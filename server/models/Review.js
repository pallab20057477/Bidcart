const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  images: [{
    url: String,
    caption: String
  }],
  helpful: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    helpful: Boolean,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  verified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminResponse: {
    comment: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ vendor: 1, rating: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ status: 1 });

// Ensure one review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Virtual for helpful count
reviewSchema.virtual('helpfulCount').get(function() {
  return this.helpful.filter(h => h.helpful).length;
});

// Virtual for not helpful count
reviewSchema.virtual('notHelpfulCount').get(function() {
  return this.helpful.filter(h => !h.helpful).length;
});

// Method to mark review as helpful
reviewSchema.methods.markHelpful = function(userId, helpful) {
  const existingIndex = this.helpful.findIndex(h => h.user.toString() === userId);
  
  if (existingIndex > -1) {
    this.helpful[existingIndex].helpful = helpful;
    this.helpful[existingIndex].date = new Date();
  } else {
    this.helpful.push({
      user: userId,
      helpful: helpful,
      date: new Date()
    });
  }
  
  return this.save();
};

// Static method to get product reviews
reviewSchema.statics.getProductReviews = function(productId, page = 1, limit = 10) {
  return this.find({ 
    product: productId, 
    status: 'approved' 
  })
  .populate('user', 'name avatar')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip((page - 1) * limit)
  .lean({ virtuals: true });
};

// Static method to get vendor reviews
reviewSchema.statics.getVendorReviews = function(vendorId, page = 1, limit = 10) {
  return this.find({ 
    vendor: vendorId, 
    status: 'approved' 
  })
  .populate('user', 'name avatar')
  .populate('product', 'name images')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip((page - 1) * limit);
};

// Static method to get average rating for product
reviewSchema.statics.getProductAverageRating = function(productId) {
  return this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
};

// Static method to get average rating for vendor
reviewSchema.statics.getVendorAverageRating = function(vendorId) {
  return this.aggregate([
    { $match: { vendor: new mongoose.Types.ObjectId(vendorId), status: 'approved' } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
};

module.exports = mongoose.model('Review', reviewSchema); 