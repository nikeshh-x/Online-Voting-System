from django.utils.deprecation import MiddlewareMixin
from .models import AuditLog
from django.utils import timezone

class AuditMiddleware(MiddlewareMixin):
    """Middleware to log all user requests"""

    def _get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def process_request(self, request):
        # Store request info for later
        request._audit_start_time = timezone.now()
    
    def process_response(self, request, response):
        # Skip for static files, media, admin
        if request.path.startswith('/static/') or request.path.startswith('/media/') or request.path.startswith('/admin/jsi18n/'):
            return response
        
        # Skip for audit log API calls
        if request.path.startswith('/api/admin/audit-logs/'):
            return response
        
        # Skip for health checks
        if request.path == '/api/health/':
            return response
        
        # Log only for authenticated users and important actions
        if hasattr(request, 'user') and request.user.is_authenticated and request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            # Only log successful requests (status code < 400)
            if response.status_code >= 400:
                return response  # Skip failed requests
            
            # Don't log admin votes separately (they're prevented anyway)
            if request.user.is_admin and request.path.startswith('/api/vote/'):
                return response
            
            action = self._get_action_from_path(request.path, request.method)
            if action:
                AuditLog.objects.create(
                    user=request.user,
                    action=action,
                    ip_address=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    timestamp=request._audit_start_time
                )
        return response
    
    def _get_action_from_path(self, path, method):
        """Map URL path to audit action"""
        if path.startswith('/api/login/'):
            return 'login'
        elif path.startswith('/api/logout/'):
            return 'logout'
        elif path.startswith('/api/vote/') and method == 'POST':
            return 'vote_cast'
        elif path.startswith('/api/vote/verify/'):
            return 'vote_verified'
        elif path.startswith('/api/elections/') and method == 'POST':
            return 'election_created'
        elif path.startswith('/api/elections/') and method in ['PUT', 'PATCH']:
            return 'election_updated'
        elif path.startswith('/api/elections/') and method == 'DELETE':
            return 'election_deleted'
        elif path.startswith('/api/elections/') and '/activate/' in path:
            return 'election_activated'
        elif path.startswith('/api/elections/') and '/close/' in path:
            return 'election_closed'
        elif path.startswith('/api/elections/') and '/candidates/' in path and method == 'POST':
            return 'candidate_added'
        elif path.startswith('/api/candidates/') and method in ['PUT', 'PATCH']:
            return 'candidate_updated'
        elif path.startswith('/api/candidates/') and method == 'DELETE':
            return 'candidate_deleted'
        elif path.startswith('/api/register/'):
            return 'user_registered'
        elif path.startswith('/api/verify-email/'):
            return 'user_verified'
        elif path.startswith('/api/verify-citizenship/'):
            return 'citizenship_verification'
        elif path.startswith('/api/resend-verification/'):
            return 'resend_verification'
        elif path.startswith('/api/profile/update/'):
            return 'profile_updated'
        elif path.startswith('/api/admin/login/'):
            return 'admin_login'
        elif path.startswith('/api/admin/audit-logs/'):
            return 'audit_log_viewed'
        
        return None