import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenService = {
    getAccessToken: () => localStorage.getItem(TOKEN_KEY),
    getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
    setTokens: (access, refresh) => {
        localStorage.setItem(TOKEN_KEY, access);
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    },
    clearTokens: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    },
    isAuthenticated: () => {
        return !!localStorage.getItem(TOKEN_KEY);
    },
};


// interceptors
api.interceptors.request.use(
    (config) => {
        const token = tokenService.getAccessToken();
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
)

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if(error.response?.status === 401){
            tokenService.clearTokens();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ========== AUTH API ==========

// Step 1: Verify citizenship
export const verifyCitizenship = async (data) => {
  const response = await api.post('/verify-citizenship/', data);
  return response.data;
};

// Step 2: Register user
export const registerUser = async (data) => {
  const response = await api.post('/register/', data);
  return response.data;
};

// Step 3: Verify email (from link)
export const verifyEmail = async (token) => {
  const response = await api.get(`/verify-email/${token}/`);
  return response.data;
};

// Resend verification email
export const resendVerification = async () => {
  const response = await api.post('/resend-verification/');
  return response.data;
};

// Login
export const loginUser = async (data) => {
  const response = await api.post('/login/', data);
  return response.data;
};

// Get profile
export const getProfile = async () => {
  const response = await api.get('/profile/');
  return response.data;
};

// Logout
export const logoutUser = async (refreshToken) => {
  const response = await api.post('/logout/', { refresh: refreshToken });
  return response.data;
};

// Get dashboard stats
export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats/');
  return response.data;
};

// Update profile
export const updateProfile = async (data) => {
  const response = await api.put('/profile/update/', data);
  return response.data;
};

// ========== ELECTION API ==========

// Get all elections
export const getElections = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `/elections/?${queryString}` : '/elections/';
  const response = await api.get(url);
  return response.data;
};

// Get active elections
export const getActiveElections = async () => {
  const response = await api.get('/elections/active/');
  return response.data;
};

// Get upcoming elections
export const getUpcomingElections = async () => {
  const response = await api.get('/elections/upcoming/');
  return response.data;
};

// Get completed elections
export const getCompletedElections = async () => {
  const response = await api.get('/elections/completed/');
  return response.data;
};

// Get single election details
export const getElectionDetail = async (id) => {
  const response = await api.get(`/elections/${id}/`);
  return response.data;
};

// Create election (admin only)
export const createElection = async (data) => {
  const response = await api.post('/elections/', data);
  return response.data;
};

// Update election (admin only)
export const updateElection = async (id, data) => {
  const response = await api.put(`/elections/${id}/`, data);
  return response.data;
};

// Delete election (admin only)
export const deleteElection = async (id) => {
  const response = await api.delete(`/elections/${id}/`);
  return response.data;
};

// ========== CANDIDATE API ==========

// Get candidates for an election
export const getCandidates = async (electionId) => {
  const response = await api.get(`/elections/${electionId}/candidates/`);
  return response.data;
};

// Add candidate (admin only)
export const addCandidate = async (electionId, data) => {
  const response = await api.post(`/elections/${electionId}/candidates/`, data);
  return response.data;
};

// Update candidate (admin only)
export const updateCandidate = async (id, data) => {
  const response = await api.put(`/candidates/${id}/`, data);
  return response.data;
};

// Delete candidate (admin only)
export const deleteCandidate = async (id) => {
  const response = await api.delete(`/candidates/${id}/`);
  return response.data;
};

// ==============Voting API=========================

// Check if user voted in election
export const checkUserVote = async (electionId) => {
  const response = await api.get(`/vote/check/${electionId}/`);
  return response.data;
};

// Cast vote
export const castVote = async (data) => {
  const response = await api.post('/vote/', data);
  return response.data;
};

// Get user vote history
export const getVoteHistory = async () => {
  const response = await api.get('/vote/history/');
  return response.data;
};

// Get election results
export const getElectionResults = async (electionId) => {
  try {
    const response = await api.get(`/elections/${electionId}/results/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching results:', error);
    return { status: 'error', message: 'Failed to load results' };
  }
};

// Get admin statistics
export const getAdminStats = async () => {
  const response = await api.get('/admin/stats/');
  return response.data;
};

export default api;