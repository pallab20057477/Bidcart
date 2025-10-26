const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const vendorRequestController = require('../controllers/vendorRequestController');
const router = express.Router();

// Submit vendor request
router.post('/', auth, vendorRequestController.submitVendorRequest);

// Get user's own vendor request
router.get('/my-request', auth, vendorRequestController.getMyVendorRequest);

// Debug route to check vendor requests data
router.get('/debug/all', adminAuth, vendorRequestController.debugAllVendorRequests);

// Admin: Get all vendor requests
router.get('/', adminAuth, vendorRequestController.getAllVendorRequests);

// Admin: Get vendor request by ID
router.get('/:id', adminAuth, vendorRequestController.getVendorRequestById);

// Admin: Approve vendor request
router.put('/:id/approve', adminAuth, vendorRequestController.approveVendorRequest);

// Admin: Reject vendor request
router.put('/:id/reject', adminAuth, vendorRequestController.rejectVendorRequest);

// Get vendor request statistics overview
router.get('/stats/overview', vendorRequestController.getVendorRequestStatsOverview);

module.exports = router; 