from django.contrib import admin
from .models import Vote

@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ('voter', 'election', 'candidate', 'timestamp')
    list_filter = ('election', 'timestamp')
    search_fields = ('voter__email', 'candidate__name', 'vote_hash')
    readonly_fields = ('vote_hash', 'timestamp')