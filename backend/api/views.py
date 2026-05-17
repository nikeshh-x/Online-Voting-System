from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import generics
from accounts.models import Citizen, User
from .serializers import CitizenSerializer, RegistrationSerializer, CitizenshipVerificationSerializer,ProfileUpdateSerializer
from rest_framework import status

from rest_framework_simplejwt.views import TokenRefreshView
from .serializers import LoginSerializer


from rest_framework.throttling import AnonRateThrottle

from rest_framework.permissions import IsAuthenticated


from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta

from django.core.cache import cache


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
    permission_classes = [AllowAny]
    
    def get(self, request, token):
        print(f"DEBUG: Received token: {token}")  # Debug
        try:
            user = User.objects.get(email_verification_token=token, is_email_verified=False)

            # Check if already verified
            if user.is_email_verified:
                return Response({
                    'status': 'success',
                    'message': 'Email already verified! Please login.'
                }, status=status.HTTP_200_OK)
            
            from django.utils import timezone
            from datetime import timedelta
            
            if user.created_at < timezone.now() - timedelta(hours=24):
                return Response({
                    'status': 'error',
                    'message': 'Verification link has expired. Please request a new one.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.is_email_verified = True
            user.email_verification_token = None
            user.save()

            print(f"User {user.email} verified successfully")  # Debug
            
            return Response({
                'status': 'success',
                'message': 'Email verified successfully! You can now login.'
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Check if already verified
            user = User.objects.filter(email_verification_token=token).first()
            if user and user.is_email_verified:
                return Response({
                    'status': 'success',
                    'message': 'Email already verified! Please login.'
                }, status=status.HTTP_200_OK)
            
            return Response({
                'status': 'error',
                'message': 'Invalid verification token.'
            }, status=status.HTTP_400_BAD_REQUEST)

class ResendVerificationEmailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        if user.is_email_verified:
            return Response({
                'status': 'error',
                'message': 'Email already verified.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Rate limiting: 1 request per 2 minutes
        cache_key = f"resend_verification_{user.id}"
        if cache.get(cache_key):
            return Response({
                'status': 'error',
                'message': 'Please wait 2 minutes before requesting another verification email.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        from accounts.utils import send_verification_email
        try:
            send_verification_email(user, request)
            cache.set(cache_key, True, 120)  # 2 minutes cooldown
            
            from audit.models import AuditLog
            AuditLog.objects.create(
                user=user,
                action='resend_verification',
                details={'ip_address': request.META.get('REMOTE_ADDR')},
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
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
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
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
    

class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request):
        serializer = ProfileUpdateSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = request.user
            if 'email' in serializer.validated_data:
                user.email = serializer.validated_data['email']
            if 'phone' in serializer.validated_data:
                user.phone = serializer.validated_data['phone']
            user.save()
            
            return Response({
                'status': 'success',
                'message': 'Profile updated successfully',
                'data': {
                    'email': user.email,
                    'phone': user.phone,
                    'full_name': user.citizen.full_name if user.citizen else user.username,
                }
            }, status=status.HTTP_200_OK)
        
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
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

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        stats = {
            'user': {
                'full_name': user.citizen.full_name if user.citizen else user.username,
                'email': user.email,
                'phone': user.phone,
                'citizenship_number': user.citizen.citizenship_number if user.citizen else None,
                'district': user.citizen.district if user.citizen else None,
                'is_verified': user.is_email_verified,
                'last_login': user.last_login,
                'date_joined': user.date_joined,
            },
            'voting_stats': {
                'has_voted': getattr(user, 'has_voted', False),
                'total_votes': 0,  # Will be implemented later
            }
        }
        
        return Response({
            'status': 'success',
            'data': stats
        }, status=status.HTTP_200_OK)