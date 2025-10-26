const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const disputeController = require('../controllers/disputeController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/disputes';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, PDF, and document files are allowed'));
    }
  }
});

// Admin routes (must come before parameterized routes)
// @route   GET /api/disputes/admin/all
router.get('/admin/all', adminAuth, disputeController.getAllDisputesAdmin);

// @route   GET /api/disputes/admin/stats
router.get('/admin/stats', adminAuth, disputeController.getDisputeStats);

// @route   POST /api/disputes
router.post('/', auth, upload.array('evidence', 10), disputeController.createDispute);

// @route   GET /api/disputes
router.get('/', auth, disputeController.getUserDisputes);

// @route   GET /api/disputes/by-orders
router.get('/by-orders', auth, disputeController.getDisputesByOrders);

// @route   GET /api/disputes/:id
router.get('/:id', auth, disputeController.getDisputeById);

// @route   POST /api/disputes/:id/messages
router.post('/:id/messages', auth, disputeController.addDisputeMessage);

// @route   POST /api/disputes/:id/evidence
router.post('/:id/evidence', auth, disputeController.addDisputeEvidence);

// @route   PUT /api/disputes/:id/status
router.put('/:id/status', adminAuth, disputeController.updateDisputeStatus);

// @route   PUT /api/disputes/:id/resolve
router.put('/:id/resolve', adminAuth, disputeController.resolveDispute);

// @route   PUT /api/disputes/:id/escalate
router.put('/:id/escalate', adminAuth, disputeController.escalateDispute);

// @route   PUT /api/disputes/:id/assign-respondent
router.put('/:id/assign-respondent', adminAuth, disputeController.assignRespondent);

// @route   DELETE /api/disputes/:id
router.delete('/:id', adminAuth, disputeController.deleteDispute);

module.exports = router; 