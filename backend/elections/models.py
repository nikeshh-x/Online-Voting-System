from django.db import models
from django.conf import settings
from django.utils import timezone


class Election(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('upcoming', 'Upcoming'),
        ('active', 'Active'),
        ('closed', 'Closed'),
        ('cancelled', 'Cancelled'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft') 
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE, related_name='created_elections')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)    

    def __str__(self):
        return f"{self.title} - {self.status}"
    
    def save(self, *args, **kwargs):
        now = timezone.now()
        if self.status != 'cancelled':
            if now < self.start_datetime:
                self.status = 'upcoming'
            elif self.start_datetime <= now <= self.end_datetime:
                self.status = 'active'
            elif now > self.end_datetime:
                self.status = 'closed'
        super().save(*args, **kwargs)

    @property
    def is_active(self):
        now = timezone.now()
        return self.start_datetime <= now <= self.end_datetime and self.status == 'active'
            
    class Meta:
        db_table = 'elections'
        verbose_name = 'Election'
        verbose_name_plural = 'Elections'
        ordering = ['-created_at']
    
    def update_status(self):
        """Update status based on current date and time"""
        now = timezone.now()
        
        # Don't change cancelled elections
        if self.status == 'cancelled':
            return
        
        # Determine new status based on dates
        if now < self.start_datetime:
            new_status = 'upcoming'
        elif self.start_datetime <= now <= self.end_datetime:
            new_status = 'active'
        elif now > self.end_datetime:
            new_status = 'closed'
        else:
            new_status = self.status
        
        # Only update if changed
        if self.status != new_status:
            self.status = new_status
            self.save(update_fields=['status'])
            return True
        return False

class Candidate(models.Model):
    election = models.ForeignKey(Election, on_delete=models.CASCADE ,related_name='candidates')
    name = models.CharField(max_length=100)
    party = models.CharField(max_length=100, blank=True, null=True)
    bio = models.TextField()
    photo = models.ImageField(upload_to='candidates/', blank=True, null=True)
    symbol = models.ImageField(upload_to='symbols/', blank=True, null=True)
    position = models.CharField(max_length=100, blank=True, null=True)
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