import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Users, Vote, Award, Calendar, Clock, Download, Printer, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import BarChart from '../components/BarChart';
import PieChart from '../components/PieChart';
import TurnoutGauge from '../components/TurnoutGauge';
import { getElectionResults } from '../services/api';

function ResultsPage() {
  const { id } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [totalEligibleVoters, setTotalEligibleVoters] = useState(0);

  useEffect(() => {
    fetchResults();
    fetchTotalEligibleVoters();
    
    // Auto-refresh every 10 seconds for active elections
    const interval = setInterval(() => {
      if (results?.election?.status === 'active') {
        fetchResults();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [id]);

  const fetchResults = async () => {
    try {
      const response = await getElectionResults(id);
      if (response.status === 'success') {
        setResults(response.data);
        setLastUpdated(new Date());
      } else {
        setError('Failed to load results');
      }
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Could not load election results');
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalEligibleVoters = async () => {
    try {
      const response = await fetch('/api/admin/stats/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setTotalEligibleVoters(data.data.users?.verified || 0);
      }
    } catch (err) {
      console.error('Error fetching eligible voters:', err);
      setTotalEligibleVoters(results?.total_votes || 0);
    }
  };

  const exportToCSV = () => {
    if (!results || !results.results) return;
    
    const headers = ['Candidate', 'Party', 'Votes', 'Percentage'];
    const rows = results.results.map(c => [
      c.name,
      c.party || 'Independent',
      c.votes,
      `${c.percentage}%`
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${results.election.title}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      upcoming: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-primary-500 text-xl">Loading results...</div>
        </div>
      </Layout>
    );
  }

  if (error || !results) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-500">{error || 'No results available'}</p>
          <Link to="/elections" className="text-primary-500 mt-4 inline-block">Back to Elections</Link>
        </div>
      </Layout>
    );
  }

  const isElectionClosed = results.election.status === 'closed';
  const hasVotes = results.total_votes > 0;
  const totalCandidates = results.results?.length || 0;

  // Prepare chart data
  const barChartData = results.chart_data || { labels: [], datasets: [] };
  const pieChartData = {
    labels: results.results?.map(c => c.name) || [],
    datasets: [{
      data: results.results?.map(c => c.percentage) || [],
      backgroundColor: ['#DC143C', '#FF6B6B', '#FFB347', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
    }]
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header with Actions */}
        <div className="flex justify-between items-center mb-6">
          <Link to="/elections" className="text-primary-500 hover:underline">
            ← Back to Elections
          </Link>
          <div className="flex gap-2 no-print">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              <Printer size={16} />
              Print
            </button>
          </div>
        </div>

        {/* Live Indicator */}
        {results.election.status === 'active' && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-full text-xs">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
            <span className="text-xs text-gray-500">Auto-refreshing every 10 seconds</span>
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        )}

        {/* Election Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">{results.election.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadge(results.election.status)}`}>
                {results.election.status_display}
              </span>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-700">{results.election.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>Start: {formatDate(results.election.start_datetime)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>End: {formatDate(results.election.end_datetime)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Votes</p>
                <p className="text-2xl font-bold text-gray-900">{results.total_votes}</p>
              </div>
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Vote className="h-5 w-5 text-primary-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Candidates</p>
                <p className="text-2xl font-bold text-gray-900">{totalCandidates}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Turnout</p>
                <p className="text-2xl font-bold text-gray-900">{results.turnout_percentage}%</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100 flex items-center justify-center">
            <TurnoutGauge percentage={results.turnout_percentage} size={70} />
          </div>
        </div>

        {/* Winner Announcement */}
        {isElectionClosed && results.winner && (
          <div className={`bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 mb-8 text-white ${results.is_tie ? 'from-gray-500 to-gray-600' : ''}`}>
            <div className="flex items-center gap-4">
              <Trophy className="h-12 w-12" />
              <div>
                <p className="text-sm opacity-90">🏆 Winner</p>
                <h2 className="text-2xl font-bold">{results.winner.name}</h2>
                <p className="text-sm opacity-90">
                  {results.winner.party || 'Independent'} • {results.winner.votes} votes ({results.winner.percentage}%)
                </p>
                {results.is_tie && (
                  <p className="text-sm mt-2 font-semibold">⚠️ This election ended in a tie!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {hasVotes && totalCandidates > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vote Distribution (Bar Chart)</h3>
              <div className="h-80">
                <BarChart data={barChartData} title="Votes per Candidate" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vote Share (Pie Chart)</h3>
              <div className="h-80">
                <PieChart data={pieChartData} title="Percentage Distribution" />
              </div>
            </div>
          </div>
        )}

        {/* Detailed Results Table */}
        {totalCandidates > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Detailed Results</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.results.map((candidate, index) => (
                    <tr key={index} className={index === 0 && !results.is_tie && isElectionClosed ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {candidate.photo ? (
                            <img src={candidate.photo} alt={candidate.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-500 font-bold text-sm">{candidate.name?.charAt(0) || '?'}</span>
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{candidate.name}</span>
                          {index === 0 && !results.is_tie && isElectionClosed && (
                            <span className="text-yellow-500 text-sm">🏆 Winner</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{candidate.party || 'Independent'}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{candidate.votes}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-primary-500 rounded-full h-2" style={{ width: `${candidate.percentage}%` }} />
                          </div>
                          <span className="text-sm text-gray-600">{candidate.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Votes Message */}
        {!hasVotes && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Vote className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No votes have been cast yet.</p>
            <p className="text-sm text-gray-400 mt-1">Results will appear here once voting begins.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ResultsPage;