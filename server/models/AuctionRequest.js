const mongoose = require('mongoose');

const auctionRequestSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  requestedStartTime: {
    type: Date,
    required: true
  },
  requestedEndTime: {
    type: Date,
    required: true
  },
  startingBid: {
    type: Number,
    required: true,
    min: 0
  },
  minBidIncrement: {
    type: Number,
    default: 1,
    min: 0.01
  },
  reservePrice: {
    type: Number,
    min: 0
  },
  buyNowPrice: {
    type: Number,
    min: 0
  },
  justification: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminResponse: {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    respondedAt: Date
  },
  approvedAuctionDetails: {
    startTime: Date,
    endTime: Date,
    startingBid: Number,
    minBidIncrement: Number,
    reservePrice: Number,
    buyNowPrice: Number
  }
}, {
  timestamps: true
});

// Index for better query performance
auctionRequestSchema.index({ vendor: 1, status: 1 });
auctionRequestSchema.index({ status: 1, createdAt: -1 });
auctionRequestSchema.index({ product: 1 });

// Method to approve request
auctionRequestSchema.methods.approve = function(adminId, auctionDetails, message = '') {
  this.status = 'approved';
  this.adminResponse = {
    admin: adminId,
    message,
    respondedAt: new Date()
  };
  this.approvedAuctionDetails = auctionDetails;
  return this.save();
};

// Method to reject request
auctionRequestSchema.methods.reject = function(adminId, message) {
  this.status = 'rejected';
  this.adminResponse = {
    admin: adminId,
    message,
    respondedAt: new Date()
  };
  return this.save();
};

module.exports = mongoose.model('AuctionRequest', auctionRequestSchema);