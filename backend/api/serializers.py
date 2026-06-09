from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from accounts.models import Citizen, User
from elections.models import Election, Candidate
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

# Election Serializers

class ElectionListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    candidates_count = serializers.SerializerMethodField()
    total_votes = serializers.SerializerMethodField()  

    class Meta:
        model = Election
        fields = ['id', 'title', 'description', 'status', 'status_display',
                  'start_datetime', 'end_datetime', 'candidates_count', 'total_votes', 'created_at'] 
    
    def get_candidates_count(self, obj):
        return obj.candidates.count()
    
    def get_total_votes(self, obj):
        from voting.models import Vote
        return Vote.objects.filter(election=obj).count()  
    
class ElectionDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    candidates = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    total_votes = serializers.SerializerMethodField()

    class Meta:
        model = Election
        fields = ['id', 'title', 'description', 'status', 'status_display',
                  'start_datetime', 'end_datetime', 'candidates', 'created_by_name',
                  'is_active', 'total_votes', 'created_at', 'updated_at']
    
    def get_candidates(self, obj):
        candidates = obj.candidates.all().order_by('display_order')
        # Pass request context to serializer
        return CandidateListSerializer(candidates, many=True, context=self.context).data
    
    def get_total_votes(self, obj):
        from voting.models import Vote
        return Vote.objects.filter(election=obj).count() 
    
class ElectionCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Election
        fields = [
            'id', 'title', 'description', 'start_datetime', 'end_datetime', 'status'
        ]

    def validate(self, data):
        start = data.get('start_datetime')
        end = data.get('end_datetime')

        if start and end:
            if start >= end:
                raise serializers.ValidationError({
                    'end_datetime': 'End Time must be adter start time'
                })
        return data

class CandidateListSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()
    symbol_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Candidate
        fields = ['id', 'name', 'party', 'symbol', 'symbol_url', 'position', 'bio', 'photo_url', 'display_order']
    
    def get_photo_url(self, obj):
        if obj.photo and obj.photo.url:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None
    
    def get_symbol_url(self, obj):
        if obj.symbol and obj.symbol.url:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.symbol.url)
            return obj.symbol.url
        return None

class CandidateDetailSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()
    symbol_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Candidate
        fields = ['id', 'name', 'party', 'bio', 'position', 'symbol', 'photo', 'photo_url', 'symbol_url', 'display_order', 'election']
    
    def get_photo_url(self, obj):
        if obj.photo and obj.photo.url:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None
    
    def get_symbol_url(self, obj):
        if obj.symbol:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.symbol.url)
            return obj.symbol.url
        return None

class CandidateCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = [
            'id', 'election', 'name', 'party', 'bio', 'photo', 
            'symbol', 'position', 'display_order'
        ]

# Vote Serializers

class VoteSerializer(serializers.Serializer):
    election_id = serializers.IntegerField()
    candidate_id = serializers.IntegerField()

    def validate(self, attrs):
        user = self.context['request'].user
        election_id = attrs.get('election_id') 
        candidate_id = attrs.get('candidate_id')

        from django.utils import timezone
        from elections.models import Election, Candidate
        from voting.models import Vote

        try:
            election = Election.objects.get(id=election_id)
        except Election.DoesNotExist:
            raise serializers.ValidationError('Election not found') 
        
        if election.status != 'active':
            raise serializers.ValidationError('This election is not active')
        
        now = timezone.now()
        if now < election.start_datetime:
            raise serializers.ValidationError('Election has not started yet')
        if now > election.end_datetime:
            raise serializers.ValidationError('Election has ended')
        
        try:
            candidate = Candidate.objects.get(id=candidate_id, election=election)
        except Candidate.DoesNotExist:
            raise serializers.ValidationError('Candidate not found in this election')
        
        if Vote.objects.filter(voter=user, election=election).exists():
            raise serializers.ValidationError('You have already voted in this election.')
        
        if not user.is_email_verified:
            raise serializers.ValidationError('Please verify your email before voting')
        
        if not user.is_email_verified:
            raise serializers.ValidationError('Please Verify your email.')
        
        attrs['election'] = election
        attrs['candidate'] = candidate
        return attrs