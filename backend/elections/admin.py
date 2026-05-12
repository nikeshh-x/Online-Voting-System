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
    actions = ['export_to_csv']
    
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

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin, ExportCsvMixin):
    list_display = ('name', 'party', 'election', 'display_order', 'created_at')
    list_filter = ('election', 'party')
    search_fields = ('name', 'party', 'bio')
    readonly_fields = ('created_at', 'updated_at')
    actions = ['export_to_csv']
    
    fieldsets = (
        ('Candidate Information', {
            'fields': ('election', 'name', 'party', 'bio', 'photo')
        }),
        ('Ordering', {
            'fields': ('display_order',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )