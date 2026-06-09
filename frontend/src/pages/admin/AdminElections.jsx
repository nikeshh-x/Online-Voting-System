import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Clock, ChevronRight } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import ElectionFormModal from '../../components/ElectionFormModal';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

function AdminElections() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingElection, setEditingElection] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('admin_access_token');
      const response = await api.get('/elections/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let electionsData = [];
      if (response.data.status === 'success') {
        electionsData = response.data.data || [];
      } else if (Array.isArray(response.data)) {
        electionsData = response.data;
      } else if (response.data.results) {
        electionsData = response.data.results;
      }
      
      setElections(electionsData);
    } catch (error) {
      console.error('Error fetching elections:', error);
      setError('Failed to load elections');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingElection(null);
    setShowFormModal(true);
  };

  const handleEdit = (election) => {
    setEditingElection(election);
    setShowFormModal(true);
  };

  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('admin_access_token');
      
      // Format dates to ISO string
      const submitData = {
        title: formData.title,
        description: formData.description,
        start_datetime: new Date(formData.start_datetime).toISOString(),
        end_datetime: new Date(formData.end_datetime).toISOString(),
        status: formData.status
      };
      
      let response;
      if (editingElection) {
        response = await api.put(`/elections/${editingElection.id}/`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await api.post('/elections/', submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      if (response.data.status === 'success' || response.data.id) {
        await fetchElections();
        setShowFormModal(false);
        setEditingElection(null);
      } else {
        setError(response.data.message || 'Failed to save election');
      }
    } catch (error) {
      console.error('Error saving election:', error);
      if (error.response?.data) {
        const errors = error.response.data;
        const errorMessages = [];
        if (errors.title) errorMessages.push(`Title: ${errors.title.join(', ')}`);
        if (errors.start_datetime) errorMessages.push(`Start Date: ${errors.start_datetime.join(', ')}`);
        if (errors.end_datetime) errorMessages.push(`End Date: ${errors.end_datetime.join(', ')}`);
        setError(errorMessages.join(' | ') || 'Failed to save election');
      } else {
        setError('Failed to save election');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('admin_access_token');
      await api.delete(`/elections/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setElections(elections.filter(e => e.id !== id));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting election:', error);
      setError('Failed to delete election');
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
    const statusNames = {
      active: 'Active',
      upcoming: 'Upcoming',
      closed: 'Closed',
      draft: 'Draft',
      cancelled: 'Cancelled',
    };
    return {
      className: badges[status] || 'bg-gray-100 text-gray-800',
      label: statusNames[status] || status
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const isElectionEditable = (status) => {
    return status === 'draft' || status === 'upcoming';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-primary-500">Loading elections...</div>
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
            <h1 className="text-2xl font-bold text-gray-900">Elections</h1>
            <p className="text-gray-500 mt-1">Create, edit, and manage all elections</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition"
          >
            <Plus size={18} />
            Create Election
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Elections Grid */}
        {elections.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Elections Yet</h3>
            <p className="text-gray-500 mb-4">Create your first election to get started</p>
            <button
              onClick={handleCreate}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition"
            >
              Create Election
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {elections.map((election) => {
              const { className: badgeClass, label: statusLabel } = getStatusBadge(election.status);
              const isEditable = isElectionEditable(election.status);
              
              return (
                <div key={election.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{election.title}</h3>
                        <p className="text-gray-500 text-sm line-clamp-2">{election.description}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ml-3 ${badgeClass}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Dates */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        <span>Start: {formatDate(election.start_datetime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={14} className="text-gray-400" />
                        <span>End: {formatDate(election.end_datetime)}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between items-center text-sm mb-4 pb-4 border-b border-gray-100">
                      <div>
                        <span className="text-gray-500">Candidates: </span>
                        <span className="font-semibold text-gray-900">{election.candidates_count || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Votes: </span>
                        <span className="font-semibold text-gray-900">{election.total_votes || 0}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(election)}
                        disabled={!isEditable}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition
                          ${isEditable 
                            ? 'text-primary-600 hover:bg-primary-50' 
                            : 'text-gray-400 cursor-not-allowed'}`}
                        title={!isEditable ? 'Cannot edit election that is active or closed' : 'Edit election'}
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      
                      <button
                        onClick={() => setShowDeleteConfirm(election.id)}
                        disabled={!isEditable}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition
                          ${isEditable 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-gray-400 cursor-not-allowed'}`}
                        title={!isEditable ? 'Cannot delete election that is active or closed' : 'Delete election'}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>

                      <button
                        onClick={() => navigate(`/admin/elections/${election.id}/candidates`)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition ml-auto"
                      >
                        Manage Candidates
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal with Blur */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Election?</h3>
              <p className="text-gray-500 mb-4">
                Are you sure you want to delete this election? This action cannot be undone.
                All candidates and votes will also be deleted.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Election Form Modal with Blur */}
        <ElectionFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingElection(null);
            setError('');
          }}
          onSubmit={handleFormSubmit}
          election={editingElection}
          isLoading={formLoading}
        />
      </div>
    </AdminLayout>
  );
}

export default AdminElections;