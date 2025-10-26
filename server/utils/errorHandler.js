/**
 * Enhanced error handling utilities for product operations
 */

class ProductErrorHandler {
  /**
   * Normalize and categorize product creation errors
   */
  static normalizeProductError(error) {
    const errorMap = {
      'Product validation failed': {
        type: 'VALIDATION_ERROR',
        userMessage: 'Please check your product details and try again',
        category: 'validation'
      },
      'Invalid product category': {
        type: 'CATEGORY_ERROR',
        userMessage: 'Please select a valid product category from the available options',
        category: 'category'
      },
      'Vendor account not found': {
        type: 'VENDOR_ERROR',
        userMessage: 'Vendor account not found. Please ensure you have a valid vendor account',
        category: 'vendor'
      },
      'Vendor account must be approved': {
        type: 'VENDOR_STATUS_ERROR',
        userMessage: 'Your vendor account must be approved before you can add products',
        category: 'vendor'
      },
      'At least one product image is required': {
        type: 'IMAGE_ERROR',
        userMessage: 'Please upload at least one product image',
        category: 'images'
      },
      'Auction start time must be in the future': {
        type: 'AUCTION_TIME_ERROR',
        userMessage: 'Auction start time must be set in the future',
        category: 'auction'
      },
      'Auction end time must be after start time': {
        type: 'AUCTION_DURATION_ERROR',
        userMessage: 'Auction end time must be after the start time',
        category: 'auction'
      }
    };

    // Check if error message matches any known patterns
    for (const [pattern, errorInfo] of Object.entries(errorMap)) {
      if (error.message.includes(pattern)) {
        return {
          ...errorInfo,
          originalMessage: error.message,
          timestamp: new Date()
        };
      }
    }

    // Default error handling
    return {
      type: 'UNKNOWN_ERROR',
      userMessage: 'An unexpected error occurred. Please try again later',
      originalMessage: error.message,
      category: 'general',
      timestamp: new Date()
    };
  }

  /**
   * Get valid categories for display
   */
  static getValidCategories() {
    return [
      'Electronics',
      'Fashion', 
      'Home',
      'Sports',
      'Books',
      'Art',
      'Collectibles',
      'Other',
      'Tools & Hardware',
      'Toys & Games'
    ];
  }

  /**
   * Format validation errors for frontend display
   */
  static formatValidationErrors(errors) {
    if (!Array.isArray(errors)) {
      errors = [errors];
    }

    return {
      success: false,
      errors: errors.map(error => ({
        field: this.getErrorField(error),
        message: this.getUserFriendlyMessage(error),
        type: this.getErrorType(error)
      })),
      validCategories: this.getValidCategories()
    };
  }

  /**
   * Get error field from validation error
   */
  static getErrorField(errorMessage) {
    const fieldMap = {
      'Product name': 'name',
      'Product description': 'description',
      'Valid price': 'price',
      'Product category': 'category',
      'Product mode': 'mode',
      'Valid stock quantity': 'stock',
      'Valid starting bid': 'auction.startingBid',
      'Auction start time': 'auction.startTime',
      'Auction end time': 'auction.endTime'
    };

    for (const [pattern, field] of Object.entries(fieldMap)) {
      if (errorMessage.includes(pattern)) {
        return field;
      }
    }

    return 'general';
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(errorMessage) {
    const messageMap = {
      'Product name is required': 'Please enter a product name',
      'Product name must be at least 3 characters long': 'Product name should be at least 3 characters',
      'Product description is required': 'Please provide a product description',
      'Product description must be at least 10 characters long': 'Description should be at least 10 characters',
      'Valid price is required': 'Please enter a valid price',
      'Invalid product category': 'Please select a valid category from the list',
      'Product mode must be either "buy-now" or "auction"': 'Please select either "buy-now" or "auction" mode',
      'At least one product image is required': 'Please upload at least one product image',
      'Auction start time must be in the future': 'Auction must start in the future',
      'Auction end time must be after start time': 'Auction end time must be after start time'
    };

    return messageMap[errorMessage] || errorMessage;
  }

  /**
   * Get error type for categorization
   */
  static getErrorType(errorMessage) {
    if (errorMessage.includes('name')) return 'name';
    if (errorMessage.includes('description')) return 'description';
    if (errorMessage.includes('price')) return 'price';
    if (errorMessage.includes('category')) return 'category';
    if (errorMessage.includes('stock')) return 'stock';
    if (errorMessage.includes('auction')) return 'auction';
    if (errorMessage.includes('image')) return 'images';
    return 'general';
  }

  /**
   * Create a standardized error response
   */
  static createErrorResponse(error, req = null) {
    const normalizedError = this.normalizeProductError(error);
    
    const response = {
      success: false,
      error: {
        type: normalizedError.type,
        message: normalizedError.userMessage,
        category: normalizedError.category,
        timestamp: normalizedError.timestamp
      }
    };

    // Add valid categories if it's a category error
    if (normalizedError.category === 'category') {
      response.validCategories = this.getValidCategories();
    }

    // Add request context if available
    if (req && req.user) {
      response.userId = req.user._id;
    }

    return response;
  }

  /**
   * Log error details for debugging
   */
  static logError(error, context = {}) {
    const logEntry = {
      timestamp: new Date(),
      type: error.type || 'UNKNOWN',
      message: error.message,
      context,
      stack: error.stack
    };

    console.error('Product Error:', logEntry);
    return logEntry;
  }
}

module.exports = ProductErrorHandler;
