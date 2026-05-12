from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('vote_cast', 'Vote Cast'),
        ('election_created', 'Election Created'),
        ('election_updated', 'Election Updated'),
        ('election_deleted', 'Election Deleted'),
        ('candidate_added', 'Candidate Added'),
        ('candidate_updated', 'Candidate Updated'),
        ('candidate_deleted', 'Candidate Deleted'),
        ('user_registered', 'User Registered'),
        ('user_verified', 'User Verified'),
        ('citizenship_verification', 'Citizenship Verification Success'),
        ('citizenship_verification_failed', 'Citizenship Verification Failed'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='audit_logs',
        null=True,  # Allow null for unauthenticated users
        blank=True
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    details = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
    
    def __str__(self):
        user_info = self.user.email if self.user else 'Anonymous'
        return f"{self.action} by {user_info} at {self.timestamp}"
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'