from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('vote_cast', 'Vote Cast'),
        ('vote_verified', 'Vote Verified'),
        ('election_created', 'Election Created'),
        ('election_updated', 'Election Updated'),
        ('election_deleted', 'Election Deleted'),
        ('election_activated', 'Election Activated'),
        ('election_closed', 'Election Closed'),
        ('candidate_added', 'Candidate Added'),
        ('candidate_updated', 'Candidate Updated'),
        ('candidate_deleted', 'Candidate Deleted'),
        ('user_registered', 'User Registered'),
        ('user_verified', 'User Verified'),
        ('citizenship_verification', 'Citizenship Verification'),
        ('citizenship_verification_failed', 'Citizenship Verification Failed'),
        ('resend_verification', 'Resend Verification'),
        ('profile_updated', 'Profile Updated'),
        ('admin_login', 'Admin Login'),
        ('audit_log_viewed', 'Audit Log Viewed'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        user_info = self.user.email if self.user else 'Anonymous'
        return f"{self.action} by {user_info} at {self.timestamp}"
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'