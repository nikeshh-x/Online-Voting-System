import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { resendVerification } from '../services/api';

function VerificationNotice() {
  const location = useLocation();
  const email = location.state?.email || '';
  const [resendStatus, setResendStatus] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    setResendStatus('sending');
    try {
      const response = await resendVerification();
      if (response.status === 'success') {
        setResendStatus('sent');
        setCooldown(60);
        setTimeout(() => setResendStatus(''), 3000);
      }
    } catch (error) {
      setResendStatus('error');
      setTimeout(() => setResendStatus(''), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-6">
          <div className="flex justify-center mb-2">
            <Mail className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">Check Your Email</h2>
          <p className="text-green-100 text-center mt-1">Step 3 of 3</p>
        </div>

        <div className="p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Email Sent!</h3>
            <p className="text-gray-600">
              We've sent a verification link to:
            </p>
            <p className="text-primary-500 font-medium mt-1">{email}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              Click the link in the email to verify your account. The link expires in 24 hours.
            </p>
          </div>

          <button
            onClick={handleResend}
            disabled={cooldown > 0}
            className="flex items-center justify-center gap-2 w-full border border-primary-500 text-primary-500 py-2 rounded-lg hover:bg-primary-50 transition font-medium disabled:opacity-50"
          >
            <RefreshCw size={18} className={resendStatus === 'sending' ? 'animate-spin' : ''} />
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
          </button>

          {resendStatus === 'sent' && (
            <p className="text-green-600 text-sm mt-3">Verification email resent!</p>
          )}
          {resendStatus === 'error' && (
            <p className="text-red-600 text-sm mt-3">Failed to resend. Please try again.</p>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificationNotice;