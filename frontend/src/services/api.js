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

export default api;