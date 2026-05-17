from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import generics
from accounts.models import Citizen, User
from .serializers import CitizenSerializer, RegistrationSerializer, CitizenshipVerificationSerializer
from rest_framework import status

from rest_framework_simplejwt.views import TokenRefreshView
from .serializers import LoginSerializer


from rest_framework.throttling import AnonRateThrottle

from rest_framework.permissions import IsAuthenticated


from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta


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
            
            # Store verified citizen in cache
            from .verification_cache import store_verified_citizen
            verification_token = store_verified_citizen(
                citizen.citizenship_number,
                citizen.full_name
            )
            
            print(f"DEBUG: Generated token: {verification_token}")  # Debug
            
            # Create audit log entry
            from audit.models import AuditLog
            AuditLog.objects.create(
                user=None,
                action='citizenship_verification',
                details={
                    'citizenship_number': citizen.citizenship_number,
                    'full_name': citizen.full_name,
                    'ip_address': request.META.get('REMOTE_ADDR'),
                    'status': 'success'
                },
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            return Response({
                'status': 'success',
                'message': 'Citizenship verified successfully',
                'data': {
                    'verification_token': verification_token,
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
    
class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegistrationSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = serializer.save()

            from accounts.utils import send_verification_email
            try:
                send_verification_email(user, request)
            except Exception as e:
                print(f"Verification email failed: {e}")
            
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'status': 'success',
                'message': 'Registration successful. Please check your email for verification.',
                'data': {
                    'user': {'id': user.id, 'email': user.email},
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response({'status': 'error', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(APIView):
    """Verify email with token"""
    permission_classes = [AllowAny]
    
    def get(self, request, token):
        try:
            # Find user with this token
            user = User.objects.get(email_verification_token=token, is_email_verified=False)
            
            # Check if token expired (24 hours)
            if user.created_at < timezone.now() - timedelta(hours=24):
                return Response({
                    'status': 'error',
                    'message': 'Verification link has expired. Please request a new one.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify user
            user.is_email_verified = True
            user.email_verification_token = None
            user.save()
            
            # Send welcome email
            from accounts.utils import send_welcome_email
            try:
                send_welcome_email(user)
            except Exception as e:
                print(f"Welcome email failed: {e}")
            
            return Response({
                'status': 'success',
                'message': 'Email verified successfully! You can now login.'
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Invalid or already used verification token.'
            }, status=status.HTTP_400_BAD_REQUEST)

class ResendVerificationEmailView(APIView):
    """Resend verification email"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        if user.is_email_verified:
            return Response({
                'status': 'error',
                'message': 'Email already verified.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Rate limit check (can be implemented with cache)
        
        # Send verification email
        from accounts.utils import send_verification_email
        try:
            send_verification_email(user, request)
            return Response({
                'status': 'success',
                'message': 'Verification email sent. Please check your inbox.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'Failed to send email: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(APIView):
    """Login with email or citizenship number"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            tokens = serializer.get_tokens(user)
            
            # Create audit log
            from audit.models import AuditLog
            AuditLog.objects.create(
                user=user,
                action='login',
                details={
                    'ip_address': request.META.get('REMOTE_ADDR'),
                    'user_agent': request.META.get('HTTP_USER_AGENT', '')
                },
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            return Response({
                'status': 'success',
                'message': 'Login successful',
                'data': {
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'full_name': user.citizen.full_name if user.citizen else user.username,
                        'is_verified': user.is_email_verified
                    },
                    'tokens': tokens
                }
            }, status=status.HTTP_200_OK)
        
        # Log failed attempt
        from audit.models import AuditLog
        AuditLog.objects.create(
            user=None,
            action='login_failed',
            details={
                'errors': serializer.errors,
                'ip_address': request.META.get('REMOTE_ADDR')
            },
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_401_UNAUTHORIZED)
    
class ProfileView(APIView):
    """Get current user profile"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'status': 'success',
            'data': {
                'id': user.id,
                'email': user.email,
                'full_name': user.citizen.full_name if user.citizen else user.username,
                'phone': user.phone,
                'citizenship_number': user.citizen.citizenship_number if user.citizen else None,
                'district': user.citizen.district if user.citizen else None,
                'is_verified': user.is_email_verified,
                'date_joined': user.date_joined,
            }
        }, status=status.HTTP_200_OK)
    
class LogoutView(APIView):
    """Logout and blacklist refresh token"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            # Create audit log
            from audit.models import AuditLog
            AuditLog.objects.create(
                user=request.user,
                action='logout',
                details={'ip_address': request.META.get('REMOTE_ADDR')},
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            return Response({
                'status': 'success',
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)