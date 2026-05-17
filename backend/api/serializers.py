from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from accounts.models import Citizen, User
import uuid


class CitizenshipVerificationSerializer(serializers.Serializer):
    citizenship_number = serializers.CharField(max_length=50)
    full_name = serializers.CharField(max_length=200)
    date_of_birth = serializers.DateField()
    district = serializers.CharField(max_length=100)

    def validate(self, attrs):
        citizenship_number = attrs.get('citizenship_number')
        full_name = attrs.get('full_name')
        date_of_birth = attrs.get('date_of_birth')
        district = attrs.get('district')

        try:
            citizen = Citizen.objects.get(citizenship_number=citizenship_number)
        except Citizen.DoesNotExist:
                raise serializers.ValidationError({
                     'citizenship_number': 'Citizenship number not found in our records'
                })
        
        if citizen.is_registered:
             raise serializers.ValidationError({
                  'citizenship_number': 'Citizenship number is already registred'
             })
        
        if not citizen.is_eligible:
             raise serializers.ValidationError({
                  'citizenship_number': 'You are not eligible to vote (must be 18+)'
             })
        
        if citizen.full_name.lower() != full_name.lower():
             raise serializers.ValidationError({
                  'full_name': 'Full name does not match our records'
             })
        
        if citizen.date_of_birth != date_of_birth:
             raise serializers.ValidationError({
                  'date_of_birth': 'Date of birth does not match our records'
             })
        if citizen.district.lower() != district.lower():
             raise serializers.ValidationError({
                  'district': 'District does not match our records'
             })
        
        attrs['citizen'] = citizen
        return attrs


class CitizenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Citizen
        fields = [
            'id', 'citizenship_number', 'full_name', 'date_of_birth','gender', 'district', 'municipality', 'ward_number','father_name', 'mother_name', 'is_eligible', 'is_registered' 
        ]
        read_only_fields = ['is_eligible', 'is_registered', 'created_at', 'updated_at']


class RegistrationSerializer(serializers.Serializer):
    """Serializer for user registration"""
    verification_token = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match'})
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({'email': 'Email already registered'})
        
        from .verification_cache import get_verified_citizen
        verified_data = get_verified_citizen(attrs['verification_token'])
        
        if not verified_data:
            raise serializers.ValidationError({
                'verification_token': 'Invalid or expired token. Please verify citizenship again.'
            })
        
        citizen = Citizen.objects.get(citizenship_number=verified_data['citizenship_number'])
        if citizen.is_registered:
            raise serializers.ValidationError('This citizenship is already registered')
        
        attrs['citizen'] = citizen
        return attrs
    
    def create(self, validated_data):
        from audit.models import AuditLog
        import uuid
        
        citizen = validated_data['citizen']
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            phone=validated_data.get('phone', ''),
            citizen=citizen,
            is_email_verified=False,
            email_verification_token=uuid.uuid4()
        )
        
        citizen.is_registered = True
        citizen.save()
        
        return user

class LoginSerializer(serializers.Serializer):
    citizenship_number = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    
    def validate(self, attrs):
        citizenship_number = attrs.get('citizenship_number')
        password = attrs.get('password')
        
        try:
            citizen = Citizen.objects.get(citizenship_number=citizenship_number)
            user = citizen.user
            
            if not user:
                raise serializers.ValidationError('No user linked to this citizenship number')
            
            if not user.check_password(password):
                raise serializers.ValidationError('Invalid password')
            
            if not user.is_email_verified:
                raise serializers.ValidationError('Email not verified. Please check your inbox.')
            
            if not user.is_active:
                raise serializers.ValidationError('Account is disabled')
                
        except Citizen.DoesNotExist:
            raise serializers.ValidationError('Citizenship number not found')
        
        attrs['user'] = user
        return attrs
    
    def get_tokens(self, user):
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

class ProfileUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    
    def validate_email(self, value):
        if value:
            user = self.context['request'].user
            if User.objects.filter(email=value).exclude(id=user.id).exists():
                raise serializers.ValidationError('Email already in use')
        return value