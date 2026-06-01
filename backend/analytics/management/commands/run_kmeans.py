import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt
import joblib
from django.core.management.base import BaseCommand
import os
from sklearn.decomposition import PCA

class Command(BaseCommand):
    help = 'Run K-Means clustering on prepared data'
    
    def add_arguments(self, parser):
        parser.add_argument('--input', type=str, default='prepared_data.csv', help='Input file')
        parser.add_argument('--k', type=int, help='Number of clusters (auto-detected if not provided)')
    
    def handle(self, *args, **options):
        input_file = options.get('input')
        k_value = options.get('k')
        
        if not os.path.exists(input_file):
            self.stdout.write(self.style.ERROR(f"File not found: {input_file}"))
            return
        
        self.stdout.write("=" * 60)
        self.stdout.write("🤖 K-MEANS CLUSTERING")
        self.stdout.write("=" * 60)
        
        # Load data
        df = pd.read_csv(input_file)
        feature_columns = ['age', 'district_code', 'gender_code', 'vote_time_hour']
        
        # Check if data exists
        if len(df) < 3:
            self.stdout.write(self.style.ERROR(f"Not enough data for clustering. Need at least 3 records, got {len(df)}"))
            return
        
        X = df[feature_columns].values
        
        self.stdout.write(f"\n📂 Loaded {len(X)} records with {len(feature_columns)} features")
        
        # Find optimal K using elbow method
        if not k_value:
            self.stdout.write("\n📊 Finding optimal K using elbow method...")
            inertias = []
            K_range = range(2, min(6, len(X) - 1))
            
            if len(K_range) < 1:
                self.stdout.write(self.style.WARNING("Not enough data for elbow method. Using K=2"))
                k_value = 2
            else:
                for k in K_range:
                    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
                    kmeans.fit(X)
                    inertias.append(kmeans.inertia_)
                    self.stdout.write(f"  K={k}: inertia={kmeans.inertia_:.2f}")
                
                # Plot elbow curve
                plt.figure(figsize=(8, 5))
                plt.plot(K_range, inertias, 'bo-')
                plt.xlabel('Number of Clusters (K)')
                plt.ylabel('Inertia')
                plt.title('Elbow Method for Optimal K')
                plt.grid(True)
                plt.savefig('elbow_curve.png')
                self.stdout.write(self.style.SUCCESS("\n✅ Elbow curve saved to elbow_curve.png"))
                
                # Suggest optimal K (elbow point)
                if len(inertias) > 2:
                    # Find where inertia starts decreasing slowly
                    diffs = np.diff(inertias)
                    k_value = np.argmin(diffs) + 2
                    k_value = max(2, min(k_value, len(K_range)))
                else:
                    k_value = 2
        
        # Run K-Means
        self.stdout.write(f"\n🎯 Running K-Means with K={k_value}...")
        kmeans = KMeans(n_clusters=k_value, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(X)
        
        # Calculate silhouette score
        if k_value > 1 and len(X) > k_value:
            silhouette_avg = silhouette_score(X, clusters)
            self.stdout.write(f"\n📊 Silhouette Score: {silhouette_avg:.4f}")
        else:
            self.stdout.write(f"\n📊 Silhouette Score: N/A (insufficient data)")
        
        # Save model
        joblib.dump(kmeans, 'kmeans_model.pkl')
        
        # Save cluster assignments
        df['cluster'] = clusters
        df.to_csv('clustered_data.csv', index=False)
        
        # PCA for visualization
        self.stdout.write("\n📊 Running PCA for visualization...")
        pca = PCA(n_components=2)
        X_pca = pca.fit_transform(X)
        
        # Save PCA results
        pca_df = pd.DataFrame(X_pca, columns=['PC1', 'PC2'])
        pca_df['cluster'] = clusters
        pca_df.to_csv('pca_data.csv', index=False)
        
        # Save PCA model
        joblib.dump(pca, 'pca_model.pkl')
        
        explained_variance = pca.explained_variance_ratio_.sum()
        self.stdout.write(f"📊 PCA Explained Variance: {explained_variance:.2%}")
        
        # Print cluster sizes
        self.stdout.write("\n📊 Cluster Sizes:")
        for i in range(k_value):
            size = np.sum(clusters == i)
            percentage = (size / len(clusters)) * 100
            self.stdout.write(f"  Cluster {i}: {size} voters ({percentage:.1f}%)")
        
        self.stdout.write(self.style.SUCCESS(f"\n✅ Clustering complete!"))
        self.stdout.write(f"📁 Results saved to clustered_data.csv")
        self.stdout.write(f"📁 PCA data saved to pca_data.csv")