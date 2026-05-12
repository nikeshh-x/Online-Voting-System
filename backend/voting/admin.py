from django.contrib import admin
from django.http import HttpResponse
import csv
from .models import Vote

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

@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin, ExportCsvMixin):
    list_display = ('voter', 'election', 'candidate', 'timestamp', 'ip_address')
    list_filter = ('election', 'timestamp')
    search_fields = ('voter__email', 'candidate__name', 'vote_hash')
    readonly_fields = ('vote_hash', 'timestamp', 'ip_address')
    date_hierarchy = 'timestamp'
    actions = ['export_to_csv']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    fieldsets = (
        ('Vote Information', {
            'fields': ('voter', 'election', 'candidate', 'timestamp', 'ip_address', 'vote_hash')
        }),
    )