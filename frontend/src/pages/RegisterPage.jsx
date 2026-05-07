import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Mail, Lock, Calendar, MapPin, Smartphone } from 'lucide-react';
import api from '../services/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    citizenshipNumber: '',
    district: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error for this field when user starts typing
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
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.citizenshipNumber) newErrors.citizenshipNumber = 'Citizenship number is required';
    if (!formData.district) newErrors.district = 'District is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Registration will be implemented in Day 4-5
      console.log('Registration data:', formData);
      
      // For now, show coming soon message
      alert('Registration system coming soon! This will be implemented with citizenship verification.');
      
      // Navigate to login after demo
      // navigate('/login');
      
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // List of Nepal districts
  const districts = [
    'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Chitwan', 'Biratnagar',
    'Dhading', 'Kaski', 'Morang', 'Sunsari', 'Jhapa', 'Ilam', 'Panchthar',
    'Sankhuwasabha', 'Tehrathum', 'Dhankuta', 'Bhojpur', 'Solukhumbu',
    'Okhaldhunga', 'Khotang', 'Udayapur', 'Saptari', 'Siraha', 'Dhanusa',
    'Mahottari', 'Sarlahi', 'Rautahat', 'Bara', 'Parsa', 'Makwanpur'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 to-gray-800 py-12 px-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-primary-500 to-primary-600 px-8 py-6">
          <div className="flex justify-center mb-2">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">Create an Account</h2>
          <p className="text-primary-100 text-center mt-1">Register to start voting</p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {errors.general}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  placeholder="Ram Prasad Sharma"
                />
              </div>
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>
            
            {/* Email */}
            <div className="mb-4">
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
                  className={`w-full pl-10 pr-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            
            {/* Phone Number */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="98xxxxxxxx"
                />
              </div>
            </div>
            
            {/* Date of Birth */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Date of Birth *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            {/* Citizenship Number */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Citizenship Number *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="citizenshipNumber"
                  value={formData.citizenshipNumber}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 border ${errors.citizenshipNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  placeholder="11-22-33-45567"
                />
              </div>
              {errors.citizenshipNumber && <p className="text-red-500 text-xs mt-1">{errors.citizenshipNumber}</p>}
            </div>
            
            {/* District */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                District *
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${errors.district ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
              >
                <option value="">Select District</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
              {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
            </div>
            
            {/* Password */}
            <div className="mb-4">
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
                  className={`w-full pl-10 pr-4 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            
            {/* Confirm Password */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition font-medium mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="px-8 pb-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;