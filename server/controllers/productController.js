// Example structure for product controller
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Notification = require('../models/Notification');
const User = require('../models/User');

const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      mode,
      search,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      auction
    } = req.query;
    const filter = { 
      isActive: true,
      approvalStatus: 'approved' // Only show approved products on public page
    };
    if (category) filter.category = category;
    if (mode) {
      filter.mode = mode;
    } else {
      filter.mode = { $ne: 'auction' };
    }
    // If auction listing is requested, allow filtering by auction stage
    if (filter.mode === 'auction' && auction) {
      const now = new Date();
      if (auction === 'live') {
        filter['auction.status'] = 'active';
        filter['auction.endTime'] = { $gt: now };
      } else if (auction === 'upcoming') {
        filter['auction.status'] = 'scheduled';
        filter['auction.startTime'] = { $gt: now };
      } else if (auction === 'past') {
        // ended auctions; include ended status or those with endTime in the past
        filter.$or = [
          { 'auction.status': 'ended' },
          { 'auction.endTime': { $lte: now } }
        ];
      }
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      filter.$text = { $search: search };
    }
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const products = await Product.find(filter)
      .populate('seller', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    const total = await Product.countDocuments(filter);
    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email')
      .populate('auction.winner', 'name email');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    product.views += 1;
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      images,
      mode,
      auction,
      brand,
      condition,
      stock,
      tags,
      specifications
    } = req.body;
    const product = new Product({
      name,
      description,
      price,
      category,
      images,
      mode,
      auction: mode === 'auction' ? auction : undefined,
      brand,
      condition,
      stock,
      tags,
      specifications,
      seller: req.user._id
    });
    await product.save();

    // Emit socket event for new product
    const io = req.app.get('io');
    if (io) {
      // Notify users tracking this category
      io.to(`category-${category}`).emit('product:new', {
        productId: product._id,
        name: product.name,
        category: product.category,
        price: product.price,
        images: product.images
      });

      // Notify admins of new product
      io.to('admins').emit('product:new', {
        productId: product._id,
        name: product.name,
        seller: req.user.name,
        category: product.category,
        status: 'pending'
      });
    }
    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createProductAdmin = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subcategory,
      brand,
      stock,
      sku,
      weight,
      dimensions,
      features,
      specifications,
      tags,
      images,
      vendor,
      isActive,
      approvalStatus,
      mode
    } = req.body;
    if (!name || !description || !price || !category || !vendor) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const vendorDoc = await Vendor.findById(vendor);
    if (!vendorDoc || vendorDoc.status !== 'approved') {
      return res.status(400).json({ message: 'Invalid or inactive vendor' });
    }
    const product = new Product({
      name,
      description,
      price,
      category,
      subcategory,
      brand,
      stock: stock || 0,
      sku,
      weight: weight || 0,
      dimensions: dimensions || { length: 0, width: 0, height: 0 },
      features: features || [],
      specifications: specifications || {},
      tags: tags || [],
      images: images || [],
      vendor,
      seller: req.user._id,
      isActive: isActive !== undefined ? isActive : true,
      approvalStatus: approvalStatus || 'approved',
      approvedBy: req.user._id,
      approvalDate: approvalStatus === 'approved' ? new Date() : undefined,
      mode
    });
    await product.save();
    await Vendor.findByIdAndUpdate(vendor, { $inc: { totalProducts: 1 } });
    await product.populate('vendor', 'businessName');
    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
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
      if (key !== 'seller' && key !== '_id') {
        product[key] = updateFields[key];
      }
    });
    await product.save();
    res.json({
      message: 'Product updated successfully',
      product
    });
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

