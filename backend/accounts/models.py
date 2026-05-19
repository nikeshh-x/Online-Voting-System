from django.db import models
from django.contrib.auth.models import AbstractUser

class Citizen(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]

    citizenship_number = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=200)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)

    district = models.CharField(max_length=100)
    municipality = models.CharField(max_length=100)
    ward_number = models.IntegerField()

    father_name = models.CharField(max_length=200, blank=True)
    mother_name = models.CharField(max_length=200, blank=True)

    is_eligible = models.BooleanField(default=True)
    is_registered = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.citizenship_number} - {self.full_name}"
    
    class Meta:
        db_table = 'citizens'
        verbose_name = 'Citizen'
        verbose_name_plural = 'Citizens'
        ordering = ['-created_at']

class User(AbstractUser):
    citizen = models.OneToOneField(Citizen, on_delete=models.SET_NULL, null=True, blank=True, related_name='user')
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.UUIDField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)
    has_voted = models.BooleanField(default=False)

    def __str__(self):
        if self.citizen and self.citizen.full_name:
            return f"{self.email} ({self.citizen.full_name})"
        return self.email
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'