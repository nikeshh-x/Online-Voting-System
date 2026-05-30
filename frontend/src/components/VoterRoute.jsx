import React from 'react';
import { Navigate } from 'react-router-dom';

function VoterRoute({ children }) {
  const isAdmin = localStorage.getItem('is_admin') === 'true';
  const adminToken = localStorage.getItem('admin_access_token');
  const token = localStorage.getItem('access_token');
  
  // If admin is logged in, redirect to admin dashboard
  if (isAdmin && adminToken) {
    return <Navigate to="/admin" replace />;
  }
  
  // If not logged in, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default VoterRoute;