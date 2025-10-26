const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  businessDescription: {
    type: String,
    required: true
  },
  businessAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  businessType: {
    type: String,
    enum: ['individual', 'business', 'corporation'],
    default: 'individual'
  },
  taxId: String,
  bankInfo: {
    accountHolder: String,
    accountNumber: String,
    routingNumber: String,
    bankName: String
  },
  documents: [{
    type: {
      type: String, // e.g., 'id_proof', 'address_proof', etc.
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  approvalDate: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  commissionRate: {
    type: Number,
    default: 10, // 10% commission by default
    min: 0,
    max: 50
  },
  payoutSchedule: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly'],
    default: 'bi-weekly'
  },
  minimumPayout: {
    type: Number,
    default: 50 // $50 minimum payout
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalProducts: {
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
  featured: {
    type: Boolean,
    default: false
  },
  categories: [{
    type: String
  }],
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String
  },
  storeSettings: {
    logo: String,
    banner: String,
    storeColor: String,
    storeDescription: String
  },
  shippingSettings: {
    freeShippingThreshold: {
      type: Number,
      default: 0
    },
    processingTime: {
      type: Number,
      default: 1
    },
    returnPolicy: {
      type: String,
      default: ''
    },
    trackingEnabled: {
      type: Boolean,
      default: true
    },
    internationalShipping: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
vendorSchema.index({ status: 1, businessName: 1 });
vendorSchema.index({ user: 1 });
vendorSchema.index({ 'rating.average': -1 });

// Virtual for total commission earned (based on earnings, not sales)
vendorSchema.virtual('totalCommission').get(function() {
  return this.totalEarnings * (this.commissionRate / 100);
});

// Virtual for net earnings (earnings after commission deduction)
vendorSchema.virtual('netEarnings').get(function() {
  return this.totalEarnings - this.totalCommission;
});

// Method to update vendor stats
vendorSchema.methods.updateStats = function() {
  return this.model('Product').countDocuments({ vendor: this._id })
    .then(count => {
      this.totalProducts = count;
      return this.save();
    });
};

// Method to calculate average rating
vendorSchema.methods.calculateRating = function() {
  return this.model('Review').aggregate([
    { $match: { vendor: this._id } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]).then(result => {
    if (result.length > 0) {
      this.rating.average = Math.round(result[0].average * 10) / 10;
      this.rating.count = result[0].count;
    }
    return this.save();
  });
};

module.exports = mongoose.model('Vendor', vendorSchema); 