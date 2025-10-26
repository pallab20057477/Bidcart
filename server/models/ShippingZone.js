const mongoose = require('mongoose');

const shippingZoneSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  countries: [{
    type: String
  }],
  states: [{
    type: String
  }],
  postalCodes: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ShippingZone', shippingZoneSchema);
