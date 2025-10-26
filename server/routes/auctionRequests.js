const express = require('express');
const router = express.Router();
const {
    createAuctionRequest,
    getAllAuctionRequests,
    getVendorAuctionRequests,
    getAuctionRequest,
    approveAuctionRequest,
    rejectAuctionRequest,
    updateAuctionRequest,
    deleteAuctionRequest,
    getAuctionRequestStats
} = require('../controllers/auctionRequestController');

const { auth, vendorAuth, adminAuth } = require('../middleware/auth');
const { validateAuctionRequest } = require('../middleware/validation');

// Test route
router.get('/test', auth, (req, res) => {
    console.log('🧪 Auction requests test route hit by user:', req.user._id);
    res.json({
        success: true,
        message: 'Auction requests API is working',
        user: req.user._id,
        timestamp: new Date()
    });
});

// Vendor routes
router.post('/', auth, createAuctionRequest);
router.get('/vendor', auth, getVendorAuctionRequests);
router.put('/:id', auth, updateAuctionRequest);
router.delete('/:id', auth, deleteAuctionRequest);

// Admin routes
router.get('/admin', adminAuth, getAllAuctionRequests);
router.get('/admin/stats', adminAuth, getAuctionRequestStats);
router.post('/:id/approve', adminAuth, approveAuctionRequest);
router.post('/:id/reject', adminAuth, rejectAuctionRequest);

// Shared routes (accessible by authenticated users)
router.get('/:id', auth, getAuctionRequest);

module.exports = router;