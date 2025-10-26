// Example structure for bid controller
const Bid = require('../models/Bid');
const Product = require('../models/Product');
const notificationService = require('../services/notificationService');

const placeBid = async (req, res) => {
  try {
    const { productId, amount } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.mode !== 'auction') {
      return res.status(400).json({ message: 'This product is not available for bidding' });
    }
    if (!product.isAuctionActive()) {
      return res.status(400).json({ message: 'Auction is not active' });
    }
    const currentHighestBid = await Bid.getHighestBid(productId);
    const minBidAmount = currentHighestBid 
      ? currentHighestBid.amount + product.auction.minBidIncrement
      : product.auction.startingBid;
    if (amount < minBidAmount) {
      return res.status(400).json({ 
        message: `Bid must be at least $${minBidAmount}`,
        minBidAmount 
      });
    }
    const bid = new Bid({
      product: productId,
      bidder: req.user._id,
      amount
    });
    await bid.save();
    
    const isFirstBid = product.auction.totalBids === 0;
    
    product.auction.currentBid = amount;
    product.auction.totalBids += 1;
    await product.save();
    
    if (currentHighestBid) {
      currentHighestBid.isWinning = false;
      currentHighestBid.status = 'outbid';
      await currentHighestBid.save();
      
      // Notify previous highest bidder they've been outbid
      await notificationService.notifyOutbid(
        currentHighestBid.bidder,
        product.name,
        productId,
        amount,
        currentHighestBid.amount
      );
    }
    
    bid.isWinning = true;
    await bid.save();
    
    // Notify vendor if this is the first bid
    if (isFirstBid) {
      await notificationService.notifyFirstBid(
        product.vendor,
        product.name,
        productId,
        amount,
        req.user.name
      );
    }
    
    // Notify bidder their bid was placed successfully
    await notificationService.notifyBidPlaced(
      req.user._id,
      product.name,
      productId,
      amount
    );
    const io = req.app.get('io');
    
    // Debug logging
    console.log(`🔥 Emitting bid-update to room: auction-${productId}`);
    console.log(`📊 Bid details:`, {
      productId,
      currentBid: amount,
      bidder: req.user.name,
      timestamp: new Date()
    });
    
    // Get room info for debugging
    const room = io.sockets.adapter.rooms.get(`auction-${productId}`);
    console.log(`👥 Users in auction room: ${room ? room.size : 0}`);
    
    io.to(`auction-${productId}`).emit('bid-update', {
      productId,
      currentBid: amount,
      bidder: req.user.name,
      bidderId: req.user._id,
      timestamp: new Date()
    });
    res.status(201).json({
      message: 'Bid placed successfully',
      bid: {
        id: bid._id,
        amount: bid.amount,
        isWinning: bid.isWinning,
        placedAt: bid.placedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProductBidHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const bids = await Bid.getProductBids(productId);
    res.json(bids);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserBidHistory = async (req, res) => {
  try {
    const bids = await Bid.getUserBids(req.user._id);
    res.json(bids);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getHighestBid = async (req, res) => {
  try {
    const { productId } = req.params;
    const highestBid = await Bid.getHighestBid(productId);
    if (!highestBid) {
      return res.json({ message: 'No bids yet' });
    }
    res.json(highestBid);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const endAuction = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to end this auction' });
    }
    const highestBid = await Bid.getHighestBid(productId);
    if (highestBid) {
      product.auction.winner = highestBid.bidder;
      product.auction.status = 'ended';
      await product.save();
      highestBid.status = 'won';
      await highestBid.save();
      const io = req.app.get('io');
      io.to(`auction-${productId}`).emit('auction-ended', {
        productId,
        winner: highestBid.bidder,
        finalBid: highestBid.amount
      });
      res.json({
        message: 'Auction ended successfully',
        winner: highestBid.bidder,
        finalBid: highestBid.amount
      });
    } else {
      product.auction.status = 'ended';
      await product.save();
      res.json({ message: 'Auction ended with no bids' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserActiveBids = async (req, res) => {
  try {
    const activeBids = await Bid.find({
      bidder: req.user._id,
      status: 'active',
      isWinning: true
    }).populate('product', 'name images auction');
    res.json(activeBids);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  placeBid,
  getProductBidHistory,
  getUserBidHistory,
  getHighestBid,
  endAuction,
  getUserActiveBids,
}; 