const getFeaturedProducts = async (req, res) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true, isActive: true })
      .populate('seller', 'name')
      .limit(8);
    res.json(featuredProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getActiveAuctions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'auction.endTime',
      sortOrder = 'asc'
    } = req.query;
    const now = new Date();
    const filter = {
      mode: 'auction',
      'auction.status': 'active',
      'auction.endTime': { $gt: now },
      isActive: true
    };
    let vendorIds = [];
    if (search) {
      filter.$or = [{ name: { $regex: search, $options: 'i' } }];
      const vendors = await User.find({ name: { $regex: search, $options: 'i' } }, '_id');
      vendorIds = vendors.map(v => v._id);
      if (vendorIds.length > 0) {
        filter.$or.push({ seller: { $in: vendorIds } });
      }
    }
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const total = await Product.countDocuments(filter);
    const auctions = await Product.find(filter)
      .populate('seller', 'name')
      .sort(sortOptions)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    res.json({
      auctions,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getScheduledAuctions = async (req, res) => {
  try {
    const now = new Date();
    const scheduledAuctions = await Product.find({
      mode: 'auction',
      'auction.status': 'scheduled',
      'auction.startTime': { $gt: now },
      isActive: true
    })
      .populate('seller', 'name')
      .sort({ 'auction.startTime': 1 });
    res.json(scheduledAuctions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUpcomingAuctions = async (req, res) => {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const upcomingAuctions = await Product.find({
      mode: 'auction',
      'auction.status': 'scheduled',
      'auction.startTime': { $gt: now, $lte: oneHourFromNow },
      isActive: true
    })
      .populate('seller', 'name')
      .sort({ 'auction.startTime': 1 });
    res.json(upcomingAuctions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAuctionStats = async (req, res) => {
  try {
    const now = new Date();

    // Get total active auctions
    const totalActive = await Product.countDocuments({
      mode: 'auction',
      'auction.status': 'active',
      'auction.endTime': { $gt: now },
      isActive: true
    });

    // Get total bids (you'll need to implement this based on your Bid model)
    const Bid = require('../models/Bid');
    const totalBids = await Bid.countDocuments({});

    // Get active bidders (unique bidders in last 24 hours)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const activeBidders = await Bid.distinct('bidder', {
      placedAt: { $gte: yesterday }
    });

    res.json({
      totalActive,
      totalBids,
      activeBidders: activeBidders.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const scheduleAuction = async (req, res) => {
  try {
    const { productId, startTime, endTime, startingBid, minBidIncrement = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.mode !== 'auction') {
      return res.status(400).json({ message: 'Product is not an auction' });
    }
    const now = new Date();
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    if (startDate <= now) {
      return res.status(400).json({ message: 'Start time must be in the future' });
    }
    if (endDate <= startDate) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }
    product.auction.startTime = startDate;
    product.auction.endTime = endDate;
    product.auction.startingBid = startingBid;
    product.auction.currentBid = startingBid;
    product.auction.minBidIncrement = minBidIncrement;
    product.auction.status = 'scheduled';
    product.auction.scheduledBy = req.user._id;
    await product.save();
    res.json({
      message: 'Auction scheduled successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const startAuctionManually = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.mode !== 'auction') {
      return res.status(400).json({ message: 'Product is not an auction' });
    }
    await product.startAuction();
    res.json({
      message: 'Auction started successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const endAuctionManually = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.mode !== 'auction') {
      return res.status(400).json({ message: 'Product is not an auction' });
    }
    await product.endAuction();
    res.json({
      message: 'Auction ended successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createAuctionProduct = async (req, res) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const {
      name, description, price, category, images, brand, condition, stock, tags, specifications, variants,
      auction
    } = req.body;
    const product = new Product({
      name,
      description,
      price,
      category,
      images,
      brand,
      condition,
      stock,
      tags,
      specifications,
      variants,
      mode: 'auction',
      auction: {
        ...auction,
        status: 'scheduled',
        totalBids: 0,
        preLaunchViews: 0,
        scheduledBy: req.user._id
      },
      seller: req.user._id,
      isActive: true,
      approvalStatus: 'approved'
    });
    await product.save();
    const users = await User.find({ isActive: true });
    const notifications = users.map(user => ({
      notificationId: `new-auction-${product._id}-${user._id}-${Date.now()}`,
      type: 'SYSTEM_ALERT',
      title: 'New Auction Available!',
      message: `New auction product: ${product.name} is now available! Auction starts at ${new Date(product.auction.startTime).toLocaleString()} and ends at ${new Date(product.auction.endTime).toLocaleString()}.`,
      category: 'system',
      priority: 'medium',
      data: {
        productId: product._id.toString(),
        productName: product.name,
        startTime: product.auction.startTime,
        endTime: product.auction.endTime
      },
      recipients: [{
        userId: user._id,
        role: 'user'
      }],
      actions: [{
        label: 'View Auction',
        url: `/products/${product._id}?mode=auction`,
        type: 'primary'
      }]
    }));
    await Notification.insertMany(notifications);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getCategoriesList = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  createProductAdmin,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getActiveAuctions,
  getScheduledAuctions,
  getUpcomingAuctions,
  getAuctionStats,
  scheduleAuction,
  startAuctionManually,
  endAuctionManually,
  createAuctionProduct,
  getCategoriesList,
}; 