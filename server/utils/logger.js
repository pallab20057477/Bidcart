const path = require('path');
const fs = require('fs');

/**
 * Simple logging utility without external dependencies
 */
class SimpleLogger {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    this.ensureLogsDirectory();
  }

  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, data = {}) {
    const timestamp = this.getTimestamp();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };
    return JSON.stringify(logEntry);
  }

  writeToFile(filename, content) {
    const filepath = path.join(this.logsDir, filename);
    fs.appendFileSync(filepath, content + '\n');
  }

  log(level, message, data = {}) {
    const formattedMessage = this.formatMessage(level, message, data);
    
    // Console output
    if (process.env.NODE_ENV !== 'production') {
      const colors = {
        error: '\x1b[31m', // Red
        warn: '\x1b[33m',  // Yellow
        info: '\x1b[36m',  // Cyan
        debug: '\x1b[35m'  // Magenta
      };
      const reset = '\x1b[0m';
      console.log(`${colors[level] || ''}[${level.toUpperCase()}]${reset} ${message}`, data);
    }

    // File output
    if (level === 'error') {
      this.writeToFile('error.log', formattedMessage);
    }
    this.writeToFile('combined.log', formattedMessage);
  }

  error(message, data = {}) {
    this.log('error', message, data);
  }

  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  info(message, data = {}) {
    this.log('info', message, data);
  }

  debug(message, data = {}) {
    this.log('debug', message, data);
  }
}

const logger = new SimpleLogger();

/**
 * Custom logging methods for different contexts
 */
class Logger {
  /**
   * Log API request
   */
  static logRequest(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id || 'anonymous'
      };

      if (res.statusCode >= 400) {
        logger.warn('API Request', logData);
      } else {
        logger.info('API Request', logData);
      }
    });

    next();
  }

  /**
   * Log product operations
   */
  static logProductOperation(operation, data) {
    logger.info('Product Operation', {
      operation,
      productId: data.productId,
      vendorId: data.vendorId,
      userId: data.userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log authentication events
   */
  static logAuthEvent(event, data) {
    logger.info('Authentication Event', {
      event,
      userId: data.userId,
      email: data.email,
      ip: data.ip,
      userAgent: data.userAgent,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log security events
   */
  static logSecurityEvent(event, data) {
    logger.warn('Security Event', {
      event,
      userId: data.userId,
      ip: data.ip,
      userAgent: data.userAgent,
      details: data.details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log business events
   */
  static logBusinessEvent(event, data) {
    logger.info('Business Event', {
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log error with context
   */
  static logError(error, context = {}) {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log performance metrics
   */
  static logPerformance(metric, value, context = {}) {
    logger.info('Performance Metric', {
      metric,
      value,
      ...context,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = logger;
module.exports.Logger = Logger; 