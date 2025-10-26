const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Art', 'Collectibles', 'Other', 'Tools & Hardware', 'Toys & Games']
  },
  images: [{
    type: String,
    required: true
  }],
  mode: {
    type: String,
    enum: ['buy-now', 'auction'],
    required: true
  },
  // Auction specific fields
  auction: {
    startTime: Date,
    endTime: Date,
    startingBid: Number,
    currentBid: Number,
    minBidIncrement: {
      type: Number,
      default: 1
    },
    reservePrice: Number,
    buyNowPrice: Number,
    status: {
      type: String,
      enum: ['pending-approval', 'scheduled', 'active', 'ended', 'cancelled', 'rejected'],
      default: 'pending-approval'
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    auctionRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuctionRequest'
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    totalBids: {
      type: Number,
      default: 0
    },
    preLaunchViews: {
      type: Number,
      default: 0
    },
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Notification tracking fields
    notifiedStartingSoon: {
      type: Boolean,
      default: false
    },
    notifiedEndingSoon: {
      type: Boolean,
      default: false
    }
  },
  // Product details
  brand: String,
  condition: {
    type: String,
    enum: ['new', 'like-new', 'good', 'fair', 'poor'],
    default: 'new'
  },
  stock: {
    type: Number,
    default: 1,
    min: 0
  },
  tags: [String],
  specifications: mongoose.Schema.Types.Mixed,
  variants: [
    {
      attributes: { type: mongoose.Schema.Types.Mixed, required: true }, // e.g., { size: 'M', color: 'Red' }
      price: { type: Number, required: true, min: 0 },
      stock: { type: Number, required: true, min: 0 },
      sku: { type: String },
      image: { type: String },
      isDefault: { type: Boolean, default: false }
    }
  ],
  // Seller/Vendor info
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: String,
  views: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  sales: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Index for better search performance
productSchema.index({ name: 'text', description: 'text', category: 1 });
productSchema.index({ 'auction.endTime': 1, 'auction.status': 1 });
productSchema.index({ mode: 1, isActive: 1 });

// Virtual for auction time remaining
productSchema.virtual('timeRemaining').get(function() {
  if (this.mode === 'auction' && this.auction.endTime) {
    const now = new Date();
    const endTime = new Date(this.auction.endTime);
    return Math.max(0, endTime - now);
  }
  return 0;
});

// Method to check if auction is active
productSchema.methods.isAuctionActive = function() {
  if (this.mode !== 'auction') return false;
  const now = new Date();
  return this.auction.startTime <= now && this.auction.endTime > now && this.auction.status === 'active';
};

// Method to check if auction is scheduled
productSchema.methods.isAuctionScheduled = function() {
  if (this.mode !== 'auction') return false;
  const now = new Date();
  return this.auction.startTime > now && this.auction.status === 'scheduled';
};

// Method to check if auction is upcoming
productSchema.methods.isAuctionUpcoming = function() {
  if (this.mode !== 'auction') return false;
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  return this.auction.startTime > now && this.auction.startTime <= oneHourFromNow && this.auction.status === 'scheduled';
};

// Method to start auction
productSchema.methods.startAuction = function() {
  this.auction.status = 'active';
  return this.save();
};

// Method to end auction
productSchema.methods.endAuction = function() {
  this.auction.status = 'ended';
  return this.save();
};

// Method to get auction status
productSchema.methods.getAuctionStatus = function() {
  if (this.mode !== 'auction') return 'not-auction';
  
  const now = new Date();
  
  if (this.auction.status === 'cancelled') return 'cancelled';
  if (this.auction.status === 'ended') return 'ended';
  
  if (this.auction.startTime > now) {
    return 'scheduled';
  } else if (this.auction.endTime > now) {
    return 'active';
  } else {
    return 'ended';
  }
};

// Static method for bulk insert
productSchema.statics.bulkInsert = async function(productsArray) {
  return this.insertMany(productsArray);
};

module.exports = mongoose.model('Product', productSchema); 