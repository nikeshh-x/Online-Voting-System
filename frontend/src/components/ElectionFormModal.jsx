import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

function ElectionFormModal({ isOpen, onClose, onSubmit, election, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    status: 'draft'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (election) {
      // Format datetime for input (YYYY-MM-DDThh:mm)
      const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };
      
      setFormData({
        title: election.title || '',
        description: election.description || '',
        start_datetime: formatDateTime(election.start_datetime),
        end_datetime: formatDateTime(election.end_datetime),
        status: election.status || 'draft'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        start_datetime: '',
        end_datetime: '',
        status: 'draft'
      });
    }
    setErrors({});
  }, [election, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.start_datetime) {
      newErrors.start_datetime = 'Start date and time is required';
    }
    if (!formData.end_datetime) {
      newErrors.end_datetime = 'End date and time is required';
    }
    
    if (formData.start_datetime && formData.end_datetime) {
      const start = new Date(formData.start_datetime);
      const end = new Date(formData.end_datetime);
      
      if (start >= end) {
        newErrors.end_datetime = 'End time must be after start time';
      }
      
      if (start < new Date()) {
        newErrors.start_datetime = 'Start time cannot be in the past';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {election ? 'Edit Election' : 'Create New Election'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Election Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none
                ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g., Presidential Election 2024"
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none
                ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Describe the election, what it's for, etc."
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                name="start_datetime"
                value={formData.start_datetime}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none
                  ${errors.start_datetime ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.start_datetime && (
                <p className="text-red-500 text-xs mt-1">{errors.start_datetime}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                name="end_datetime"
                value={formData.end_datetime}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none
                  ${errors.end_datetime ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.end_datetime && (
                <p className="text-red-500 text-xs mt-1">{errors.end_datetime}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="draft">Draft</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Note: Status can also be automatically determined by dates
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : (election ? 'Update Election' : 'Create Election')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ElectionFormModal;