import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Vote,
  Calendar,
  User,
  Copy,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import Layout from "../components/Layout";
import api from "../services/api";

function VoteHistoryPage() {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [verificationResults, setVerificationResults] = useState({});
  const [verifyingIds, setVerifyingIds] = useState({});

  useEffect(() => {
    fetchVoteHistory();
  }, []);

  const fetchVoteHistory = async () => {
    try {
      const response = await api.get("/vote/history/");
      if (response.data.status === "success") {
        setVotes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching vote history:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, voteId) => {
    navigator.clipboard.writeText(text);
    setCopiedId(voteId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
            Active
          </span>
        );
      case "upcoming":
        return (
          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
            Upcoming
          </span>
        );
      case "closed":
        return (
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  const verifyVote = async (voteHash, voteId) => {
    setVerifyingIds(prev => ({ ...prev, [voteId]: true }));
    
    try {
      const response = await api.get(`/vote/verify/${voteHash}/`);
      if (response.data.status === "success") {
        setVerificationResults(prev => ({
          ...prev,
          [voteId]: { is_valid: response.data.data.is_valid }
        }));
      } else {
        setVerificationResults(prev => ({
          ...prev,
          [voteId]: { is_valid: false, error: response.data.message }
        }));
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResults(prev => ({
        ...prev,
        [voteId]: { is_valid: false, error: "Verification failed" }
      }));
    } finally {
      setVerifyingIds(prev => ({ ...prev, [voteId]: false }));
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-primary-500 text-xl">
            Loading vote history...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Vote History</h1>
          <p className="text-gray-500 mt-1">View all your past votes</p>
        </div>

        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-4 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Votes Cast</p>
              <p className="text-3xl font-bold">{votes.length}</p>
            </div>
            <Vote className="h-10 w-10 opacity-80" />
          </div>
        </div>

        {votes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <Vote className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No votes yet
            </h3>
            <p className="text-gray-500">You haven't cast any votes yet.</p>
            <Link
              to="/elections"
              className="inline-block mt-4 text-primary-500 hover:text-primary-600"
            >
              View Active Elections →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {votes.map((vote, index) => {
              const uniqueId = vote.id !== undefined ? vote.id : index;
              const isVerifying = verifyingIds[uniqueId];
              const result = verificationResults[uniqueId];
              
              return (
                <div
                  key={uniqueId}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {vote.election_title}
                          </h3>
                          {getStatusBadge(vote.election_status)}
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                          {vote.candidate_photo ? (
                            <img
                              src={vote.candidate_photo}
                              alt={vote.candidate_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-500 font-bold">
                                {vote.candidate_name?.charAt(0) || "?"}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {vote.candidate_name}
                            </p>
                            {vote.candidate_party && (
                              <p className="text-sm text-gray-500">
                                {vote.candidate_party}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>Cast on: {formatDate(vote.timestamp)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            <span>Candidate ID: {vote.candidate_id}</span>
                          </div>
                        </div>

                        <div className="mt-3 bg-gray-50 rounded-lg p-2 flex items-center justify-between">
                          <code className="text-xs text-gray-600 font-mono break-all">
                            Vote Hash: {vote.vote_hash}
                          </code>
                          <button
                            onClick={() => copyToClipboard(vote.vote_hash, uniqueId)}
                            className="ml-2 p-1 text-gray-400 hover:text-primary-500 transition"
                            title="Copy hash"
                          >
                            {copiedId === uniqueId ? (
                              <CheckCircle size={16} className="text-green-500" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>

                        <div className="mt-3">
                          <button
                            onClick={() => verifyVote(vote.vote_hash, uniqueId)}
                            className="text-xs text-primary-500 hover:text-primary-600"
                            disabled={isVerifying}
                          >
                            {isVerifying ? "Verifying..." : "Verify Vote Integrity"}
                          </button>
                          
                          {result && (
                            <div
                              className={`mt-2 p-2 rounded-lg text-xs ${
                                result.is_valid
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {result.is_valid ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle size={14} />
                                  <span>✓ Vote is valid and verified</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span>✗</span>
                                  <span>
                                    {result.error || "Vote integrity check failed"}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <Link
                        to={`/results/${vote.election_id}`}
                        className="ml-4 flex items-center gap-1 text-primary-500 hover:text-primary-600 text-sm font-medium whitespace-nowrap"
                      >
                        View Results
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default VoteHistoryPage;