import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from django.core.management.base import BaseCommand
import os

class Command(BaseCommand):
    help = 'Prepare data for K-Means clustering'
    
    def add_arguments(self, parser):
        parser.add_argument('--input', type=str, default='voting_data.csv', help='Input CSV file')
        parser.add_argument('--output', type=str, default='prepared_data.csv', help='Output file')
    
    def handle(self, *args, **options):
        input_file = options.get('input')
        output_file = options.get('output')
        
        if not os.path.exists(input_file):
            self.stdout.write(self.style.ERROR(f"File not found: {input_file}"))
            return
        
        self.stdout.write("=" * 60)
        self.stdout.write("📊 PREPARING DATA FOR K-MEANS")
        self.stdout.write("=" * 60)
        
        # Load data
        df = pd.read_csv(input_file)
        self.stdout.write(f"\n📂 Loaded {len(df)} records")
        
        # Select features for clustering
        feature_columns = ['age', 'district_code', 'gender_code', 'vote_time_hour']
        
        # Check for missing values
        missing = df[feature_columns].isnull().sum()
        self.stdout.write(f"\n📋 Missing values:\n{missing}")
        
        # Drop rows with missing values
        df_clean = df.dropna(subset=feature_columns)
        self.stdout.write(f"\n🧹 After cleaning: {len(df_clean)} records")
        
        # Extract features
        X = df_clean[feature_columns].values
        
        # Normalize features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Save prepared data
        prepared_df = pd.DataFrame(X_scaled, columns=feature_columns)
        prepared_df['original_index'] = df_clean.index
        prepared_df.to_csv(output_file, index=False)
        
        # Save scaler for later use
        import joblib
        joblib.dump(scaler, 'scaler.pkl')
        
        self.stdout.write(self.style.SUCCESS(f"\n✅ Prepared data saved to {output_file}"))
        self.stdout.write(f"📊 Features: {feature_columns}")
        self.stdout.write(f"📋 Records: {len(prepared_df)}")