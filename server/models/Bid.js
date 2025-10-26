const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  isWinning: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'outbid', 'won', 'cancelled'],
    default: 'active'
  },
  placedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
bidSchema.index({ product: 1, amount: -1 });
bidSchema.index({ bidder: 1, placedAt: -1 });
bidSchema.index({ product: 1, isWinning: 1 });

// Static method to get highest bid for a product
bidSchema.statics.getHighestBid = function(productId) {
  return this.findOne({ 
    product: productId, 
    status: 'active' 
  }).sort({ amount: -1 });
};

// Static method to get all bids for a product
bidSchema.statics.getProductBids = function(productId) {
  return this.find({ product: productId })
    .populate('bidder', 'name email')
    .sort({ amount: -1 });
};

// Static method to get user's bids
bidSchema.statics.getUserBids = function(userId) {
  return this.find({ bidder: userId })
    .populate('product', 'name images mode')
    .sort({ placedAt: -1 });
};

module.exports = mongoose.model('Bid', bidSchema); 