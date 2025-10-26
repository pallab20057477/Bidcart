const mongoose = require('mongoose');

const shippingMethodSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  baseRate: {
    type: Number,
    default: 0
  },
  perKgRate: {
    type: Number,
    default: 0
  },
  freeThreshold: {
    type: Number,
    default: 0
  },
  estimatedDays: {
    type: String,
    default: '3-5'
  },
  zoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShippingZone'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ShippingMethod', shippingMethodSchema); 