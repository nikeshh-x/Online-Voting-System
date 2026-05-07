import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Vote, 
  BarChart3,
  ShieldCheck,
  Calendar,
  ArrowRight,
  Activity
} from 'lucide-react';
import api from '../services/api';

const DashboardPage= () => {
  const [stats, setStats] = useState({
    totalCitizens: 0,
    registeredVoters: 0,
    activeElections: 0,
    totalVotes: 0,
    turnoutRate: 0
  });
  const [recentElections, setRecentElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch dashboard data
    const fetchData = async () => {
      try {
        // Fetch citizens data
        const citizensRes = await api.get('/citizens/');
        const citizens = citizensRes.data;
        
        const registered = citizens.filter(c => c.is_registered).length;
        const turnoutRate = registered > 0 ? ((stats.totalVotes / registered) * 100).toFixed(1) : 0;
        
        setStats({
          totalCitizens: citizens.length,
          registeredVoters: registered,
          activeElections: 3, // Placeholder
          totalVotes: 1250, // Placeholder
          turnoutRate: turnoutRate
        });
        
        // Placeholder for recent elections
        setRecentElections([
          { id: 1, title: 'National Election 2024', status: 'active', endDate: '2024-12-15' },
          { id: 2, title: 'Local Election 2024', status: 'upcoming', endDate: '2024-11-30' },
          { id: 3, title: 'Student Council', status: 'closed', endDate: '2024-10-01' },
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Get user from localStorage (temp)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const statCards = [
    { 
      title: 'Total Citizens', 
      value: stats.totalCitizens, 
      icon: Users, 
      color: 'bg-blue-500',
      change: '+12%',
      changeColor: 'text-green-500'
    },
    { 
      title: 'Registered Voters', 
      value: stats.registeredVoters, 
      icon: CheckCircle, 
      color: 'bg-green-500',
      change: '+8%',
      changeColor: 'text-green-500'
    },
    { 
      title: 'Active Elections', 
      value: stats.activeElections, 
      icon: Clock, 
      color: 'bg-yellow-500',
      change: '-2',
      changeColor: 'text-red-500'
    },
    { 
      title: 'Total Votes Cast', 
      value: stats.totalVotes.toLocaleString(), 
      icon: TrendingUp, 
      color: 'bg-purple-500',
      change: '+15%',
      changeColor: 'text-green-500'
    },
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Active</span>;
      case 'upcoming':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Upcoming</span>;
      case 'closed':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">Closed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          {user ? `Welcome back, ${user.fullName || 'Voter'}!` : 'Welcome to the Online Voting System'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <p className={`text-xs mt-1 ${stat.changeColor}`}>{stat.change} from last month</p>
                    </>
                  )}
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Elections */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Recent Elections</h2>
                  <p className="text-gray-500 text-sm mt-1">Latest election activities</p>
                </div>
                <Link to="/elections" className="text-primary-500 text-sm hover:text-primary-600 flex items-center gap-1">
                  View All <ArrowRight size={16} />
                </Link>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {recentElections.map((election) => (
                <div key={election.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                        <Vote className="h-5 w-5 text-primary-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{election.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(election.status)}
                          <span className="text-xs text-gray-400">Ends: {election.endDate}</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-primary-500 hover:text-primary-600 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & Status */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link 
                to="/elections" 
                className="flex items-center justify-between w-full bg-primary-500 text-white p-3 rounded-lg hover:bg-primary-600 transition"
              >
                <span className="flex items-center gap-2">
                  <Vote size={18} />
                  View Active Elections
                </span>
                <ArrowRight size={16} />
              </Link>
              <Link 
                to="/results" 
                className="flex items-center justify-between w-full border border-primary-500 text-primary-500 p-3 rounded-lg hover:bg-primary-50 transition"
              >
                <span className="flex items-center gap-2">
                  <BarChart3 size={18} />
                  View Results
                </span>
                <ArrowRight size={16} />
              </Link>
              <Link 
                to="/profile" 
                className="flex items-center justify-between w-full border border-gray-200 text-gray-700 p-3 rounded-lg hover:bg-gray-50 transition"
              >
                <span className="flex items-center gap-2">
                  <Users size={18} />
                  Update Profile
                </span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-linear-to-r from-primary-500 to-primary-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">System Status</h2>
              <Activity className="h-5 w-5" />
            </div>
            <div className="space-y-3">
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
                <span className="text-primary-100">Voter Turnout</span>
                <span className="font-medium">{stats.turnoutRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-primary-100">Last Updated</span>
                <span className="text-sm">Just now</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;