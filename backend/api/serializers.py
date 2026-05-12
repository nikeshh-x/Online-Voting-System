from rest_framework import serializers
from accounts.models import Citizen


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

