const Withdrawal = require('../models/Withdrawal');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ErrorHandler = require('../middleware/errorHandler');

// Create withdrawal request with Razorpay
const createRazorpayWithdrawal = async (req, res) => {
  try {
    const { amount, bankDetails, note } = req.body;
    const vendor = await Vendor.findOne({ user: req.user._id });
    
    if (!vendor) {
      throw ErrorHandler.createBusinessError('Vendor account not found', 404);
    }

    // Validate amount
    if (!amount || amount <= 0) {
      throw ErrorHandler.createBusinessError('Invalid withdrawal amount', 400);
    }

    const minimumWithdrawal = 10;
    if (amount < minimumWithdrawal) {
      throw ErrorHandler.createBusinessError(`Minimum withdrawal amount is $${minimumWithdrawal}`, 400);
    }

    // Validate bank details for Razorpay transfer
    if (!bankDetails || !bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.bankName) {
      throw ErrorHandler.createBusinessError('Complete bank details are required for Razorpay transfer', 400);
    }

    // Validate IFSC code format
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(bankDetails.ifscCode)) {
      throw ErrorHandler.createBusinessError('Invalid IFSC code format', 400);
    }

    // Get real earnings data
    const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
    const productIds = vendorProducts.map(p => p._id);
    
    // Get real earnings from orders
    const earningsAggregation = await Order.aggregate([
      { 
        $match: { 
          'products.product': { $in: productIds }, 
          paymentStatus: 'completed' 
        } 
      },
      { 
        $group: { 
          _id: null,
          totalEarnings: { $sum: '$totalAmount' }
        } 
      }
    ]);
    
    const realEarnings = earningsAggregation[0] || { totalEarnings: 0 };
    const totalEarnings = realEarnings.totalEarnings;
    const commissionRate = vendor.commissionRate || 15;
    const netEarnings = totalEarnings * (1 - commissionRate / 100);
    
    const totalWithdrawn = await Withdrawal.aggregate([
      { $match: { vendor: vendor._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingWithdrawals = await Withdrawal.aggregate([
      { $match: { vendor: vendor._id, status: { $in: ['pending', 'processing'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const availableBalance = Math.max(0, netEarnings - (totalWithdrawn[0]?.total || 0) - (pendingWithdrawals[0]?.total || 0));

    if (amount > availableBalance) {
      throw ErrorHandler.createBusinessError('Insufficient balance for withdrawal', 400);
    }

    // Calculate processing fee (Razorpay charges: 2% or $2, whichever is higher)
    const processingFee = Math.max(amount * 0.02, 2);
    const netAmount = amount - processingFee;

    // Create withdrawal with Razorpay details
    const withdrawal = new Withdrawal({
      vendor: vendor._id,
      amount,
      processingFee,
      netAmount,
      bankDetails: {
        accountHolderName: bankDetails.accountHolderName,
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode.toUpperCase(),
        bankName: bankDetails.bankName
      },
      transferMethod: 'razorpay',
      note,
      status: 'pending'
    });

    await withdrawal.save();

    // TODO: Integrate with Razorpay Payout API for automatic transfers
    // const razorpayTransfer = await initiateRazorpayTransfer(withdrawal);

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully! Funds will be transferred via Razorpay within 24 hours.',
      withdrawal: {
        _id: withdrawal._id,
        amount: withdrawal.amount,
        netAmount: withdrawal.netAmount,
        processingFee: withdrawal.processingFee,
        status: withdrawal.status,
        transferMethod: withdrawal.transferMethod,
        bankDetails: {
          accountHolderName: withdrawal.bankDetails.accountHolderName,
          bankName: withdrawal.bankDetails.bankName,
          accountNumber: `****${withdrawal.bankDetails.accountNumber.slice(-4)}`
        },
        createdAt: withdrawal.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating Razorpay withdrawal:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create withdrawal'
    });
  }
};

module.exports = {
  createRazorpayWithdrawal
};