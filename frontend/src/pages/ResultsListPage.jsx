import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Calendar, Users, Trophy } from 'lucide-react';
import Layout from '../components/Layout';
import { getElections } from '../services/api';

function ResultsListPage() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const response = await getElections();
      if (response.status === 'success') {
        setElections(response.data);
      } else if (Array.isArray(response)) {
        setElections(response);
      } else if (response.data && Array.isArray(response.data)) {
        setElections(response.data);
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Active</span>;
      case 'upcoming': return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">Upcoming</span>;
      case 'closed': return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">Closed</span>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-primary-500">Loading results...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Election Results</h1>
          <p className="text-gray-500 mt-1">View results for all elections</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {elections.map((election) => (
            <Link
              key={election.id}
              to={`/results/${election.id}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{election.title}</h3>
                  {getStatusBadge(election.status)}
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{election.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{election.candidates_count || 0} Candidates</span>
                  </div>
                  {election.status === 'closed' && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Trophy size={14} />
                      <span>Results Available</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {elections.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No elections available</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ResultsListPage;