from django.contrib import admin
from .models import Citizen

@admin.register(Citizen)
class CitizenAdmin(admin.ModelAdmin):
    list_display = ('citizenship_number', 'full_name', 'district', 'ward_number', 'is_eligible', 'is_registered')
    list_filter = ('district', 'is_eligible', 'is_registered', 'gender')
    search_fields = ('citizenship_number', 'full_name', 'father_name', 'mother_name')
    readonly_fields = ('created_at', 'updated_at') 

    fieldsets = (
        ('Personal Information', {
            'fields': ('citizenship_number', 'full_name', 'date_of_birth', 'gender')
        }),
        ('Address', {
            'fields': ('district', 'municipality', 'ward_number')
        }),
        ('Family Details', {
            'fields': ('father_name', 'mother_name')
        }),
        ('Status', {
            'fields': ('is_eligible', 'is_registered')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
