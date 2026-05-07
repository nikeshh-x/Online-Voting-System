import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 to-gray-800 px-4">
      <div className="text-center">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className="text-8xl font-bold text-white opacity-10">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertCircle className="h-24 w-24 text-primary-400" />
          </div>
        </div>
        
        {/* Error Message */}
        <h1 className="text-4xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition font-medium"
          >
            <Home size={18} />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 border border-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition font-medium"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
        
        {/* Help Text */}
        <p className="text-gray-400 text-sm mt-8">
          Need help? <Link to="/login" className="text-primary-400 hover:text-primary-300">Contact support</Link>
        </p>
      </div>
    </div>
  );
}

export default NotFoundPage;