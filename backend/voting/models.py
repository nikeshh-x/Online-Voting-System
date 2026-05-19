from django.db import models
from django.conf import settings
from elections.models import Election, Candidate
import hashlib
import uuid


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
    timestamp = models.DateTimeField(auto_now_add=True)
    vote_hash = models.CharField(max_length=64, unique=True)
    ip_address = models.GenericIPAddressField()

    def save(self, *args, **kwargs):
        if not self.vote_hash:
            unique_string = f"{self.voter.id}{self.candidate.id}{self.election.id}{self.timestamp or uuid.uuid4()}"
            self.vote_hash = hashlib.sha256(unique_string.encode()).hexdigest()
        super().save(*args, **kwargs)


    def __str__(self):
        return f'{self.voter.email} voted for {self.candidate.name}'

    class Meta:
        db_table = 'votes'
        ordering = ['-timestamp']
        unique_together = [['voter', 'election']]
        verbose_name = 'Vote'
        verbose_name_plural = 'Votes'