const express = require('express');
const { auth, adminAuth, vendorAuth } = require('../middleware/auth');
const deliveryController = require('../controllers/deliveryController');

const router = express.Router();

// Create delivery tracking for an order
router.post('/create', adminAuth, deliveryController.createDeliveryTracking);

// Get tracking information by tracking number
router.get('/track/:trackingNumber', deliveryController.getTrackingByNumber);

// Get tracking information by order ID
router.get('/order/:orderId', auth, deliveryController.getTrackingByOrderId);

// Update delivery status (Admin/Vendor)
router.put('/update/:trackingNumber', adminAuth, deliveryController.updateDeliveryStatus);

// Get user's delivery tracking history
router.get('/user/history', auth, deliveryController.getUserDeliveryHistory);

// Get vendor's delivery tracking (for vendor orders)
router.get('/vendor/history', vendorAuth, deliveryController.getVendorDeliveryHistory);

// Admin: Get all delivery tracking
router.get('/admin/all', adminAuth, deliveryController.getAllDeliveries);

// Admin: Get delivery statistics
router.get('/admin/stats', adminAuth, deliveryController.getDeliveryStats);

// Simulate delivery updates (for testing/demo purposes)
router.post('/simulate-update/:trackingNumber', adminAuth, deliveryController.simulateDeliveryUpdate);

module.exports = router; 