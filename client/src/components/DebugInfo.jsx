import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

const DebugInfo = () => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  // Only show debug info in these specific cases:
  // 1. Development environment
  // 2. When there's an authentication error (trying to access protected routes)
  // 3. When explicitly enabled via URL parameter (?debug=true)
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasDebugParam = new URLSearchParams(window.location.search).get('debug') === 'true';
  const isProtectedRoute = location.pathname.startsWith('/admin') || 
                          location.pathname.startsWith('/vendor') || 
                          location.pathname.startsWith('/profile');
  
  // Show debug info only if:
  // - In development, OR
  // - Debug parameter is set, OR  
  // - User is trying to access protected routes but not authenticated
  const shouldShow = isDevelopment || 
                    hasDebugParam || 
                    (isProtectedRoute && !user && !loading);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-sm text-xs z-50">
      <strong>Debug Info:</strong>
      <div>Path: {location.pathname}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>User: {user ? user.email : 'None'}</div>
      <div>Role: {user ? user.role : 'None'}</div>
      <div>IsAdmin: {isAdmin ? 'Yes' : 'No'}</div>
      {hasDebugParam && (
        <div className="mt-2 pt-2 border-t border-red-300">
          <small>Remove ?debug=true from URL to hide</small>
        </div>
      )}
    </div>
  );
};

export default DebugInfo;