from django.contrib import admin
from .models import Election, Candidate

@admin.register(Election)
class ElectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'start_datetime', 'end_datetime', 'created_at')
    list_filter = ('status', 'start_datetime', 'end_datetime')
    search_fields = ('title', 'description')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('name', 'party', 'election', 'display_order')
    list_filter = ('election', 'party')
    search_fields = ('name', 'party', 'bio')