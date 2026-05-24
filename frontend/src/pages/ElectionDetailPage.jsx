import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { getElectionDetail, checkUserVote, castVote } from '../services/api';

function ElectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [voting, setVoting] = useState(false);
  const [voteResult, setVoteResult] = useState(null);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    fetchElection();
    checkVoteStatus();
  }, [id]);

  const fetchElection = async () => {
    try {
      const response = await getElectionDetail(id);
      setElection(response);
    } catch (error) {
      console.error('Error fetching election:', error);
      navigate('/elections');
    } finally {
      setLoading(false);
    }
  };

  const checkVoteStatus = async () => {
    try {
      const response = await checkUserVote(id);
      if (response.status === 'success') {
        setHasVoted(response.has_voted);
      }
    } catch (error) {
      console.error('Error checking vote status:', error);
    }
  };

  const handleVoteClick = (candidate) => {
    setSelectedCandidate(candidate);
    setShowConfirmModal(true);
  };

  const confirmVote = async () => {
    setVoting(true);
    try {
      const response = await castVote({
        election_id: parseInt(id),
        candidate_id: selectedCandidate.id
      });
      
      if (response.status === 'success') {
        setVoteResult(response.data);
        setHasVoted(true);
        setShowConfirmModal(false);
      }
    } catch (error) {
      console.error('Error casting vote:', error);
      alert(error.response?.data?.errors || 'Failed to cast vote');
    } finally {
      setVoting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      upcoming: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-gray-100 text-gray-800',
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
          <div className="text-primary-500">Loading...</div>
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
          ← Back to Elections
        </Link>

        {/* Election Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-white">{election.title}</h1>
                <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${getStatusBadge(election.status)}`}>
                  {election.status_display || election.status}
                </span>
              </div>
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

        {/* Vote Success Message */}
        {voteResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-green-800">Vote Cast Successfully!</p>
                <p className="text-sm text-green-700">You voted for: {voteResult.candidate}</p>
                <p className="text-xs text-green-600 mt-1">Receipt: {voteResult.vote_hash}</p>
              </div>
            </div>
          </div>
        )}

        {/* Already Voted Message */}
        {hasVoted && !voteResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <p className="text-blue-800">You have already voted in this election.</p>
            </div>
          </div>
        )}

        {/* Candidates Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Candidates</h2>
            <p className="text-sm text-gray-500">Click on a candidate to vote</p>
          </div>

          <div className="divide-y divide-gray-100">
            {election.candidates && election.candidates.length > 0 ? (
              election.candidates.map((candidate) => (
                <div key={candidate.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start gap-4">
                    {candidate.photo_url ? (
                      <img
                        src={candidate.photo_url}
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
                      <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                      {candidate.party && <p className="text-sm text-gray-500">{candidate.party}</p>}
                      {candidate.symbol && !candidate.symbol.startsWith('/media') && (
                        <p className="text-sm text-gray-400 mt-1">Symbol: {candidate.symbol}</p>
                      )}
                    </div>
                    {election.status === 'active' && !hasVoted && !voteResult && (
                      <button
                        onClick={() => handleVoteClick(candidate)}
                        className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition"
                      >
                        Vote
                      </button>
                    )}
                    {hasVoted && <span className="text-green-600 text-sm">✓ Voted</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No candidates for this election</p>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && selectedCandidate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Your Vote</h3>
              <p className="text-gray-600 mb-4">You are about to vote for:</p>
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="font-medium text-gray-900">{selectedCandidate.name}</p>
                {selectedCandidate.party && <p className="text-sm text-gray-500">{selectedCandidate.party}</p>}
              </div>
              <p className="text-sm text-red-500 mb-4">This action cannot be undone!</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmVote}
                  disabled={voting}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50"
                >
                  {voting ? 'Casting Vote...' : 'Confirm Vote'}
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