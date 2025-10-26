const mongoose = require('mongoose');

const deliveryTrackingSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  trackingNumber: {
    type: String,
    required: true,
    unique: true
  },
  carrier: {
    type: String,
    required: true,
    enum: ['fedex', 'ups', 'usps', 'dhl', 'shiprocket', 'custom']
  },
  status: {
    type: String,
    required: true,
    enum: [
      'pending',
      'confirmed',
      'shipped',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'failed',
      'returned'
    ],
    default: 'pending'
  },
  estimatedDelivery: {
    type: Date
  },
  actualDelivery: {
    type: Date
  },
  currentLocation: {
    city: String,
    state: String,
    country: String,
    facility: String
  },
  trackingHistory: [{
    status: {
      type: String,
      required: true
    },
    location: {
      city: String,
      state: String,
      country: String,
      facility: String
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  shippingDetails: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    service: String,
    cost: Number
  },
  recipient: {
    name: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    phone: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
deliveryTrackingSchema.index({ order: 1 });
deliveryTrackingSchema.index({ status: 1 });
deliveryTrackingSchema.index({ lastUpdated: 1 });

// Method to add tracking event
deliveryTrackingSchema.methods.addTrackingEvent = function(event) {
  this.trackingHistory.push({
    status: event.status,
    location: event.location,
    description: event.description,
    timestamp: event.timestamp || new Date()
  });

  this.status = event.status;
  this.currentLocation = event.location;
  this.lastUpdated = new Date();

  if (event.status === 'delivered') {
    this.actualDelivery = new Date();
  }

  return this.save();
};

// Method to update status
deliveryTrackingSchema.methods.updateStatus = function(newStatus, description = '') {
  return this.addTrackingEvent({
    status: newStatus,
    description: description,
    timestamp: new Date()
  });
};

// Static method to generate tracking number
deliveryTrackingSchema.statics.generateTrackingNumber = function() {
  const prefix = 'BC';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// Static method to get delivery statistics
deliveryTrackingSchema.statics.getDeliveryStats = function(period = '30') {
  const days = parseInt(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get average delivery time
deliveryTrackingSchema.statics.getAverageDeliveryTime = function(period = '30') {
  const days = parseInt(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        status: 'delivered',
        actualDelivery: { $exists: true },
        createdAt: { $gte: startDate }
      }
    },
    {
      $project: {
        deliveryTime: {
          $divide: [
            { $subtract: ['$actualDelivery', '$createdAt'] },
            1000 * 60 * 60 * 24 // Convert to days
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgDeliveryTime: { $avg: '$deliveryTime' },
        minDeliveryTime: { $min: '$deliveryTime' },
        maxDeliveryTime: { $max: '$deliveryTime' }
      }
    }
  ]);
};

module.exports = mongoose.model('DeliveryTracking', deliveryTrackingSchema); 