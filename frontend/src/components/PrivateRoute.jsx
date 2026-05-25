import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children, requireAdmin = false }) {
  const token = localStorage.getItem('access_token');
  const adminToken = localStorage.getItem('admin_access_token');
  const isAdmin = localStorage.getItem('is_admin') === 'true';
  
  if (requireAdmin) {
    if (!adminToken || !isAdmin) {
      return <Navigate to="/admin-login" replace />;
    }
    return children;
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default PrivateRoute;