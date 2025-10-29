# BidCart Deployment Guide

## Issues Fixed

### 1. API Endpoint Issues
- ✅ Fixed hardcoded fetch calls to use the configured API instance
- ✅ Updated API base URL configuration with fallback logic
- ✅ Fixed response handling for axios vs fetch differences

### 2. Static File Issues
- ✅ Fixed %PUBLIC_URL% not being replaced in HTML template
- ✅ Created proper manifest.json file
- ✅ Updated HTML meta tags for better SEO

### 3. Render Configuration
- ✅ Updated render.yaml to include both frontend and backend services
- ✅ Fixed build command paths
- ✅ Added proper environment variables

## Deployment Steps

### 1. Backend Deployment (bidcart-backend.onrender.com)
```bash
# Deploy the server folder as a Node.js service
# Service name: bidcart-backend
# Build command: cd server && npm install
# Start command: cd server && npm start
```

### 2. Frontend Deployment (bidcartt.onrender.com)
```bash
# Deploy the client folder as a static site
# Service name: bidcart-frontend
# Build command: cd client && npm install && npm run build && cp build/index.html build/404.html
# Publish directory: ./client/build
```

### 3. Environment Variables

#### Backend (bidcart-backend)
- NODE_ENV=production
- CLIENT_URL=https://bidcartt.onrender.com
- MONGODB_URI=your_mongodb_connection_string
- JWT_SECRET=your_jwt_secret
- RAZORPAY_KEY_ID=your_razorpay_key
- RAZORPAY_KEY_SECRET=your_razorpay_secret

#### Frontend (bidcartt)
- REACT_APP_API_URL=https://bidcart-backend.onrender.com/api

## Testing

After deployment, test these endpoints:
1. https://bidcartt.onrender.com - Frontend should load
2. https://bidcart-backend.onrender.com/api/products - Should return products
3. https://bidcartt.onrender.com/products - Should show products page (SPA routing)

## Common Issues

1. **404 on API calls**: Make sure REACT_APP_API_URL is set correctly
2. **CORS errors**: Ensure CLIENT_URL is set in backend environment
3. **Static files not loading**: Check build command and publish directory
4. **Page refresh 404**: Ensure _redirects file and 404.html are in build folder