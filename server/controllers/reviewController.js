const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

const submitReview = async (req, res) => {
  try {
    const { product: productId, rating, title, comment, images, order: orderId } = req.body;
    const userId = req.user._id;
    if (!productId || !rating || !title || !comment) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }
    let order = null;
    let deliveredProduct = null;
    
    if (orderId) {
      // If specific order ID is provided, check that order
      order = await Order.findOne({
        _id: orderId,
        user: userId,
        'products.product': productId
      });
      
      if (order) {
        deliveredProduct = order.products.find(
          item => item.product.toString() === productId && item.status === 'delivered'
        );
      }
    } else {
      // Find any order with this product that has been delivered
      const orders = await Order.find({
        user: userId,
        'products.product': productId
      });
      
      for (const foundOrder of orders) {
        const orderProduct = foundOrder.products.find(
          item => item.product.toString() === productId && item.status === 'delivered'
        );
        
        if (orderProduct) {
          order = foundOrder;
          deliveredProduct = orderProduct;
          break;
        }
      }
    }
    
    if (!order || !deliveredProduct) {
      return res.status(400).json({ message: 'You can only review products that have been delivered to you' });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const review = new Review({
      user: userId,
      product: productId,
      vendor: product.vendor,
      order: order._id,
      rating,
      title,
      comment,
      images: images || [],
      status: 'approved'
    });
    await review.save();
    const ratingResult = await Review.getProductAverageRating(productId);
    if (ratingResult.length > 0) {
      const { average, count } = ratingResult[0];
      await Product.findByIdAndUpdate(productId, { rating: { average, count } });
    }
    if (req.app.get('io')) {
      req.app.get('io').emit('new_review', {
        productId,
        review: {
          _id: review._id,
          rating,
          title,
          comment,
          user: {
            _id: req.user._id,
            name: req.user.name,
            avatar: req.user.avatar
          }
        }
      });
    }
    await review.populate('user', 'name avatar');
    res.status(201).json({
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Fetch reviews with virtuals included
    const reviews = await Review.find({ product: productId, status: 'approved' })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Ensure virtual properties are included in the response
    const reviewsWithCounts = reviews.map(review => ({
      ...review.toObject({ virtuals: true }),
      helpfulCount: review.helpfulCount || 0,
      notHelpfulCount: review.notHelpfulCount || 0,
    }));

    const avg = await Review.getProductAverageRating(productId);

    res.json({
      reviews: reviewsWithCounts,
      averageRating: avg[0]?.average || 0,
      reviewCount: avg[0]?.count || 0,
      currentPage: page,
      totalPages: Math.ceil((avg[0]?.count || 0) / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const checkReviewEligibility = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    
    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      return res.json({
        canReview: false,
        message: 'You have already reviewed this product'
      });
    }
    
    // Find orders containing this product for the user
    const orders = await Order.find({
      user: userId,
      'products.product': productId
    }).populate('products.product');
    
    if (!orders || orders.length === 0) {
      return res.json({
        canReview: false,
        message: 'You can only review products that you have purchased'
      });
    }
    
    // Check if any of the product instances in any order are delivered
    let deliveredProduct = null;
    let deliveredOrder = null;
    
    for (const order of orders) {
      const orderProduct = order.products.find(
        item => item.product._id.toString() === productId && item.status === 'delivered'
      );
      
      if (orderProduct) {
        deliveredProduct = orderProduct;
        deliveredOrder = order;
        break;
      }
    }
    
    if (!deliveredProduct) {
      return res.json({
        canReview: false,
        message: 'You can only review products that have been delivered to you'
      });
    }
    
    res.json({
      canReview: true,
      orderInfo: {
        _id: deliveredOrder._id,
        deliveredAt: deliveredOrder.updatedAt,
        product: deliveredProduct
      }
    });
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name images')
      .sort({ createdAt: -1 });
    res.json({
      reviews,
      count: reviews.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { helpful } = req.body;
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    await review.markHelpful(req.user._id, helpful);
    res.json({
      message: 'Review marked as helpful',
      helpfulCount: review.helpfulCount,
      notHelpfulCount: review.notHelpfulCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  submitReview,
  getProductReviews,
  checkReviewEligibility,
  getUserReviews,
  markReviewHelpful,
}; 