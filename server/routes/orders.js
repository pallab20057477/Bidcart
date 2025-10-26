const express = require('express');
const { auth } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

const router = express.Router();

// Create order (checkout)
router.post('/', auth, orderController.createOrder);

// Get user orders
router.get('/user', auth, orderController.getUserOrders);

// Get single order
router.get('/:id', auth, orderController.getOrderById);

// Update order status (Admin only)
router.put('/:id/status', auth, orderController.updateOrderStatus);

// Update payment status
router.put('/:id/payment', auth, orderController.updatePaymentStatus);

// Update payment status (Admin only)
router.put('/:id/payment-status', auth, orderController.updatePaymentStatusAdmin);

// Cancel order
router.put('/:id/cancel', auth, orderController.cancelOrder);

// Get order statistics (Admin only)
router.get('/stats/overview', auth, orderController.getOrderStatsOverview);

module.exports = router; 