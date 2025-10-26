const mongoose = require('mongoose');

const vendorRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminResponse: {
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  businessDetails: {
    businessName: {
      type: String,
      trim: true
    },
    businessType: {
      type: String,
      enum: ['individual', 'company', 'partnership', 'business', 'other']
    },
    businessAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    phone: String,
    website: String
  },
  bankInfo: {
    accountHolder: String,
    accountNumber: String,
    routingNumber: String,
    bankName: String
  },
  categories: [{
    type: String
  }],
  taxId: {
    type: String,
    trim: true
  },
  documents: [{
    type: {
      type: String,
      enum: ['id_proof', 'business_license', 'tax_certificate', 'bank_statement', 'address_proof', 'gst_certificate', 'other'],
      required: true
    },
    filename: String,
    originalName: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    },
    verificationNotes: String
  }],
  requiredDocuments: {
    idProof: {
      isRequired: { type: Boolean, default: true },
      uploaded: { type: Boolean, default: false },
      verified: { type: Boolean, default: false }
    },
    businessLicense: {
      isRequired: { type: Boolean, default: true },
      uploaded: { type: Boolean, default: false },
      verified: { type: Boolean, default: false }
    },
    taxCertificate: {
      isRequired: { type: Boolean, default: true },
      uploaded: { type: Boolean, default: false },
      verified: { type: Boolean, default: false }
    },
    bankStatement: {
      isRequired: { type: Boolean, default: true },
      uploaded: { type: Boolean, default: false },
      verified: { type: Boolean, default: false }
    },
    addressProof: {
      isRequired: { type: Boolean, default: true },
      uploaded: { type: Boolean, default: false },
      verified: { type: Boolean, default: false }
    }
  },
  verificationStatus: {
    documentsVerified: { type: Boolean, default: false },
    backgroundCheck: { type: Boolean, default: false },
    businessLegitimacy: { type: Boolean, default: false },
    overallApproved: { type: Boolean, default: false }
  },
  adminVerificationNotes: {
    documentsReview: String,
    backgroundCheckNotes: String,
    businessLegitimacyNotes: String,
    finalDecision: String
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date
}, {
  timestamps: true
});

// Index for better query performance
vendorRequestSchema.index({ status: 1, requestedAt: -1 });
vendorRequestSchema.index({ user: 1 });
vendorRequestSchema.index({ 'adminResponse.respondedBy': 1 });

// Prevent multiple pending requests from same user
vendorRequestSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'pending') {
    const existingPending = await this.constructor.findOne({
      user: this.user,
      status: 'pending'
    });
    if (existingPending) {
      return next(new Error('You already have a pending vendor request'));
    }
  }
  next();
});

// Methods
vendorRequestSchema.methods.approve = function(adminId, responseMessage = '') {
  this.status = 'approved';
  this.adminResponse = {
    message: responseMessage || 'Your vendor request has been approved!',
    respondedBy: adminId,
    respondedAt: new Date()
  };
  this.processedAt = new Date();
  return this.save();
};

vendorRequestSchema.methods.reject = function(adminId, responseMessage = '') {
  this.status = 'rejected';
  this.adminResponse = {
    message: responseMessage || 'Your vendor request has been rejected.',
    respondedBy: adminId,
    respondedAt: new Date()
  };
  this.processedAt = new Date();
  return this.save();
};

// Static methods
vendorRequestSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};

vendorRequestSchema.statics.getPendingRequests = function() {
  return this.find({ status: 'pending' })
    .populate('user', 'name email phone')
    .sort({ requestedAt: 1 });
};

module.exports = mongoose.model('VendorRequest', vendorRequestSchema); 