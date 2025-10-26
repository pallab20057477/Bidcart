const Coupon = require('../models/Coupon');

const getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = {};
    if (status === 'active') {
      filter.isActive = true;
      filter.validFrom = { $lte: new Date() };
      filter.validUntil = { $gte: new Date() };
    } else if (status === 'expired') {
      filter.validUntil = { $lt: new Date() };
    } else if (status === 'upcoming') {
      filter.validFrom = { $gt: new Date() };
    }
    const coupons = await Coupon.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Coupon.countDocuments(filter);
    res.json({
      coupons,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createCoupon = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      userUsageLimit,
      validFrom,
      validUntil,
      applicableCategories,
      applicableProducts,
      excludedProducts
    } = req.body;
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    const coupon = new Coupon({
      code: code.toUpperCase(),
      name,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      userUsageLimit,
      validFrom,
      validUntil,
      applicableCategories,
      applicableProducts,
      excludedProducts,
      createdBy: req.user._id
    });
    await coupon.save();
    res.status(201).json({
      message: 'Coupon created successfully',
      coupon
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    const updateFields = req.body;
    Object.keys(updateFields).forEach(key => {
      if (key !== '_id' && key !== 'createdBy') {
        coupon[key] = updateFields[key];
      }
    });
    await coupon.save();
    res.json({
      message: 'Coupon updated successfully',
      coupon
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const validateAndApplyCoupon = async (req, res) => {
  try {
    const { code, orderAmount, products } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }
    if (!coupon.isValid()) {
      return res.status(400).json({ message: 'Coupon is not valid or has expired' });
    }
    if (!coupon.canUserUse(req.user._id)) {
      return res.status(400).json({ message: 'You have already used this coupon' });
    }
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ 
        message: `Minimum order amount required: $${coupon.minOrderAmount}` 
      });
    }
    if (coupon.applicableCategories.length > 0 || coupon.applicableProducts.length > 0) {
      const applicableProducts = products.filter(product => {
        if (coupon.applicableCategories.length > 0) {
          if (!coupon.applicableCategories.includes(product.category)) {
            return false;
          }
        }
        if (coupon.applicableProducts.length > 0) {
          if (!coupon.applicableProducts.includes(product._id)) {
            return false;
          }
        }
        return true;
      });
      if (applicableProducts.length === 0) {
        return res.status(400).json({ message: 'Coupon not applicable to selected products' });
      }
    }
    if (coupon.excludedProducts.length > 0) {
      const hasExcludedProduct = products.some(product => 
        coupon.excludedProducts.includes(product._id)
      );
      if (hasExcludedProduct) {
        return res.status(400).json({ message: 'Coupon not applicable to some selected products' });
      }
    }
    const discountAmount = coupon.calculateDiscount(orderAmount);
    res.json({
      message: 'Coupon applied successfully',
      coupon: {
        id: coupon._id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        discountAmount: discountAmount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserCouponHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const coupons = await Coupon.find({
      'usageHistory.user': req.user._id
    })
    .populate('usageHistory.order', 'orderNumber totalAmount')
    .sort({ 'usageHistory.usedAt': -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    const total = await Coupon.countDocuments({
      'usageHistory.user': req.user._id
    });
    res.json({
      coupons,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getCouponStats = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const stats = await Coupon.aggregate([
      {
        $match: {
          'usageHistory.usedAt': { $gte: startDate }
        }
      },
      {
        $unwind: '$usageHistory'
      },
      {
        $match: {
          'usageHistory.usedAt': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$code',
          name: { $first: '$name' },
          totalUsage: { $sum: 1 },
          totalDiscount: { $sum: '$usageHistory.discountAmount' }
        }
      },
      {
        $sort: { totalUsage: -1 }
      }
    ]);
    const totalStats = await Coupon.aggregate([
      {
        $group: {
          _id: null,
          totalCoupons: { $sum: 1 },
          activeCoupons: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isActive', true] },
                    { $lte: ['$validFrom', new Date()] },
                    { $gte: ['$validUntil', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalUsage: { $sum: '$usedCount' },
          totalDiscount: { $sum: { $sum: '$usageHistory.discountAmount' } }
        }
      }
    ]);
    res.json({
      periodStats: stats,
      totalStats: totalStats[0] || {
        totalCoupons: 0,
        activeCoupons: 0,
        totalUsage: 0,
        totalDiscount: 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateAndApplyCoupon,
  getUserCouponHistory,
  getCouponStats,
}; 