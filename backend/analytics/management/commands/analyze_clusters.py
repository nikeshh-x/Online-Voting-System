import pandas as pd
import joblib
from django.core.management.base import BaseCommand
from accounts.models import Citizen

class Command(BaseCommand):
    help = 'Analyze and interpret clusters'
    
    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("📊 CLUSTER ANALYSIS")
        self.stdout.write("=" * 60)
        
        # Load clustered data
        df = pd.read_csv('clustered_data.csv')
        
        # Load original data to get original values
        original_df = pd.read_csv('voting_data.csv')
        
        # Get cluster information
        clusters = df['cluster'].unique()
        
        for cluster in sorted(clusters):
            self.stdout.write(f"\n🔵 CLUSTER {cluster}")
            self.stdout.write("-" * 40)
            
            cluster_data = df[df['cluster'] == cluster]
            original_cluster = original_df.iloc[cluster_data['original_index']]
            
            # Calculate average age
            avg_age = cluster_data['age'].mean()
            self.stdout.write(f"  Average Age: {avg_age:.1f} years")
            
            # Gender distribution
            gender_data = original_cluster['gender']
            gender_counts = gender_data.value_counts()
            self.stdout.write(f"  Gender: {dict(gender_counts)}")
            
            # Time category distribution
            time_data = original_cluster['time_category']
            time_counts = time_data.value_counts()
            self.stdout.write(f"  Vote Time: {dict(time_counts)}")
            
            # Candidates voted
            candidate_data = original_cluster['candidate_name']
            candidate_counts = candidate_data.value_counts()
            self.stdout.write(f"  Top Candidate: {candidate_counts.index[0] if len(candidate_counts) > 0 else 'N/A'}")
            self.stdout.write(f"    ({candidate_counts.values[0] if len(candidate_counts) > 0 else 0} votes)")
        
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("✅ Analysis complete")