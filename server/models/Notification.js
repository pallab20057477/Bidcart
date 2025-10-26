const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Notification identification
  notificationId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: [
      'PAYMENT_CONFIRMED', 
      'ORDER_STATUS_UPDATE', 
      'REFUND_PROCESSED', 
      'WITHDRAWAL_REQUEST', 
      'SYSTEM_ALERT',
      'AUCTION_OUTBID',
      'AUCTION_ENDING_SOON',
      'AUCTION_STARTED',
      'AUCTION_STARTING_SOON',
      'AUCTION_FIRST_BID',
      'AUCTION_ENDED',
      'BID_PLACED'
    ],
    required: true
  },

  // Content
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },

  // Related data
  data: {
    orderId: String,
    orderNumber: String,
    customerName: String,
    customerEmail: String,
    amount: Number,
    currency: String,
    paymentId: String,
    paidAt: Date,
    products: [{
      name: String,
      quantity: Number,
      price: Number
    }]
  },

  // Status
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,

  // Metadata
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['payment', 'order', 'system', 'user', 'auction'],
    default: 'system'
  },

  // Actions
  actions: [{
    label: String,
    url: String,
    action: String,
    type: {
      type: String,
      enum: ['primary', 'secondary', 'success', 'warning', 'danger'],
      default: 'primary'
    }
  }],

  // Recipients
  recipients: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'vendor', 'user'],
      default: 'admin'
    }
  }]
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ read: 1, createdAt: -1 });
notificationSchema.index({ category: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, createdAt: -1 });
notificationSchema.index({ 'recipients.role': 1, createdAt: -1 });

// Static methods
notificationSchema.statics.getForAdmin = function (options = {}) {
  // Query for admin notifications only
  const query = {
    $or: [
      { 'recipients.role': 'admin' },
      { recipients: { $size: 0 } }, // Notifications with no specific recipients
      { recipients: { $exists: false } } // Notifications without recipients field
    ]
  };

  if (options.read !== undefined) {
    query.read = options.read;
  }

  if (options.category) {
    query.category = options.category;
  }

  if (options.type) {
    query.type = options.type;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

notificationSchema.statics.markAsRead = function (notificationId) {
  return this.findOneAndUpdate(
    { notificationId },
    {
      read: true,
      readAt: new Date()
    },
    { new: true }
  );
};

notificationSchema.statics.getUnreadCount = function (role = 'admin') {
  return this.countDocuments({
    $and: [
      {
        $or: [
          { read: false },
          { read: { $exists: false } } // Handle notifications without read field
        ]
      },
      {
        $or: [
          { 'recipients.role': role },
          { recipients: { $size: 0 } },
          { recipients: { $exists: false } }
        ]
      }
    ]
  });
};

// Get notifications for a specific user
notificationSchema.statics.getForUser = function (userId, options = {}) {
  const query = {
    $or: [
      { 'recipients.userId': userId },
      { user: userId }, // Support old notification format
      { recipients: { $size: 0 } }, // Broadcast notifications
      { recipients: { $exists: false } } // Legacy notifications
    ]
  };

  if (options.read !== undefined) {
    query.read = options.read;
  }

  if (options.category) {
    query.category = options.category;
  }

  if (options.type) {
    query.type = options.type;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

// Get unread count for a specific user
notificationSchema.statics.getUnreadCountForUser = function (userId) {
  return this.countDocuments({
    $and: [
      {
        $or: [
          { read: false },
          { read: { $exists: false } }
        ]
      },
      {
        $or: [
          { 'recipients.userId': userId },
          { user: userId }, // Support old notification format
          { recipients: { $size: 0 } },
          { recipients: { $exists: false } }
        ]
      }
    ]
  });
};

// Get notifications for vendors
notificationSchema.statics.getForVendor = function (vendorUserId, options = {}) {
  const query = {
    $or: [
      { 'recipients.userId': vendorUserId, 'recipients.role': 'vendor' },
      { user: vendorUserId }, // Support old notification format
      { recipients: { $size: 0 } }, // Broadcast notifications
      { recipients: { $exists: false } } // Legacy notifications
    ]
  };

  if (options.read !== undefined) {
    query.read = options.read;
  }

  if (options.category) {
    query.category = options.category;
  }

  if (options.type) {
    query.type = options.type;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

module.exports = mongoose.model('Notification', notificationSchema);