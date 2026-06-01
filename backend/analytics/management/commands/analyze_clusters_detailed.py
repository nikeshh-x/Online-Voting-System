import pandas as pd
import joblib
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Detailed cluster analysis with actual values'
    
    def handle(self, *args, **options):
        self.stdout.write("=" * 70)
        self.stdout.write("📊 DETAILED CLUSTER ANALYSIS")
        self.stdout.write("=" * 70)
        
        # Load data
        clustered_df = pd.read_csv('clustered_data.csv')
        original_df = pd.read_csv('voting_data.csv')
        
        # Reverse normalization (approximate)
        scaler = joblib.load('scaler.pkl')
        
        clusters = clustered_df['cluster'].unique()
        
        for cluster in sorted(clusters):
            self.stdout.write(f"\n🔵 CLUSTER {cluster}")
            self.stdout.write("-" * 50)
            
            cluster_indices = clustered_df[clustered_df['cluster'] == cluster]['original_index'].astype(int)
            cluster_data = original_df.iloc[cluster_indices]
            
            # Age statistics (actual years)
            ages = cluster_data['age']
            self.stdout.write(f"  📊 Age Range: {ages.min()} - {ages.max()} years")
            self.stdout.write(f"  📊 Average Age: {ages.mean():.1f} years")
            
            # Gender distribution
            gender_counts = cluster_data['gender'].value_counts()
            self.stdout.write(f"  👥 Gender: {dict(gender_counts)}")
            
            # Vote time distribution
            time_counts = cluster_data['time_category'].value_counts()
            self.stdout.write(f"  ⏰ Vote Time: {dict(time_counts)}")
            
            # Candidate preference
            candidate_counts = cluster_data['candidate_name'].value_counts()
            top_candidate = candidate_counts.index[0] if len(candidate_counts) > 0 else 'N/A'
            top_percentage = (candidate_counts.iloc[0] / len(cluster_data) * 100) if len(candidate_counts) > 0 else 0
            self.stdout.write(f"  🗳️ Top Candidate: {top_candidate} ({top_percentage:.0f}%)")
            
            # District distribution
            district_counts = cluster_data['district'].value_counts()
            self.stdout.write(f"  📍 Top District: {district_counts.index[0] if len(district_counts) > 0 else 'N/A'}")
            
            # Cluster size
            size = len(cluster_data)
            total = len(original_df)
            percentage = (size / total) * 100
            self.stdout.write(f"  📏 Cluster Size: {size} voters ({percentage:.1f}%)")
        
        self.stdout.write("\n" + "=" * 70)
        self.stdout.write("✅ Analysis complete")