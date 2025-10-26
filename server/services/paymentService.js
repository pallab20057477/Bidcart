const Razorpay = require('razorpay');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const notificationService = require('./notificationService');

// Check if Razorpay credentials are properly configured
const hasRazorpayCredentials = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;
const isTestMode = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_');

console.log('Razorpay Configuration:');
console.log('- Has credentials:', hasRazorpayCredentials);
console.log('- Test mode:', isTestMode);
if (hasRazorpayCredentials) {
  console.log('- Key ID:', process.env.RAZORPAY_KEY_ID?.substring(0, 15) + '...');
}

// Always initialize Razorpay if we have credentials (even test ones)
let razorpay = null;
if (hasRazorpayCredentials) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('✅ Razorpay initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Razorpay:', error.message);
  }
} else {
  console.warn('⚠️ Razorpay credentials not found. Using mock payment mode.');
}

class PaymentService {
  /**
   * Create Razorpay order
   */
  static async createRazorpayOrder(orderId, amount, currency = 'INR') {
    try {
      // Validate inputs
      if (!orderId || !amount || amount <= 0) {
        throw new Error('Invalid order ID or amount');
      }

      // If Razorpay is not configured, use mock mode
      if (!hasRazorpayCredentials || !razorpay) {
        return this.createMockOrder(orderId, amount, currency);
      }

      const options = {
        amount: Math.round(amount * 100), // Amount in paise
        currency,
        receipt: `order_${orderId}`,
        notes: {
          orderId: orderId.toString()
        }
      };

      console.log('Creating Razorpay order with options:', options);

      let razorpayOrder;
      try {
        razorpayOrder = await razorpay.orders.create(options);
        console.log('Razorpay order created successfully:', razorpayOrder.id);
      } catch (razorpayError) {
        // If Razorpay authentication fails, fall back to mock mode
        if (razorpayError.statusCode === 401 || razorpayError.error?.code === 'BAD_REQUEST_ERROR') {
          console.log('⚠️ Razorpay authentication failed, falling back to mock mode');
          console.log('💡 To use real payments, update your Razorpay credentials in .env');
          return this.createMockOrder(orderId, amount, currency);
        }
        throw razorpayError;
      }

      // Create transaction record
      const transaction = new Transaction({
        type: 'order_payment',
        order: orderId,
        amount,
        currency,
        paymentGateway: 'razorpay',
        gatewayTransactionId: razorpayOrder.id,
        status: 'pending',
        description: `Payment for order ${orderId}`
      });

      await transaction.save();

      return {
        success: true,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        transactionId: transaction.transactionId
      };
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);

      // Handle different types of errors safely
      const errorMessage = error.message || 'Unknown error';
      const errorDescription = error.error?.description || '';

      if (error.statusCode === 401 || errorMessage.includes('Authentication failed') || errorDescription.includes('Authentication failed')) {
        throw new Error('Razorpay authentication failed. Please check your API credentials.');
      } else if (errorMessage.includes('Invalid key') || errorMessage.includes('invalid')) {
        throw new Error('Razorpay credentials are invalid. Please check your API keys.');
      } else if (errorMessage.includes('network') || errorMessage.includes('ENOTFOUND')) {
        throw new Error('Network error connecting to Razorpay. Please try again.');
      } else {
        throw new Error(`Payment order creation failed: ${errorMessage}`);
      }
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  static verifyRazorpaySignature(orderId, paymentId, signature) {
    try {
      // If using mock mode, always return true for mock orders
      if (!hasRazorpayCredentials ||
        (typeof orderId === 'string' && orderId.includes('mock')) ||
        (typeof paymentId === 'string' && paymentId.includes('mock')) ||
        signature === 'mock_signature_test') {
        console.log('Mock mode: Skipping signature verification');
        return true;
      }

      if (!process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay key secret not configured');
      }

      const text = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  /**
   * Process successful payment
   */
  static async processSuccessfulPayment(orderId, paymentDetails) {
    try {
      const order = await Order.findById(orderId).populate('products.product user');
      if (!order) {
        throw new Error('Order not found');
      }

      console.log('🎉 Processing successful payment for order:', orderId);

      // Update order payment status
      order.paymentStatus = 'completed';
      order.paymentId = paymentDetails.paymentId;
      order.paidAt = new Date();

      if (order.status === 'pending') {
        order.status = 'confirmed';
      }

      await order.save();
      console.log('✅ Order status updated to confirmed and paid');

      // Update transaction
      const transaction = await Transaction.findOne({
        order: orderId,
        gatewayTransactionId: paymentDetails.razorpayOrderId
      });

      if (transaction) {
        await transaction.markAsCompleted(paymentDetails.paymentId, paymentDetails);
      }

      // Update product sales and vendor earnings
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product) {
          // Update product stats
          product.sales = (product.sales || 0) + item.quantity;
          product.totalRevenue = (product.totalRevenue || 0) + (item.price * item.quantity);
          await product.save();

          // Update vendor earnings
          if (product.vendor) {
            const vendor = await Vendor.findById(product.vendor);
            if (vendor) {
              const itemTotal = item.price * item.quantity;
              const commissionRate = vendor.commissionRate || 10; // Default 10% if not set
              const commission = itemTotal * (commissionRate / 100);
              const vendorEarning = itemTotal - commission;

              vendor.totalSales = (vendor.totalSales || 0) + item.quantity;
              vendor.totalEarnings = (vendor.totalEarnings || 0) + vendorEarning;
              await vendor.save();

              // Create commission transaction
              const commissionTransaction = new Transaction({
                type: 'commission',
                order: orderId,
                vendor: vendor._id,
                amount: commission,
                currency: order.currency || 'INR',
                paymentGateway: 'manual',
                status: 'completed',
                description: `Commission for order ${orderId}`,
                completedAt: new Date()
              });
              await commissionTransaction.save();
            }
          }
        }
      }

      console.log('🔔 Sending payment notifications...');

      // Send real-time notification to admin dashboard
      await this.notifyAdminPaymentConfirmed(order, paymentDetails);

      // Send confirmation email/notification to customer
      await this.notifyCustomerPaymentSuccess(order, paymentDetails);

      console.log('✅ Payment notifications sent successfully');

      console.log('🎉 Payment processing completed successfully');

      return {
        success: true,
        order,
        message: 'Payment processed successfully',
        paymentConfirmed: true,
        orderStatus: order.status,
        paymentStatus: order.paymentStatus
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Process failed payment
   */
  static async processFailedPayment(orderId, errorDetails) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      order.paymentStatus = 'failed';
      await order.save();

      // Update transaction
      const transaction = await Transaction.findOne({
        order: orderId,
        status: 'pending'
      });

      if (transaction) {
        await transaction.markAsFailed(
          errorDetails.code || 'PAYMENT_FAILED',
          errorDetails.description || 'Payment failed'
        );
      }

      return {
        success: true,
        message: 'Payment failure recorded'
      };
    } catch (error) {
      console.error('Error processing failed payment:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  static async processRefund(orderId, amount, reason) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.paymentStatus !== 'completed') {
        throw new Error('Cannot refund unpaid order');
      }

      // Create refund with Razorpay
      const refund = await razorpay.payments.refund(order.paymentId, {
        amount: Math.round(amount * 100), // Amount in paise
        notes: {
          orderId: orderId.toString(),
          reason
        }
      });

      // Update order
      order.paymentStatus = 'refunded';
      order.status = 'refunded';
      await order.save();

      // Create refund transaction
      const transaction = new Transaction({
        type: 'refund',
        order: orderId,
        user: order.user,
        amount,
        currency: order.currency || 'INR',
        paymentGateway: 'razorpay',
        gatewayTransactionId: refund.id,
        status: 'completed',
        description: `Refund for order ${orderId}: ${reason}`,
        completedAt: new Date()
      });
      await transaction.save();

      // Reverse vendor earnings
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product && product.vendor) {
          const vendor = await Vendor.findById(product.vendor);
          if (vendor) {
            const itemTotal = item.price * item.quantity;
            const commissionRate = vendor.commissionRate || 10; // Default 10% if not set
            const commission = itemTotal * (commissionRate / 100);
            const vendorEarning = itemTotal - commission;

            vendor.totalEarnings = Math.max(0, (vendor.totalEarnings || 0) - vendorEarning);
            await vendor.save();
          }
        }
      }

      return {
        success: true,
        refund,
        transaction,
        message: 'Refund processed successfully'
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  static async getPaymentStatus(paymentId) {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return {
        success: true,
        payment
      };
    } catch (error) {
      console.error('Error fetching payment status:', error);
      throw error;
    }
  }

  /**
   * Process COD payment
   */
  static async processCODPayment(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Create transaction record
      const transaction = new Transaction({
        type: 'order_payment',
        order: orderId,
        user: order.user,
        amount: order.totalAmount,
        currency: 'INR',
        paymentGateway: 'cod',
        status: 'pending',
        description: `COD payment for order ${orderId}`
      });
      await transaction.save();

      return {
        success: true,
        transaction,
        message: 'COD order created successfully'
      };
    } catch (error) {
      console.error('Error processing COD payment:', error);
      throw error;
    }
  }

  /**
   * Mark COD as collected
   */
  static async markCODCollected(orderId) {
    try {
      const order = await Order.findById(orderId).populate('products.product');
      if (!order) {
        throw new Error('Order not found');
      }

      order.paymentStatus = 'completed';
      await order.save();

      // Update transaction
      const transaction = await Transaction.findOne({
        order: orderId,
        paymentGateway: 'cod'
      });

      if (transaction) {
        await transaction.markAsCompleted();
      }

      // Update vendor earnings (same as online payment)
      await this.processSuccessfulPayment(orderId, { paymentId: 'COD' });

      return {
        success: true,
        message: 'COD payment marked as collected'
      };
    } catch (error) {
      console.error('Error marking COD as collected:', error);
      throw error;
    }
  }
  /**
   * Notify admin dashboard of payment confirmation
   */
  static async notifyAdminPaymentConfirmed(order, paymentDetails) {
    try {
      console.log('📢 Sending admin notification for payment confirmation');
      console.log('Order data:', {
        id: order._id,
        user: order.user?.name,
        amount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus
      });

      const notificationData = {
        orderId: order._id,
        orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
        customerName: order.user?.name || 'Unknown Customer',
        customerEmail: order.user?.email,
        amount: order.totalAmount,
        currency: order.currency || 'INR',
        paymentId: paymentDetails.paymentId,
        paidAt: order.paidAt,
        products: order.products.map(item => ({
          name: item.product?.name || 'Unknown Product',
          quantity: item.quantity,
          price: item.price
        }))
      };

      // Send real-time notification to admin dashboard
      const notification = notificationService.notifyPaymentConfirmed(notificationData);

      console.log('🔔 Admin notification sent:', notification.id);

      // Also update order with notification flag
      await Order.findByIdAndUpdate(order._id, {
        $set: {
          adminNotified: true,
          adminNotifiedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error sending admin notification:', error);
      // Don't throw error as this shouldn't fail the payment process
    }
  }

  /**
   * Notify customer of payment success
   */
  static async notifyCustomerPaymentSuccess(order, paymentDetails) {
    try {
      console.log('📧 Sending customer confirmation for payment success');

      const customerNotification = {
        type: 'PAYMENT_SUCCESS',
        orderId: order._id,
        customerEmail: order.user?.email,
        customerName: order.user?.name,
        amount: order.totalAmount,
        currency: order.currency || 'INR',
        orderStatus: order.status,
        estimatedDelivery: this.calculateEstimatedDelivery(),
        trackingInfo: {
          status: 'confirmed',
          message: 'Your payment has been confirmed and order is being processed'
        }
      };

      console.log('✉️ Customer Notification:', JSON.stringify(customerNotification, null, 2));

      // Here you would send email, SMS, push notification, etc.
      // await this.sendCustomerEmail(customerNotification);

    } catch (error) {
      console.error('Error sending customer notification:', error);
      // Don't throw error as this shouldn't fail the payment process
    }
  }

  /**
   * Calculate estimated delivery date
   */
  static calculateEstimatedDelivery() {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7); // 7 days from now
    return deliveryDate;
  }

  /**
   * Create mock order for testing
   */
  static async createMockOrder(orderId, amount, currency = 'INR') {
    console.log('Creating mock payment order');

    // Generate a mock order ID that looks like Razorpay format
    const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create transaction record with valid enum value
    const mongoose = require('mongoose');
    const mockTransactionId = `PAY${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const transaction = new Transaction({
      transactionId: mockTransactionId,
      type: 'order_payment',
      order: new mongoose.Types.ObjectId(orderId),
      amount,
      currency,
      paymentGateway: 'manual', // Use 'manual' (valid enum value)
      gatewayTransactionId: mockOrderId,
      status: 'pending',
      description: `Mock payment for order ${orderId}`
    });

    await transaction.save();

    return {
      success: true,
      razorpayOrderId: mockOrderId,
      amount: Math.round(amount * 100),
      currency,
      transactionId: transaction.transactionId,
      isMock: true,
      showRazorpayForm: true // This will show the Razorpay form even in mock mode
    };
  }
}

module.exports = PaymentService;
