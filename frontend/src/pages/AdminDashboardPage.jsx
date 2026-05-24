import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, UserCheck, UserX, Calendar, Vote, BarChart3, 
  Activity, TrendingUp, CheckCircle, XCircle, Clock, 
  Award, Eye, EyeOff, RefreshCw
} from 'lucide-react';
import Layout from '../components/Layout';
import { getAdminStats } from '../services/api';

function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRecentActivity, setShowRecentActivity] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await getAdminStats();
      if (response.status === 'success') {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to load stats');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Could not load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-primary-500 text-xl">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={fetchStats}
            className="mt-4 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">System overview and statistics</p>
          </div>
          <button 
            onClick={fetchStats}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Citizens Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.citizens?.total || 0}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Total Citizens</h3>
            <div className="mt-3 flex gap-4 text-sm">
              <span className="text-green-600">✓ {stats?.citizens?.registered || 0} registered</span>
              <span className="text-red-600">✗ {stats?.citizens?.unregistered || 0} unregistered</span>
            </div>
          </div>

          {/* Users Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.users?.total || 0}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <div className="mt-3 flex gap-4 text-sm">
              <span className="text-green-600">✓ {stats?.users?.verified || 0} verified</span>
              <span className="text-red-600">✗ {stats?.users?.unverified || 0} unverified</span>
            </div>
          </div>

          {/* Elections Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.elections?.total || 0}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Total Elections</h3>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Active: {stats?.elections?.active || 0}</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">Upcoming: {stats?.elections?.upcoming || 0}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">Closed: {stats?.elections?.closed || 0}</span>
            </div>
          </div>

          {/* Votes Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Vote className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.votes?.total || 0}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Total Votes Cast</h3>
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 rounded-full h-2" 
                    style={{ width: `${Math.min(stats?.votes?.turnout_percentage || 0, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{stats?.votes?.turnout_percentage || 0}%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Voter Turnout</p>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Active Elections</p>
                <p className="text-2xl font-bold">{stats?.elections?.active || 0}</p>
              </div>
              <Activity className="h-8 w-8 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Registered Voters</p>
                <p className="text-2xl font-bold">{stats?.citizens?.registered || 0}</p>
              </div>
              <UserCheck className="h-8 w-8 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Candidates</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Award className="h-8 w-8 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Votes Today</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <TrendingUp className="h-8 w-8 opacity-80" />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <p className="text-sm text-gray-500">Latest votes and user actions</p>
            </div>
            <button 
              onClick={() => setShowRecentActivity(!showRecentActivity)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showRecentActivity ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          {showRecentActivity && (
            <div className="divide-y divide-gray-100">
              {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                stats.recent_activity.map((activity, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Vote className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Vote cast by {activity.voter_email}
                        </p>
                        <p className="text-xs text-gray-500">
                          Voted for {activity.candidate_name} in {activity.election_title}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No recent activity</p>
                  <p className="text-sm text-gray-400">Votes will appear here once cast</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default AdminDashboardPage;