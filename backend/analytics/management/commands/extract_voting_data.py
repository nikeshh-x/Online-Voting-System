import csv
import os
from datetime import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User, Citizen
from elections.models import Election, Candidate
from voting.models import Vote

class Command(BaseCommand):
    help = 'Extract voting data for K-Means clustering'
    
    def add_arguments(self, parser):
        parser.add_argument('--election-id', type=int, help='Specific election ID')
        parser.add_argument('--output', type=str, default='voting_data.csv', help='Output filename')
    
    def handle(self, *args, **options):
        election_id = options.get('election-id')
        output_file = options.get('output')
        
        self.stdout.write("=" * 60)
        self.stdout.write("📊 EXTRACTING VOTING DATA")
        self.stdout.write("=" * 60)
        
        # Get elections
        if election_id:
            elections = Election.objects.filter(id=election_id)
        else:
            elections = Election.objects.filter(status='closed')
        
        if not elections.exists():
            self.stdout.write(self.style.ERROR("No closed elections found"))
            return
        
        # Prepare data
        data = []
        
        for election in elections:
            self.stdout.write(f"\nProcessing: {election.title}")
            
            # Get all votes for this election
            votes = Vote.objects.filter(election=election).select_related('voter', 'voter__citizen', 'candidate')
            
            self.stdout.write(f"  Found {votes.count()} votes")
            
            for vote in votes:
                user = vote.voter
                citizen = user.citizen
                
                if not citizen:
                    continue
                
                # Calculate age at voting time
                age = vote.timestamp.year - citizen.date_of_birth.year
                if vote.timestamp.month < citizen.date_of_birth.month or \
                   (vote.timestamp.month == citizen.date_of_birth.month and vote.timestamp.day < citizen.date_of_birth.day):
                    age -= 1
                
                # District code (simple mapping)
                district_code = hash(citizen.district) % 100
                
                # Gender code: M=1, F=2, O=3
                gender_code = {'M': 1, 'F': 2, 'O': 3}.get(citizen.gender, 1)
                
                # Vote time hour
                vote_time_hour = vote.timestamp.hour
                
                # Time category
                if 5 <= vote_time_hour < 12:
                    time_category = 'morning'
                elif 12 <= vote_time_hour < 17:
                    time_category = 'afternoon'
                elif 17 <= vote_time_hour < 21:
                    time_category = 'evening'
                else:
                    time_category = 'night'
                
                data.append({
                    'vote_id': vote.id,
                    'election_id': election.id,
                    'election_title': election.title,
                    'user_id': user.id,
                    'user_email': user.email,
                    'candidate_id': vote.candidate.id,
                    'candidate_name': vote.candidate.name,
                    'age': age,
                    'district': citizen.district,
                    'district_code': district_code,
                    'gender': citizen.gender,
                    'gender_code': gender_code,
                    'vote_time': vote.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                    'vote_time_hour': vote_time_hour,
                    'time_category': time_category,
                })
        
        # Write to CSV
        if data:
            with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = ['vote_id', 'election_id', 'election_title', 'user_id', 'user_email',
                              'candidate_id', 'candidate_name', 'age', 'district', 'district_code',
                              'gender', 'gender_code', 'vote_time', 'vote_time_hour', 'time_category']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(data)
            
            self.stdout.write(self.style.SUCCESS(f"\n✅ Data exported to {output_file}"))
            self.stdout.write(f"📊 Total records: {len(data)}")
            self.stdout.write(f"📋 Features: {len(fieldnames)}")
        else:
            self.stdout.write(self.style.WARNING("No data to export"))