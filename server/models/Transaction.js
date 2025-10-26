const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Transaction identification
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['order_payment', 'refund', 'withdrawal', 'commission', 'adjustment'],
    required: true
  },
  
  // Related entities
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  withdrawal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Withdrawal'
  },
  
  // Financial details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  
  // Payment gateway details
  paymentGateway: {
    type: String,
    enum: ['razorpay', 'stripe', 'paypal', 'cod', 'manual'],
    required: true
  },
  gatewayTransactionId: {
    type: String,
    index: true
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    required: true
  },
  
  // Metadata
  description: {
    type: String
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    paymentMethod: String,
    cardLast4: String,
    cardBrand: String
  },
  
  // Error handling
  errorCode: String,
  errorMessage: String,
  
  // Timestamps for different stages
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  failedAt: Date,
  refundedAt: Date
}, {
  timestamps: true
});

// Indexes for performance
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ vendor: 1, createdAt: -1 });
transactionSchema.index({ order: 1 });
transactionSchema.index({ status: 1, type: 1 });
transactionSchema.index({ paymentGateway: 1, gatewayTransactionId: 1 });

// Pre-save middleware to generate transaction ID
transactionSchema.pre('save', function(next) {
  if (this.isNew && !this.transactionId) {
    const prefix = {
      order_payment: 'PAY',
      refund: 'REF',
      withdrawal: 'WD',
      commission: 'COM',
      adjustment: 'ADJ'
    }[this.type] || 'TXN';
    
    this.transactionId = `${prefix}${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  }
  next();
});

// Instance methods
transactionSchema.methods.markAsCompleted = function(gatewayTransactionId, gatewayResponse) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (gatewayTransactionId) this.gatewayTransactionId = gatewayTransactionId;
  if (gatewayResponse) this.gatewayResponse = gatewayResponse;
  return this.save();
};

transactionSchema.methods.markAsFailed = function(errorCode, errorMessage) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.errorCode = errorCode;
  this.errorMessage = errorMessage;
  return this.save();
};

transactionSchema.methods.markAsRefunded = function() {
  this.status = 'refunded';
  this.refundedAt = new Date();
  return this.save();
};

// Static methods
transactionSchema.statics.getUserTransactions = function(userId, options = {}) {
  const query = { user: userId };
  if (options.type) query.type = options.type;
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

transactionSchema.statics.getVendorTransactions = function(vendorId, options = {}) {
  const query = { vendor: vendorId };
  if (options.type) query.type = options.type;
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

transactionSchema.statics.getOrderTransactions = function(orderId) {
  return this.find({ order: orderId }).sort({ createdAt: -1 });
};

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

module.exports = mongoose.model('Transaction', transactionSchema);
