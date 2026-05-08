from django.contrib import admin
from .models import Citizen, User
from django.contrib.auth.admin import UserAdmin
from django.utils.safestring import mark_safe

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


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'get_citizen_name', 'phone', 'is_email_verified', 'is_staff')
    list_filter = ('is_email_verified', 'is_staff', 'is_active')
    search_fields = ('email', 'citizen__full_name', 'citizen__citizenship_number')
    
    def get_citizen_name(self, obj):
        if obj.citizen:
            return obj.citizen.full_name
        return '-'
    get_citizen_name.short_description = 'Citizen Name'
    
    fieldsets = UserAdmin.fieldsets + (
        ('Voting Information', {
            'fields': ('citizen', 'phone', 'is_email_verified', 'email_verification_token')
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Voting Information', {
            'fields': ('citizen', 'phone', 'email')
        }),
    )