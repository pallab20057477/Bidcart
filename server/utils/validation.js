/**
 * Professional validation utilities for product management
 */

class ValidationService {
  /**
   * Validate product data with comprehensive rules
   */
  static validateProductData(data) {
    const errors = [];
    const warnings = [];

    // Required fields validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Product name is required');
    } else if (data.name.trim().length < 3) {
      errors.push('Product name must be at least 3 characters long');
    } else if (data.name.trim().length > 100) {
      errors.push('Product name must be less than 100 characters');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Product description is required');
    } else if (data.description.trim().length < 10) {
      errors.push('Product description must be at least 10 characters long');
    } else if (data.description.trim().length > 2000) {
      errors.push('Product description must be less than 2000 characters');
    }

    if (!data.price || isNaN(data.price) || parseFloat(data.price) <= 0) {
      errors.push('Valid price is required');
    } else if (parseFloat(data.price) > 100000) {
      errors.push('Price cannot exceed $100,000');
    }

    if (!data.category) {
      errors.push('Product category is required');
    } else if (!this.isValidCategory(data.category)) {
      errors.push('Invalid product category');
    }

    if (!data.mode || !['buy-now', 'auction'].includes(data.mode)) {
      errors.push('Product mode must be either "buy-now" or "auction"');
    }

    // Stock validation
    if (data.mode === 'buy-now') {
      if (!data.stock || isNaN(data.stock) || parseInt(data.stock) < 0) {
        errors.push('Valid stock quantity is required for buy-now products');
      } else if (parseInt(data.stock) > 10000) {
        warnings.push('Stock quantity seems unusually high');
      }
    }

    // Condition validation
    if (data.condition && !this.isValidCondition(data.condition)) {
      errors.push('Invalid product condition');
    }

    // Brand validation
    if (data.brand && data.brand.trim().length > 50) {
      errors.push('Brand name must be less than 50 characters');
    }

    // Tags validation
    if (data.tags) {
      let tags = [];
      
      // Handle both array and string formats
      if (Array.isArray(data.tags)) {
        tags = data.tags.map(t => typeof t === 'string' ? t.trim() : String(t).trim()).filter(t => t.length > 0);
      } else if (typeof data.tags === 'string') {
        tags = data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      } else {
        tags = [];
      }
      
      if (tags.length > 10) {
        errors.push('Maximum 10 tags allowed');
      }
      for (const tag of tags) {
        if (tag.length > 20) {
          errors.push('Each tag must be less than 20 characters');
        }
        if (!/^[a-zA-Z0-9\s\-_]+$/.test(tag)) {
          errors.push('Tags can only contain letters, numbers, spaces, hyphens, and underscores');
        }
      }
    }

