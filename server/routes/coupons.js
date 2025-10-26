const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const couponController = require('../controllers/couponController');

const router = express.Router();

// Get all coupons (Admin only)
router.get('/admin', adminAuth, couponController.getAllCoupons);

// Create coupon (Admin only)
router.post('/admin', adminAuth, couponController.createCoupon);

// Update coupon (Admin only)
router.put('/admin/:id', adminAuth, couponController.updateCoupon);

// Delete coupon (Admin only)
router.delete('/admin/:id', adminAuth, couponController.deleteCoupon);

// Validate and apply coupon
router.post('/validate', auth, couponController.validateAndApplyCoupon);

// Get user's coupon usage history
router.get('/history', auth, couponController.getUserCouponHistory);

// Get coupon statistics (Admin only)
router.get('/admin/stats', adminAuth, couponController.getCouponStats);

module.exports = router; 