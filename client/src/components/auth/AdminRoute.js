import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  console.log('AdminRoute - User:', user);
  console.log('AdminRoute - Loading:', loading);
  console.log('AdminRoute - IsAdmin:', isAdmin);
  console.log('AdminRoute - Current location:', location.pathname);

  if (loading) {
    console.log('AdminRoute - Still loading...');
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    console.log('AdminRoute - No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    console.log('AdminRoute - User is not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('AdminRoute - User is admin, rendering children');
  return children;
};

export default AdminRoute; 