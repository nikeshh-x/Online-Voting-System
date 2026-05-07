from django.db import models


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