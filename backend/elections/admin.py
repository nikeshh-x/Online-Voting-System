from django.contrib import admin
from django.http import HttpResponse
import csv
from .models import Election, Candidate

class ExportCsvMixin:
    def export_to_csv(self, request, queryset):
        meta = self.model._meta
        field_names = [field.name for field in meta.fields]
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename={meta.model_name}_export.csv'
        
        writer = csv.writer(response)
        writer.writerow(field_names)
        for obj in queryset:
            writer.writerow([getattr(obj, field) for field in field_names])
        
        return response
    export_to_csv.short_description = "Export selected to CSV"

@admin.register(Election)
class ElectionAdmin(admin.ModelAdmin, ExportCsvMixin):
    list_display = ('title', 'status', 'start_datetime', 'end_datetime', 'created_by', 'created_at')
    list_filter = ('status', 'start_datetime', 'end_datetime')
    search_fields = ('title', 'description')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'start_datetime'
    actions = ['export_to_csv', 'activate_elections', 'close_elections']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description')
        }),
        ('Schedule', {
            'fields': ('start_datetime', 'end_datetime', 'status')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def activate_elections(self, request, queryset):
        queryset.update(status='active')
        self.message_user(request, f"{queryset.count()} election(s) activated.")
    activate_elections.short_description = 'Activate Selected elections'

    def close_elections(self, request, queryset):
        queryset.update(status='closed')
        self.message_user(request, f"{queryset.count()} election(s) closed.")

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin, ExportCsvMixin):
    list_display = ('name', 'party', 'symbol', 'election','position', 'display_order', 'created_at')
    list_filter = ('election', 'party')
    search_fields = ('name', 'party','symbol', 'bio')
    readonly_fields = ('created_at', 'updated_at')
    actions = ['export_to_csv']
    
    fieldsets = (
        ('Candidate Information', {
            'fields': ('election', 'name', 'party','position', 'bio', 'photo','symbol',)
        }),
        ('Ordering', {
            'fields': ('display_order',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )