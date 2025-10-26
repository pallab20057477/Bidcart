const logger = require('../utils/logger');

/**
 * Professional error handling middleware
 */
class ErrorHandler {
  /**
   * Main error handler middleware
   */
  static handleError(err, req, res, next) {
    // Log the error
    this.logError(err, req);

    // Determine error type and create appropriate response
    const errorResponse = this.createErrorResponse(err);

    // Send error response
    res.status(errorResponse.status).json(errorResponse);
  }

  /**
   * Log error with context
   */
  static logError(err, req) {
    const errorContext = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id || 'anonymous',
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name
      }
    };

    if (err.status >= 500) {
      logger.error('Server Error:', errorContext);
    } else {
      logger.warn('Client Error:', errorContext);
    }
  }

  /**
   * Create standardized error response
   */
  static createErrorResponse(err) {
    // Handle different types of errors
    if (err.name === 'ValidationError') {
      return this.handleValidationError(err);
    }

    if (err.name === 'CastError') {
      return this.handleCastError(err);
    }

    if (err.name === 'MongoError' && err.code === 11000) {
      return this.handleDuplicateKeyError(err);
    }

    if (err.name === 'MulterError') {
      return this.handleMulterError(err);
    }

    if (err.name === 'JsonWebTokenError') {
      return this.handleJWTError(err);
    }

    if (err.name === 'TokenExpiredError') {
      return this.handleTokenExpiredError(err);
    }

    // Handle custom business logic errors
    if (err.isBusinessError) {
      return this.handleBusinessError(err);
    }

    // Default error response
    return this.handleGenericError(err);
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(err) {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));

    return {
      status: 400,
      error: {
        type: 'VALIDATION_ERROR',
        message: 'Data validation failed',
        details: errors
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle cast errors (invalid ObjectId, etc.)
   */
  static handleCastError(err) {
    return {
      status: 400,
      error: {
        type: 'INVALID_ID',
        message: 'Invalid identifier provided',
        details: {
          field: err.path,
          value: err.value
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle duplicate key errors
   */
  static handleDuplicateKeyError(err) {
    const field = Object.keys(err.keyPattern)[0];
    return {
      status: 409,
      error: {
        type: 'DUPLICATE_ENTRY',
        message: `${field} already exists`,
        details: {
          field,
          value: err.keyValue[field]
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle file upload errors
   */
  static handleMulterError(err) {
    let message = 'File upload error';
    let status = 400;

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds the limit';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = err.message;
        status = 500;
    }

    return {
      status,
      error: {
        type: 'FILE_UPLOAD_ERROR',
        message,
        details: {
          code: err.code,
          field: err.field
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle JWT errors
   */
  static handleJWTError(err) {
    return {
      status: 401,
      error: {
        type: 'AUTHENTICATION_ERROR',
        message: 'Invalid authentication token',
        details: {
          reason: 'token_invalid'
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle expired token errors
   */
  static handleTokenExpiredError(err) {
    return {
      status: 401,
      error: {
        type: 'AUTHENTICATION_ERROR',
        message: 'Authentication token expired',
        details: {
          reason: 'token_expired',
          expiredAt: err.expiredAt
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle business logic errors
   */
  static handleBusinessError(err) {
    return {
      status: err.status || 400,
      error: {
        type: 'BUSINESS_ERROR',
        message: err.message,
        details: err.details || {},
        code: err.code
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle generic errors
   */
  static handleGenericError(err) {
    const status = err.status || 500;
    const message = status >= 500 ? 'Internal server error' : err.message;

    return {
      status,
      error: {
        type: 'GENERIC_ERROR',
        message,
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            stack: err.stack,
            name: err.name
          }
        })
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create custom business error
   */
  static createBusinessError(message, status = 400, details = {}, code = null) {
    const error = new Error(message);
    error.isBusinessError = true;
    error.status = status;
    error.details = details;
    error.code = code;
    return error;
  }

  /**
   * Async error wrapper for route handlers
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * 404 handler
   */
  static handleNotFound(req, res) {
    res.status(404).json({
      status: 404,
      error: {
        type: 'NOT_FOUND',
        message: 'Resource not found',
        details: {
          method: req.method,
          url: req.url
        }
      },
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ErrorHandler; 