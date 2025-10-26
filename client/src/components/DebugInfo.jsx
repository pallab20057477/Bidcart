import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

const DebugInfo = () => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  // Only show in development or when there's an issue
  if (process.env.NODE_ENV === 'production' && user) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-sm text-xs">
      <strong>Debug Info:</strong>
      <div>Path: {location.pathname}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>User: {user ? user.email : 'None'}</div>
      <div>Role: {user ? user.role : 'None'}</div>
      <div>IsAdmin: {isAdmin ? 'Yes' : 'No'}</div>
    </div>
  );
};

export default DebugInfo;