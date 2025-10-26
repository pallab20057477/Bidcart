const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: false // for legacy orders, but should be required for new ones
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    mode: {
      type: String,
      enum: ['buy-now', 'auction'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'out-for-delivery', 'nearest-area', 'delivered', 'cancelled'],
      default: 'processing'
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'stripe', 'cod'],
    required: true
  },
  paymentId: String,
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  shippingMethod: {
    type: String,
    default: 'standard'
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  coupon: {
    code: String,
    discountAmount: Number,
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    }
  },
  notes: String,
  estimatedDelivery: Date,
  trackingNumber: String,
  // For auction orders
  auctionDetails: {
    productId: mongoose.Schema.Types.ObjectId,
    winningBid: Number,
    auctionEndTime: Date
  },
  // Delivery tracking reference
  deliveryTracking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryTracking'
  }
}, {
  timestamps: true
});

// Index for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ 'products.product': 1 });

// Virtual for order total
orderSchema.virtual('orderTotal').get(function() {
  return this.totalAmount + this.shippingCost + this.taxAmount - this.discountAmount;
});

// Static method to get user orders
orderSchema.statics.getUserOrders = function(userId) {
  return this.find({ user: userId })
    .populate('products.product', 'name images')
    .sort({ createdAt: -1 });
};

// Static method to get orders by status
orderSchema.statics.getOrdersByStatus = function(status) {
  return this.find({ status })
    .populate('user', 'name email')
    .populate('products.product', 'name images')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Order', orderSchema); 