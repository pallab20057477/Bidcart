const express = require('express');
const { auth } = require('../middleware/auth');
const bidController = require('../controllers/bidController');

const router = express.Router();

// Place a bid
router.post('/', auth, bidController.placeBid);

// Get bid history for a product
router.get('/product/:productId', bidController.getProductBidHistory);

// Get user's bid history
router.get('/user', auth, bidController.getUserBidHistory);

// Get current highest bid for a product
router.get('/highest/:productId', bidController.getHighestBid);

// End auction (Admin only or seller)
router.post('/end-auction/:productId', auth, bidController.endAuction);

// Get user's active bids
router.get('/user/active', auth, bidController.getUserActiveBids);

module.exports = router; 