const { body, validationResult } = require('express-validator');

const validateAuctionRequest = [
    body('productId')
        .notEmpty()
        .withMessage('Product ID is required')
        .isMongoId()
        .withMessage('Invalid product ID'),
    
    body('requestedStartTime')
        .notEmpty()
        .withMessage('Start time is required')
        .isISO8601()
        .withMessage('Invalid start time format'),
    
    body('requestedEndTime')
        .notEmpty()
        .withMessage('End time is required')
        .isISO8601()
        .withMessage('Invalid end time format'),
    
    body('startingBid')
        .notEmpty()
        .withMessage('Starting bid is required')
        .isFloat({ min: 0.01 })
        .withMessage('Starting bid must be greater than 0'),
    
    body('minBidIncrement')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Minimum bid increment must be greater than 0'),
    
    body('reservePrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Reserve price must be non-negative'),
    
    body('buyNowPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Buy now price must be non-negative'),
    
    body('justification')
        .notEmpty()
        .withMessage('Justification is required')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Justification must be between 10 and 1000 characters'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = {
    validateAuctionRequest
};