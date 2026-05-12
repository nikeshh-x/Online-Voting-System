from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import generics
from accounts.models import Citizen
from .serializers import CitizenSerializer
from rest_framework import status

from rest_framework.throttling import AnonRateThrottle
from .serializers import CitizenshipVerificationSerializer


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'status': 'ok',
            'message': 'API is running',
            'version': '1.0.0'
        })
    
class CitizenListView(generics.ListAPIView):
    queryset = Citizen.objects.all()
    serializer_class = CitizenSerializer
    permission_classes = [AllowAny]

class CitizenDetailView(generics.RetrieveAPIView):
    queryset = Citizen.objects.all()
    serializer_class = CitizenSerializer
    permission_classes = [AllowAny]

class VerifyCitizenshipView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]
    throttle_scope = 'verification'

    def post(self, request):
        serializer = CitizenshipVerificationSerializer(data=request.data)

        if serializer.is_valid():
            citizen = serializer.validated_data['citizen']

            from audit.models import AuditLog
            AuditLog.objects.create(
                user=None,
                action = 'citizenship_verification',
                details={
                    'citizenship_number': citizen.citizenship_number,
                    'full_name':citizen.full_name,
                    'ip_address': request.META.get('REMOTE_ADDR'),
                    'status': 'success'
                },
                ip_address=request.META.get('REMOTE_ADDR')
            )
            return Response({
                'status': 'success',
                'message': 'Citizenship verified successfully',
                'data': {
                    'full_name': citizen.full_name,
                    'district': citizen.district,
                    'municipality': citizen.municipality,
                    'ward_number': citizen.ward_number,
                    'is_eligible': citizen.is_eligible
                }
            }, status=status.HTTP_200_OK)
            
        # Log failed attempt
        from audit.models import AuditLog
        AuditLog.objects.create(
            user=None,
            action='citizenship_verification_failed',
            details={
                'errors': serializer.errors,
                'ip_address': request.META.get('REMOTE_ADDR')
            },
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)