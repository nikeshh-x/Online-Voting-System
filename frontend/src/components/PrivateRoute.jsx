import React from 'react';
import { Navigate } from 'react-router-dom';
import { tokenService } from '../services/api';

function PrivateRoute({ children }) {
  // const isAuthenticated = tokenService.isAuthenticated();
  const isAuthenticated = true; // Placeholder for authentication check

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PrivateRoute;