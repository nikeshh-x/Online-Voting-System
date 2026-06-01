import React, { useState, useEffect } from 'react';
import { Bar, Pie, Scatter } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { RefreshCw, Users, TrendingUp, Clock, Award, Download } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement
);

function AnalyticsDashboardPage() {
  const [data, setData] = useState(null);
  const [pcaData, setPcaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
    fetchPCAData();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('admin_access_token');
      const response = await api.get('/analytics/data/', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (response.data.status === 'success') {
        setData(response.data.data);
      } else {
        setError(response.data.message || 'No analytics data');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchPCAData = async () => {
    try {
      const adminToken = localStorage.getItem('admin_access_token');
      const response = await api.get('/analytics/pca/', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (response.data.status === 'success') {
        setPcaData(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching PCA data:', err);
    }
  };

  const runAnalytics = async () => {
    setUpdating(true);
    try {
      const adminToken = localStorage.getItem('admin_access_token');
      const response = await api.post('/analytics/run/', {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (response.data.status === 'success') {
        await fetchAnalytics();
        await fetchPCAData();
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error running analytics:', err);
      setError('Failed to run analytics');
    } finally {
      setUpdating(false);
    }
  };

  const exportReport = () => {
    if (!data) return;
    
    const reportData = {
      total_voters: data.total_voters,
      total_clusters: data.total_clusters,
      clusters: data.clusters,
      generated_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_report_${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#DC143C', '#FF6B6B', '#FFB347', '#4ECDC4', '#45B7D1', '#96CEB4'];

  // Bar chart data
  const barChartData = {
    labels: data?.clusters?.map(c => `Cluster ${c.id}`) || [],
    datasets: [
      {
        label: 'Number of Voters',
        data: data?.clusters?.map(c => c.size) || [],
        backgroundColor: 'rgba(220, 20, 60, 0.6)',
        borderColor: 'rgba(220, 20, 60, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Pie chart data
  const pieChartData = {
    labels: data?.clusters?.map(c => `Cluster ${c.id} (${c.percentage}%)`) || [],
    datasets: [
      {
        data: data?.clusters?.map(c => c.percentage) || [],
        backgroundColor: COLORS,
      },
    ],
  };

  // Scatter plot data for PCA visualization
  const scatterData = {
    datasets: data?.clusters?.map((cluster, idx) => ({
      label: `Cluster ${cluster.id}`,
      data: pcaData?.filter(d => d.cluster === cluster.id).map(d => ({ x: d.PC1, y: d.PC2 })) || [],
      backgroundColor: COLORS[idx % COLORS.length],
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBorderColor: 'white',
      pointBorderWidth: 2,
    })) || [],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (context.dataset.label) {
              return `${context.dataset.label}: ${context.raw}`;
            }
            return `${context.label}: ${context.raw}`;
          }
        }
      }
    },
  };

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Cluster: ${context.dataset.label}`;
          }
        }
      }
    },
    scales: {
      x: { 
        title: { 
          display: true, 
          text: 'Principal Component 1 (PC1)',
          font: { weight: 'bold' }
        } 
      },
      y: { 
        title: { 
          display: true, 
          text: 'Principal Component 2 (PC2)',
          font: { weight: 'bold' }
        } 
      }
    },
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-primary-500">Loading analytics...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">K-Means Analytics</h1>
            <p className="text-gray-500 mt-1">Voter segmentation and clustering analysis</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportReport}
              disabled={!data}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              <Download size={16} />
              Export Report
            </button>
            <button
              onClick={runAnalytics}
              disabled={updating}
              className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition disabled:opacity-50"
            >
              <RefreshCw size={16} className={updating ? 'animate-spin' : ''} />
              {updating ? 'Running...' : 'Run Analysis'}
            </button>
          </div>
        </div>

        {error ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800">{error}</p>
            <button
              onClick={runAnalytics}
              className="mt-3 text-primary-500 hover:text-primary-600"
            >
              Run K-Means Analysis →
            </button>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Voters</p>
                    <p className="text-2xl font-bold text-gray-900">{data?.total_voters || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary-500" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Clusters Found</p>
                    <p className="text-2xl font-bold text-gray-900">{data?.total_clusters || 0}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Largest Cluster</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.max(...(data?.cluster_values || [0]))} voters
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Analysis Date</p>
                    <p className="text-sm font-medium text-gray-900">Today</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Charts Row 1 - Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cluster Distribution (Bar Chart)</h3>
                <div className="h-80">
                  <Bar data={barChartData} options={chartOptions} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cluster Percentage (Pie Chart)</h3>
                <div className="h-80">
                  <Pie data={pieChartData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* PCA Scatter Plot */}
            {pcaData && pcaData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">PCA Visualization (2D Scatter Plot)</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Principal Component Analysis - Each point represents a voter, colored by cluster
                </p>
                <div className="h-96">
                  <Scatter data={scatterData} options={scatterOptions} />
                </div>
              </div>
            )}

            {/* Cluster Details Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Cluster Analysis</h3>
                <p className="text-sm text-gray-500">Detailed breakdown of each voter segment</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cluster</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age Range</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Age</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Top Candidate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data?.clusters?.map((cluster) => (
                      <tr key={cluster.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-primary-500">Cluster {cluster.id}</td>
                        <td className="px-6 py-4">{cluster.size} ({cluster.percentage}%)</td>
                        <td className="px-6 py-4">{cluster.age_min} - {cluster.age_max}</td>
                        <td className="px-6 py-4">{cluster.avg_age} years</td>
                        <td className="px-6 py-4">{cluster.top_candidate}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {Object.entries(cluster.genders || {}).map(([gender, count]) => (
                              <span key={gender} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {gender}: {count}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AnalyticsDashboardPage;