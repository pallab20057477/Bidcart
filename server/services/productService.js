const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Notification = require('../models/Notification');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUtils');
const { validateProductData, validateVariantData } = require('../utils/validation');
// If uploadToCloudinary and deleteFromCloudinary are custom, import from their new location or implement here.

class ProductService {
  /**
   * Create a new product with professional validation and error handling
   */
  static async createProduct(productData, vendorId, userId, files = []) {
    try {
      // Validate vendor exists and is approved
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new Error('Vendor account not found');
      }
      if (vendor.status !== 'approved') {
        throw new Error('Vendor account must be approved to add products');
      }

      // Validate product data
      const ValidationService = require('../utils/validation');
      const validationResult = ValidationService.validateProductData(productData);
      if (!validationResult.isValid) {
        const error = new Error(`Product validation failed: ${validationResult.errors.join(', ')}`);
        error.validationErrors = validationResult.errors;
        error.statusCode = 400;
        throw error;
      }

      // Handle images - either from files or direct URLs
      let imageUrls = [];
      
      console.log('🖼️ Processing images:', {
        hasImages: !!productData.images,
        isArray: Array.isArray(productData.images),
        length: productData.images?.length,
        images: productData.images,
        hasFiles: !!files,
        filesLength: files?.length
      });
      
      // Check if images are provided as URLs in productData
      if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
        // Images are provided as URLs
        imageUrls = productData.images.filter(url => url && url.trim() !== '');
        console.log('✅ Using provided image URLs:', imageUrls);
      } else if (files && files.length > 0) {
        // Images are provided as files to upload
        imageUrls = await this.processProductImages(files);
        console.log('✅ Processed image files:', imageUrls);
      }

      if (imageUrls.length === 0) {
        console.error('❌ No valid images found');
        throw new Error('At least one product image is required');
      }

      console.log('✅ Final image URLs:', imageUrls);

      // Process variants if provided
      let variants = [];
      if (productData.variants && productData.variants.length > 0) {
        variants = await this.processProductVariants(productData.variants);
      }

      // Create product with proper data sanitization
      const product = new Product({
        name: productData.name.trim(),
        description: productData.description.trim(),
        price: parseFloat(productData.price),
        category: productData.category,
        images: imageUrls,
        mode: productData.mode,
        auction: productData.mode === 'auction' ? this.processAuctionData(productData.auction) : undefined,
        brand: productData.brand?.trim() || '',
        condition: productData.condition || 'new',
        stock: parseInt(productData.stock) || 0,
        tags: this.processTags(productData.tags),
        variants,
        seller: userId,
        vendor: vendorId,
        approvalStatus: 'pending',
        isActive: true,
        metadata: {
          createdAt: new Date(),
          createdBy: userId,
          version: '1.0'
        }
      });

      await product.save();

      // Create admin notification
      await this.createAdminNotification(product, vendor, 'product_created');

      // Update vendor stats
      await this.updateVendorStats(vendorId);

