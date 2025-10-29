const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const http = require('http');
const setupSocket = require('./socket');
const DashboardCache = require('./utils/dashboardCache');
const path = require('path');

// Import security middleware
const {
  apiLimiter,
  authLimiter,
  paymentLimiter,
  speedLimiter,
  sanitizeData,
  preventXSS,
  preventHPP,
  requestLogger,
  getCorsOptions,
  getHelmetConfig,
  validateCriticalInput
} = require('./middleware/security');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const bidRoutes = require('./routes/bids');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const vendorRoutes = require('./routes/vendors');
const couponRoutes = require('./routes/coupons');
const deliveryRoutes = require('./routes/delivery');
const dashboardRoutes = require('./routes/admin/dashboard');
const disputeRoutes = require('./routes/disputes');
const vendorRequestRoutes = require('./routes/vendorRequests');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const featuresRoutes = require('./routes/features');
const reviewRoutes = require('./routes/reviews');
const auctionRequestRoutes = require('./routes/auctionRequests');
const paymentRoutes = require('./routes/payments');
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const connectDB = require('./config/db');
const ErrorHandler = require('./middleware/errorHandler');

// Initialize dashboard cache
global.dashboardCache = new DashboardCache();

const app = express();

// Trust proxy for deployment platforms like Render, Heroku, etc.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const server = http.createServer(app);
const io = setupSocket(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
app.set('io', io);

// ==================== SECURITY MIDDLEWARE ====================

// 1. Security Headers (Helmet)
app.use(helmet(getHelmetConfig()));

// 2. CORS Configuration
const corsOptions = getCorsOptions();
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight

// 3. Request Logging (for security monitoring)
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// 4. Body Parser
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Data Sanitization against NoSQL Injection
app.use(sanitizeData);

// 6. Data Sanitization against XSS
app.use(preventXSS);

// 7. Prevent HTTP Parameter Pollution
app.use(preventHPP);

// 8. Compression for better performance
app.use(compression());

// 9. General API Rate Limiting
app.use('/api/', apiLimiter);

// 10. Speed Limiting for heavy operations
app.use('/api/', speedLimiter);

// 11. Input Validation for critical operations
app.use('/api/', validateCriticalInput);

// Serve static files for dispute evidence
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== ROUTES ====================

// Authentication routes (with strict rate limiting)
app.use('/api/auth', authLimiter, authRoutes);

// Payment routes (with payment-specific rate limiting)
app.use('/api/payments', paymentLimiter, paymentRoutes);

// Regular routes (with general rate limiting already applied above)
app.use('/api/products', productRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/vendor-requests', vendorRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', uploadRoutes);
app.use('/api/features', featuresRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/auction-requests', auctionRequestRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/api/test-root', (req, res) => {
  console.log('Test root route hit');
  res.json({ message: 'Test root route hit' });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const errorResponse = {
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack
    } : undefined
  };

  res.status(500).json(errorResponse);
});

// 404 handler (after all routes)
app.use(ErrorHandler.handleNotFound);

// Global error handler (must be last)
app.use(ErrorHandler.handleError);

// Import createAdmin function
const createAdmin = require('./createAdmin');

// Clean server startup sequence
const startServer = async () => {
  try {
    // Disable mongoose debug logs in production
    if (process.env.NODE_ENV === 'production') {
      mongoose.set('debug', false);
    }

    console.log('Starting server...');

    // Connect to MongoDB
    await connectDB();
    console.log('MongoDB connected');

    // Start the HTTP server
    const PORT = process.env.PORT || 5000;

    await new Promise((resolve, reject) => {
      server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        resolve();
      }).on('error', (err) => {
        console.error('Failed to start server:', err.message);
        reject(err);
      });
    });

    // Initialize admin users (non-blocking)
    createAdmin.createAdminUser()
      .catch(err => console.warn('Admin init warning:', err.message));

    // Start auction scheduler (non-blocking)
    try {
      const auctionScheduler = require('./utils/auctionScheduler');
      auctionScheduler.setIo(io);

      if (mongoose.connection.readyState === 1) {
        auctionScheduler.start();
      } else {
        mongoose.connection.once('connected', () => {
          auctionScheduler.start();
        });
      }
    } catch (err) {
      console.warn('Auction scheduler failed:', err.message);
    }

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();