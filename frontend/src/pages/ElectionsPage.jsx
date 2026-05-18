import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, Plus } from 'lucide-react';
import Layout from '../components/Layout';
import { getElections } from '../services/api';

function ElectionsPage() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchElections();
  }, [filter]);

  const fetchElections = async () => {
    setLoading(true);
    try {
      let params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await getElections(params);
      console.log('API Response:', response);
      
      // The API returns { status: "success", data: [...] }
      if (response && response.status === 'success') {
        setElections(response.data || []);
      } else if (Array.isArray(response)) {
        setElections(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setElections(response.data);
      } else {
        setElections([]);
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
      setElections([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      upcoming: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-gray-100 text-gray-800',
      draft: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.is_admin || false;

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="text-primary-500">Loading elections...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Elections</h1>
            <p className="text-gray-500 mt-1">View and participate in elections</p>
          </div>
          {isAdmin && (
            <Link
              to="/elections/create"
              className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition"
            >
              <Plus size={18} />
              Create Election
            </Link>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {['all', 'active', 'upcoming', 'closed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-sm font-medium transition ${
                filter === tab
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {elections.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No elections found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map((election) => (
              <Link
                key={election.id}
                to={`/elections/${election.id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{election.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(election.status)}`}>
                      {election.status_display || election.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{election.description}</p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>Start: {formatDate(election.start_datetime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>End: {formatDate(election.end_datetime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} />
                      <span>{election.candidates_count || 0} Candidates</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ElectionsPage;