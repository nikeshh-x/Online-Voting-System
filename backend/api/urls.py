from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    HealthCheckView,
    CitizenListView,
    CitizenDetailView,
    VerifyCitizenshipView,
    RegisterView,
    VerifyEmailView,
    ResendVerificationEmailView,
    LoginView,
    ProfileView,
    ProfileUpdateView,
    DashboardStatsView,
    LogoutView,
    ElectionListView,
    ElectionDetailView,
    ActiveElectionsView,
    UpcomingElectionsView,
    CompletedElectionsView,
    CandidateListView,
    CandidateDetailView,
    CastVoteView,
    CheckUserVoteView,
    UserVoteHistoryView,
    ElectionResultsView,
    AdminStatsView,
    VoteHistoryView,
    VerifyVoteView,
    AdminAuditLogView,
    AdminLoginView,
    ElectionCountdownView,
    TestEmailView,
    AnalyticsDataView, 
    RunAnalyticsView
)

urlpatterns = [
    # Health check
    path('health/', HealthCheckView.as_view(), name='health'),
    
    # Citizen endpoints
    path('citizens/', CitizenListView.as_view(), name='citizen-list'),
    path('citizens/<int:pk>/', CitizenDetailView.as_view(), name='citizen-detail'),
    
    # Auth endpoints
    path('verify-citizenship/', VerifyCitizenshipView.as_view(), name='verify-citizenship'),
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='resend-verification'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/update/', ProfileUpdateView.as_view(), name='profile-update'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Election endpoints
    path('elections/', ElectionListView.as_view(), name='election-list'),
    path('elections/<int:pk>/', ElectionDetailView.as_view(), name='election-detail'),
    path('elections/active/', ActiveElectionsView.as_view(), name='active-elections'),
    path('elections/upcoming/', UpcomingElectionsView.as_view(), name='upcoming-elections'),
    path('elections/completed/', CompletedElectionsView.as_view(), name='completed-elections'),

    # Election COuntdown
    path('elections/<int:election_id>/countdown/', ElectionCountdownView.as_view(), name='election-countdown'),
    
    # Candidate endpoints
    path('elections/<int:election_id>/candidates/', CandidateListView.as_view(), name='candidate-list'),
    path('candidates/<int:pk>/', CandidateDetailView.as_view(), name='candidate-detail'),

    # Voting URLs
    path('vote/', CastVoteView.as_view(), name='cast-vote'),
    path('vote/check/<int:election_id>/', CheckUserVoteView.as_view(), name='check-vote'),
    path('vote/history/', UserVoteHistoryView.as_view(), name='vote-history'),
    path('vote/history/', VoteHistoryView.as_view(), name='vote-history'),
    path('vote/verify/<str:vote_hash>/', VerifyVoteView.as_view(), name='verify-vote'),

    # Result URLs 
    path('elections/<int:election_id>/results/', ElectionResultsView.as_view(), name='election-results'),

    # Audit Logs
    path('admin/audit-logs/', AdminAuditLogView.as_view(), name='admin-audit-logs'),

    # Admin Login
    path('admin/login/', AdminLoginView.as_view(), name='admin-login'),
    
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),

    path('test-email/', TestEmailView.as_view(), name='test-email'),

    path('analytics/data/', AnalyticsDataView.as_view(), name='analytics-data'),
    path('analytics/run/', RunAnalyticsView.as_view(), name='run-analytics'),
]
