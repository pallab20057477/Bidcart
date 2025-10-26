const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Bid = require('../models/Bid');
const Notification = require('../models/Notification');
const Vendor = require('../models/Vendor');
const AdminActivity = require('../models/AdminActivity');

const getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalBids = await Bid.countDocuments();
    const revenue = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .populate('products.product', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    const activeAuctions = await Product.find({
      mode: 'auction',
      'auction.status': 'active'
    }).populate('seller', 'name');
    
    // Emit real-time dashboard updates to admins
    const io = req.app.get('io');
    if (io) {
      io.to('analytics').emit('admin:dashboard-update', {
        stats: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalBids,
          totalRevenue: revenue[0]?.total || 0
        },
        recentOrders: recentOrders.length,
        activeAuctions: activeAuctions.length,
        timestamp: new Date()
      });
    }
    
    res.json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalBids,
        totalRevenue: revenue[0]?.total || 0
      },
      recentOrders,
      activeAuctions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const filter = {};
    
    // If role is specified, filter by that role, otherwise default to 'user'
    if (role) {
      filter.role = role;
    } else {
      filter.role = 'user';
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await User.countDocuments(filter);
    res.json({ users, totalPages: Math.ceil(total / limit), currentPage: page, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const notification = await Notification.create({
      notificationId: `user_${isActive ? 'activated' : 'deactivated'}_${user._id}_${Date.now()}`,
      type: 'SYSTEM_ALERT',
      title: `Account ${isActive ? 'Activated' : 'Deactivated'}`,
      message: `Your account has been ${isActive ? 'activated' : 'deactivated'} by the admin.`,
      category: 'system',
      priority: isActive ? 'medium' : 'high',
      recipients: [{
        userId: user._id,
        role: user.role || 'user'
      }]
    });
    const io = req.app.get('io');
    if (io) {
      io.to(user._id.toString()).emit('notification:new', notification);
    }
    res.json({ message: `User has been ${isActive ? 'activated' : 'deactivated'} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }
    const user = new User({ name, email, password });
    await user.save();
    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAdminActivityLogs = async (req, res) => {
  try {
    const { adminId } = req.params;
    const activities = await AdminActivity.find({ admin: adminId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ activities });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('products.product', 'name images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Order.countDocuments(filter);
    res.json({ orders, totalPages: Math.ceil(total / limit), currentPage: page, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getDailyOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orderCount: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getActiveAndUpcomingAuctions = async (req, res) => {
  try {
    const now = new Date();
    const activeAuctions = await Product.find({
      mode: 'auction',
      'auction.status': { $in: ['active', 'scheduled'] }
    })
      .populate('seller', 'name')
      .populate('auction.winner', 'name')
      .sort({ 'auction.startTime': 1, 'auction.endTime': 1 });
    const auctionsWithComputedStatus = activeAuctions.map(auction => {
      const auctionObj = auction.toObject();
      auctionObj.computedStatus = auction.getAuctionStatus();
      return auctionObj;
    });
    res.json(auctionsWithComputedStatus);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAuctionHistory = async (req, res) => {
  try {
    const auctionHistory = await Product.find({
      mode: 'auction',
      'auction.status': { $in: ['ended', 'cancelled'] }
    })
      .populate('seller', 'name')
      .populate('auction.winner', 'name')
      .sort({ 'auction.endTime': -1 });
    res.json(auctionHistory);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAuctionDetails = async (req, res) => {
  try {
    const auction = await Product.findById(req.params.id)
      .populate('seller', 'name email')
      .populate('auction.winner', 'name email');
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    if (auction.mode !== 'auction') {
      return res.status(400).json({ message: 'Product is not an auction' });
    }
    res.json(auction);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAuctionBids = async (req, res) => {
  try {
    const bids = await Bid.find({ product: req.params.id })
      .populate('bidder', 'name email')
      .sort({ amount: -1, placedAt: -1 });
    res.json(bids);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const endAuctionManually = async (req, res) => {
  try {
    const auction = await Product.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    if (auction.mode !== 'auction') {
      return res.status(400).json({ message: 'Product is not an auction' });
    }
    if (auction.auction.status === 'ended') {
      return res.status(400).json({ message: 'Auction is already ended' });
    }
    const highestBid = await Bid.findOne({ product: req.params.id })
      .sort({ amount: -1 })
      .populate('bidder', 'name email');
    auction.auction.status = 'ended';
    if (highestBid) {
      auction.auction.winner = highestBid.bidder._id;
      auction.auction.currentBid = highestBid.amount;
    }
    await auction.save();
    req.app.get('io').emit('auction-ended', {
      productId: auction._id,
      winner: highestBid?.bidder?.name || null,
      finalBid: highestBid?.amount || auction.auction.startingBid
    });
    res.json({ message: 'Auction ended successfully', auction });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAdminOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('products.product', 'name images price vendor')
      .populate('products.vendor', 'businessName')
      .populate('user', 'name email phone');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getSalesAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const dailySales = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: 'completed' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const categorySales = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: 'completed' } },
      { $lookup: { from: 'products', localField: 'products.product', foreignField: '_id', as: 'productDetails' } },
      { $group: { _id: '$productDetails.category', total: { $sum: '$totalAmount' } } }
    ]);
    res.json({ dailySales, categorySales });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAuctionAnalytics = async (req, res) => {
  try {
    const activeAuctions = await Product.countDocuments({ mode: 'auction', 'auction.status': 'active' });
    const endedAuctions = await Product.countDocuments({ mode: 'auction', 'auction.status': 'ended' });
    const totalBids = await Bid.countDocuments();
    const avgBidAmount = await Bid.aggregate([
      { $group: { _id: null, average: { $avg: '$amount' } } }
    ]);
    const topBidders = await Bid.aggregate([
      { $group: { _id: '$bidder', totalBids: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]);
    res.json({
      activeAuctions,
      endedAuctions,
      totalBids,
      averageBidAmount: avgBidAmount[0]?.average || 0,
      topBidders
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProductAnalytics = async (req, res) => {
  try {
    const productsByCategory = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const mostViewed = await Product.find().sort({ views: -1 }).limit(10).select('name views category');
    const productsByMode = await Product.aggregate([
      { $group: { _id: '$mode', count: { $sum: 1 } } }
    ]);
    res.json({ productsByCategory, mostViewed, productsByMode });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getPendingProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'pending' } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.approvalStatus = status;
    }
    const products = await Product.find(filter)
      .populate('seller', 'name email')
      .populate('vendor', 'businessName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Product.countDocuments(filter);
    res.json({ products, totalPages: Math.ceil(total / limit), currentPage: page, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const approveProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    product.approvalStatus = 'approved';
    product.isActive = true;
    await product.save();
    if (product.vendor) {
      const vendor = await Vendor.findById(product.vendor);
      if (vendor && vendor.user) {
        const notification = await Notification.create({
          notificationId: `product_approved_${product._id}_${Date.now()}`,
          type: 'SYSTEM_ALERT',
          title: 'Product Approved',
          message: `Your product "${product.name}" has been approved and is now live!`,
          category: 'system',
          priority: 'medium',
          recipients: [{
            userId: vendor.user,
            role: 'vendor'
          }],
          data: {
            productId: product._id.toString(),
            productName: product.name
          }
        });
        
        const io = req.app.get('io');
        if (io) {
          io.to(vendor.user.toString()).emit('notification:new', notification);
          io.to(vendor.user.toString()).emit('vendor:product-approved', {
            productId: product._id,
            productName: product.name,
            message: 'Product approved successfully'
          });
        }
      }
    }
    res.json({ message: 'Product approved successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const rejectProduct = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    product.approvalStatus = 'rejected';
    product.rejectionReason = rejectionReason.trim();
    product.isActive = false;
    await product.save();
    if (product.vendor) {
      const vendor = await Vendor.findById(product.vendor);
      if (vendor && vendor.user) {
        await Notification.create({
          notificationId: `product_rejected_${product._id}_${Date.now()}`,
          type: 'SYSTEM_ALERT',
          title: 'Product Rejected',
          message: `Your product "${product.name}" was rejected. Reason: ${rejectionReason}`,
          category: 'system',
          priority: 'high',
          recipients: [{
            userId: vendor.user,
            role: 'vendor'
          }],
          data: {
            productId: product._id.toString(),
            productName: product.name,
            rejectionReason: rejectionReason
          }
        });
        const io = req.app.get('io');
        if (io) {
          io.to(vendor.user.toString()).emit('notification:update', { type: 'new' });
          io.to(vendor.user.toString()).emit('vendor:product-rejected', {
            productId: product._id,
            productName: product.name,
            reason: rejectionReason
          });
        }
      }
    }
    res.json({ message: 'Product rejected successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, filter } = req.query;
    const queryFilter = {};
    if (search) {
      queryFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (filter) {
      switch (filter) {
        case 'active':
          queryFilter.isActive = true;
          break;
        case 'inactive':
          queryFilter.isActive = false;
          break;
        case 'auction':
          queryFilter.mode = 'auction';
          break;
        case 'fixed':
          queryFilter.mode = 'buy-now';
          break;
      }
    }
    const products = await Product.find(queryFilter)
      .populate('seller', 'name email')
      .populate('vendor', 'businessName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Product.countDocuments(queryFilter);
    res.json({ products, totalPages: Math.ceil(total / limit), currentPage: page, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const updateFields = req.body;
    Object.keys(updateFields).forEach(key => {
      if (key !== 'seller' && key !== '_id' && key !== 'vendor') {
        product[key] = updateFields[key];
      }
    });
    await product.save();
    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getDashboard,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  createUser,
  deleteUser,
  getAdminActivityLogs,
  getAllOrders,
  getDailyOrderStats,
  getActiveAndUpcomingAuctions,
  getAuctionHistory,
  getAuctionDetails,
  getAuctionBids,
  endAuctionManually,
  getAdminOrderById,
  getSalesAnalytics,
  getAuctionAnalytics,
  getProductAnalytics,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
}; 