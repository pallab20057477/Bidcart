const express = require('express');
const router = express.Router();
const {
  getWithdrawals,
  createWithdrawal,
  cancelWithdrawal,
  addPaymentMethod,
  getPaymentMethods,
  removePaymentMethod
} = require('../controllers/withdrawalController');
const { vendorAuth } = require('../middleware/auth');
const { validateWithdrawal, validatePaymentMethod } = require('../middleware/withdrawalValidation');

// Apply authentication middleware to all routes
router.use(vendorAuth);

// Withdrawal routes
router.route('/withdrawals')
  .get(getWithdrawals)
  .post(validateWithdrawal, createWithdrawal);

router.route('/withdrawals/:withdrawalId/cancel')
  .patch(cancelWithdrawal);

// Payment method routes
router.route('/payment-methods')
  .get(getPaymentMethods)
  .post(validatePaymentMethod, addPaymentMethod);

router.route('/payment-methods/:methodId')
  .delete(removePaymentMethod);

module.exports = router;