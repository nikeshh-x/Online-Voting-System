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
        ('user_registration_failed', 'User Registration Failed'),
        ('user_registered', 'User Registered'),
        ('user_verified', 'User Verified'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,  # Changed from CASCADE to SET_NULL
        null=True,                   # Allow null
        blank=True,                  # Allow blank
        related_name='audit_logs'
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    details = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
    
    def __str__(self):
        return f"{self.action} by {self.user.email if self.user else 'Anonymous'} at {self.timestamp}"
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'