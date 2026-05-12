from django.urls import path
from .views import (
    HealthCheckView, 
    CitizenListView, 
    CitizenDetailView, 
    VerifyCitizenshipView,
    RegisterView
)

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health'),
    path('citizens/', CitizenListView.as_view(), name='citizen-list'),
    path('citizens/<int:pk>/', CitizenDetailView.as_view(), name='citizen-detail'),
    path('verify-citizenship/', VerifyCitizenshipView.as_view(), name='verify-citizenship'),
    path('register/', RegisterView.as_view(), name='register'),
]
