import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Vote, BarChart3, Users, Clock, CheckCircle, TrendingUp, Calendar, ShieldCheck, Award, Bell, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import { SkeletonStats } from '../components/Skeleton';
import { getActiveElections, getElections, getDashboardStats, getVoteHistory } from '../services/api';

function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalElections: 0,
    activeElections: 0,
    upcomingElections: 0,
    closedElections: 0,
    totalVotesCast: 0,
    myVotes: 0,
    participationRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [recentElections, setRecentElections] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      setUser(userData);

      // Get all elections
      const electionsRes = await getElections();
      let allElections = [];
      if (electionsRes && electionsRes.status === 'success') {
        allElections = electionsRes.data || [];
      } else if (Array.isArray(electionsRes)) {
        allElections = electionsRes;
      }

      // Get active elections
      const activeRes = await getActiveElections();
      let activeElections = [];
      if (activeRes && activeRes.status === 'success') {
        activeElections = activeRes.data || [];
      } else if (Array.isArray(activeRes)) {
        activeElections = activeRes;
      }

      // Calculate upcoming elections
      const now = new Date();
      const upcoming = allElections.filter(e => new Date(e.start_datetime) > now);
      
      // Calculate closed elections
      const closed = allElections.filter(e => e.status === 'closed');

      // Get user's vote count from API
      let userVotes = 0;
      try {
        const voteHistoryRes = await getVoteHistory();
        if (voteHistoryRes.status === 'success') {
          userVotes = voteHistoryRes.count || 0;
        }
      } catch (err) {
        console.error('Error fetching vote count:', err);
        // If API fails, try to get from localStorage or set to 0
        userVotes = 0;
      }

      let totalVotes = 0;
      try {
        const statsRes = await getDashboardStats();
        if (statsRes.status === 'success') {
          totalVotes = statsRes.data.votes?.total || 0;
        }
      } catch (err) {
        console.error('Error fetching votes:', err);
      }

      // Calculate participation rate
      const participationRate = allElections.length > 0 
        ? Math.round((userVotes / allElections.length) * 100) 
        : 0;

      setStats({
        totalElections: allElections.length,
        activeElections: activeElections.length,
        upcomingElections: upcoming.length,
        closedElections: closed.length,
        totalVotesCast: totalVotes,
        myVotes: userVotes,
        participationRate: participationRate
      });

      // Get recent elections (last 3)
      setRecentElections(allElections.slice(0, 3));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => <SkeletonStats key={i} />)}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 animate-fade-in">
        {/* Welcome Header with Refresh Button */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-8 w-8 text-primary-500" />
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.full_name || user?.email || 'Voter'}!
              </h1>
            </div>
            <p className="text-gray-500">Track your voting activity and participate in elections</p>
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-2">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">My Votes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.myVotes}</p>
                <p className="text-xs text-gray-400 mt-1">Out of {stats.totalElections} elections</p>
              </div>
              <div className="bg-primary-100 p-3 rounded-lg">
                <Vote className="h-6 w-6 text-primary-500" />
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-primary-500 rounded-full h-1.5" 
                  style={{ width: `${stats.participationRate}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{stats.participationRate}% participation rate</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Elections</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeElections}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
            {stats.activeElections > 0 && (
              <Link 
                to="/elections?status=active" 
                className="text-xs text-primary-500 mt-2 inline-block hover:underline"
              >
                Vote now →
              </Link>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Upcoming Elections</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.upcomingElections}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            {stats.upcomingElections > 0 && (
              <Link 
                to="/elections?status=upcoming" 
                className="text-xs text-primary-500 mt-2 inline-block hover:underline"
              >
                View upcoming →
              </Link>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Community Votes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalVotesCast.toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status Card */}
        {user && !user.is_verified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-yellow-800">Email Not Verified</p>
                <p className="text-sm text-yellow-700">Please check your email to verify your account and start voting.</p>
              </div>
              <Link
                to="/resend-verification"
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-600 transition whitespace-nowrap"
              >
                Resend Email
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/elections"
                className="flex items-center justify-between w-full bg-primary-50 text-primary-700 p-4 rounded-lg hover:bg-primary-100 transition"
              >
                <span className="flex items-center gap-3">
                  <Vote size={20} />
                  <span className="font-medium">View Active Elections</span>
                </span>
                <span>→</span>
              </Link>
              <Link
                to="/vote-history"
                className="flex items-center justify-between w-full border border-gray-200 text-gray-700 p-4 rounded-lg hover:bg-gray-50 transition"
              >
                <span className="flex items-center gap-3">
                  <Clock size={20} />
                  <span className="font-medium">My Vote History</span>
                </span>
                <span>→</span>
              </Link>
              <Link
                to="/results"
                className="flex items-center justify-between w-full border border-gray-200 text-gray-700 p-4 rounded-lg hover:bg-gray-50 transition"
              >
                <span className="flex items-center gap-3">
                  <BarChart3 size={20} />
                  <span className="font-medium">Election Results</span>
                </span>
                <span>→</span>
              </Link>
              <Link
                to="/profile"
                className="flex items-center justify-between w-full border border-gray-200 text-gray-700 p-4 rounded-lg hover:bg-gray-50 transition"
              >
                <span className="flex items-center gap-3">
                  <Users size={20} />
                  <span className="font-medium">Update Profile</span>
                </span>
                <span>→</span>
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-sm p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Your Voting Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-primary-100">Elections Participated</span>
                <span className="font-bold text-xl">{stats.myVotes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-primary-100">Active Elections</span>
                <span className="font-bold text-xl">{stats.activeElections}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-primary-100">Upcoming Elections</span>
                <span className="font-bold text-xl">{stats.upcomingElections}</span>
              </div>
              <div className="pt-3 border-t border-white/20">
                <div className="flex justify-between items-center">
                  <span className="text-primary-100">Account Status</span>
                  <span className="flex items-center gap-1">
                    {user?.is_verified ? (
                      <span className="text-green-300">✓ Verified</span>
                    ) : (
                      <span className="text-yellow-300">⚠️ Not Verified</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Elections */}
        {recentElections.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Recent Elections</h3>
              <p className="text-sm text-gray-500">Latest election activities</p>
            </div>
            <div className="divide-y divide-gray-100">
              {recentElections.map((election) => (
                <div key={election.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(election.status).split(' ')[0]}`}>
                        {election.status === 'active' ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        ) : (
                          <Award size={18} className="text-gray-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{election.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(election.status)}`}>
                            {election.status_display || election.status}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(election.end_datetime).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {election.status === 'active' && (
                      <Link 
                        to={`/elections/${election.id}`}
                        className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                      >
                        Vote Now →
                      </Link>
                    )}
                    {election.status === 'closed' && (
                      <Link 
                        to={`/results/${election.id}`}
                        className="text-gray-500 hover:text-gray-600 text-sm font-medium"
                      >
                        View Results →
                      </Link>
                    )}
                    {election.status === 'upcoming' && (
                      <span className="text-gray-400 text-sm">Coming Soon</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.activeElections === 0 && stats.upcomingElections === 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Elections Available</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              There are currently no active or upcoming elections. Check back later for updates.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default DashboardPage;