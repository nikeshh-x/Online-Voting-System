import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  X,
  Copy,
  Check,
  TrendingUp,
  Award,
  BarChart3,
} from "lucide-react";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import ElectionProgress from "../components/ElectionProgress";
import CountdownTimer from "../components/CountdownTimer";
import Toast from "../components/Toast";
import { getElectionDetail, checkUserVote, castVote } from "../services/api";

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

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    fetchElection();
    checkVoteStatus();
  }, [id]);

  useEffect(() => {
    let interval;
    if (election?.status === "active") {
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
      console.error("Error fetching election:", error);
      navigate("/elections");
    } finally {
      setLoading(false);
    }
  };

  const checkVoteStatus = async () => {
    try {
      const response = await checkUserVote(id);
      if (response.status === "success") {
        setHasVoted(response.has_voted);
      }
    } catch (error) {
      console.error("Error checking vote status:", error);
    }
  };

  const handleCandidateSelect = (candidate) => {
    if (!hasVoted && election?.status === "active") {
      setSelectedCandidate(candidate);
    }
  };

  const confirmVote = async () => {
    if (!selectedCandidate) {
      setToast({ message: "Please select a candidate first", type: "warning" });
      return;
    }

    setVoting(true);

    try {
      const response = await castVote({
        election_id: parseInt(id),
        candidate_id: selectedCandidate.id,
      });

      if (response.status === "success") {
        setVoteResult(response.data);
        setHasVoted(true);
        setShowConfirmModal(false);
        setShowReceiptModal(true);
        setToast({ message: "Vote cast successfully!", type: "success" });
        fetchElection();
      }
    } catch (err) {
      console.error("Error casting vote:", err);

      let errorMsg = "Failed to cast vote. Please try again.";

      if (err.response?.status === 403) {
        if (err.response?.data?.message) {
          errorMsg = err.response.data.message;
        } else {
          errorMsg =
            "You are not eligible to vote. You must be 18 years or older.";
        }
      } else if (err.response?.status === 429) {
        errorMsg = "Too many votes. Please wait an hour before voting again.";
      } else if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        errorMsg =
          typeof errors === "object" ? Object.values(errors).flat()[0] : errors;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }

      setToast({ message: errorMsg, type: "error" });
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
    if (!dateString) return "N/A";
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
      <div className="max-w-6xl mx-auto p-6 animate-fade-in">
        {/* Back button */}
        <Link
          to="/elections"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          ← Back to Elections
        </Link>

        {/* Election Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-8 py-6">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {election.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <StatusBadge
                    status={election.status}
                    endDateTime={election.end_datetime}
                  />
                  {election.status === "active" && (
                    <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      LIVE NOW
                    </div>
                  )}
                </div>
              </div>
              {election.status === "active" && (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-white/80">Total Votes</p>
                  <p
                    className={`text-2xl font-bold text-white ${votesAnimating ? "scale-110 transition-transform" : ""}`}
                  >
                    {liveVotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            <p className="text-gray-700 text-lg leading-relaxed">
              {election.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(election.start_datetime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(election.end_datetime)}
                  </p>
                </div>
              </div>
            </div>

            <ElectionProgress
              startDate={election.start_datetime}
              endDate={election.end_datetime}
              status={election.status}
            />

            {election.status !== "closed" && (
              <div className="mt-6">
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
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">
                  You have already voted in this election
                </p>
                <p className="text-sm text-green-700">
                  Thank you for participating!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Candidates Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Candidates</h2>
              <p className="text-gray-500 mt-1">
                Click on a candidate card to select them
              </p>
            </div>
            {election.status === "active" && !hasVoted && selectedCandidate && (
              <div className="text-right">
                <p className="text-sm text-green-600 font-medium">
                  ✓ Candidate selected
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {election.candidates && election.candidates.length > 0 ? (
              election.candidates.map((candidate) => {
                const isSelected = selectedCandidate?.id === candidate.id;
                const canVote =
                  election.status === "active" && !hasVoted && !voteResult;
                const isClickable = canVote && !hasVoted;

                return (
                  <div
                    key={candidate.id}
                    onClick={() =>
                      isClickable && handleCandidateSelect(candidate)
                    }
                    className={`
                      relative bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer transition-all duration-300
                      ${isClickable ? "hover:shadow-xl hover:-translate-y-1" : "cursor-default"}
                      ${isSelected ? "ring-2 ring-primary-500 shadow-lg transform scale-[1.02]" : ""}
                      ${hasVoted ? "opacity-75" : ""}
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`h-2 w-full ${isSelected ? "bg-primary-500" : "bg-gray-200"}`}
                    />

                    <div className="p-6">
                      <div className="flex justify-center mb-4">
                        {candidate.photo_url ? (
                          <img
                            src={candidate.photo_url}
                            alt={candidate.name}
                            className="w-28 h-28 rounded-full object-cover border-4 border-gray-100 shadow-md"
                          />
                        ) : (
                          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-md">
                            <span className="text-primary-500 font-bold text-4xl">
                              {candidate.name?.charAt(0) || "?"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">
                          {candidate.name}
                        </h3>
                        {candidate.party && (
                          <p className="text-sm text-gray-500 mt-1">
                            {candidate.party}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        {candidate.position && (
                          <div className="flex items-center justify-center gap-2 text-gray-600">
                            <Award size={14} />
                            <span>{candidate.position}</span>
                          </div>
                        )}

                        {/* Symbol Display - Handle both text and image */}
                        {candidate.symbol && (
                          <div className="flex flex-col items-center gap-2 mt-4 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                            {candidate.symbol.startsWith("/media/") ||
                            candidate.symbol.startsWith("http") ? (
                              <img
                                src={candidate.symbol}
                                alt="Election symbol"
                                className="w-14 h-14 object-contain"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="text-5xl leading-none">
                                {candidate.symbol}
                              </span>
                            )}
                            <span className="text-xs text-gray-400 uppercase tracking-wide">
                              Election symbol
                            </span>
                          </div>
                        )}
                      </div>

                      {candidate.bio && (
                        <p className="mt-4 text-sm text-gray-600 line-clamp-2 text-center">
                          {candidate.bio}
                        </p>
                      )}
                    </div>

                    {canVote && !hasVoted && (
                      <div className="px-6 pb-6">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCandidateSelect(candidate);
                            setShowConfirmModal(true);
                          }}
                          className={`w-full py-3 rounded-xl font-semibold transition-all duration-200
                            ${
                              isSelected
                                ? "bg-primary-500 text-white hover:bg-primary-600"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                          {isSelected
                            ? "Vote for " + candidate.name
                            : "Select Candidate"}
                        </button>
                      </div>
                    )}

                    {hasVoted && (
                      <div className="px-6 pb-6">
                        <div className="w-full py-3 rounded-xl bg-green-50 text-green-600 font-semibold text-center">
                          ✓ Voted
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No candidates for this election</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Vote Button */}
        {election.status === "active" && !hasVoted && selectedCandidate && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={voting}
              className="bg-primary-500 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:bg-primary-600 transition-all duration-200 hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
            >
              <BarChart3 className="h-5 w-5" />
              Vote for {selectedCandidate.name}
            </button>
          </div>
        )}

        {/* Results Link */}
        {election.status === "closed" && (
          <div className="text-center mt-8">
            <Link
              to={`/results/${id}`}
              className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition"
            >
              <BarChart3 size={18} />
              View Election Results
            </Link>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && selectedCandidate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Confirm Your Vote
                </h3>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="text-center mb-6">
                <p className="text-gray-600 mb-3">You are about to vote for:</p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-lg font-bold text-gray-900">
                    {selectedCandidate.name}
                  </h4>
                  {selectedCandidate.party && (
                    <p className="text-sm text-gray-500">
                      {selectedCandidate.party}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 rounded-xl p-3 mb-6">
                <p className="text-sm text-yellow-800 text-center">
                  ⚠️ This action cannot be undone. Please vote carefully.
                </p>
              </div>

              <div className="flex gap-3">
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Vote Cast Successfully!
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Your vote has been recorded
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-500 mb-1">Vote Receipt Hash</p>
                <code className="text-xs text-gray-700 font-mono break-all">
                  {voteResult.vote_hash}
                </code>
                <button
                  onClick={() => copyToClipboard(voteResult.vote_hash)}
                  className="mt-2 text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy Hash"}
                </button>
              </div>

              <div className="flex gap-3">
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
