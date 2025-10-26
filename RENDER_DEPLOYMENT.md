# Render Deployment Guide for BidCart Frontend

## Prerequisites
- GitHub repository with your code
- Render account (free tier available)

## Deployment Steps

### 1. Prepare Your Repository
Make sure all the files are committed to your GitHub repository:
- `client/package.json` (updated with Express dependency)
- `client/server.js` (Express server for SPA routing)
- `client/Dockerfile` (optional)
- `client/.env` (environment variables)

### 2. Create a New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select your repository and branch

### 3. Configure the Service

**Basic Settings:**
- **Name**: `bidcart-frontend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `client`

**Build & Deploy Settings:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Environment Variables:**
Add these in the Render dashboard:
- `REACT_APP_API_URL`: `https://bidcart-backend.onrender.com/api`
- `REACT_APP_CLOUDINARY_CLOUD_NAME`: `dgq9gkpik`
- `REACT_APP_RAZORPAY_KEY_ID`: `rzp_test_1DP5mmOlF5G5ag`

### 4. Advanced Settings (Optional)

**Auto-Deploy**: Enable to automatically deploy on git push
**Health Check Path**: `/` (default)

### 5. Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build your React app
   - Start the Express server
   - Provide you with a URL

## Alternative: Static Site Deployment

If you prefer a static site deployment (faster and cheaper):

1. Choose "Static Site" instead of "Web Service"
2. **Build Command**: `npm install && npm run build`
3. **Publish Directory**: `build`

Note: Static sites don't support server-side routing, so you might need to handle 404s differently.

## Troubleshooting

### Common Issues:

1. **Build Fails**: Check that all dependencies are in package.json
2. **404 on Routes**: Make sure you're using the Web Service (not Static Site) for SPA routing
3. **Environment Variables**: Ensure all REACT_APP_ variables are set in Render dashboard

### Logs:
- Check build logs in Render dashboard
- Monitor runtime logs for any errors

## Post-Deployment

1. Test all routes and functionality
2. Update any hardcoded URLs to use your new Render URL
3. Configure custom domain (if needed) in Render dashboard

## Cost Optimization

- **Free Tier**: 750 hours/month (enough for one always-on service)
- **Paid Plans**: Start at $7/month for always-on services
- **Static Sites**: Free with 100GB bandwidth/month

Your frontend will be available at: `https://your-service-name.onrender.com`