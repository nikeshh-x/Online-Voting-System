import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Calendar, MapPin, AlertCircle } from 'lucide-react';
import { verifyCitizenship } from '../services/api';

function VerifyCitizenship({ onVerificationSuccess }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    citizenship_number: '',
    full_name: '',
    date_of_birth: '',
    district: '',
  });

  const districts = [
    'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Chitwan', 
    'Dhading', 'Kaski', 'Morang', 'Sunsari', 'Jhapa'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await verifyCitizenship(formData);
      
      if (response.status === 'success') {
        // Store the verification token and user data
        localStorage.setItem('verification_token', response.data.verification_token);
        localStorage.setItem('verified_citizen', JSON.stringify(response.data));
        
        // Call the success callback to move to next step
        if (onVerificationSuccess) {
          onVerificationSuccess(response.data);
        } else {
          navigate('/register');
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'Verification failed. Please try again.' });
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
          <h2 className="text-2xl font-bold text-white text-center">Verify Citizenship</h2>
          <p className="text-primary-100 text-center mt-1">Step 1 of 3</p>
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
                Citizenship Number *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="citizenship_number"
                  value={formData.citizenship_number}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2 border ${errors.citizenship_number ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  placeholder="e.g., 10-68-18-10050"
                />
              </div>
              {errors.citizenship_number && (
                <p className="text-red-500 text-xs mt-1">{errors.citizenship_number}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Full Name (as in citizenship) *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2 border ${errors.full_name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  placeholder="Shyam Karki"
                />
              </div>
              {errors.full_name && (
                <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Date of Birth *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2 border ${errors.date_of_birth ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                />
              </div>
              {errors.date_of_birth && (
                <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                District *
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border ${errors.district ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
              >
                <option value="">Select District</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
              {errors.district && (
                <p className="text-red-500 text-xs mt-1">{errors.district}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition font-medium mt-6 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Citizenship'}
          </button>
        </form>

        <div className="px-8 pb-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-primary-500 hover:text-primary-600 font-medium">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyCitizenship;