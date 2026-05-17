import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Smartphone, ShieldCheck } from 'lucide-react';
import { registerUser } from '../services/api';

function RegisterForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    verification_token: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
  });

  useEffect(() => {
    // Get verification token from localStorage
    const token = localStorage.getItem('verification_token');
    const citizen = localStorage.getItem('verified_citizen');
    
    if (!token || !citizen) {
      // No verification token, redirect to step 1
      navigate('/verify-citizenship');
    } else {
      setFormData(prev => ({ ...prev, verification_token: token }));
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});

    try {
      const response = await registerUser({
        verification_token: formData.verification_token,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
        phone: formData.phone,
      });
      
      if (response.status === 'success') {
        // Clear verification data
        localStorage.removeItem('verification_token');
        localStorage.removeItem('verified_citizen');
        
        // Redirect to verification notice
        navigate('/verification-notice', { state: { email: formData.email } });
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 to-gray-800 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-linear-to-r from-primary-500 to-primary-600 px-8 py-6">
          <div className="flex justify-center mb-2">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">Create Account</h2>
          <p className="text-primary-100 text-center mt-1">Step 2 of 3</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {errors.general}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="98xxxxxxxx"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2 border ${errors.confirm_password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-black py-3 rounded-lg hover:bg-primary-600 transition font-medium mt-6 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterForm;