import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, Users, CheckCircle, X, Copy, Check, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import ElectionProgress from '../components/ElectionProgress';
import CountdownTimer from '../components/CountdownTimer';
import Toast from '../components/Toast';
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
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liveVotes, setLiveVotes] = useState(0);
  const [votesAnimating, setVotesAnimating] = useState(false);
  const [toast, setToast] = useState(null);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    fetchElection();
    checkVoteStatus();
  }, [id]);

  useEffect(() => {
    let interval;
    if (election?.status === 'active') {
      interval = setInterval(() => {
        fetchElection();
        checkVoteStatus();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id, election?.status]);

  const fetchElection = async () => {
    try {
      const response = await getElectionDetail(id);
      setElection(response);
      if (response.total_votes !== liveVotes) {
        setVotesAnimating(true);
        setTimeout(() => setVotesAnimating(false), 500);
      }
      setLiveVotes(response.total_votes || 0);
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
      setShowReceiptModal(true);
      setToast({ message: 'Vote cast successfully!', type: 'success' });
      fetchElection();
    }
  } catch (err) {
    console.error('Error casting vote:', err);
    
    let errorMsg = 'Failed to cast vote. Please try again.';
    
    if (err.response?.status === 403) {
      // Check if it's an age-related error
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else {
        errorMsg = 'You are not eligible to vote. You must be 18 years or older.';
      }
    } else if (err.response?.status === 429) {
      errorMsg = 'Too many votes. Please wait an hour before voting again.';
    } else if (err.response?.data?.errors) {
      const errors = err.response.data.errors;
      errorMsg = typeof errors === 'object' ? Object.values(errors).flat()[0] : errors;
    } else if (err.response?.data?.message) {
      errorMsg = err.response.data.message;
    }
    
    setToast({ message: errorMsg, type: 'error' });
  } finally {
    setVoting(false);
  }
};

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleStatusChange = (newStatus) => {
    fetchElection();
    checkVoteStatus();
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
          <Link to="/elections" className="text-primary-500 mt-2 inline-block">
            Back to Elections
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Link
          to="/elections"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
        >
          ← Back to Elections
        </Link>

        {/* Election Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-white">{election.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <StatusBadge status={election.status} endDateTime={election.end_datetime} />
                  {election.status === 'active' && (
                    <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      LIVE
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-gray-700">{election.description}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">{formatDate(election.start_datetime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">{formatDate(election.end_datetime)}</p>
                </div>
              </div>
            </div>

            <ElectionProgress 
              startDate={election.start_datetime} 
              endDate={election.end_datetime} 
              status={election.status} 
            />

            {/* Live Vote Count */}
            {election.status === 'active' && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <TrendingUp size={16} className="text-green-500" />
                <span className="text-sm text-gray-500">Total Votes:</span>
                <span className={`font-bold text-primary-600 transition-all duration-300 ${votesAnimating ? 'scale-110' : ''}`}>
                  {liveVotes}
                </span>
              </div>
            )}

            {/* Countdown Timer */}
            {election.status !== 'closed' && (
              <div className="pt-2">
                <CountdownTimer 
                  electionId={id} 
                  onStatusChange={handleStatusChange}
                />
              </div>
            )}
          </div>
        </div>

        {/* Already Voted Message */}
        {hasVoted && !voteResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-blue-500 shrink-0" />
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
                <div
                  key={candidate.id}
                  className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                    selectedCandidate?.id === candidate.id ? "bg-primary-50 border-l-4 border-primary-500" : ""
                  }`}
                  onClick={() => !hasVoted && !voteResult && handleVoteClick(candidate)}
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {candidate.photo ? (
                      <img
                        src={candidate.photo}
                        alt={candidate.name}
                        className="w-16 h-16 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                        <span className="text-primary-500 font-bold text-xl">
                          {candidate.name?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                      {candidate.party && <p className="text-sm text-gray-500">{candidate.party}</p>}
                      {candidate.symbol && !candidate.symbol.startsWith("/media") && (
                        <p className="text-sm text-gray-400 mt-1">Symbol: {candidate.symbol}</p>
                      )}
                    </div>
                    {election.status === "active" && !hasVoted && !voteResult && (
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <input
                          type="radio"
                          name="candidate"
                          checked={selectedCandidate?.id === candidate.id}
                          onChange={() => handleVoteClick(candidate)}
                          className="w-4 h-4 text-primary-500"
                        />
                      </div>
                    )}
                    {hasVoted && <span className="text-green-600 text-sm mt-2 sm:mt-0">✓ Voted</span>}
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

        {/* Vote Button */}
        {election.status === "active" && !hasVoted && !voteResult && selectedCandidate && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setShowConfirmModal(true)}
              className="bg-primary-500 text-white px-8 py-3 rounded-lg hover:bg-primary-600 transition font-medium text-lg"
            >
              Cast Vote for {selectedCandidate.name}
            </button>
          </div>
        )}

        {/* Results Link */}
        {election.status === 'closed' && (
          <div className="mt-6 flex justify-center">
            <Link
              to={`/results/${id}`}
              className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition"
            >
              View Results
            </Link>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && selectedCandidate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Confirm Your Vote</h3>
                <button onClick={() => setShowConfirmModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <p className="text-gray-600 mb-4">You are about to vote for:</p>
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="font-medium text-gray-900">{selectedCandidate.name}</p>
                {selectedCandidate.party && <p className="text-sm text-gray-500">{selectedCandidate.party}</p>}
              </div>
              <p className="text-sm text-red-500 mb-4">⚠️ This action cannot be undone!</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmVote}
                  disabled={voting}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50"
                >
                  {voting ? "Casting Vote..." : "Confirm Vote"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceiptModal && voteResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Vote Cast Successfully!</h3>
                <p className="text-sm text-gray-500 mt-1">Your vote has been recorded</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">Vote Receipt Hash</p>
                <code className="text-xs text-gray-700 font-mono break-all">{voteResult.vote_hash}</code>
                <button
                  onClick={() => copyToClipboard(voteResult.vote_hash)}
                  className="mt-2 text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy Hash"}
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowReceiptModal(false);
                    navigate("/vote-history");
                  }}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                >
                  View My Votes
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </div>
    </Layout>
  );
}

export default ElectionDetailPage;