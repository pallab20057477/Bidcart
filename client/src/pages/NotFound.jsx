import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NotFound = () => {
  const location = useLocation();
  const { user, loading, isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h2>
          <p className="text-gray-600">
            The page <code className="bg-gray-100 px-2 py-1 rounded">{location.pathname}</code> could not be found.
          </p>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left text-sm">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <div>Path: {location.pathname}</div>
          <div>Loading: {loading ? 'Yes' : 'No'}</div>
          <div>User: {user ? user.email : 'None'}</div>
          <div>Role: {user ? user.role : 'None'}</div>
          <div>IsAdmin: {isAdmin ? 'Yes' : 'No'}</div>
        </div>

        <div className="space-y-3">
          <Link 
            to="/" 
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
          
          {!user && (
            <Link 
              to="/login" 
              className="block w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
            >
              Login
            </Link>
          )}
          
          {user && user.role === 'admin' && (
            <Link 
              to="/admin/dashboard" 
              className="block w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
            >
              Admin Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;