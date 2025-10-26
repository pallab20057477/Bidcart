import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';

const ErrorPage = () => {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="text-center">
        <FaExclamationTriangle className="text-9xl text-red-600 mb-6" aria-hidden="true" />
        <h1 className="text-6xl font-extrabold mb-4">404</h1>
        <p className="text-2xl mb-6">Oops! The page you are looking for does not exist.</p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          <FaHome className="mr-3" aria-hidden="true" />
          Go to Home
        </Link>
      </div>
    </main>
  );
};

export default ErrorPage;
