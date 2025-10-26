const Withdrawal = require('../models/Withdrawal');
const PaymentMethod = require('../models/PaymentMethod');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ErrorHandler = require('../middleware/errorHandler');

// Get vendor withdrawals and balance
const getWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, dateRange, search } = req.query;
    const vendor = await Vendor.findOne({ user: req.user._id });
    
    if (!vendor) {
      throw ErrorHandler.createBusinessError('Vendor account not found', 404);
    }

    // Build query
    const query = { vendor: vendor._id };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (dateRange) {
      const days = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      query.createdAt = { $gte: startDate };
    }
    
    if (search) {
      query.$or = [
        { 'paymentMethod.accountName': { $regex: search, $options: 'i' } },
        { note: { $regex: search, $options: 'i' } }
      ];
    }

    // Get withdrawals with pagination
    const withdrawals = await Withdrawal.find(query)
      .populate('paymentMethod')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Withdrawal.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get payment methods
    const paymentMethods = await PaymentMethod.find({ vendor: vendor._id, isActive: true });

    // Get real earnings data from the same source as earnings controller
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id name price');
    const productIds = vendorProducts.map(p => p._id);
    
    // Get real earnings from orders
    const earningsAggregation = await Order.aggregate([
      { 
        $match: { 
          'products.product': { $in: productIds }, 
          createdAt: { $gte: startDate }, 
          paymentStatus: 'completed' 
        } 
      },
      { 
        $group: { 
          _id: null,
          totalEarnings: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 }
        } 
      }
    ]);
    
    const realEarnings = earningsAggregation[0] || { totalEarnings: 0, totalOrders: 0 };
    const totalEarnings = realEarnings.totalEarnings;
    const commissionRate = vendor.commissionRate || 15; // Default 15% commission (same as earnings)
    
    // Calculate net earnings after commission
    const netEarnings = totalEarnings * (1 - commissionRate / 100);
    
    // Production: Debug logs removed
    
    const totalWithdrawn = await Withdrawal.aggregate([
      { $match: { vendor: vendor._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingWithdrawals = await Withdrawal.aggregate([
      { $match: { vendor: vendor._id, status: { $in: ['pending', 'processing'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const successfulWithdrawals = await Withdrawal.countDocuments({
      vendor: vendor._id,
      status: 'completed'
    });

    const balance = {
      total: totalEarnings, // Total earnings before commission
      netEarnings: netEarnings, // Earnings after platform commission
      available: Math.max(0, netEarnings - (totalWithdrawn[0]?.total || 0) - (pendingWithdrawals[0]?.total || 0)), // Available = Net earnings - Already withdrawn - Pending withdrawals
      pending: pendingWithdrawals[0]?.total || 0,
      minimumWithdrawal: 10, // Configure this
      commissionRate: commissionRate
    };

    // Production: Debug logs removed

    const statistics = {
      totalWithdrawn: totalWithdrawn[0]?.total || 0,
      successfulWithdrawals,
      averageAmount: successfulWithdrawals > 0 ? (totalWithdrawn[0]?.total || 0) / successfulWithdrawals : 0,
      lastWithdrawal: withdrawals[0]?.createdAt || null
    };

    const responseData = {
      success: true,
      data: {
        balance,
        withdrawals,
        paymentMethods,
        statistics
      },
      pagination: {
        currentPage: page,
        totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch withdrawals'
    });
  }
};

// Create withdrawal request
const createWithdrawal = async (req, res) => {
  try {
    const { amount, paymentMethodId, note } = req.body;
    const vendor = await Vendor.findOne({ user: req.user._id });
    
    if (!vendor) {
      throw ErrorHandler.createBusinessError('Vendor account not found', 404);
    }

    // Validate amount
    if (!amount || amount <= 0) {
      throw ErrorHandler.createBusinessError('Invalid withdrawal amount', 400);
    }

    const minimumWithdrawal = 10; // Configure this
    if (amount < minimumWithdrawal) {
      throw ErrorHandler.createBusinessError(`Minimum withdrawal amount is $${minimumWithdrawal}`, 400);
    }

    // Check available balance (use net earnings after commission)
    const commissionRate = vendor.commissionRate || 15;
    let netEarnings = vendor.netEarnings;
    if (netEarnings === undefined || netEarnings === null) {
      netEarnings = (vendor.totalEarnings || 0) * (1 - commissionRate / 100);
    }
    
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

    // Validate payment method
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      vendor: vendor._id,
      isActive: true
    });

    if (!paymentMethod) {
      throw ErrorHandler.createBusinessError('Invalid payment method', 400);
    }

    // Calculate processing fee (example: 2% or $2, whichever is higher)
    const processingFee = Math.max(amount * 0.02, 2);
    const netAmount = amount - processingFee;

    // Create withdrawal
    const withdrawal = new Withdrawal({
      vendor: vendor._id,
      amount,
      processingFee,
      netAmount,
      paymentMethod: paymentMethodId,
      note,
      status: 'pending'
    });

    await withdrawal.save();

    // Populate payment method for response
    await withdrawal.populate('paymentMethod');

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully',
      withdrawal
    });
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create withdrawal'
    });
  }
};

// Cancel withdrawal
const cancelWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const vendor = await Vendor.findOne({ user: req.user._id });
    
    if (!vendor) {
      throw ErrorHandler.createBusinessError('Vendor account not found', 404);
    }

    const withdrawal = await Withdrawal.findOne({
      _id: withdrawalId,
      vendor: vendor._id,
      status: 'pending'
    });

    if (!withdrawal) {
      throw ErrorHandler.createBusinessError('Withdrawal not found or cannot be cancelled', 404);
    }

    withdrawal.status = 'cancelled';
    withdrawal.cancelledAt = new Date();
    await withdrawal.save();

    res.json({
      success: true,
      message: 'Withdrawal cancelled successfully',
      withdrawal
    });
  } catch (error) {
    console.error('Error cancelling withdrawal:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to cancel withdrawal'
    });
  }
};

