import axios from 'axios';

// Determine the correct API base URL
const getApiBaseUrl = () => {
  // Check if we have the environment variable
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback based on current domain
  const currentDomain = window.location.hostname;
  if (currentDomain.includes('bidcartt.onrender.com')) {
    return 'https://bidcart-backend.onrender.com/api';
  }
  
  // Local development fallback
  return 'http://localhost:5000/api';
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // Increased to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log API configuration on startup
console.log('API Configuration:', {
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  env: process.env.REACT_APP_API_URL
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    // Handle 401 Unauthorized errors
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden errors
    if (error.response.status === 403) {
      console.error('Access denied:', error.response.data);
    }

    // Handle 500 Internal Server errors
    if (error.response.status >= 500) {
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api; 