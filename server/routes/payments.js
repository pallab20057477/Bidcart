const express = require('express');
const crypto = require('crypto');
const { auth, adminAuth } = require('../middleware/auth');
const PaymentService = require('../services/paymentService');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');

const router = express.Router();

/**
 * Create payment order (Razorpay)
 * POST /api/payments/create-order
 */
router.post('/create-order', auth, async (req, res) => {
  try {
    const { orderId, amount, currency } = req.body;

    console.log('=== CREATE PAYMENT ORDER ===');
    console.log('Payment order request:', { orderId, amount, currency, userId: req.user._id });
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    if (!orderId || !amount) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Order ID and amount are required'
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Verify order belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      console.log('Unauthorized access:', { orderUser: order.user, requestUser: req.user._id });
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to order'
      });
    }

    // Check if payment already exists
    if (order.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    console.log('Creating Razorpay order for:', { orderId, amount, currency: currency || 'INR' });

    const result = await PaymentService.createRazorpayOrder(
      orderId,
      amount,
      currency || 'INR'
    );

    console.log('Razorpay order created successfully:', result.razorpayOrderId);

    res.json(result);
  } catch (error) {
    console.error('Error creating payment order:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Verify payment
 * POST /api/payments/verify
 */
router.post('/verify', auth, async (req, res) => {
  try {
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment details'
      });
    }

    // Verify signature
    const isValid = PaymentService.verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Process successful payment
    const result = await PaymentService.processSuccessfulPayment(orderId, {
      razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature
    });

    res.json(result);
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment'
    });
  }
});

/**
 * Handle payment failure
 * POST /api/payments/failed
 */
router.post('/failed', auth, async (req, res) => {
  try {
    const { orderId, error } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const result = await PaymentService.processFailedPayment(orderId, error || {});

    res.json(result);
  } catch (error) {
    console.error('Error handling payment failure:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process payment failure'
    });
  }
});

/**
 * Process refund (Admin only)
 * POST /api/payments/refund
 */
router.post('/refund', adminAuth, async (req, res) => {
  try {
    const { orderId, amount, reason } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and amount are required'
      });
    }

    const result = await PaymentService.processRefund(orderId, amount, reason);

    res.json(result);
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process refund'
    });
  }
});

/**
 * Get payment status
 * GET /api/payments/status/:paymentId
 */
router.get('/status/:paymentId', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const result = await PaymentService.getPaymentStatus(paymentId);

    res.json(result);
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment status'
    });
  }
});

/**
 * Get user transactions
 * GET /api/payments/transactions
 */
router.get('/transactions', auth, async (req, res) => {
  try {
    const { type, status, limit } = req.query;

    const transactions = await Transaction.getUserTransactions(req.user._id, {
      type,
      status,
      limit: parseInt(limit) || 50
    });

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch transactions'
    });
  }
});

/**
 * Process COD payment
 * POST /api/payments/cod
 */
router.post('/cod', auth, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const result = await PaymentService.processCODPayment(orderId);

    res.json(result);
  } catch (error) {
    console.error('Error processing COD payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process COD payment'
    });
  }
});

/**
 * Mark COD as collected (Admin/Delivery only)
 * POST /api/payments/cod/collected
 */
router.post('/cod/collected', adminAuth, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const result = await PaymentService.markCODCollected(orderId);

    res.json(result);
  } catch (error) {
    console.error('Error marking COD as collected:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark COD as collected'
    });
  }
});

/**
 * Test Razorpay connection
 * GET /api/payments/test
 */
router.get('/test', async (req, res) => {
  try {
    console.log('=== PAYMENT TEST ENDPOINT ===');
    
    // Check environment variables
    const envCheck = {
      RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
      keyIdValue: process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.substring(0, 10) + '...' : 'Not set'
    };
    
    console.log('Environment check:', envCheck);

    // Try to create a test order
    const mongoose = require('mongoose');
    const testOrderId = new mongoose.Types.ObjectId();
    console.log('Creating test order with ID:', testOrderId.toString());
    
    const result = await PaymentService.createRazorpayOrder(testOrderId.toString(), 1, 'INR');
    
    console.log('Test order result:', result);
    
    res.json({
      success: true,
      message: 'Payment service working correctly',
      environment: envCheck,
      testResult: result
    });
  } catch (error) {
    console.error('Payment test failed:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Payment test failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      environment: {
        RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
        RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET
      }
    });
  }
});

/**
 * Razorpay webhook
 * POST /api/payments/webhook
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        // Payment successful
        await PaymentService.processSuccessfulPayment(
          payload.payment.entity.notes.orderId,
          {
            paymentId: payload.payment.entity.id,
            razorpayOrderId: payload.payment.entity.order_id
          }
        );
        break;

      case 'payment.failed':
        // Payment failed
        await PaymentService.processFailedPayment(
          payload.payment.entity.notes.orderId,
          {
            code: payload.payment.entity.error_code,
            description: payload.payment.entity.error_description
          }
        );
        break;

      case 'refund.processed':
        // Refund processed
        console.log('Refund processed:', payload);
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

module.exports = router;