// Add payment method
const addPaymentMethod = async (req, res) => {
  try {
    const { type, accountName, accountNumber, bankName, routingNumber, swiftCode, paypalEmail, isDefault } = req.body;
    const vendor = await Vendor.findOne({ user: req.user._id });
    
    if (!vendor) {
      throw ErrorHandler.createBusinessError('Vendor account not found', 404);
    }

    // Validate required fields based on type
    if (type === 'bank') {
      if (!accountName || !accountNumber || !bankName || !routingNumber) {
        throw ErrorHandler.createBusinessError('Missing required bank account information', 400);
      }
    } else if (type === 'paypal') {
      if (!paypalEmail) {
        throw ErrorHandler.createBusinessError('PayPal email is required', 400);
      }
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await PaymentMethod.updateMany(
        { vendor: vendor._id },
        { isDefault: false }
      );
    }

    const paymentMethod = new PaymentMethod({
      vendor: vendor._id,
      type,
      accountName,
      accountNumber,
      bankName,
      routingNumber,
      swiftCode,
      paypalEmail,
      isDefault
    });

    await paymentMethod.save();

    res.status(201).json({
      success: true,
      message: 'Payment method added successfully',
      paymentMethod
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to add payment method'
    });
  }
};

// Get payment methods
const getPaymentMethods = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    
    if (!vendor) {
      throw ErrorHandler.createBusinessError('Vendor account not found', 404);
    }

    const paymentMethods = await PaymentMethod.find({
      vendor: vendor._id,
      isActive: true
    }).sort({ isDefault: -1, createdAt: -1 });

    res.json({
      success: true,
      paymentMethods
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment methods'
    });
  }
};

// Remove payment method
const removePaymentMethod = async (req, res) => {
  try {
    const { methodId } = req.params;
    const vendor = await Vendor.findOne({ user: req.user._id });
    
    if (!vendor) {
      throw ErrorHandler.createBusinessError('Vendor account not found', 404);
    }

    const paymentMethod = await PaymentMethod.findOne({
      _id: methodId,
      vendor: vendor._id
    });

    if (!paymentMethod) {
      throw ErrorHandler.createBusinessError('Payment method not found', 404);
    }

    // Check if there are pending withdrawals using this method
    const pendingWithdrawals = await Withdrawal.countDocuments({
      paymentMethod: methodId,
      status: { $in: ['pending', 'processing'] }
    });

    if (pendingWithdrawals > 0) {
      throw ErrorHandler.createBusinessError('Cannot remove payment method with pending withdrawals', 400);
    }

    paymentMethod.isActive = false;
    await paymentMethod.save();

    res.json({
      success: true,
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    console.error('Error removing payment method:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to remove payment method'
    });
  }
};

module.exports = {
  getWithdrawals,
  createWithdrawal,
  cancelWithdrawal,
  addPaymentMethod,
  getPaymentMethods,
  removePaymentMethod
};