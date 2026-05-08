from django.db import models
from django.conf import settings
from elections.models import Election, Candidate


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

    def __str__(self):
        return f'Vote by {self.voter.email} in {self.election.title}'

    class Meta:
        db_table = 'votes'
        ordering = ['-timestamp']
        unique_together = [['voter', 'election']]
        verbose_name = 'Vote'
        verbose_name_plural = 'Votes'