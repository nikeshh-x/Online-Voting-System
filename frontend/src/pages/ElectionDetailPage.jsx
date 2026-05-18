import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, Users, Edit, Trash2, ArrowLeft, UserPlus } from 'lucide-react';
import Layout from '../components/Layout';
import { getElectionDetail, deleteElection } from '../services/api';

function ElectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.is_admin || false;

  useEffect(() => {
    fetchElection();
  }, [id]);

  const fetchElection = async () => {
    setLoading(true);
    try {
      const response = await getElectionDetail(id);
      console.log('Election Detail Response:', response);
      
      // The API returns { status: "success", data: {...} }
      if (response && response.status === 'success') {
        setElection(response.data);
      } else if (response && response.data) {
        setElection(response.data);
      } else {
        setElection(response);
      }
    } catch (error) {
      console.error('Error fetching election:', error);
      navigate('/elections');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteElection(id);
      navigate('/elections');
    } catch (error) {
      console.error('Error deleting election:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      upcoming: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-gray-100 text-gray-800',
      draft: 'bg-blue-100 text-blue-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="text-primary-500">Loading election details...</div>
        </div>
      </Layout>
    );
  }

  if (!election) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Election not found</p>
          <Link to="/elections" className="text-primary-500 mt-2 inline-block">Back to Elections</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <Link to="/elections" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={18} />
          Back to Elections
        </Link>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="bg-linear-to-r from-primary-500 to-primary-600 px-6 py-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-black">{election.title}</h1>
                <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${getStatusBadge(election.status)}`}>
                  {election.status_display || election.status}
                </span>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-white text-red-500 p-2 rounded-lg hover:bg-gray-100 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-gray-700">{election.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">{formatDate(election.start_datetime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">{formatDate(election.end_datetime)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Candidates Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Candidates</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {election.candidates && election.candidates.length > 0 ? (
              election.candidates.map((candidate) => (
                <div key={candidate.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start gap-4">
                    {candidate.photo ? (
                      <img
                        src={candidate.photo}
                        alt={candidate.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-500 font-bold text-xl">
                          {candidate.name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div>
                        <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                        {candidate.party && (
                          <p className="text-sm text-gray-500">{candidate.party}</p>
                        )}
                        {candidate.symbol && (
                          <p className="text-sm text-gray-400 mt-1">Symbol: {candidate.symbol}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No candidates added yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Election?</h3>
              <p className="text-gray-500 mb-4">
                Are you sure you want to delete "{election.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ElectionDetailPage;