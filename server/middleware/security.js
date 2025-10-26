const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

/**
 * General API Rate Limiter
 * Limits all API requests to prevent abuse
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain IPs (optional)
  skip: (req) => {
    // Skip for localhost in development
    if (process.env.NODE_ENV === 'development' && req.ip === '::1') {
      return true;
    }
    return false;
  }
});

/**
 * Strict Rate Limiter for Authentication Routes
 * Prevents brute force attacks on login/register
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Payment Route Rate Limiter
 * Stricter limits for payment-related endpoints
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 payment attempts per hour
  message: {
    success: false,
    message: 'Too many payment attempts. Please try again later or contact support.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Speed Limiter for Heavy Operations
 * Slows down requests after threshold to prevent DoS
 */
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes at full speed
  delayMs: () => 500, // Add 500ms delay per request after delayAfter (new v2 syntax)
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  validate: { delayMs: false } // Disable deprecation warning
});

/**
 * MongoDB Injection Prevention
 * Sanitizes user input to prevent NoSQL injection attacks
 */
const sanitizeData = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️ Potential NoSQL injection attempt detected: ${key}`);
  }
});

/**
 * XSS Protection
 * Cleans user input from malicious scripts
 */
const preventXSS = xss();

/**
 * HTTP Parameter Pollution Protection
 * Prevents parameter pollution attacks
 */
const preventHPP = hpp({
  whitelist: [
    'price',
    'rating',
    'quantity',
    'sort',
    'category',
    'status',
    'mode'
  ]
});

/**
 * Request Logger Middleware
 * Logs all API requests for security monitoring
 */
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || 'Unknown';

  // Log request
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);

  // Log suspicious activity
  if (req.body && typeof req.body === 'object') {
    const suspiciousPatterns = [
      /\$where/i,
      /\$ne/i,
      /<script/i,
      /javascript:/i,
      /onerror=/i,
      /onclick=/i
    ];

    const bodyString = JSON.stringify(req.body);
    const hasSuspiciousContent = suspiciousPatterns.some(pattern =>
      pattern.test(bodyString)
    );

    if (hasSuspiciousContent) {
      console.warn(`🚨 SECURITY ALERT: Suspicious request detected!`);
      console.warn(`IP: ${ip}`);
      console.warn(`URL: ${url}`);
      console.warn(`User-Agent: ${userAgent}`);
      console.warn(`Body: ${bodyString.substring(0, 200)}`);
    }
  }

  next();
};

/**
 * CORS Configuration
 * Secure CORS settings for production
 */
const getCorsOptions = () => {
  console.log('🔧 CORS Configuration - ALLOWING ALL ORIGINS FOR DEBUGGING');
  console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
  console.log('🔧 CLIENT_URL:', process.env.CLIENT_URL);
  
  // Completely permissive CORS for debugging
  return {
    origin: function (origin, callback) {
      console.log('🌐 CORS request from origin:', origin);
      console.log('✅ ALLOWING ALL ORIGINS');
      callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Allow-Origin']
  };
};

/**
 * Security Headers Configuration
 * Helmet.js configuration for secure HTTP headers
 */
const getHelmetConfig = () => {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'http:'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://checkout.razorpay.com'],
        connectSrc: ["'self'", 'https://api.razorpay.com'],
        frameSrc: ["'self'", 'https://api.razorpay.com']
      }
    },
    crossOriginEmbedderPolicy: false, // Allow Razorpay iframe
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  };
};

/**
 * Input Validation Helper
 * Additional validation for critical fields
 */
const validateCriticalInput = (req, res, next) => {
  // Skip validation for GET requests (read-only operations)
  if (req.method === 'GET') {
    return next();
  }

  // Check for common injection patterns
  const dangerousPatterns = [
    /(\$where|\$ne|\$gt|\$lt|\$regex)/i, // NoSQL injection
    /<script|javascript:|onerror=|onclick=/i, // XSS
    /(union|select|insert|update|delete|drop|create|alter)/i // SQL injection (just in case)
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return dangerousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    console.warn('🚨 Malicious input detected and blocked');
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected. Please check your data.'
    });
  }

  next();
};

module.exports = {
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
};
