import hashlib
import uuid
from django.db import models
from django.conf import settings
from elections.models import Election, Candidate
from django.utils import timezone

class Vote(models.Model):
    voter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='votes'
    )
    election = models.ForeignKey(
        Election,
        on_delete=models.CASCADE,
        related_name='votes'
    )
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name='votes'
    )
    vote_hash = models.CharField(max_length=64, unique=True, blank=True)
    unique_id = models.CharField(max_length=32, blank=True, null=True)  # Store the unique ID
    ip_address = models.GenericIPAddressField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if not self.vote_hash:
            # Generate unique ID and store it
            self.unique_id = uuid.uuid4().hex
            hash_string = f"{self.voter.id}{self.candidate.id}{self.election.id}{self.unique_id}"
            self.vote_hash = hashlib.sha256(hash_string.encode()).hexdigest()
        super().save(*args, **kwargs)
    
    def verify_hash(self):
        """Verify if the stored hash matches the recalculated hash"""
        if not self.unique_id:
            # Old vote without unique_id - can't verify
            return False
        hash_string = f"{self.voter.id}{self.candidate.id}{self.election.id}{self.unique_id}"
        calculated_hash = hashlib.sha256(hash_string.encode()).hexdigest()
        return self.vote_hash == calculated_hash
    
    def __str__(self):
        return f"{self.voter.email} voted for {self.candidate.name}"
    
    class Meta:
        db_table = 'votes'
        unique_together = ['voter', 'election']
        ordering = ['-timestamp']