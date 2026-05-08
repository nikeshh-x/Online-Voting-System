from django.db import models
from django.conf import settings


class Election(models.Model):
    STATUS_CHOICES = [
        ('upcomming', 'Upcomming'),
        ('active', 'Active'),
        ('closed', 'Closed'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='upcomming') 
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE, related_name='created_elections')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)    

    def __str__(self):
        return f"{self.title} - {self.status}"

    class Meta:
        db_table = 'elections'
        verbose_name = 'Election'
        verbose_name_plural = 'Elections'
        ordering = ['-created_at']

class Candidate(models.Model):
    election = models.ForeignKey(Election, on_delete=models.CASCADE ,related_name='candidates')
    name = models.CharField(max_length=100)
    party = models.CharField(max_length=100, blank=True, null=True)
    bio = models.TextField()
    photo = models.ImageField(upload_to='candidates/', blank=True, null=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.name} - {self.election.title}'
    
    class Meta:
        db_table = 'candidates'
        verbose_name = 'Candidate'
        verbose_name_plural = 'Candidates'
        ordering = ['display_order', 'name']