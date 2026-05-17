from django.urls import path
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
    LogoutView,
    ProfileUpdateView,
    DashboardStatsView,
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health'),
    path('citizens/', CitizenListView.as_view(), name='citizen-list'),
    path('citizens/<int:pk>/', CitizenDetailView.as_view(), name='citizen-detail'),
    path('verify-citizenship/', VerifyCitizenshipView.as_view(), name='verify-citizenship'),
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification-email/', ResendVerificationEmailView.as_view(), name='resend-verification'),

    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/update/', ProfileUpdateView.as_view(), name='profile-update'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
