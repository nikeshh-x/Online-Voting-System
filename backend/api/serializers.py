from rest_framework import serializers
from accounts.models import Citizen


class CitizenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Citizen
        fields = [
            'id', 'citizenship_number', 'full_name', 'date_of_birth','gender', 'district', 'municipality', 'ward_number','father_name', 'mother_name', 'is_eligible', 'is_registered' 
        ]
        read_only_fields = ['is_eligible', 'is_registered', 'created_at', 'updated_at']

