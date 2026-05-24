import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Trophy, Users, Vote, Calendar, Clock, Award } from 'lucide-react';
import Layout from '../components/Layout';
import { getElectionResults } from '../services/api';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function ResultsPage() {
  const { id } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await getElectionResults(id);
      if (response.status === 'success') {
        setResults(response.data);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  // Prepare chart data - handle empty results
  const barChartData = {
    labels: results?.results?.map(c => c.name) || ['No data'],
    datasets: [
      {
        label: 'Votes',
        data: results?.results?.map(c => c.votes) || [0],
        backgroundColor: 'rgba(220, 20, 60, 0.6)',
        borderColor: 'rgba(220, 20, 60, 1)',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const pieChartData = {
    labels: results?.results?.map(c => c.name) || ['No data'],
    datasets: [
      {
        data: results?.results?.map(c => c.percentage) || [100],
        backgroundColor: ['#DC143C', '#FF6B6B', '#FFB347', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Vote Distribution',
      },
    },
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

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <Link to="/elections" className="text-primary-500 mt-4 inline-block">Back to Elections</Link>
        </div>
      </Layout>
    );
  }

  if (!results) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">No results available</p>
          <Link to="/elections" className="text-primary-500 mt-4 inline-block">Back to Elections</Link>
        </div>
      </Layout>
    );
  }

  const isElectionClosed = results.election?.status === 'closed';
  const isElectionActive = results.election?.status === 'active';
  const hasVotes = results.total_votes > 0;
  const hasCandidates = results.results && results.results.length > 0;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link to="/elections" className="text-primary-500 hover:underline">← Back to Elections</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">{results.election?.title || 'Election Results'}</h1>
          <p className="text-gray-500 mt-2">{results.election?.description || ''}</p>
          
          {/* Election Status Badge */}
          <div className="flex items-center gap-2 mt-3">
            {isElectionClosed ? (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Election Closed</span>
            ) : isElectionActive ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Election Active</span>
            ) : (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">Election Upcoming</span>
            )}
            <span className="text-sm text-gray-400">
              {formatDate(results.election?.start_datetime)} - {formatDate(results.election?.end_datetime)}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Votes Cast</p>
                <p className="text-2xl font-bold text-gray-900">{results.total_votes || 0}</p>
              </div>
              <div className="bg-primary-100 p-3 rounded-lg">
                <Vote className="h-6 w-6 text-primary-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Voter Turnout</p>
                <p className="text-2xl font-bold text-gray-900">{results.turnout_percentage || 0}%</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Participating Candidates</p>
                <p className="text-2xl font-bold text-gray-900">{results.results?.length || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Award className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Winner Announcement */}
        {isElectionClosed && results.winner && (
          <div className={`bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 mb-8 text-white ${results.is_tie ? 'from-gray-500 to-gray-600' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
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

        {/* Charts Section */}
        {hasCandidates && hasVotes && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Bar Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vote Distribution (Bar Chart)</h3>
              <div className="h-80">
                <Bar data={barChartData} options={chartOptions} />
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vote Share (Pie Chart)</h3>
              <div className="h-80">
                <Pie data={pieChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}

        {/* Detailed Results Table */}
        {hasCandidates && (
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
                          <span className="font-medium text-gray-900">{candidate.name}</span>
                          {index === 0 && !results.is_tie && isElectionClosed && (
                            <span className="text-yellow-500 text-sm">🏆 Winner</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{candidate.party || 'Independent'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900">{candidate.votes}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-500 rounded-full h-2" 
                              style={{ width: `${candidate.percentage}%` }}
                            />
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