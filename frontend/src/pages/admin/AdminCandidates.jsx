import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, ArrowLeft, Upload, X,
  User, Users, Calendar, Image as ImageIcon
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

function AdminCandidates() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    party: '',
    bio: '',
    position: '',
    display_order: 0,
    photo: null,
    symbol: null
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [symbolPreview, setSymbolPreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, [electionId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('admin_access_token');
      
      const electionRes = await api.get(`/elections/${electionId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let electionData = electionRes.data;
      if (electionRes.data.status === 'success') {
        electionData = electionRes.data.data;
      }
      setElection(electionData);

      const candidatesRes = await api.get(`/elections/${electionId}/candidates/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let candidatesData = [];
      if (candidatesRes.data.status === 'success') {
        candidatesData = candidatesRes.data.data || [];
      } else if (Array.isArray(candidatesRes.data)) {
        candidatesData = candidatesRes.data;
      } else if (candidatesRes.data.results) {
        candidatesData = candidatesRes.data.results;
      }
      
      // Fix: Use photo_url from API response
      candidatesData = candidatesData.map(candidate => ({
        ...candidate,
        displayImage: candidate.photo_url || null,
        displaySymbol: candidate.symbol_url || candidate.symbol || null
      }));
      
      candidatesData.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setCandidates(candidatesData);
      
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const isElectionEditable = () => {
    return election && (election.status === 'draft' || election.status === 'upcoming');
  };

  const handleOpenCreate = () => {
    if (!isElectionEditable()) {
      setError('Cannot add candidates to an election that is active or closed');
      return;
    }
    setEditingCandidate(null);
    setFormData({
      name: '',
      party: '',
      bio: '',
      position: '',
      display_order: candidates.length,
      photo: null,
      symbol: null
    });
    setPhotoPreview(null);
    setSymbolPreview(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (candidate) => {
    if (!isElectionEditable()) {
      setError('Cannot edit candidates of an election that is active or closed');
      return;
    }
    
    setEditingCandidate(candidate);
    setFormData({
      name: candidate.name || '',
      party: candidate.party || '',
      bio: candidate.bio || '',
      position: candidate.position || '',
      display_order: candidate.display_order || 0,
      photo: null,
      symbol: null
    });
    setPhotoPreview(candidate.displayImage || null);
    setSymbolPreview(candidate.displaySymbol || null);
    setShowFormModal(true);
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    if (type === 'photo') {
      setFormData({ ...formData, photo: file });
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFormData({ ...formData, symbol: file });
      const reader = new FileReader();
      reader.onloadend = () => setSymbolPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Candidate name is required');
      return;
    }

    setFormLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('admin_access_token');
      const submitData = new FormData();
      
      submitData.append('name', formData.name);
      submitData.append('election', electionId);
      submitData.append('bio', formData.bio || '');
      
      if (formData.party) submitData.append('party', formData.party);
      if (formData.position) submitData.append('position', formData.position);
      submitData.append('display_order', formData.display_order);
      
      if (formData.photo instanceof File) {
        submitData.append('photo', formData.photo);
      }
      if (formData.symbol instanceof File) {
        submitData.append('symbol', formData.symbol);
      }

      let response;
      if (editingCandidate) {
        response = await api.put(`/candidates/${editingCandidate.id}/`, submitData, {
          headers: { 
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        response = await api.post(`/elections/${electionId}/candidates/`, submitData, {
          headers: { 
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      console.log('Save response:', response.data);
      
      setShowFormModal(false);
      // Wait a moment for the backend to process, then refresh
      setTimeout(() => {
        fetchData();
      }, 500);
      
    } catch (error) {
      console.error('Save error:', error);
      if (error.response?.data) {
        const errors = error.response.data;
        const errorMessages = [];
        if (errors.election) errorMessages.push(`Election: ${errors.election.join(', ')}`);
        if (errors.bio) errorMessages.push(`Bio: ${errors.bio.join(', ')}`);
        if (errors.name) errorMessages.push(`Name: ${errors.name.join(', ')}`);
        setError(errorMessages.join(' | ') || 'Failed to save candidate');
      } else {
        setError('Failed to save candidate');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('admin_access_token');
      await api.delete(`/candidates/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCandidates(candidates.filter(c => c.id !== id));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete candidate');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-primary-500">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!election) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-500">Election not found</p>
          <button
            onClick={() => navigate('/admin/elections')}
            className="mt-4 text-primary-500 hover:underline"
          >
            Back to Elections
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/admin/elections')}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2"
            >
              <ArrowLeft size={18} />
              Back to Elections
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{election.title}</h1>
            <p className="text-gray-500 mt-1">Manage candidates for this election</p>
          </div>
          <button
            onClick={handleOpenCreate}
            disabled={!isElectionEditable()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition
              ${isElectionEditable() 
                ? 'bg-primary-500 text-white hover:bg-primary-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            <Plus size={18} />
            Add Candidate
          </button>
        </div>

        {/* Election Info Bar */}
        <div className="bg-gray-50 rounded-lg p-4 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                {election.start_datetime ? new Date(election.start_datetime).toLocaleDateString() : 'N/A'} - {election.end_datetime ? new Date(election.end_datetime).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">{candidates.length} Candidates</span>
            </div>
          </div>
          <div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              election.status === 'active' ? 'bg-green-100 text-green-800' :
              election.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
              election.status === 'draft' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {election.status_display || election.status || 'Draft'}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Candidates Grid */}
        {candidates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Candidates Yet</h3>
            <p className="text-gray-500 mb-4">Add candidates for this election</p>
            {isElectionEditable() && (
              <button
                onClick={handleOpenCreate}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition"
              >
                Add Your First Candidate
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate, index) => (
              <div key={candidate.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                {/* Photo */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl overflow-hidden">
                  {candidate.displayImage ? (
                    <img 
                      src={candidate.displayImage} 
                      alt={candidate.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image failed to load:', candidate.displayImage);
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="flex items-center justify-center h-full"><svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>';
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <User size={48} className="text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900">{candidate.name}</h3>
                  {candidate.party && (
                    <p className="text-sm text-primary-600 font-medium">{candidate.party}</p>
                  )}
                  {candidate.position && (
                    <p className="text-xs text-gray-500 mt-1">Position: {candidate.position}</p>
                  )}
                  {candidate.bio && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{candidate.bio}</p>
                  )}

                  {/* Symbol Preview */}
                  {candidate.displaySymbol && (
                    <div className="mt-3 flex items-center gap-2">
                      <ImageIcon size={14} className="text-gray-400" />
                      <img 
                        src={candidate.displaySymbol} 
                        alt="Symbol"
                        className="w-6 h-6 object-contain"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  {isElectionEditable() && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleOpenEdit(candidate)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(candidate.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Candidate Form Modal */}
        {showFormModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}
                </h2>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Candidate Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Political Party
                  </label>
                  <input
                    type="text"
                    name="party"
                    value={formData.party}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="e.g., Nepali Congress, UML, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="e.g., President, Chairman, Vice President"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Biography / Bibliography *
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio || ''}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="Write candidate's biography, achievements, background, etc."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Candidate Photo
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition overflow-hidden bg-gray-50">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-4">
                          <Upload size={24} className="text-gray-400 mx-auto mb-1" />
                          <span className="text-xs text-gray-500">Upload</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'photo')}
                        className="hidden"
                      />
                    </label>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Upload candidate photo (JPG, PNG up to 5MB)</p>
                      {editingCandidate?.displayImage && !photoPreview && (
                        <p className="text-xs text-green-600 mt-1">Current photo will be kept</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Party Symbol
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition overflow-hidden bg-gray-50">
                      {symbolPreview ? (
                        <img src={symbolPreview} alt="Symbol" className="w-full h-full object-contain p-2" />
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon size={24} className="text-gray-400 mx-auto mb-1" />
                          <span className="text-xs text-gray-500">Symbol</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'symbol')}
                        className="hidden"
                      />
                    </label>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Upload party symbol (JPG, PNG up to 5MB)</p>
                      {editingCandidate?.displaySymbol && !symbolPreview && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-green-600">Current symbol:</span>
                          <img src={editingCandidate.displaySymbol} alt="Current symbol" className="w-6 h-6 object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first on the ballot</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50"
                  >
                    {formLoading ? 'Saving...' : (editingCandidate ? 'Update Candidate' : 'Add Candidate')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Candidate?</h3>
              <p className="text-gray-500 mb-4">
                Are you sure you want to delete this candidate? This action cannot be undone.
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
      </div>
    </AdminLayout>
  );
}

export default AdminCandidates;