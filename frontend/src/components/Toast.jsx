import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle size={18} className="text-green-500" />,
    error: <XCircle size={18} className="text-red-500" />,
    warning: <AlertCircle size={18} className="text-yellow-500" />,
    info: <AlertCircle size={18} className="text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${bgColors[type]} animate-slide-up`}>
      {icons[type]}
      <span className={`text-sm font-medium ${textColors[type]}`}>{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600">
        <X size={16} />
      </button>
    </div>
  );
}

export default Toast;