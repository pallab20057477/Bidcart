const express = require('express');
const { adminAuth } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Admin dashboard overview
router.get('/dashboard', adminAuth, adminController.getDashboard);

// Get all users
router.get('/users', adminAuth, adminController.getAllUsers);

// Update user role
router.put('/users/:id/role', adminAuth, adminController.updateUserRole);

// Update user active status (Admin)
router.put('/users/:id/status', adminAuth, adminController.updateUserStatus);

// Admin: Create new user
router.post('/users/create', adminAuth, adminController.createUser);

// Delete user (Admin)
router.delete('/users/:id', adminAuth, adminController.deleteUser);

// Get admin activity logs
router.get('/users/:adminId/activity', adminAuth, adminController.getAdminActivityLogs);

// Get all orders
router.get('/orders', adminAuth, adminController.getAllOrders);

// Get daily order stats
router.get('/orders/daily-stats', adminAuth, adminController.getDailyOrderStats);

// Get active and upcoming auctions
router.get('/auctions/active', adminAuth, adminController.getActiveAndUpcomingAuctions);

// Get auction history
router.get('/auctions/history', adminAuth, adminController.getAuctionHistory);

// Get auction details
router.get('/auctions/:id', adminAuth, adminController.getAuctionDetails);

// Get auction bids
router.get('/auctions/:id/bids', adminAuth, adminController.getAuctionBids);

// End auction manually
router.post('/auctions/:id/end', adminAuth, adminController.endAuctionManually);

// Get order by id (admin)
router.get('/orders/:id', adminAuth, adminController.getAdminOrderById);

// Get sales analytics
router.get('/analytics/sales', adminAuth, adminController.getSalesAnalytics);

// Get auction analytics
router.get('/analytics/auctions', adminAuth, adminController.getAuctionAnalytics);

// Get product analytics
router.get('/analytics/products', adminAuth, adminController.getProductAnalytics);

// Get pending products
router.get('/products/pending', adminAuth, adminController.getPendingProducts);

// Approve product
router.post('/products/:id/approve', adminAuth, adminController.approveProduct);

// Reject product
router.post('/products/:id/reject', adminAuth, adminController.rejectProduct);

// Get all products
router.get('/products', adminAuth, adminController.getAllProducts);

// Update product
router.put('/products/:id', adminAuth, adminController.updateProduct);

// Delete product
router.delete('/products/:id', adminAuth, adminController.deleteProduct);

module.exports = router; 