    // Auction validation
    if (data.mode === 'auction') {
      const auctionErrors = this.validateAuctionData(data.auction);
      errors.push(...auctionErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate variant data
   */
  static validateVariantData(variant) {
    const errors = [];

    // Required fields
    if (!variant.price || isNaN(variant.price) || parseFloat(variant.price) <= 0) {
      errors.push('Valid variant price is required');
    }

    if (!variant.stock || isNaN(variant.stock) || parseInt(variant.stock) < 0) {
      errors.push('Valid variant stock quantity is required');
    }

    // Attributes validation
    if (variant.attributes) {
      const attributeErrors = this.validateAttributes(variant.attributes);
      errors.push(...attributeErrors);
    }

    // SKU validation
    if (variant.sku && variant.sku.trim().length > 50) {
      errors.push('SKU must be less than 50 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate auction data
   */
  static validateAuctionData(auctionData) {
    const errors = [];

    if (!auctionData) {
      errors.push('Auction data is required for auction mode');
      return errors;
    }

    if (!auctionData.startTime) {
      errors.push('Auction start time is required');
    } else {
      const startTime = new Date(auctionData.startTime);
      const now = new Date();
      if (startTime <= now) {
        errors.push('Auction start time must be in the future');
      }
    }

    if (!auctionData.endTime) {
      errors.push('Auction end time is required');
    } else {
      const endTime = new Date(auctionData.endTime);
      const startTime = new Date(auctionData.startTime);
      if (endTime <= startTime) {
        errors.push('Auction end time must be after start time');
      }
    }

    if (!auctionData.startingBid || isNaN(auctionData.startingBid) || parseFloat(auctionData.startingBid) <= 0) {
      errors.push('Valid starting bid is required');
    }

    if (auctionData.minBidIncrement && (isNaN(auctionData.minBidIncrement) || parseInt(auctionData.minBidIncrement) <= 0)) {
      errors.push('Minimum bid increment must be a positive number');
    }

    return errors;
  }

  /**
   * Validate product attributes
   */
  static validateAttributes(attributes) {
    const errors = [];

    for (const [key, value] of Object.entries(attributes)) {
      if (key.length > 20) {
        errors.push('Attribute key must be less than 20 characters');
      }
      if (value && value.toString().length > 50) {
        errors.push('Attribute value must be less than 50 characters');
      }
      if (!/^[a-zA-Z0-9\s\-_]+$/.test(key)) {
        errors.push('Attribute keys can only contain letters, numbers, spaces, hyphens, and underscores');
      }
    }

    return errors;
  }

  /**
   * Validate image files
   */
  static validateImageFiles(files) {
    const errors = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!files || files.length === 0) {
      errors.push('At least one image is required');
      return errors;
    }

    if (files.length > 10) {
      errors.push('Maximum 10 images allowed per product');
    }

    for (const file of files) {
      if (!allowedTypes.includes(file.mimetype)) {
        errors.push(`Invalid file type: ${file.originalname}. Only JPEG, PNG, and WebP are allowed`);
      }

      if (file.size > maxSize) {
        errors.push(`File too large: ${file.originalname}. Maximum size is 5MB`);
      }

      if (file.originalname.length > 100) {
        errors.push(`Filename too long: ${file.originalname}`);
      }
    }

    return errors;
  }

  /**
   * Validate category
   */
  static isValidCategory(category) {
    const validCategories = [
      'Electronics', 'Fashion', 'Home', 'Sports', 
      'Books', 'Art', 'Collectibles', 'Other', 
      'Tools & Hardware', 'Toys & Games'
    ];
    
    // Handle case-insensitive matching
    if (typeof category !== 'string') return false;
    
    const normalizedCategory = category.trim();
    return validCategories.some(validCat => 
      validCat.toLowerCase() === normalizedCategory.toLowerCase()
    );
  }

  /**
   * Validate condition
   */
  static isValidCondition(condition) {
    const validConditions = ['new', 'like-new', 'good', 'fair', 'poor'];
    return validConditions.includes(condition);
  }

  /**
   * Sanitize product data
   */
  static sanitizeProductData(data) {
    let tags = [];
    
    // Handle tags in both array and string formats
    if (data.tags) {
      if (Array.isArray(data.tags)) {
        tags = data.tags.map(t => typeof t === 'string' ? t.trim() : String(t).trim()).filter(t => t.length > 0);
      } else if (typeof data.tags === 'string') {
        tags = data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      }
    }
    
    return {
      name: data.name?.trim(),
      description: data.description?.trim(),
      price: parseFloat(data.price) || 0,
      category: data.category,
      mode: data.mode,
      brand: data.brand?.trim() || '',
      condition: data.condition || 'new',
      stock: parseInt(data.stock) || 0,
      tags: tags
    };
  }

  /**
   * Validate vendor permissions
   */
  static async validateVendorPermissions(vendorId, userId) {
    const Vendor = require('../models/Vendor');
    
    const vendor = await Vendor.findOne({ _id: vendorId, user: userId });
    if (!vendor) {
      throw new Error('Vendor account not found');
    }

    if (vendor.status !== 'approved') {
      throw new Error('Vendor account must be approved to manage products');
    }

    return vendor;
  }

  /**
   * Validate product ownership
   */
  static async validateProductOwnership(productId, vendorId) {
    const Product = require('../models/Product');
    
    const product = await Product.findOne({ _id: productId, vendor: vendorId });
    if (!product) {
      throw new Error('Product not found or access denied');
    }

    return product;
  }
}

module.exports = ValidationService; 