      return {
        success: true,
        product,
        message: 'Product created successfully and is pending admin approval'
      };

    } catch (error) {
      // Clean up uploaded images if product creation fails
      if (files && files.length > 0) {
        await this.cleanupFailedUploads(files);
      }
      
      throw new Error(`Product creation failed: ${error.message}`);
    }
  }

  /**
   * Update an existing product with professional validation
   */
  static async updateProduct(productId, productData, vendorId, userId, files = []) {
    try {
      // Validate product ownership
      const product = await Product.findOne({
        _id: productId,
        vendor: vendorId
      });

      if (!product) {
        throw new Error('Product not found or access denied');
      }

      // Validate product data
      const validationResult = validateProductData(productData);
      if (!validationResult.isValid) {
        throw new Error(`Product validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Process new images
      const newImageUrls = await this.processProductImages(files);
      
      // Combine with existing images
      let allImages = product.images;
      if (productData.existingImages) {
        const existingImages = JSON.parse(productData.existingImages);
        allImages = [...existingImages, ...newImageUrls];
      } else {
        allImages = [...allImages, ...newImageUrls];
      }

      if (allImages.length === 0) {
        throw new Error('At least one product image is required');
      }

      // Process variants
      let variants = [];
      if (productData.variants && productData.variants.length > 0) {
        variants = await this.processProductVariants(productData.variants);
      }

      // Update product with audit trail
      const updateData = {
        name: productData.name.trim(),
        description: productData.description.trim(),
        price: parseFloat(productData.price),
        category: productData.category,
        images: allImages,
        mode: productData.mode,
        auction: productData.mode === 'auction' ? this.processAuctionData(productData.auction) : undefined,
        brand: productData.brand?.trim() || '',
        condition: productData.condition,
        stock: parseInt(productData.stock) || 0,
        tags: this.processTags(productData.tags),
        variants,
        approvalStatus: 'pending', // Reset to pending after edit
        'metadata.lastUpdated': new Date(),
        'metadata.updatedBy': userId,
        'metadata.version': (product.metadata?.version || 0) + 0.1
      };

      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        updateData,
        { new: true, runValidators: true }
      );

      // Create admin notification
      const vendor = await Vendor.findById(vendorId);
      await this.createAdminNotification(updatedProduct, vendor, 'product_updated');

      return {
        success: true,
        product: updatedProduct,
        message: 'Product updated successfully and is pending admin approval'
      };

    } catch (error) {
      // Clean up uploaded images if update fails
      if (files.length > 0) {
        await this.cleanupFailedUploads(files);
      }
      
      throw new Error(`Product update failed: ${error.message}`);
    }
  }

  /**
   * Process and upload product images to Cloudinary
   */
  static async processProductImages(files) {
    const imageUrls = [];
    
    for (const file of files) {
      try {
        const result = await uploadToCloudinary(file, 'products');
        imageUrls.push(result.secure_url);
      } catch (error) {
        console.error('Image upload failed:', error);
        throw new Error(`Failed to upload image: ${file.originalname}`);
      }
    }
    
    return imageUrls;
  }

  /**
   * Process product variants with validation
   */
  static async processProductVariants(variantsData) {
    const processedVariants = [];
    
    for (const variant of variantsData) {
      const validationResult = validateVariantData(variant);
      if (!validationResult.isValid) {
        throw new Error(`Variant validation failed: ${validationResult.errors.join(', ')}`);
      }

      processedVariants.push({
        attributes: variant.attributes || {},
        price: parseFloat(variant.price),
        stock: parseInt(variant.stock),
        sku: variant.sku?.trim() || '',
        image: variant.image || null,
        isDefault: Boolean(variant.isDefault)
      });
    }
    
    return processedVariants;
  }

  /**
   * Process auction data with validation
   */
  static processAuctionData(auctionData) {
    if (!auctionData) return undefined;

    const startTime = new Date(auctionData.startTime);
    const endTime = new Date(auctionData.endTime);
    const now = new Date();

    if (startTime <= now) {
      throw new Error('Auction start time must be in the future');
    }
    if (endTime <= startTime) {
      throw new Error('Auction end time must be after start time');
    }

    return {
      startTime,
      endTime,
      startingBid: parseFloat(auctionData.startingBid),
      minBidIncrement: parseInt(auctionData.minBidIncrement) || 1,
      status: 'scheduled'
    };
  }

  /**
   * Process tags with sanitization
   */
  static processTags(tags) {
    if (!tags) return [];
    
    // If tags is already an array, return trimmed array limited to 10
    if (Array.isArray(tags)) {
      return tags.map(tag => (typeof tag === 'string' ? tag.trim() : String(tag).trim())).filter(tag => tag.length > 0).slice(0, 10);
    }
    
    // Otherwise assume string and split
    if (typeof tags === 'string') {
      return tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, 10); // Limit to 10 tags
    }
    
    // Handle case where tags might be an object or other type
    if (typeof tags === 'object') {
      try {
        // Try to convert to array if it's an object
        const tagArray = Object.values(tags).filter(val => typeof val === 'string' && val.trim().length > 0);
        return tagArray.slice(0, 10);
      } catch (error) {
        return [];
      }
    }
    
    // If tags is neither array nor string, return empty array
    return [];
  }

  /**
   * Create admin notification for product actions
   */
  static async createAdminNotification(product, vendor, action) {
    try {
      const User = require('../models/User');
      
      // Find all admin users
      const adminUsers = await User.find({ role: 'admin' });
      
      if (adminUsers.length === 0) {
        console.warn('No admin users found for notification');
        return;
      }

      // Create notifications for all admin users
      const notifications = adminUsers.map(admin => ({
        user: admin._id,
        message: this.getNotificationMessage(action, product, vendor),
        type: 'product_approval',
        data: {
          productId: product._id,
          vendorId: vendor._id,
          vendorName: vendor.businessName,
          action,
          title: this.getNotificationTitle(action)
        }
      }));

      await Notification.insertMany(notifications);
    } catch (error) {
      console.error('Failed to create admin notifications:', error);
      // Don't throw error to prevent product creation from failing due to notification issues
    }
  }

  /**
   * Get notification title based on action
   */
  static getNotificationTitle(action) {
    const titles = {
      product_created: 'New Product Pending Approval',
      product_updated: 'Product Updated - Pending Approval',
      product_approved: 'Product Approved',
      product_rejected: 'Product Rejected'
    };
    return titles[action] || 'Product Action';
  }

  /**
   * Get notification message based on action
   */
  static getNotificationMessage(action, product, vendor) {
    const messages = {
      product_created: `Product "${product.name}" from ${vendor.businessName} is pending approval`,
      product_updated: `Product "${product.name}" from ${vendor.businessName} has been updated and is pending approval`,
      product_approved: `Product "${product.name}" from ${vendor.businessName} has been approved`,
      product_rejected: `Product "${product.name}" from ${vendor.businessName} has been rejected`
    };
    return messages[action] || 'Product action completed';
  }

  /**
   * Update vendor statistics
   */
  static async updateVendorStats(vendorId) {
    const totalProducts = await Product.countDocuments({ vendor: vendorId });
    const pendingProducts = await Product.countDocuments({ 
      vendor: vendorId, 
      approvalStatus: 'pending' 
    });

    await Vendor.findByIdAndUpdate(vendorId, {
      totalProducts,
      pendingProducts,
      lastProductAdded: new Date()
    });
  }

  /**
   * Cleanup failed uploads
   */
  static async cleanupFailedUploads(files) {
    for (const file of files) {
      try {
        if (file.path) {
          await deleteFromCloudinary(file.path);
        }
      } catch (error) {
        console.error('Failed to cleanup file:', error);
      }
    }
  }

  /**
   * Get vendor products with pagination and filtering
   */
  static async getVendorProducts(vendorId, options = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      search
    } = options;

    const query = { vendor: vendorId };
    
    // Exclude auction products that are still pending approval
    // Only show auction products that have been approved by admin
    query.$or = [
      { mode: { $ne: 'auction' } }, // Non-auction products
      { 
        mode: 'auction', 
        $or: [
          { 'auction.status': 'approved' }, // Approved auction products
          { 'auction.status': 'active' },   // Active auction products
          { 'auction.status': 'completed' } // Completed auction products
        ]
      }
    ];
    
    if (status) query.approvalStatus = status;
    if (category) query.category = category;
    if (search) {
      const searchQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
      // Combine with existing $or query
      query.$and = [
        { $or: query.$or }, // Existing auction filter
        searchQuery
      ];
      delete query.$or;
    }

    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('vendor', 'businessName'),
      Product.countDocuments(query)
    ]);

    return {
      products,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }
}

module.exports = ProductService; 