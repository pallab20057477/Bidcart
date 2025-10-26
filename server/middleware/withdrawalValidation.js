const { body, validationResult } = require('express-validator');

// Validation for withdrawal creation
const validateWithdrawal = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number')
    .custom((value) => {
      if (value < 10) {
        throw new Error('Minimum withdrawal amount is $10');
      }
      if (value > 50000) {
        throw new Error('Maximum withdrawal amount is $50,000');
      }
      return true;
    }),
  
  body('paymentMethodId')
    .isMongoId()
    .withMessage('Valid payment method ID is required'),
  
  body('note')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters')
    .trim(),

  // Check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation for payment method creation
const validatePaymentMethod = [
  body('type')
    .isIn(['bank', 'paypal', 'stripe', 'wise'])
    .withMessage('Invalid payment method type'),
  
  body('accountName')
    .notEmpty()
    .withMessage('Account name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Account name must be between 2 and 100 characters')
    .trim(),

  // Bank account validation
  body('accountNumber')
    .if(body('type').equals('bank'))
    .notEmpty()
    .withMessage('Account number is required for bank accounts')
    .isLength({ min: 8, max: 20 })
    .withMessage('Account number must be between 8 and 20 digits')
    .isNumeric()
    .withMessage('Account number must contain only numbers'),

  body('bankName')
    .if(body('type').equals('bank'))
    .notEmpty()
    .withMessage('Bank name is required for bank accounts')
    .isLength({ min: 2, max: 100 })
    .withMessage('Bank name must be between 2 and 100 characters')
    .trim(),

  body('routingNumber')
    .if(body('type').equals('bank'))
    .notEmpty()
    .withMessage('Routing number is required for bank accounts')
    .isLength({ min: 9, max: 9 })
    .withMessage('Routing number must be exactly 9 digits')
    .isNumeric()
    .withMessage('Routing number must contain only numbers'),

  body('swiftCode')
    .optional()
    .isLength({ min: 8, max: 11 })
    .withMessage('SWIFT code must be between 8 and 11 characters')
    .isAlphanumeric()
    .withMessage('SWIFT code must contain only letters and numbers')
    .toUpperCase(),

  // PayPal validation
  body('paypalEmail')
    .if(body('type').equals('paypal'))
    .notEmpty()
    .withMessage('PayPal email is required for PayPal accounts')
    .isEmail()
    .withMessage('Valid PayPal email is required')
    .normalizeEmail(),

  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean value'),

  // Check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation for withdrawal cancellation
const validateWithdrawalCancellation = [
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Cancellation reason cannot exceed 200 characters')
    .trim(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateWithdrawal,
  validatePaymentMethod,
  validateWithdrawalCancellation
};