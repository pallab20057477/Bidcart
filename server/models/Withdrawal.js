const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  processingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  netAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled', 'failed'],
    default: 'pending'
  },
  note: {
    type: String,
    maxlength: 500
  },
  withdrawalTransactionId: {
    type: String
  },
  processedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  failureReason: {
    type: String
  },
  adminNotes: {
    type: String
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    processingMethod: String
  }
}, {
  timestamps: true
});

// Indexes
withdrawalSchema.index({ vendor: 1, status: 1 });
withdrawalSchema.index({ vendor: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: 1 });
withdrawalSchema.index({ withdrawalTransactionId: 1 }, { sparse: true });

// Virtual for formatted amount
withdrawalSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(this.amount);
});

// Virtual for formatted net amount
withdrawalSchema.virtual('formattedNetAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(this.netAmount);
});

// Pre-save middleware to generate withdrawal transaction ID
withdrawalSchema.pre('save', function(next) {
  if (this.isNew && !this.withdrawalTransactionId) {
    this.withdrawalTransactionId = `WD${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  }
  next();
});

// Static method to get vendor balance
withdrawalSchema.statics.getVendorBalance = async function(vendorId) {
  const vendor = await mongoose.model('Vendor').findById(vendorId);
  if (!vendor) return null;

  const totalEarnings = vendor.totalEarnings || 0;
  
  const withdrawalStats = await this.aggregate([
    { $match: { vendor: vendorId } },
    {
      $group: {
        _id: '$status',
        total: { $sum: '$amount' }
      }
    }
  ]);

  const completed = withdrawalStats.find(s => s._id === 'completed')?.total || 0;
  const pending = withdrawalStats.find(s => ['pending', 'processing'].includes(s._id))?.total || 0;

  return {
    total: totalEarnings,
    available: totalEarnings - completed - pending,
    pending,
    withdrawn: completed
  };
};

// Instance method to check if withdrawal can be cancelled
withdrawalSchema.methods.canBeCancelled = function() {
  return this.status === 'pending';
};

// Instance method to process withdrawal
withdrawalSchema.methods.process = function() {
  this.status = 'processing';
  this.processedAt = new Date();
  return this.save();
};

// Instance method to complete withdrawal
withdrawalSchema.methods.complete = function(withdrawalTransactionId) {
  this.status = 'completed';
  this.processedAt = new Date();
  if (withdrawalTransactionId) {
    this.withdrawalTransactionId = withdrawalTransactionId;
  }
  return this.save();
};

// Instance method to cancel withdrawal
withdrawalSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  if (reason) {
    this.failureReason = reason;
  }
  return this.save();
};

// Instance method to fail withdrawal
withdrawalSchema.methods.fail = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  return this.save();
};

module.exports = mongoose.model('Withdrawal', withdrawalSchema);