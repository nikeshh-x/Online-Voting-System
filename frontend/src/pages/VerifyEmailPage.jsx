import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { verifyEmail } from '../services/api';

function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      // Add a small delay to ensure everything is ready
      const timer = setTimeout(() => {
        verifyEmailToken();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [token]);

  const verifyEmailToken = async () => {
    try {
      console.log('Verifying token:', token);
      const response = await verifyEmail(token);
      console.log('Verification response:', response);
      
      if (response.status === 'success') {
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.message || 'Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      console.error('Error response:', error.response);
      
      // Check if already verified (common case)
      if (error.response?.data?.message?.includes('already verified')) {
        setStatus('success');
        setMessage('Email already verified! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } 
      // Check if token is invalid
      else if (error.response?.status === 400 || error.response?.status === 404) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Invalid verification link. Please request a new one.');
      }
      else {
        setStatus('error');
        setMessage('Verification failed. Please try again or request a new link.');
      }
    }
  };

  // Different UI states
  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <Loader className="h-12 w-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Verifying your email...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
          <p className="text-gray-600 mb-4">{message}</p>
          <div className="animate-pulse">
            <p className="text-sm text-gray-500">Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition"
          >
            Go to Login
          </button>
          <button
            onClick={() => navigate('/resend-verification')}
            className="w-full border border-primary-500 text-primary-500 px-6 py-2 rounded-lg hover:bg-primary-50 transition"
          >
            Request New Link
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;