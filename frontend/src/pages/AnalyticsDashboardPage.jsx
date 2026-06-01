import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { RefreshCw, Users, TrendingUp, Clock, Award } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function AnalyticsDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
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

  const runAnalytics = async () => {
    setUpdating(true);
    try {
      const adminToken = localStorage.getItem('admin_access_token');
      const response = await api.post('/analytics/run/', {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (response.data.status === 'success') {
        await fetchAnalytics();
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

  // Prepare chart data
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

  const pieChartData = {
    labels: data?.clusters?.map(c => `Cluster ${c.id} (${c.percentage}%)`) || [],
    datasets: [
      {
        data: data?.clusters?.map(c => c.percentage) || [],
        backgroundColor: ['#DC143C', '#FF6B6B', '#FFB347', '#4ECDC4', '#45B7D1', '#96CEB4'],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      },
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
          <button
            onClick={runAnalytics}
            disabled={updating}
            className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={updating ? 'animate-spin' : ''} />
            {updating ? 'Running...' : 'Run Analysis'}
          </button>
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

            {/* Charts */}
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

            {/* Cluster Details */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Cluster Analysis</h3>
                <p className="text-sm text-gray-500">Detailed breakdown of each voter segment</p>
              </div>
              <div className="divide-y divide-gray-100">
                {data?.clusters?.map((cluster) => (
                  <div key={cluster.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-semibold text-primary-500">Cluster {cluster.id}</h4>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {cluster.size} voters ({cluster.percentage}%)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Age Range</p>
                        <p className="font-medium">{cluster.age_min} - {cluster.age_max} years</p>
                        <p className="text-xs text-gray-400">Avg: {cluster.avg_age} years</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Top Candidate</p>
                        <p className="font-medium">{cluster.top_candidate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Gender Distribution</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {Object.entries(cluster.genders || {}).map(([gender, count]) => (
                            <span key={gender} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {gender}: {count}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-500">Vote Time Preference</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {Object.entries(cluster.time_categories || {}).map(([time, count]) => (
                          <span key={time} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                            {time}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AnalyticsDashboardPage;