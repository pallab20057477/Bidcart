const express = require('express');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const User = require('../../models/User');
const Vendor = require('../../models/Vendor');
const Coupon = require('../../models/Coupon');
const { adminAuth } = require('../../middleware/auth');

const router = express.Router();

// Get dashboard overview statistics
router.get('/overview', adminAuth, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total counts - only count regular users (not admins or vendors)
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalProducts = await Product.countDocuments();
    const totalVendors = await Vendor.countDocuments(); // Count ALL vendors (matches AccountsManagement page)
    const approvedVendors = await Vendor.countDocuments({ status: 'approved' });
    const totalOrders = await Order.countDocuments();

    console.log('Dashboard Overview - Database Counts:');
    console.log('Total Users (role: user):', totalUsers);
    console.log('Total Admins:', totalAdmins);
    console.log('Total Vendors (all):', totalVendors);
    console.log('Approved Vendors:', approvedVendors);
    console.log('Total Products:', totalProducts);
    console.log('Total Orders:', totalOrders);

    // Get period-specific counts - only count regular users
    const newUsers = await User.countDocuments({ role: 'user', createdAt: { $gte: startDate } });
    const newProducts = await Product.countDocuments({ createdAt: { $gte: startDate } });
    const newVendors = await Vendor.countDocuments({ createdAt: { $gte: startDate } }); // Count ALL new vendors
    const newOrders = await Order.countDocuments({ createdAt: { $gte: startDate } });

    // Get revenue statistics
    const revenueStats = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'delivered'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    // Get auction statistics
    const auctionStats = await Product.aggregate([
      {
        $match: {
          mode: 'auction',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalAuctions: { $sum: 1 },
          activeAuctions: {
            $sum: {
              $cond: [
                { $eq: ['$auction.status', 'active'] },
                1,
                0
              ]
            }
          },
          completedAuctions: {
            $sum: {
              $cond: [
                { $eq: ['$auction.status', 'ended'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      overview: {
        totalUsers,
        totalProducts,
        totalVendors,
        totalOrders,
        newUsers,
        newProducts,
        newVendors,
        newOrders
      },
      revenue: revenueStats[0] || {
        totalRevenue: 0,
        avgOrderValue: 0,
        orderCount: 0
      },
      auctions: auctionStats[0] || {
        totalAuctions: 0,
        activeAuctions: 0,
        completedAuctions: 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sales chart data
router.get('/sales-chart', adminAuth, async (req, res) => {
  try {
    const { period = '30', groupBy = 'day' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let dateFormat, groupId;
    if (groupBy === 'hour') {
      dateFormat = '%Y-%m-%d-%H';
      groupId = { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } };
    } else if (groupBy === 'week') {
      dateFormat = '%Y-%U';
      groupId = { $dateToString: { format: '%Y-W%U', date: '$createdAt' } };
    } else if (groupBy === 'month') {
      dateFormat = '%Y-%m';
      groupId = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    } else {
      dateFormat = '%Y-%m-%d';
      groupId = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'delivered'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupId,
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json(salesData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user growth chart data
router.get('/user-growth', adminAuth, async (req, res) => {
  try {
    const { period = '30', groupBy = 'day' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let groupId;
    if (groupBy === 'week') {
      groupId = { $dateToString: { format: '%Y-W%U', date: '$createdAt' } };
    } else if (groupBy === 'month') {
      groupId = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    } else {
      groupId = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupId,
          newUsers: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json(userGrowth);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get product category distribution
router.get('/category-distribution', adminAuth, async (req, res) => {
  try {
    const categoryData = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: '$price' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(categoryData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get top performing products
router.get('/top-products', adminAuth, async (req, res) => {
  try {
    const { period = '30', limit = 10 } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const topProducts = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'delivered'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $unwind: '$products'
      },
      {
        $group: {
          _id: '$products.product',
          totalSold: { $sum: '$products.quantity' },
          totalRevenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          name: '$product.name',
          category: '$product.category',
          totalSold: 1,
          totalRevenue: 1,
          orderCount: 1
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get auction performance data
router.get('/auction-performance', adminAuth, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const auctionPerformance = await Product.aggregate([
      {
        $match: {
          mode: 'auction',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$auction.status',
          count: { $sum: 1 },
          avgStartingPrice: { $avg: '$auction.startingBid' },
          avgFinalPrice: { $avg: '$auction.currentBid' },
          totalBids: { $sum: '$auction.totalBids' }
        }
      }
    ]);

    // Get auction timeline data
    const auctionTimeline = await Product.aggregate([
      {
        $match: {
          mode: 'auction',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          auctionsCreated: { $sum: 1 },
          auctionsEnded: {
            $sum: {
              $cond: [
                { $eq: ['$auction.status', 'ended'] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      performance: auctionPerformance,
      timeline: auctionTimeline
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get real-time activity feed
router.get('/activity-feed', adminAuth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name')
      .populate('products.product', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent product additions
    const recentProducts = await Product.find()
      .populate('seller', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent auction activities
    const recentAuctions = await Product.find({
      mode: 'auction',
      'auction.totalBids': { $gt: 0 }
    })
      .populate('seller', 'name')
      .sort({ 'auction.endTime': -1 })
      .limit(5);

    res.json({
      orders: recentOrders,
      users: recentUsers,
      products: recentProducts,
      auctions: recentAuctions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 