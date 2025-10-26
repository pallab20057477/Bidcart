const mongoose = require('mongoose');
const crypto = require('crypto');

const paymentMethodSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  type: {
    type: String,
    enum: ['bank', 'paypal', 'stripe', 'wise'],
    required: true
  },
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  // Bank account fields
  accountNumber: {
    type: String,
    set: function(value) {
      if (value && this.type === 'bank') {
        // Encrypt sensitive data
        return this.encrypt(value);
      }
      return value;
    },
    get: function(value) {
      if (value && this.type === 'bank') {
        // Decrypt for use, but mask for display
        return this.decrypt(value);
      }
      return value;
    }
  },
  bankName: {
    type: String,
    trim: true
  },
  routingNumber: {
    type: String,
    trim: true
  },
  swiftCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  // PayPal fields
  paypalEmail: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        if (this.type === 'paypal' && email) {
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
        }
        return true;
      },
      message: 'Invalid PayPal email format'
    }
  },
  // Stripe fields
  stripeAccountId: {
    type: String,
    trim: true
  },
  // Wise fields
  wiseAccountId: {
    type: String,
    trim: true
  },
  // Common fields
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  country: {
    type: String,
    uppercase: true,
    default: 'US'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationData: {
    verifiedAt: Date,
    verificationMethod: String,
    verificationId: String
  },
  lastUsed: {
    type: Date
  },
  metadata: {
    addedFromIP: String,
    userAgent: String
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Mask sensitive data in JSON output
      if (ret.accountNumber && doc.type === 'bank') {
        ret.maskedAccountNumber = `****${ret.accountNumber.slice(-4)}`;
        delete ret.accountNumber;
      }
      return ret;
    }
  }
});

// Indexes
paymentMethodSchema.index({ vendor: 1, isActive: 1 });
paymentMethodSchema.index({ vendor: 1, isDefault: 1 });
paymentMethodSchema.index({ vendor: 1, type: 1 });

// Encryption methods
paymentMethodSchema.methods.encrypt = function(text) {
  if (!text) return text;
  const algorithm = 'aes-256-cbc';
  const key = process.env.ENCRYPTION_KEY || 'your-secret-key-here-32-characters';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

paymentMethodSchema.methods.decrypt = function(text) {
  if (!text || !text.includes(':')) return text;
  const algorithm = 'aes-256-cbc';
  const key = process.env.ENCRYPTION_KEY || 'your-secret-key-here-32-characters';
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Virtual for masked account number
paymentMethodSchema.virtual('maskedAccountNumber').get(function() {
  if (this.accountNumber && this.type === 'bank') {
    const decrypted = this.decrypt(this.accountNumber);
    return `****${decrypted.slice(-4)}`;
  }
  return null;
});

// Virtual for display name
paymentMethodSchema.virtual('displayName').get(function() {
  switch (this.type) {
    case 'bank':
      return `${this.bankName} - ${this.maskedAccountNumber}`;
    case 'paypal':
      return `PayPal - ${this.paypalEmail}`;
    case 'stripe':
      return `Stripe Account`;
    case 'wise':
      return `Wise Account`;
    default:
      return 'Payment Method';
  }
});

// Pre-save middleware
paymentMethodSchema.pre('save', async function(next) {
  // If setting as default, unset other defaults for this vendor
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { 
        vendor: this.vendor, 
        _id: { $ne: this._id },
        isActive: true 
      },
      { isDefault: false }
    );
  }

  // Validate required fields based on type
  if (this.type === 'bank') {
    if (!this.accountNumber || !this.bankName || !this.routingNumber) {
      return next(new Error('Bank account requires account number, bank name, and routing number'));
    }
  } else if (this.type === 'paypal') {
    if (!this.paypalEmail) {
      return next(new Error('PayPal account requires email address'));
    }
  }

  next();
});

// Static method to get vendor's default payment method
paymentMethodSchema.statics.getDefault = function(vendorId) {
  return this.findOne({ 
    vendor: vendorId, 
    isDefault: true, 
    isActive: true 
  });
};

// Static method to get vendor's payment methods
paymentMethodSchema.statics.getByVendor = function(vendorId) {
  return this.find({ 
    vendor: vendorId, 
    isActive: true 
  }).sort({ isDefault: -1, createdAt: -1 });
};

// Instance method to mark as used
paymentMethodSchema.methods.markAsUsed = function() {
  this.lastUsed = new Date();
  return this.save();
};

// Instance method to verify
paymentMethodSchema.methods.verify = function(method, verificationId) {
  this.isVerified = true;
  this.verificationData = {
    verifiedAt: new Date(),
    verificationMethod: method,
    verificationId: verificationId
  };
  return this.save();
};

// Instance method to deactivate
paymentMethodSchema.methods.deactivate = function() {
  this.isActive = false;
  this.isDefault = false;
  return this.save();
};

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);