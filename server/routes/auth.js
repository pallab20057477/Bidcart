const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const Vendor = require('../models/Vendor');
const authController = require('../controllers/authController');

const router = express.Router();

// Register user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Get user profile
router.get('/profile', auth, authController.getProfile);

// Update user profile
router.put('/profile', auth, authController.updateProfile);

// Change password
router.put('/change-password', auth, authController.changePassword);

// Search users (Admin only)
router.get('/search', auth, authController.searchUsers);

// Get current user
router.get('/me', auth, authController.getMe);

// Get vendor status for current user
router.get('/vendor-status', auth, authController.getVendorStatus);

module.exports = router; 