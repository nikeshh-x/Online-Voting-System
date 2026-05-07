from django.urls import path
from .views import HealthCheckView, CitizenListView, CitizenDetailView


urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health'),

    path('citizens/', CitizenListView.as_view(), name='citizen-list'),
    path('citizens/<int:pk>/', CitizenDetailView.as_view(), name='citizen-detail'),
]
