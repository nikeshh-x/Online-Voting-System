from django.db import models
from django.conf import settings
from elections.models import Election, Candidate
from voting.models import Vote

class AnalyticsDataset(models.Model):
    """Store processed analytics data"""
    election = models.ForeignKey(Election, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    data_version = models.CharField(max_length=20, default='1.0')
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Analytics for {self.election.title} - {self.created_at}"
    
    class Meta:
        db_table = 'analytics_datasets'
        ordering = ['-created_at']


class VoterFeature(models.Model):
    """Store individual voter features for clustering"""
    dataset = models.ForeignKey(AnalyticsDataset, on_delete=models.CASCADE, related_name='voter_features')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    election = models.ForeignKey(Election, on_delete=models.CASCADE)
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE)
    
    # Features
    age = models.IntegerField()
    district_code = models.IntegerField()
    gender_code = models.IntegerField()
    vote_time_hour = models.IntegerField()
    vote_time_category = models.CharField(max_length=20)
    
    # Cluster assignment
    cluster_id = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'voter_features'