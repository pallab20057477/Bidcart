const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const admin = require('../middleware/admin');
const productController = require('../controllers/productController');

const router = express.Router();

// Get all products with filters
router.get('/', productController.getAllProducts);

// Get single product
router.get('/:id', productController.getProductById);

// Create product (Admin only)
router.post('/', adminAuth, productController.createProduct);

// Admin: Create product
router.post('/admin/create', adminAuth, productController.createProductAdmin);

// Update product (Admin only)
router.put('/:id', adminAuth, productController.updateProduct);

// Delete product (Admin only)
router.delete('/:id', adminAuth, productController.deleteProduct);

// Get featured products
router.get('/featured/featured', productController.getFeaturedProducts);

// Get active auctions
router.get('/auctions/active', productController.getActiveAuctions);

// Get scheduled/upcoming auctions
router.get('/auctions/scheduled', productController.getScheduledAuctions);

// Get upcoming auctions (starting within 1 hour)
router.get('/auctions/upcoming', productController.getUpcomingAuctions);

// Get auction statistics
router.get('/auctions/stats', productController.getAuctionStats);

// Schedule auction (Admin only)
router.post('/auctions/schedule', adminAuth, productController.scheduleAuction);

// Start auction manually (Admin only)
router.post('/auctions/:id/start', adminAuth, productController.startAuctionManually);

// End auction manually (Admin only)
router.post('/auctions/:id/end', adminAuth, productController.endAuctionManually);

// POST /api/products/auction - Admin creates auction product
router.post(
  '/auction',
  auth,
  admin,
  [
    body('name').isString().trim().isLength({ min: 1, max: 100 }),
    body('description').isString().trim().isLength({ min: 1, max: 2000 }),
    body('price').isFloat({ min: 0 }),
    body('category').isString().trim().notEmpty(),
    body('images').isArray({ min: 1 }),
    body('images.*').isString().notEmpty(),
    body('auction.startTime').isISO8601().toDate(),
    body('auction.endTime').isISO8601().toDate(),
    body('auction.startingBid').isFloat({ min: 0 }),
    body('auction.minBidIncrement').optional().isInt({ min: 1 })
  ],
  (req, res) => productController.createAuctionProduct(req, res)
);

// Get categories
router.get('/categories/list', productController.getCategoriesList);

module.exports = router; 