from django.core.management.base import BaseCommand
from elections.models import Election

class Command(BaseCommand):
    help = 'Update all election statuses based on current date'
    
    def handle(self, *args, **options):
        elections = Election.objects.all()
        updated = 0
        
        for election in elections:
            old_status = election.status
            election.update_status()
            if old_status != election.status:
                updated += 1
                self.stdout.write(f"Updated '{election.title}': {old_status} → {election.status}")
        
        self.stdout.write(self.style.SUCCESS(f"Updated {updated} elections"))