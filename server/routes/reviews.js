const express = require('express');
const { auth } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// POST /api/reviews - Submit a new review
router.post('/', auth, reviewController.submitReview);

// GET /api/reviews/product/:productId - Get all reviews for a product
router.get('/product/:productId', reviewController.getProductReviews);

// GET /api/reviews/check-eligibility/:productId - Check if user can review product
router.get('/check-eligibility/:productId', auth, reviewController.checkReviewEligibility);

// GET /api/reviews/user/my-reviews - Get user's own reviews
router.get('/user/my-reviews', auth, reviewController.getUserReviews);

// POST /api/reviews/:reviewId/helpful - Mark review as helpful
router.post('/:reviewId/helpful', auth, reviewController.markReviewHelpful);

module.exports = router; 