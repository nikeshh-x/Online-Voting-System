from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'status': 'ok',
            'message': 'API is running',
            'version': '1.0.0'
        })