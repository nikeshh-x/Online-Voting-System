from django.contrib import admin
from django.http import HttpResponse
import csv
from .models import AuditLog

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

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin, ExportCsvMixin):
    list_display = ('user', 'action', 'timestamp', 'ip_address')
    list_filter = ('action', 'timestamp')
    search_fields = ('user__email', 'ip_address', 'details')
    readonly_fields = ('timestamp',)
    date_hierarchy = 'timestamp'
    actions = ['export_to_csv']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False