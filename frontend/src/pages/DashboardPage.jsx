import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Vote, BarChart3, Users, Clock, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { getDashboardStats, getActiveElections, getElections } from '../services/api';

function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalElections: 0,
    activeElections: 0,
    totalVotes: 0,
    turnoutRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      setUser(userData);

      // Fetch all elections
      const electionsRes = await getElections();
      let allElections = [];
      if (electionsRes && electionsRes.status === 'success') {
        allElections = electionsRes.data || [];
      } else if (Array.isArray(electionsRes)) {
        allElections = electionsRes;
      }

      // Fetch active elections
      const activeRes = await getActiveElections();
      let activeElections = [];
      if (activeRes && activeRes.status === 'success') {
        activeElections = activeRes.data || [];
      } else if (Array.isArray(activeRes)) {
        activeElections = activeRes;
      }

      // Calculate stats
      const totalElections = allElections.length;
      const activeCount = activeElections.length;
      
      // For now, total votes is 0 (will implement later)
      const totalVotes = 0;
      const turnoutRate = 0;

      setStats({
        totalElections,
        activeElections: activeCount,
        totalVotes,
        turnoutRate
      });
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-primary-500 text-xl">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.full_name || user?.email || 'Voter'}!
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your voting dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Elections</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalElections}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Vote className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Elections</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeElections}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            {stats.activeElections > 0 && (
              <Link 
                to="/elections?status=active" 
                className="text-xs text-primary-500 mt-2 inline-block hover:underline"
              >
                View active elections →
              </Link>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Votes Cast</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalVotes}</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Voter Turnout</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.turnoutRate}%</p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status Card */}
        {user && !user.is_verified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-yellow-800">Email Not Verified</p>
                <p className="text-sm text-yellow-700">Please check your email to verify your account.</p>
              </div>
              <Link
                to="/resend-verification"
                className="ml-auto bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-600 transition"
              >
                Resend Email
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/elections"
                className="flex items-center justify-between w-full bg-primary-50 text-primary-700 p-3 rounded-lg hover:bg-primary-100 transition"
              >
                <span className="flex items-center gap-2">
                  <Vote size={18} />
                  View Active Elections
                </span>
                <span>→</span>
              </Link>
              <Link
                to="/profile"
                className="flex items-center justify-between w-full border border-gray-200 text-gray-700 p-3 rounded-lg hover:bg-gray-50 transition"
              >
                <span className="flex items-center gap-2">
                  <Users size={18} />
                  Update Profile
                </span>
                <span>→</span>
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-sm p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-primary-100">API Status</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-primary-100">Database</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Connected
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-primary-100">Active Elections</span>
                <span className="font-medium">{stats.activeElections}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Section (if no active elections) */}
        {stats.activeElections === 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
            <Vote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Elections</h3>
            <p className="text-gray-500">Check back later for upcoming elections.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default DashboardPage;