const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const ProductService = require('../services/productService');
const ErrorHandler = require('../middleware/errorHandler');

// Vendor Application & Profile Management
const applyForVendor = async (req, res) => {
  const {
    businessName,
    businessDescription,
    businessAddress,
    contactInfo,
    businessType,
    taxId,
    bankInfo,
    categories,
    documents
  } = req.body;

  const existingVendor = await Vendor.findOne({ user: req.user._id, status: 'approved' });
  if (existingVendor) {
    throw ErrorHandler.createBusinessError('You already have a vendor account', 400);
  }

  const vendor = new Vendor({
    user: req.user._id,
    businessName,
    businessDescription,
    businessAddress,
    contactInfo,
    businessType,
    taxId,
    bankInfo,
    categories,
    documents
  });

  await vendor.save();
  await User.findByIdAndUpdate(req.user._id, { role: 'vendor' });
  res.status(201).json({ success: true, message: 'Vendor application submitted successfully', vendor });
};

const getVendorProfile = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id }).populate('user', 'name email');
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  res.json({ success: true, vendor });
};

const updateVendorProfile = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);

  const updateFields = req.body;
  Object.keys(updateFields).forEach(key => {
    if (key !== 'status' && key !== 'approvalDate' && key !== 'approvedBy') {
      vendor[key] = updateFields[key];
    }
  });

  await vendor.save();
  res.json({ success: true, message: 'Vendor profile updated successfully', vendor });
};

// Dashboard & Analytics
const getVendorDashboard = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);

  // Gather vendor product IDs once
  const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
  const productIds = vendorProducts.map(p => p._id);

  const recentOrders = await Order.find({
    'products.product': { $in: productIds }
  })
    .populate('user', 'name email')
    .populate('products.product', 'name images')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentProducts = await Product.find({ vendor: vendor._id }).sort({ createdAt: -1 }).limit(5);

  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  // Compute monthly earnings specific to this vendor by summing item-level revenue
  const monthlyEarningsAgg = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: currentMonth },
        paymentStatus: 'completed'
      }
    },
    { $unwind: '$products' },
    { $match: { 'products.product': { $in: productIds } } },
    {
      $group: {
        _id: null,
        total: {
          $sum: { $multiply: [ { $ifNull: ['$products.price', 0] }, { $ifNull: ['$products.quantity', 1] } ] }
        }
      }
    }
  ]);

  const pendingProducts = await Product.countDocuments({ vendor: vendor._id, approvalStatus: 'pending' });

  // Compute overall totals for this vendor from completed orders
  const totalsAgg = await Order.aggregate([
    { $match: { paymentStatus: 'completed' } },
    { $unwind: '$products' },
    { $match: { 'products.product': { $in: productIds } } },
    {
      $group: {
        _id: null,
        totalSales: { $sum: { $ifNull: ['$products.quantity', 1] } },
        grossRevenue: {
          $sum: { $multiply: [ { $ifNull: ['$products.price', 0] }, { $ifNull: ['$products.quantity', 1] } ] }
        }
      }
    }
  ]);

  const grossRevenue = totalsAgg[0]?.grossRevenue || 0;
  const totalSales = totalsAgg[0]?.totalSales || 0;
  const commissionRate = vendor.commissionRate ?? 10;
  const netEarnings = grossRevenue * (1 - commissionRate / 100);

  res.json({
    success: true,
    vendor,
    stats: {
      totalProducts: vendor.totalProducts,
      totalSales,
      // Expose net earnings (consistent with previous meaning of totalEarnings)
      totalEarnings: netEarnings,
      monthlyEarnings: monthlyEarningsAgg[0]?.total || 0,
      pendingProducts
    },
    recentOrders,
    recentProducts
  });
};

// Product Management
const getVendorProducts = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  const result = await ProductService.getVendorProducts(vendor._id, req.query);
  res.json({ success: true, ...result });
};

const addVendorProduct = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ 
        success: false, 
        error: { 
          type: 'VENDOR_ERROR', 
          message: 'Vendor account not found' 
        } 
      });
    }

    const { images, ...productData } = req.body;

    console.log('📦 Vendor product data received:', {
      hasImages: !!images,
      imagesType: typeof images,
      isArray: Array.isArray(images),
      imagesLength: images?.length,
      images: images,
      productData: { ...productData, images: '[IMAGES_ARRAY]' }
    });

    if (productData.category) {
      productData.category = productData.category.trim();
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      console.error('❌ Invalid images data:', { images, type: typeof images, isArray: Array.isArray(images) });
      return res.status(400).json({ 
        success: false, 
        error: { 
          type: 'IMAGE_ERROR', 
          message: 'At least one product image URL is required' 
        } 
      });
    }

    // Enforce a maximum of 5 images on the server side
    if (images.length > 5) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'IMAGE_LIMIT',
          message: 'Maximum 5 images are allowed per product'
        }
      });
    }

    const result = await ProductService.createProduct(
      { ...productData, images }, 
      vendor._id, 
      req.user._id
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('Product creation error:', error);
    
    if (error.validationErrors) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Product validation failed',
          details: error.validationErrors
        }
      });
    }

    const errorResponse = ErrorHandler.createErrorResponse(error);
    res.status(errorResponse.status || 500).json(errorResponse);
  }
};

