from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework import permissions
from rest_framework.throttling import AnonRateThrottle

from .serializers import (CitizenSerializer, 
                          RegistrationSerializer, 
                          CitizenshipVerificationSerializer,
                          ProfileUpdateSerializer, 
                          LoginSerializer, 
                          ElectionListSerializer, 
                          ElectionDetailSerializer, 
                          ElectionCreateUpdateSerializer, 
                          CandidateListSerializer, 
                          CandidateDetailSerializer, 
                          CandidateCreateUpdateSerializer, 
                          VoteSerializer
                        )
from elections.models import Candidate, Election
from accounts.models import Citizen, User
from voting.models import Vote

from django.shortcuts import get_object_or_404
from django.core.cache import cache
import uuid
import hashlib
from django.utils import timezone
from audit.models import AuditLog
from django.db.models import Q
from datetime import datetime, timedelta
from django.db import transaction


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
        # Clean the token - remove any trailing '=' or other invalid characters
        token = token.strip().rstrip('=')
        
        try:
            # Validate UUID format
            token_uuid = uuid.UUID(token)
        except ValueError:
            return Response({
                'status': 'error',
                'message': 'Invalid verification token format.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email_verification_token=token_uuid, is_email_verified=False)
            
            # Check if token expired (24 hours)
            if user.created_at < timezone.now() - timedelta(hours=24):
                return Response({
                    'status': 'error',
                    'message': 'Verification link has expired. Please request a new one.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify the user
            user.is_email_verified = True
            user.email_verification_token = None
            user.save()
            
            return Response({
                'status': 'success',
                'message': 'Email verified successfully! You can now login.'
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Check if already verified
            user = User.objects.filter(email_verification_token=token_uuid).first()
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
                        'is_verified': user.is_email_verified,
                        'is_admin': user.is_admin,
                        'has_voted': user.has_voted,
                        'date_joined': user.date_joined,
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
    
# Election Views
class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin
    def has_object_permission(self, request, view, obj):
        return request.user and request.user.is_authenticated and request.user.is_admin
    
class ElectionListView(generics.ListCreateAPIView):
    
    def get_queryset(self):
        queryset = Election.objects.all()
        
        # Update status for all elections
        for election in queryset:
            election.update_status()
        
        # Refresh queryset to get updated statuses
        queryset = Election.objects.all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ElectionCreateUpdateSerializer
        return ElectionListSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminUser()]
        return [AllowAny()]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ElectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Election.objects.all()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ElectionDetailSerializer
        return ElectionCreateUpdateSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminUser()]

class ActiveElectionsView(APIView):
    """Get currently active elections"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        now = timezone.now()
        elections = Election.objects.filter(
            status='active',
            start_datetime__lte=now,
            end_datetime__gte=now
        ).order_by('start_datetime')
        
        serializer = ElectionListSerializer(elections, many=True)
        return Response({
            'status': 'success',
            'count': elections.count(),
            'data': serializer.data
        })

class UpcomingElectionsView(APIView):
    """Get upcoming elections"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        now = timezone.now()
        elections = Election.objects.filter(
            status='upcoming',
            start_datetime__gt=now
        ).order_by('start_datetime')
        
        serializer = ElectionListSerializer(elections, many=True)
        return Response({
            'status': 'success',
            'count': elections.count(),
            'data': serializer.data
        })

class CompletedElectionsView(APIView):
    """Get completed elections"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        now = timezone.now()
        elections = Election.objects.filter(
            status='closed'
        ).order_by('-end_datetime')
        
        serializer = ElectionListSerializer(elections, many=True)
        return Response({
            'status': 'success',
            'count': elections.count(),
            'data': serializer.data
        })
    
# ========== CANDIDATE VIEWS ==========
class CandidateListView(generics.ListCreateAPIView):
    """List candidates for an election or add new candidate"""
    
    serializer_class = CandidateListSerializer
    
    def get_queryset(self):
        election_id = self.kwargs.get('election_id')
        return Candidate.objects.filter(election_id=election_id).order_by('display_order', 'name')
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminUser()]
        return [AllowAny()]
    
    def perform_create(self, serializer):
        election_id = self.kwargs.get('election_id')
        election = Election.objects.get(id=election_id)
        serializer.save(election=election)

class CandidateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update or delete candidate by ID"""
    
    queryset = Candidate.objects.all()
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CandidateDetailSerializer
        return CandidateCreateUpdateSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminUser()]

# Voting Views
from django.db import transaction  # Add this at the top

class CastVoteView(APIView):
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def post(self, request):
        # Check if user is admin - admins cannot vote
        if request.user.is_admin:
            return Response({
                'status': 'error',
                'message': 'Administrators cannot vote'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if user has a linked citizen
        if not request.user.citizen:
            return Response({
                'status': 'error',
                'message': 'No citizen profile linked. Please complete registration.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Rate limiting: 10 votes per hour per IP
        ip_address = request.META.get('REMOTE_ADDR')
        rate_limit_key = f"vote_rate_limit_{ip_address}"
        vote_count = cache.get(rate_limit_key, 0)
        
        if vote_count >= 10:
            return Response({
                'status': 'error',
                'message': 'Rate limit exceeded. Maximum 10 votes per hour allowed.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        serializer = VoteSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = request.user
            election = serializer.validated_data['election']
            candidate = serializer.validated_data['candidate']
            
            # Double-check with select_for_update to prevent race conditions
            existing_vote = Vote.objects.select_for_update().filter(
                voter=user, 
                election=election
            ).first()
            
            if existing_vote:
                return Response({
                    'status': 'error',
                    'message': 'You have already voted in this election.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create vote
            vote = Vote.objects.create(
                voter=user,
                election=election,
                candidate=candidate,
                ip_address=ip_address
            )
            
            # Increment rate limit counter
            cache.set(rate_limit_key, vote_count + 1, 3600)  # 1 hour expiry
            
            return Response({
                'status': 'success',
                'message': 'Your vote has been cast successfully!',
                'data': {
                    'vote_hash': vote.vote_hash,
                    'election': election.title,
                    'candidate': candidate.name,
                    'timestamp': vote.timestamp
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
class CheckUserVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, election_id):
        from voting.models import Vote

        try:
            vote = Vote.objects.get(voter=request.user, election_id=election_id)
            return Response({
                'status':'success',
                'has_voted':True,
                'data':{
                    'candidate_name': vote.candidate.name,
                    'timestamp': vote.timestamp,
                    'vote_hash': vote.vote_hash[:16] + '...'
                }
            })
        except Vote.DoesNotExist:
            return Response({
                'status':'success',
                'has_voted': False
            })
        
class UserVoteHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        votes = Vote.objects.filter(voter=request.user).select_related('election', 'candidate')

        data = []
        for vote in votes:
            data.append({
                'election_id':vote.election.id,
                'election_title':vote.election.title,
                'candidate_name':vote.candidate.name,
                'candidate_party':vote.candidate.party,
                'timestamp':vote.timestamp,
                'vote_hash':vote.vote_hash,
            })
        return Response({
            'status': 'success',
            'count': len(data),
            'data': data
        })

class ElectionResultsView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, election_id):
        try:
            election = Election.objects.get(id=election_id)
        except Election.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Election not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update status
        election.update_status()
        
        # Get votes
        votes = Vote.objects.filter(election=election)
        total_votes = votes.count()
        
        # Calculate votes per candidate
        candidate_votes = {}
        for vote in votes:
            candidate_id = vote.candidate.id
            if candidate_id not in candidate_votes:
                # Get photo URL safely
                photo_url = None
                if vote.candidate.photo:
                    try:
                        photo_url = request.build_absolute_uri(vote.candidate.photo.url)
                    except:
                        photo_url = None
                
                candidate_votes[candidate_id] = {
                    'id': candidate_id,
                    'name': str(vote.candidate.name),
                    'party': str(vote.candidate.party) if vote.candidate.party else '',
                    'symbol': str(vote.candidate.symbol) if vote.candidate.symbol else '',
                    'photo': photo_url,
                    'votes': 0
                }
            candidate_votes[candidate_id]['votes'] += 1
        
        all_candidates = election.candidates.all()
        
        # Initialize vote counts for all candidates
        candidate_votes = {}
        for candidate in all_candidates:
            # Get photo URL safely
            photo_url = None
            if candidate.photo:
                try:
                    photo_url = request.build_absolute_uri(candidate.photo.url)
                except:
                    photo_url = None
            
            candidate_votes[candidate.id] = {
                'id': candidate.id,
                'name': str(candidate.name),
                'party': str(candidate.party) if candidate.party else '',
                'symbol': str(candidate.symbol) if candidate.symbol else '',
                'photo': photo_url,
                'votes': 0
            }
        
        # Add actual votes
        for vote in votes:
            candidate_id = vote.candidate.id
            if candidate_id in candidate_votes:
                candidate_votes[candidate_id]['votes'] += 1
        
        # Calculate percentages and prepare results
        results = []
        chart_labels = []
        chart_data = []
        chart_colors = ['#DC143C', '#FF6B6B', '#FFB347', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
        
        for candidate_id, data in candidate_votes.items():
            percentage = round((data['votes'] / total_votes) * 100, 2) if total_votes > 0 else 0
            results.append({
                'name': data['name'],
                'party': data['party'],
                'symbol': data['symbol'],
                'photo': data['photo'],
                'votes': data['votes'],
                'percentage': percentage
            })
            chart_labels.append(data['name'])
            chart_data.append(data['votes'])
        
        # Sort by votes (descending)
        results.sort(key=lambda x: x['votes'], reverse=True)
        
        # Calculate percentages and prepare results
        results = []
        chart_labels = []
        chart_data = []
        chart_colors = ['#DC143C', '#FF6B6B', '#FFB347', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
        
        for candidate_id, data in candidate_votes.items():
            percentage = round((data['votes'] / total_votes) * 100, 2) if total_votes > 0 else 0
            results.append({
                'name': data['name'],
                'party': data['party'],
                'symbol': data['symbol'],
                'photo': data['photo'],
                'votes': data['votes'],
                'percentage': percentage
            })
            chart_labels.append(data['name'])
            chart_data.append(data['votes'])
        
        # Sort by votes (descending)
        results.sort(key=lambda x: x['votes'], reverse=True)
        
        # Determine winner
        winner = results[0] if results else None
        is_tie = False
        if winner and len(results) > 1:
            is_tie = winner['votes'] == results[1]['votes']
        
        # Calculate voter turnout
        total_eligible_voters = User.objects.filter(is_email_verified=True).count()
        turnout_percentage = round((total_votes / total_eligible_voters) * 100, 2) if total_eligible_voters > 0 else 0
        
        return Response({
            'status': 'success',
            'data': {
                'election': {
                    'id': election.id,
                    'title': str(election.title),
                    'description': str(election.description) if election.description else '',
                    'status': election.status,
                    'status_display': election.get_status_display(),
                    'start_datetime': election.start_datetime.isoformat() if election.start_datetime else None,
                    'end_datetime': election.end_datetime.isoformat() if election.end_datetime else None,
                },
                'total_votes': total_votes,
                'turnout_percentage': turnout_percentage,
                'results': results,
                'winner': winner,
                'is_tie': is_tie,
                'chart_data': {
                    'labels': chart_labels,
                    'datasets': [{
                        'label': 'Votes',
                        'data': chart_data,
                        'backgroundColor': chart_colors[:len(chart_labels)],
                        'borderRadius': 8,
                    }]
                }
            }
        })

class VoteHistoryView(APIView):
    """Get current user's vote history"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from voting.models import Vote
        
        votes = Vote.objects.filter(voter=request.user).select_related('election', 'candidate').order_by('-timestamp')
        
        data = []
        for vote in votes:
            data.append({
                'id': vote.id,  # MAKE SURE THIS IS INCLUDED
                'election_id': vote.election.id,
                'election_title': vote.election.title,
                'election_status': vote.election.status,
                'candidate_id': vote.candidate.id,
                'candidate_name': vote.candidate.name,
                'candidate_party': vote.candidate.party,
                'candidate_photo': vote.candidate.photo.url if vote.candidate.photo else None,
                'timestamp': vote.timestamp.isoformat(),
                'vote_hash': vote.vote_hash,
            })
        
        return Response({
            'status': 'success',
            'count': len(data),
            'data': data
        })
    
class VerifyVoteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, vote_hash):
        from voting.models import Vote
        
        try:
            vote = Vote.objects.get(vote_hash=vote_hash)
            
            # Check if the user owns this vote
            if vote.voter != request.user:
                return Response({
                    'status': 'error',
                    'message': 'You do not have permission to verify this vote'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Use the model's verify method
            is_valid = vote.verify_hash()
            
            return Response({
                'status': 'success',
                'data': {
                    'vote_hash': vote.vote_hash,
                    'is_valid': is_valid,
                    'election': vote.election.title,
                    'candidate': vote.candidate.name,
                    'timestamp': vote.timestamp,
                    'verified_at': timezone.now().isoformat()
                }
            })
        except Vote.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Vote not found'
            }, status=status.HTTP_404_NOT_FOUND)

# Results Views
class ElectionCountdownView(APIView):
    """Get countdown information for an election"""
    permission_classes = [AllowAny]
    
    def get(self, request, election_id):
        from elections.models import Election
        from django.utils import timezone
        
        try:
            election = Election.objects.get(id=election_id)
        except Election.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Election not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update status first
        election.update_status()
        
        now = timezone.now()
        
        if election.status == 'upcoming':
            remaining = election.start_datetime - now
            status_type = 'upcoming'
            message = "Election starts in"
        elif election.status == 'active':
            remaining = election.end_datetime - now
            status_type = 'active'
            message = "Election ends in"
        else:
            return Response({
                'status': 'success',
                'data': {
                    'status': election.status,
                    'message': 'Election has ended',
                    'is_active': False,
                    'days': 0,
                    'hours': 0,
                    'minutes': 0,
                    'seconds': 0,
                    'total_seconds': 0
                }
            })
        
        # Ensure remaining is not negative
        if remaining.total_seconds() < 0:
            remaining = timedelta(seconds=0)
        
        # Calculate days, hours, minutes, seconds
        days = remaining.days
        hours = remaining.seconds // 3600
        minutes = (remaining.seconds % 3600) // 60
        seconds = remaining.seconds % 60
        
        return Response({
            'status': 'success',
            'data': {
                'status': status_type,
                'message': message,
                'days': days,
                'hours': hours,
                'minutes': minutes,
                'seconds': seconds,
                'total_seconds': max(0, remaining.total_seconds()),
                'is_active': status_type == 'active'
            }
        })
        
# Admin Views

class AdminAuditLogView(APIView):
    """Get audit logs for admin dashboard"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Check if user is admin
        if not request.user.is_admin:
            return Response({
                'status': 'error',
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get query parameters
        action = request.query_params.get('action')
        user_email = request.query_params.get('user')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))
        
        # Build queryset
        queryset = AuditLog.objects.select_related('user')
        
        # Apply filters
        if action:
            queryset = queryset.filter(action=action)
        if user_email:
            queryset = queryset.filter(user__email__icontains=user_email)
        if date_from:
            try:
                from_date = datetime.strptime(date_from, '%Y-%m-%d')
                queryset = queryset.filter(timestamp__gte=from_date)
            except:
                pass
        if date_to:
            try:
                to_date = datetime.strptime(date_to, '%Y-%m-%d') + timedelta(days=1)
                queryset = queryset.filter(timestamp__lte=to_date)
            except:
                pass
        
        # Get total count
        total = queryset.count()
        
        # Paginate
        start = (page - 1) * page_size
        end = start + page_size
        logs = queryset[start:end]
        
        # Serialize
        data = []
        for log in logs:
            data.append({
                'id': log.id,
                'user': {
                    'id': log.user.id if log.user else None,
                    'email': log.user.email if log.user else 'Anonymous'
                },
                'action': log.action,
                'action_display': dict(AuditLog.ACTION_CHOICES).get(log.action, log.action),
                'details': log.details,
                'ip_address': log.ip_address,
                'timestamp': log.timestamp.isoformat()
            })
        
        return Response({
            'status': 'success',
            'data': {
                'logs': data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total': total,
                    'total_pages': (total + page_size - 1) // page_size
                },
                'filters': {
                    'actions': dict(AuditLog.ACTION_CHOICES),
                    'available_actions': list(dict(AuditLog.ACTION_CHOICES).keys())
                }
            }
        })
    
class AdminLoginView(APIView):
    """Login for admin users using email/username"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        from django.contrib.auth import authenticate
        from rest_framework_simplejwt.tokens import RefreshToken
        
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({
                'status': 'error',
                'message': 'Username and password required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response({
                'status': 'error',
                'message': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user is admin (either is_admin field or is_staff)
        if not (user.is_admin or user.is_staff):
            return Response({
                'status': 'error',
                'message': 'Not authorized as admin'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Create audit log
        from audit.models import AuditLog
        AuditLog.objects.create(
            user=user,
            action='admin_login',
            details={
                'ip_address': request.META.get('REMOTE_ADDR'),
                'user_agent': request.META.get('HTTP_USER_AGENT', '')
            },
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({
            'status': 'success',
            'message': 'Admin login successful',
            'data': {
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'is_admin': user.is_admin or user.is_staff,
                },
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }
        })

class AdminStatsView(APIView):
    """Get statistics for admin dashboard"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Check if user is admin
        if not request.user.is_admin and not request.user.is_staff:
            return Response({
                'status': 'error',
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        from accounts.models import Citizen, User
        from elections.models import Election
        from voting.models import Vote
        from django.utils import timezone
        
        # Citizen stats
        total_citizens = Citizen.objects.count()
        registered_citizens = Citizen.objects.filter(is_registered=True).count()
        
        # User stats
        total_users = User.objects.count()
        verified_users = User.objects.filter(is_email_verified=True).count()
        
        # Election stats
        total_elections = Election.objects.count()
        now = timezone.now()
        active_elections = Election.objects.filter(
            status='active',
            start_datetime__lte=now,
            end_datetime__gte=now
        ).count()
        upcoming_elections = Election.objects.filter(
            status='upcoming',
            start_datetime__gt=now
        ).count()
        closed_elections = Election.objects.filter(status='closed').count()
        
        # Vote stats
        total_votes = Vote.objects.count()
        
        # Voter turnout
        turnout_percentage = round((total_votes / registered_citizens) * 100, 2) if registered_citizens > 0 else 0
        
        # Recent votes
        recent_votes = Vote.objects.select_related('voter', 'election', 'candidate').order_by('-timestamp')[:5]
        recent_activity = []
        for vote in recent_votes:
            recent_activity.append({
                'timestamp': vote.timestamp.isoformat(),
                'voter_email': vote.voter.email,
                'election_title': vote.election.title,
                'candidate_name': vote.candidate.name
            })
        
        return Response({
            'status': 'success',
            'data': {
                'citizens': {
                    'total': total_citizens,
                    'registered': registered_citizens,
                    'unregistered': total_citizens - registered_citizens
                },
                'users': {
                    'total': total_users,
                    'verified': verified_users,
                    'unverified': total_users - verified_users
                },
                'elections': {
                    'total': total_elections,
                    'active': active_elections,
                    'upcoming': upcoming_elections,
                    'closed': closed_elections
                },
                'votes': {
                    'total': total_votes,
                    'turnout_percentage': turnout_percentage
                },
                'recent_activity': recent_activity
            }
        })