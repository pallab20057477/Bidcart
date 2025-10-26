const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');
const featureController = require('../controllers/featureController');
const router = express.Router();

// POST /api/features - Admin creates a new feature
router.post(
  '/',
  auth,
  admin,
  body('title').isString().trim().isLength({ min: 1, max: 100 }),
  body('description').isString().trim().isLength({ min: 1, max: 1000 }),
  body('date').isISO8601().toDate(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    featureController.createFeature(req, res);
  }
);

// GET /api/features - Get all features (optionally filter by date)
router.get('/', featureController.getAllFeatures);

module.exports = router; 