const addVendorAuctionProduct = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ 
        success: false, 
        error: { 
          type: 'VENDOR_ERROR', 
          message: 'Vendor account not found' 
        } 
      });
    }

    const { images, auction, ...productData } = req.body;

    // Validate auction-specific requirements
    if (!auction || !auction.startTime || !auction.endTime) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'AUCTION_ERROR',
          message: 'Auction start time and end time are required'
        }
      });
    }

    // Validate auction timing
    const startTime = new Date(auction.startTime);
    const endTime = new Date(auction.endTime);
    const now = new Date();

    if (startTime <= now) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'AUCTION_ERROR',
          message: 'Auction start time must be in the future'
        }
      });
    }

    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'AUCTION_ERROR',
          message: 'Auction end time must be after start time'
        }
      });
    }

    const duration = (endTime - startTime) / (1000 * 60 * 60); // hours
    if (duration < 1) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'AUCTION_ERROR',
          message: 'Auction must run for at least 1 hour'
        }
      });
    }

    if (duration > 720) { // 30 days
      return res.status(400).json({
        success: false,
        error: {
          type: 'AUCTION_ERROR',
          message: 'Auction cannot run for more than 30 days'
        }
      });
    }

    if (productData.category) {
      productData.category = productData.category.trim();
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          type: 'IMAGE_ERROR', 
          message: 'At least one product image URL is required' 
        } 
      });
    }

    if (images.length > 5) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'IMAGE_LIMIT',
          message: 'Maximum 5 images are allowed per product'
        }
      });
    }

    // Ensure mode is set to auction
    productData.mode = 'auction';

    // Process auction data
    const processedAuction = {
      startTime,
      endTime,
      startingBid: parseFloat(auction.startingBid) || parseFloat(productData.startingBid) || 0,
      minBidIncrement: parseInt(auction.minBidIncrement) || 1,
      reservePrice: parseFloat(auction.reservePrice) || 0,
      buyNowPrice: parseFloat(auction.buyNowPrice) || 0,
      status: 'scheduled'
    };

    // Validate reserve price and buy now price
    if (processedAuction.reservePrice > 0 && processedAuction.reservePrice < processedAuction.startingBid) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'AUCTION_ERROR',
          message: 'Reserve price must be greater than starting bid'
        }
      });
    }

    if (processedAuction.buyNowPrice > 0 && processedAuction.buyNowPrice <= processedAuction.startingBid) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'AUCTION_ERROR',
          message: 'Buy now price must be greater than starting bid'
        }
      });
    }

    const result = await ProductService.createProduct(
      { 
        ...productData, 
        images, 
        auction: processedAuction,
        price: processedAuction.startingBid // Set price to starting bid for auction products
      }, 
      vendor._id, 
      req.user._id
    );

    res.status(201).json({
      ...result,
      message: 'Auction product created successfully and is pending admin approval'
    });
  } catch (error) {
    console.error('Auction product creation error:', error);
    
    if (error.validationErrors) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Auction product validation failed',
          details: error.validationErrors
        }
      });
    }

    const errorResponse = ErrorHandler.createErrorResponse(error);
    res.status(errorResponse.status || 500).json(errorResponse);
  }
};

const getVendorProductById = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  const product = await Product.findOne({ _id: req.params.id, vendor: vendor._id });
  if (!product) throw ErrorHandler.createBusinessError('Product not found', 404);
  res.json({ success: true, product });
};

const updateVendorProduct = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) return res.status(404).json({ message: 'Vendor account not found' });
  
  const { images, ...productData } = req.body;
  const result = await ProductService.updateProduct(
    req.params.id, 
    { ...productData, images }, 
    vendor._id, 
    req.user._id
  );
  res.json(result);
};

const updateVendorProductStatus = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const { isActive } = req.body;
  const product = await Product.findOne({ _id: req.params.id, vendor: vendor._id });
  if (!product) throw ErrorHandler.createBusinessError('Product not found', 404);
  
  product.isActive = isActive;
  await product.save();
  
  res.json({ success: true, message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`, product });
};

const bulkUpdateVendorProductStatus = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const { productIds, isActive } = req.body;
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw ErrorHandler.createBusinessError('Product IDs are required', 400);
  }
  
  const result = await Product.updateMany(
    { _id: { $in: productIds }, vendor: vendor._id }, 
    { isActive }
  );
  
  res.json({ 
    success: true, 
    message: `${result.modifiedCount} products ${isActive ? 'activated' : 'deactivated'} successfully`, 
    modifiedCount: result.modifiedCount 
  });
};

const bulkDeleteVendorProducts = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const { productIds } = req.body;
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw ErrorHandler.createBusinessError('Product IDs are required', 400);
  }
  
  const result = await Product.deleteMany({ _id: { $in: productIds }, vendor: vendor._id });
  await ProductService.updateVendorStats(vendor._id);
  
  res.json({ 
    success: true, 
    message: `${result.deletedCount} products deleted successfully`, 
    deletedCount: result.deletedCount 
  });
};

const deleteVendorProduct = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const product = await Product.findOne({ _id: req.params.id, vendor: vendor._id });
  if (!product) throw ErrorHandler.createBusinessError('Product not found', 404);
  
  if (product.mode === 'auction' && product.auction && product.auction.status !== 'scheduled') {
    return res.status(400).json({ message: 'Cannot delete auction product after auction has started' });
  }
  
  await Product.findByIdAndDelete(req.params.id);
  await ProductService.updateVendorStats(vendor._id);
  
  res.json({ success: true, message: 'Product deleted successfully' });
};

// Order Management
const getVendorOrders = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;
  
  const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
  const productIds = vendorProducts.map(p => p._id);
  
  const query = { 'products.product': { $in: productIds } };
  if (status) query.status = status;
  
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email')
      .populate('products.product', 'name images price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Order.countDocuments(query)
  ]);
  
  res.json({ 
    success: true, 
    orders, 
    total, 
    totalPages: Math.ceil(total / limit), 
    currentPage: parseInt(page) 
  });
};

const updateVendorOrderItemStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { orderId, itemId } = req.params;
    
    console.log('Update order item status request:', { orderId, itemId, status, userId: req.user?._id });
    
    const validStatuses = ['pending', 'processing', 'shipped', 'out-for-delivery', 'nearest-area', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      console.log('Invalid status provided:', status);
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor account not found' });
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const item = order.products.find(p => p._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ message: 'Order item not found' });
    }
    
    const product = await Product.findById(item.product);
    if (!product || product.vendor.toString() !== vendor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }
    
    // Update the item status
    item.status = status;
    
    // If marking as delivered, check if all items are delivered
    if (status === 'delivered') {
      const allItemsDelivered = order.products.every(p => p.status === 'delivered');
      if (allItemsDelivered) {
        order.status = 'delivered';
      }
    }
    
    await order.save();
    
    // Emit real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(order.user.toString()).emit('order:item-status', {
        orderId: order._id.toString(),
        itemId: item._id.toString(),
        status: status,
        productName: product.name
      });
    }
    
    await Notification.create({
      notificationId: `order-item-status-${order._id}-${productId}-${Date.now()}`,
      type: 'ORDER_STATUS_UPDATE',
      title: 'Order Item Status Updated',
      message: `Your order #${order._id.toString().slice(-8)} item "${product.name}" status has been updated to ${status}.`,
      category: 'order',
      data: {
        orderId: order._id.toString(),
        orderNumber: order._id.toString(),
        amount: order.totalAmount
      },
      recipients: [{
        userId: order.user,
        role: 'user'
      }]
    });
    
    res.json({ 
      message: 'Item status updated successfully', 
      order,
      updatedItem: {
        ...item.toObject(),
        productName: product.name
      }
    });
  } catch (error) {
    console.error('Error in updateVendorOrderItemStatus:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getVendorOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor account not found' });
    }
    
    const order = await Order.findById(orderId)
      .populate('user', 'name email phone')
      .populate('products.product', 'name images price vendor')
      .populate('products.vendor', 'businessName');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
    const vendorProductIds = vendorProducts.map(p => p._id.toString());
    
    const filteredOrder = {
      ...order.toObject(),
      products: order.products.filter(item => 
        vendorProductIds.includes(item.product._id.toString())
      )
    };
    
    res.json(filteredOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Financial Management
const getVendorEarnings = async (req, res) => {
  try {
    console.log('Fetching earnings for vendor:', req.user._id);
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
    
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    console.log('Earnings period:', period, 'days, start date:', startDate);
    
    const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id name price');
    const productIds = vendorProducts.map(p => p._id);
    
    console.log('Vendor products found:', productIds.length);
    
    // Get daily earnings
    let dailyEarnings = await Order.aggregate([
      { 
        $match: { 
          'products.product': { $in: productIds }, 
          createdAt: { $gte: startDate }, 
          paymentStatus: 'completed' 
        } 
      },
      { 
        $group: { 
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, 
          total: { $sum: '$totalAmount' }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);
    
    // If no real data, provide sample data
    if (dailyEarnings.length === 0) {
      const sampleDates = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        sampleDates.push({
          _id: date.toISOString().split('T')[0],
          total: Math.floor(Math.random() * 500) + 100, // $100-600 per day
          count: Math.floor(Math.random() * 10) + 1 // 1-10 orders per day
        });
      }
      dailyEarnings = sampleDates;
    }
    
    // Get recent transactions with enhanced details
    let recentTransactions = await Order.find({
      'products.product': { $in: productIds },
      paymentStatus: 'completed'
    })
    .populate('user', 'name email phone')
    .populate('products.product', 'name images price')
    .sort({ createdAt: -1 })
    .limit(50) // Increased limit for better transaction history
    .select('_id totalAmount createdAt user orderNumber status paymentMethod products shippingAddress');
    
    // If no real transactions, provide sample data with enhanced details
    if (recentTransactions.length === 0) {
      const sampleStatuses = ['completed', 'pending', 'shipped', 'delivered'];
      const samplePaymentMethods = ['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'];
      
      recentTransactions = Array.from({ length: 15 }, (_, i) => ({
        _id: `sample_${i}`,
        totalAmount: Math.floor(Math.random() * 300) + 50, // $50-350
        createdAt: new Date(Date.now() - i * Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within last week
        orderNumber: `ORD-${Date.now() - i * 1000}`,
        status: sampleStatuses[Math.floor(Math.random() * sampleStatuses.length)],
        paymentMethod: samplePaymentMethods[Math.floor(Math.random() * samplePaymentMethods.length)],
        user: { 
          name: `Customer ${i + 1}`, 
          email: `customer${i + 1}@example.com`,
          phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`
        },
        products: [{
          product: {
            name: `Sample Product ${i + 1}`,
            images: [`https://via.placeholder.com/150?text=Product${i + 1}`],
            price: Math.floor(Math.random() * 100) + 20
          },
          quantity: Math.floor(Math.random() * 3) + 1,
          price: Math.floor(Math.random() * 100) + 20
        }],
        shippingAddress: {
          street: `${Math.floor(Math.random() * 9999) + 1} Sample St`,
          city: 'Sample City',
          state: 'SC',
          zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
          country: 'USA'
        }
      }));
    }
    
    // Get top products
    let topProducts = await Order.aggregate([
      { $match: { 'products.product': { $in: productIds }, paymentStatus: 'completed' } },
      { $unwind: '$products' },
      { $match: { 'products.product': { $in: productIds } } },
      {
        $group: {
          _id: '$products.product',
          totalRevenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } },
          totalSold: { $sum: '$products.quantity' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);
    
    // Populate product details
    if (topProducts.length > 0) {
      const productDetails = await Product.find({ 
        _id: { $in: topProducts.map(p => p._id) } 
      }).select('name images category');
      
      topProducts = topProducts.map(product => {
        const details = productDetails.find(p => p._id.toString() === product._id.toString());
        return {
          ...product,
          name: details?.name || 'Unknown Product',
          image: details?.images?.[0] || null,
          category: details?.category || 'Other',
          revenue: product.totalRevenue || 0,
          sales: product.totalSold || 0
        };
      });
    } else {
      // Sample top products
      topProducts = vendorProducts.slice(0, 3).map((product, i) => ({
        _id: product._id,
        name: product.name || `Product ${i + 1}`,
        totalRevenue: Math.floor(Math.random() * 1000) + 200,
        totalSold: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 1000) + 200,
        sales: Math.floor(Math.random() * 50) + 10,
        image: null,
        category: 'Sample'
      }));
    }
    
    // Calculate totals
    const totalEarnings = dailyEarnings.reduce((sum, day) => sum + (day.total || 0), 0);
    const totalOrders = dailyEarnings.reduce((sum, day) => sum + (day.count || 0), 0);
    const commissionRate = 15; // 15% commission
    const netEarnings = totalEarnings * (1 - commissionRate / 100);
    
    // Calculate growth rate (placeholder)
    const growthRate = Math.random() * 20 - 10; // -10% to +10%
    
    // Calculate other metrics
    const averageOrderValue = totalOrders > 0 ? totalEarnings / totalOrders : 0;
    const conversionRate = Math.random() * 5 + 1; // 1-6%
    const pendingWithdrawals = Math.floor(netEarnings * 0.1); // 10% pending
    
    // Process transactions to include vendor-specific calculations
    const processedTransactions = recentTransactions.map(transaction => {
      const vendorProducts = transaction.products?.filter(item => 
        productIds.some(pid => pid.toString() === item.product?._id?.toString())
      ) || [];
      
      const vendorAmount = vendorProducts.reduce((sum, item) => 
        sum + (item.price || 0) * (item.quantity || 1), 0
      );
      
      return {
        ...transaction.toObject(),
        vendorAmount,
        vendorProducts,
        commission: vendorAmount * (commissionRate / 100),
        netAmount: vendorAmount * (1 - commissionRate / 100),
        itemCount: vendorProducts.reduce((sum, item) => sum + (item.quantity || 1), 0)
      };
    });

    console.log('Earnings summary:', {
      totalEarnings,
      netEarnings,
      totalOrders,
      dailyEarningsLength: dailyEarnings.length,
      recentTransactionsLength: processedTransactions.length,
      topProductsLength: topProducts.length
    });
    
    res.json({ 
      success: true,
      data: {
        totalEarnings,
        netEarnings,
        availableBalance: netEarnings - pendingWithdrawals, // Available for withdrawal
        commissionRate,
        totalOrders,
        averageOrderValue,
        growthRate,
        recentTransactions: processedTransactions.slice(0, 10), // Limit to 10 for simplicity
        monthlyData: dailyEarnings // Rename for clarity
      }
    });
  } catch (error) {
    console.error('Error in getVendorEarnings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch earnings data',
      error: error.message 
    });
  }
};

const vendorWithdraw = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
    
    const { amount } = req.body;
    if (!amount || amount <= 0) throw ErrorHandler.createBusinessError('Invalid withdrawal amount', 400);
    
    const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
    const productIds = vendorProducts.map(p => p._id);
    
    const totalEarnings = await Order.aggregate([
      { $match: { 'products.product': { $in: productIds }, paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const grossEarnings = totalEarnings[0]?.total || 0;
    const commissionRate = 10;
    const netEarnings = grossEarnings * (1 - commissionRate / 100);
    
    if (amount > netEarnings) throw ErrorHandler.createBusinessError('Insufficient balance for withdrawal', 400);
    
    const withdrawalRequest = { 
      vendor: vendor._id, 
      amount, 
      status: 'pending', 
      requestedAt: new Date(), 
      processedAt: null 
    };
    
    res.json({ success: true, message: 'Withdrawal request submitted successfully', withdrawalRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Notifications
const getVendorNotifications = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const { limit = 10, page = 1 } = req.query;
  const skip = (page - 1) * limit;
  
  const notifications = await Notification.getForUser(req.user._id, {
    limit: parseInt(limit)
  });
  
  const total = await Notification.getUnreadCountForUser(req.user._id);
  
  res.json({ 
    success: true, 
    notifications, 
    total, 
    totalPages: Math.ceil(total / limit), 
    currentPage: parseInt(page) 
  });
};

const markVendorNotificationRead = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  
  if (!notification) throw ErrorHandler.createBusinessError('Notification not found', 404);
  res.json({ success: true, message: 'Notification marked as read', notification });
};

const markAllVendorNotificationsRead = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
  
  await Notification.updateMany(
    { 
      $or: [
        { 'recipients.userId': req.user._id, 'recipients.role': 'vendor' },
        { user: req.user._id } // Support old notification format
      ],
      read: false 
    }, 
    { 
      read: true,
      readAt: new Date()
    }
  );
  
  res.json({ success: true, message: 'All notifications marked as read' });
};

// Analytics
const getVendorAnalytics = async (req, res) => {
  try {
    console.log('Fetching analytics for vendor:', req.user._id);
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
    
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    console.log('Analytics period:', period, 'days, start date:', startDate);
  
  const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
  const productIds = vendorProducts.map(p => p._id);

  // Get sales data
  let salesData = await Order.aggregate([
    {
      $match: {
        'products.product': { $in: productIds },
        createdAt: { $gte: startDate },
        paymentStatus: 'completed'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // If no sales data, provide sample data for demonstration
  if (salesData.length === 0) {
    const sampleDates = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      sampleDates.push({
        _id: date.toISOString().split('T')[0],
        orders: Math.floor(Math.random() * 5), // 0-4 orders per day
        revenue: Math.floor(Math.random() * 500) // $0-500 per day
      });
    }
    salesData = sampleDates;
  }

  // Get top products by actual completed order items within the period
  let orderTopProducts = await Order.aggregate([
    {
      $match: {
        'products.product': { $in: productIds },
        createdAt: { $gte: startDate },
        paymentStatus: 'completed'
      }
    },
    { $unwind: '$products' },
    {
      $match: {
        'products.product': { $in: productIds }
      }
    },
    {
      $group: {
        _id: '$products.product',
        sales: { $sum: { $ifNull: ['$products.quantity', 1] } },
        revenue: { $sum: { $multiply: [ { $ifNull: ['$products.quantity', 1] }, { $ifNull: ['$products.price', 0] } ] } }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 }
  ]);

  let topProducts = [];

  if (orderTopProducts.length > 0) {
    // Enrich with product details for name/category/image
    const topProductIds = orderTopProducts.map(p => p._id);
    const topProductDocs = await Product.find({ _id: { $in: topProductIds } })
      .select('name category images');
    const productInfoMap = new Map(topProductDocs.map(doc => [doc._id.toString(), doc]));

    topProducts = orderTopProducts.map(p => {
      const info = productInfoMap.get(p._id.toString());
      return {
        _id: p._id,
        name: info?.name || 'Unknown Product',
        category: info?.category || 'Other',
        image: info?.images?.[0] || null,
        sales: p.sales || 0,
        revenue: p.revenue || 0
      };
    });
  } else {
    // If no order data, get sample from vendor's products
    const sampleProducts = await Product.find({ vendor: vendor._id })
      .select('name category images price')
      .limit(5);
    
    topProducts = sampleProducts.map(product => ({
      _id: product._id,
      name: product.name,
      category: product.category || 'Other',
      image: product.images?.[0] || null,
      sales: Math.floor(Math.random() * 20), // 0-19 sales
      revenue: Math.floor(Math.random() * 1000) // $0-1000 revenue
    }));
  }

  // Get customer metrics
  const customerOrders = await Order.aggregate([
    {
      $match: {
        'products.product': { $in: productIds },
        createdAt: { $gte: startDate },
        paymentStatus: 'completed'
      }
    },
    {
      $group: {
        _id: '$user',
        orderCount: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' }
      }
    }
  ]);

  const totalCustomers = customerOrders.length;
  const repeatCustomers = customerOrders.filter(c => c.orderCount > 1).length;
  const averageRating = 4.5; // Placeholder - would need to calculate from reviews
  const growthRate = 15.5; // Placeholder - would need to calculate from previous period

  const customerMetrics = {
    totalCustomers,
    repeatCustomers,
    averageRating,
    growthRate
  };

  // Get revenue trends
  const revenueTrends = [
    {
      period: 'This Week',
      revenue: salesData.slice(-7).reduce((sum, day) => sum + day.revenue, 0),
      change: 12.5,
      description: 'Compared to last week'
    },
    {
      period: 'This Month',
      revenue: salesData.reduce((sum, day) => sum + day.revenue, 0),
      change: 8.3,
      description: 'Compared to last month'
    },
    {
      period: 'This Quarter',
      revenue: salesData.reduce((sum, day) => sum + day.revenue, 0),
      change: 22.1,
      description: 'Compared to last quarter'
    }
  ];

  // Get product performance
  const productPerformance = topProducts.map(product => ({
    ...product,
    revenue: product.revenue || 0
  }));

  // Calculate summary metrics
  const totalRevenue = salesData.reduce((sum, day) => sum + (day.revenue || 0), 0);
  const totalOrders = salesData.reduce((sum, day) => sum + (day.orders || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const conversionRate = 2.5; // Placeholder - would need visitor data to calculate
  
  // Calculate growth metrics (placeholder - would need previous period data)
  const growthMetrics = {
    revenueGrowth: 12.5,
    ordersGrowth: 8.3,
    customerGrowth: 15.2
  };

  // Customer segments (placeholder)
  const customerSegments = [
    { name: 'New Customers', count: Math.floor(totalCustomers * 0.6), percentage: 60, description: 'First-time buyers' },
    { name: 'Returning Customers', count: Math.floor(totalCustomers * 0.3), percentage: 30, description: 'Repeat purchasers' },
    { name: 'VIP Customers', count: Math.floor(totalCustomers * 0.1), percentage: 10, description: 'High-value customers' }
  ];

    console.log('Analytics summary:', {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      salesDataLength: salesData.length,
      topProductsLength: topProducts.length
    });

    res.json({ 
      success: true, 
      data: {
        balance: {
          available: totalRevenue * 0.85, // 85% available after fees
          pending: totalRevenue * 0.15,   // 15% pending
          total: totalRevenue,
          minimumWithdrawal: 10,
          commissionRate: 15
        },
        paymentMethods: [] // Would be fetched separately
      },
      salesData,
      topProducts,
      customerMetrics,
      revenueTrends,
      productPerformance,
      customerSegments,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      conversionRate,
      growthMetrics
    });
  } catch (error) {
    console.error('Error in getVendorAnalytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch analytics data',
      error: error.message 
    });
  }
};

const getVendorSalesAnalytics = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
    
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
    const productIds = vendorProducts.map(p => p._id);
    
    if (productIds.length === 0) {
      // No products, return empty but valid data structure
      return res.json({ success: true, salesAnalytics: [] });
    }
    
    const salesAnalytics = await Order.aggregate([
      {
        $match: {
          'products.product': { $in: productIds },
          createdAt: { $gte: startDate },
          paymentStatus: 'completed'
        }
      },
      { $unwind: '$products' },
      {
        $match: {
          'products.product': { $in: productIds }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: 1 },
          revenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Fill in missing dates with zero values for better chart display
    const dateRange = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();
    
    while (currentDate <= endDate) {
      dateRange.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const salesMap = new Map(salesAnalytics.map(item => [item._id, item]));
    const completeSalesData = dateRange.map(date => ({
      _id: date,
      sales: salesMap.get(date)?.sales || 0,
      revenue: salesMap.get(date)?.revenue || 0
    }));
    
    console.log('Sales Analytics Result:', completeSalesData);
    res.json({ success: true, salesAnalytics: completeSalesData });
  } catch (error) {
    console.error('Error in getVendorSalesAnalytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales analytics' });
  }
};

const getVendorProductsAnalytics = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
    
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get all products for this vendor (not just within period for better overview)
    const productsAnalytics = await Product.aggregate([
      {
        $match: {
          vendor: vendor._id
        }
      },
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Ensure all possible statuses are represented
    const allStatuses = ['pending', 'approved', 'rejected'];
    const statusMap = new Map(productsAnalytics.map(item => [item._id, item.count]));
    
    const statusCounts = allStatuses.map(status => ({
      status: status,
      count: statusMap.get(status) || 0
    }));
    
    console.log('Product Analytics Result:', statusCounts);
    res.json({ success: true, data: statusCounts });
  } catch (error) {
    console.error('Error in getVendorProductsAnalytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product analytics' });
  }
};

const getVendorCategoriesAnalytics = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
    
    const categoriesAnalytics = await Product.aggregate([
      {
        $match: { vendor: vendor._id }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalSales: { $sum: '$sales' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Ensure we return an array with proper structure
    const categoryData = categoriesAnalytics.map(item => ({
      _id: item._id || 'Unknown',
      count: item.count || 0,
      totalSales: item.totalSales || 0
    }));
    
    console.log('Categories Analytics Result:', categoryData);
    res.json({ success: true, data: categoryData });
  } catch (error) {
    console.error('Error in getVendorCategoriesAnalytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories analytics' });
  }
};

const getVendorTopProductsAnalytics = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) throw ErrorHandler.createBusinessError('Vendor account not found', 404);
    
    const { period = 30 } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get actual sales data from orders
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['delivered', 'completed'] }
        }
      },
      { $unwind: '$products' },
      {
        $lookup: {
          from: 'products',
          localField: 'products.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $match: {
          'productInfo.vendor': vendor._id
        }
      },
      {
        $group: {
          _id: '$products.product',
          totalSales: { $sum: '$products.quantity' },
          totalRevenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } },
          productName: { $first: '$productInfo.name' },
          productPrice: { $first: '$productInfo.price' },
          productCategory: { $first: '$productInfo.category' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);
    
    // If no sales data, get recent products instead
    if (salesData.length === 0) {
      const recentProducts = await Product.find({ vendor: vendor._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name price category createdAt');
      
      const topProducts = recentProducts.map(product => ({
        _id: product._id,
        name: product.name,
        price: product.price,
        category: product.category,
        sales: 0,
        totalSales: 0,
        totalRevenue: 0,
        productName: product.name,
        productPrice: product.price,
        productCategory: product.category
      }));
      
      return res.json({ success: true, topProducts });
    }
    
    // Format the sales data
    const topProducts = salesData.map(item => ({
      _id: item._id,
      name: item.productName,
      price: item.productPrice,
      category: item.productCategory,
      sales: item.totalSales,
      totalSales: item.totalSales,
      totalRevenue: item.totalRevenue,
      productName: item.productName,
      productPrice: item.productPrice,
      productCategory: item.productCategory
    }));
    
    res.json({ success: true, topProducts });
  } catch (error) {
    console.error('Error in getVendorTopProductsAnalytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch top products analytics' });
  }
};

const getAllVendorApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (status) query.status = status;
    
    const [applications, total] = await Promise.all([
      Vendor.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Vendor.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      applications,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateOrderProductStatusByVendor = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['processing', 'shipped', 'out-for-delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor account not found' });
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const product = await Product.findOne({ _id: productId, vendor: vendor._id });
    if (!product) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }
    
    const orderItem = order.products.find(item => 
      item.product.toString() === productId
    );
    
    if (!orderItem) {
      return res.status(404).json({ message: 'Product not found in order' });
    }
    
    orderItem.status = status;
    await order.save();
    
    await Notification.create({
      notificationId: `order-item-status-2-${order._id}-${productId}-${Date.now()}`,
      type: 'ORDER_STATUS_UPDATE',
      title: 'Order Item Status Updated',
      message: `Your order #${order._id.toString().slice(-8)} item "${product.name}" status has been updated to ${status}.`,
      category: 'order',
      data: {
        orderId: order._id.toString(),
        orderNumber: order._id.toString(),
        amount: order.totalAmount
      },
      recipients: [{
        userId: order.user,
        role: 'user'
      }]
    });
    
    res.json({ message: 'Product status updated successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin functions
const getAllVendors = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    const [vendors, total] = await Promise.all([
      Vendor.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Vendor.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      vendors,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('user', 'name email');
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }
    
    res.json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getVendorApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (status) query.status = status;
    
    const [applications, total] = await Promise.all([
      Vendor.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Vendor.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      applications,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateVendorApplicationStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const vendor = await Vendor.findById(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor application not found' });
    }
    
    vendor.status = status;
    vendor.approvalDate = new Date();
    vendor.approvedBy = req.user._id;
    
    if (reason) vendor.rejectionReason = reason;
    
    await vendor.save();
    
    // Update user role if approved
    if (status === 'approved') {
      await User.findByIdAndUpdate(vendor.user, { role: 'vendor' });
    }
    
    res.json({ success: true, message: `Vendor application ${status}`, vendor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createVendorByAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      businessName,
      businessDescription,
      businessAddress,
      contactInfo,
      businessType,
      taxId,
      bankInfo,
      categories,
      status,
      commissionRate
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'A user with this email already exists' 
      });
    }

    // Create user account
    const user = new User({
      name,
      email,
      password,
      role: 'vendor',
      isActive: true,
      isVerified: true
    });

    await user.save();

    // Create vendor profile
    const vendor = new Vendor({
      user: user._id,
      businessName,
      businessDescription,
      businessAddress,
      contactInfo: {
        ...contactInfo,
        email: email // Use the main email if contact email not provided
      },
      businessType,
      taxId,
      bankInfo,
      categories,
      status: status || 'approved',
      commissionRate: commissionRate || 10,
      approvalDate: new Date(),
      approvedBy: req.user._id
    });

    await vendor.save();

    // Create notification for the new vendor
    await Notification.create({
      notificationId: `vendor_created_${user._id}_${Date.now()}`,
      type: 'SYSTEM_ALERT',
      title: 'Vendor Account Created',
      message: `Welcome! Your vendor account has been created by admin.`,
      category: 'system',
      priority: 'medium',
      recipients: [{
        userId: user._id,
        role: 'vendor'
      }]
    });

    res.status(201).json({ 
      success: true, 
      message: 'Vendor created successfully', 
      vendor,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error creating vendor by admin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create vendor',
      error: error.message 
    });
  }
};

const deactivateVendorByAdmin = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }
    
    vendor.status = 'deactivated';
    vendor.deactivatedAt = new Date();
    vendor.deactivatedBy = req.user._id;
    
    await vendor.save();
    
    // Deactivate all products
    await Product.updateMany({ vendor: vendor._id }, { isActive: false });
    
    res.json({ success: true, message: 'Vendor deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getVendorActivityByAdmin = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId).populate('user', 'name email');
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }
    
    // Get vendor's product IDs
    const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
    const productIds = vendorProducts.map(p => p._id);
    
    // Count total products
    const totalProducts = productIds.length;
    
    // Calculate earnings from completed orders only
    const earningsAgg = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: 'completed',
          'products.product': { $in: productIds }
        } 
      },
      { $unwind: '$products' },
      { 
        $match: { 
          'products.product': { $in: productIds }
        } 
      },
      {
        $group: {
          _id: null,
          totalOrders: { $addToSet: '$_id' },
          totalEarnings: { 
            $sum: { 
              $multiply: [
                { $ifNull: ['$products.price', 0] }, 
                { $ifNull: ['$products.quantity', 1] }
              ] 
            } 
          }
        }
      }
    ]);
    
    const totalOrders = earningsAgg[0]?.totalOrders?.length || 0;
    const grossEarnings = earningsAgg[0]?.totalEarnings || 0;
    
    // Calculate net earnings after commission
    const commissionRate = vendor.commissionRate || 10; // Default 10%
    const netEarnings = grossEarnings * (1 - commissionRate / 100);

    // Get recent products
    const recentProducts = await Product.find({ vendor: vendor._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name approvalStatus');

    // Get recent orders
    const recentOrders = await Order.find({ 
      'products.product': { $in: productIds }
    })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('_id totalAmount status createdAt');

    res.json({
      success: true,
      vendor,
      stats: {
        totalProducts,
        totalOrders,
        totalEarnings: netEarnings,
        grossEarnings,
        commissionRate
      },
      products: recentProducts,
      orders: recentOrders
    });
  } catch (error) {
    console.error('Error in getVendorActivityByAdmin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getVendorStorePage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find vendor by ID
    const vendor = await Vendor.findById(id)
      .populate('user', 'name email')
      .select('-bankInfo -taxId -documents');
    
    if (!vendor || vendor.status !== 'approved') {
      return res.status(404).json({ 
        success: false, 
        error: 'Vendor store not found' 
      });
    }

    // Get vendor's active products
    const products = await Product.find({ 
      vendor: vendor._id, 
      isActive: true,
      approvalStatus: 'approved'
    })
    .sort({ createdAt: -1 })
    .limit(20);

    // Get vendor stats
    const totalProducts = await Product.countDocuments({ 
      vendor: vendor._id, 
      isActive: true,
      approvalStatus: 'approved'
    });

    const vendorStats = {
      totalProducts,
      totalSales: vendor.totalSales || 0,
      rating: vendor.rating || 0,
      joinedDate: vendor.createdAt
    };

    res.json({
      success: true,
      vendor: {
        _id: vendor._id,
        businessName: vendor.businessName,
        businessDescription: vendor.businessDescription,
        businessAddress: vendor.businessAddress,
        contactInfo: vendor.contactInfo,
        businessType: vendor.businessType,
        categories: vendor.categories,
        rating: vendor.rating,
        totalSales: vendor.totalSales,
        totalProducts: vendor.totalProducts,
        createdAt: vendor.createdAt,
        user: vendor.user
      },
      products,
      stats: vendorStats
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

const deleteVendorByAdmin = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw ErrorHandler.createBusinessError('Vendor not found', 404);
    }
    
    // Delete all products associated with this vendor
    await Product.deleteMany({ vendor: vendorId });
    
    // Delete the vendor
    await Vendor.findByIdAndDelete(vendorId);
    
    // Update user role back to customer
    await User.findByIdAndUpdate(vendor.user, { role: 'customer' });
    
    res.json({ success: true, message: 'Vendor deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  applyForVendor,
  getVendorProfile,
  updateVendorProfile,
  getVendorDashboard,
  getVendorProducts,
  addVendorProduct,
  addVendorAuctionProduct,
  getVendorProductById,
  updateVendorProduct,
  updateVendorProductStatus,
  bulkUpdateVendorProductStatus,
  bulkDeleteVendorProducts,
  deleteVendorProduct,
  getVendorOrders,
  updateVendorOrderItemStatus,
  getVendorOrderById,
  getVendorEarnings,
  vendorWithdraw,
  getVendorNotifications,
  markVendorNotificationRead,
  markAllVendorNotificationsRead,
  getVendorAnalytics,
  getVendorSalesAnalytics,
  getVendorProductsAnalytics,
  getVendorCategoriesAnalytics,
  getVendorTopProductsAnalytics,
  getAllVendorApplications,
  getAllVendors,
  getVendorById,
  getVendorApplications,
  updateVendorApplicationStatus,
  createVendorByAdmin,
  deactivateVendorByAdmin,
  getVendorActivityByAdmin,
  deleteVendorByAdmin,
  getVendorStorePage,
  updateOrderProductStatusByVendor
};
