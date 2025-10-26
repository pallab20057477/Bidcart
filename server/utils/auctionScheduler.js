const Product = require('../models/Product');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

class AuctionScheduler {
  constructor() {
    this.checkInterval = 30000; // Check every 30 seconds
    this.isRunning = false;
    this.io = null;
  }

  setIo(io) {
    this.io = io;
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('Auction scheduler started');

    this.checkAuctions();
    this.interval = setInterval(() => {
      this.checkAuctions();
    }, this.checkInterval);
  }

  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
    console.log('Auction scheduler stopped');
  }

  async checkAuctions() {
    try {
      // Check MongoDB connection
      const db = mongoose.connection;
      if (db.readyState !== 1) { // 1 = connected
        return;
      }

      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

      // Check for auctions that need to start
      const auctionsToStart = await Product.find({
        mode: 'auction',
        'auction.status': 'scheduled',
        'auction.startTime': { $lte: now },
        isActive: true
      });

      for (const auction of auctionsToStart) {
        await this.startAuction(auction);
      }

      // Check for auctions starting in 1 hour (notify once)
      const auctionsStartingSoon = await Product.find({
        mode: 'auction',
        'auction.status': 'scheduled',
        'auction.startTime': { $gte: now, $lte: oneHourFromNow },
        'auction.notifiedStartingSoon': { $ne: true },
        isActive: true
      });

      for (const auction of auctionsStartingSoon) {
        await this.notifyStartingSoon(auction);
      }

      // Check for auctions that need to end
      const auctionsToEnd = await Product.find({
        mode: 'auction',
        'auction.status': 'active',
        'auction.endTime': { $lte: now },
        isActive: true
      });

      for (const auction of auctionsToEnd) {
        await this.endAuction(auction);
      }

      // Check for auctions ending in 30 minutes (notify once)
      const auctionsEndingSoon = await Product.find({
        mode: 'auction',
        'auction.status': 'active',
        'auction.endTime': { $gte: now, $lte: thirtyMinutesFromNow },
        'auction.notifiedEndingSoon': { $ne: true },
        isActive: true
      });

      for (const auction of auctionsEndingSoon) {
        await this.notifyEndingSoon(auction);
      }

    } catch (error) {
      console.error('Auction scheduler error:', error.message);
      // If it's a connection error, try to reconnect
      if (error.name === 'MongoNotConnectedError' || error.name === 'MongoNetworkError') {
        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 5000
        });
      }
    }
  }

  async notifyStartingSoon(product) {
    try {
      const notificationService = require('../services/notificationService');
      await notificationService.notifyAuctionStartingSoon(
        product._id,
        product.name,
        product.auction.startTime,
        product.auction.startingBid
      );

      // Mark as notified to avoid duplicate notifications
      product.auction.notifiedStartingSoon = true;
      await product.save();

      console.log(`Notified: Auction starting soon - ${product.name}`);
    } catch (error) {
      console.error(`Error notifying starting soon ${product._id}:`, error.message);
    }
  }

  async notifyEndingSoon(product) {
    try {
      const minutesLeft = Math.round((product.auction.endTime - new Date()) / 60000);
      
      const notificationService = require('../services/notificationService');
      await notificationService.notifyAuctionEndingSoon(
        product._id,
        product.name,
        product.auction.currentBid || product.auction.startingBid,
        minutesLeft
      );

      // Mark as notified to avoid duplicate notifications
      product.auction.notifiedEndingSoon = true;
      await product.save();

      console.log(`Notified: Auction ending soon - ${product.name}`);
    } catch (error) {
      console.error(`Error notifying ending soon ${product._id}:`, error.message);
    }
  }

  async startAuction(product) {
    try {
      product.auction.status = 'active';
      await product.save();

      // Emit socket event to notify clients
      if (this.io) {
        this.io.emit('auctionStarted', {
          productId: product._id,
          message: `Auction for ${product.name} has started!`
        });
      }

      // Send notification that auction has started
      const notificationService = require('../services/notificationService');
      await notificationService.notifyAuctionStarted(
        product._id,
        product.name,
        product.auction.startingBid,
        product.vendor
      );

      console.log(`Auction started: ${product.name}`);
    } catch (error) {
      console.error(`Error starting auction ${product._id}:`, error.message);
    }
  }

  async endAuction(product) {
    try {
      product.auction.status = 'ended';

      // Set winner if there are bids
      let highestBid = null;
      if (product.auction.totalBids > 0) {
        // Find the highest bid
        const Bid = require('../models/Bid');
        highestBid = await Bid.findOne({ product: product._id })
          .sort({ amount: -1 })
          .populate('bidder', 'name email address');

        if (highestBid) {
          product.auction.winner = highestBid.bidder._id;
        }
      }

      await product.save();

      // Send notification to vendor that auction ended
      const notificationService = require('../services/notificationService');
      await notificationService.notifyAuctionEnded(
        product.vendor,
        product.name,
        product._id,
        highestBid ? highestBid.bidder.name : null,
        highestBid ? highestBid.amount : null,
        product.auction.totalBids
      );

      // Emit socket event to notify clients
      if (this.io) {
        this.io.emit('auctionEnded', {
          productId: product._id,
          message: `Auction for ${product.name} has ended!`,
          winner: product.auction.winner
        });
      }

      // When auction ends and winner is set, automatically create order
      if (product.auction.winner && highestBid) {
        try {
          const Order = require('../models/Order');
          const User = require('../models/User');

          // Get winner's details
          const winner = await User.findById(product.auction.winner);

          if (winner) {
            // Prepare shipping address (use user's address or default)
            const shippingAddress = winner.address || {
              street: 'To be provided',
              city: 'To be provided',
              state: 'To be provided',
              zipCode: '00000',
              country: 'To be provided',
              phone: winner.phone || 'To be provided'
            };

            // Create automatic order for auction winner
            const order = new Order({
              user: winner._id,
              products: [{
                product: product._id,
                vendor: product.vendor,
                quantity: 1,
                price: highestBid.amount,
                mode: 'auction',
                status: 'processing'
              }],
              totalAmount: highestBid.amount,
              status: 'pending',
              paymentStatus: 'pending',
              paymentMethod: 'razorpay', // Default, winner can update
              shippingAddress: shippingAddress,
              billingAddress: shippingAddress,
              shippingMethod: 'standard',
              shippingCost: 0, // Free shipping for auction winners
              taxAmount: highestBid.amount * 0.1, // 10% tax
              auctionDetails: {
                productId: product._id,
                winningBid: highestBid.amount,
                auctionEndTime: new Date()
              },
              notes: 'Automatic order created for auction winner'
            });

            const savedOrder = await order.save();

            // Send notification about order creation
            await Notification.create({
              notificationId: `auction-won-order-${product._id}-${winner._id}-${Date.now()}`,
              type: 'ORDER_STATUS_UPDATE',
              title: 'Auction Won! Order Created',
              message: `Congratulations! You won the auction for ${product.name}. Order #${savedOrder._id} has been created. Please complete payment.`,
              category: 'order',
              priority: 'high',
              data: {
                orderId: savedOrder._id.toString(),
                productId: product._id.toString(),
                productName: product.name,
                amount: highestBid.amount
              },
              recipients: [{
                userId: winner._id,
                role: 'user'
              }],
              actions: [{
                label: 'View Order',
                url: `/orders/${savedOrder._id}`,
                type: 'primary'
              }]
            });

            // Emit socket event for new order
            if (this.io) {
              this.io.to(winner._id.toString()).emit('order:created', {
                orderId: savedOrder._id,
                productName: product.name,
                amount: highestBid.amount
              });
            }

            console.log(`Automatic order created for auction winner: ${winner.name}, Order ID: ${savedOrder._id}`);
          }
        } catch (orderError) {
          console.error(`Error creating automatic order for auction ${product._id}:`, orderError.message);
          // Still send notification even if order creation fails
          await Notification.create({
            notificationId: `auction-won-${product._id}-${product.auction.winner}-${Date.now()}`,
            type: 'SYSTEM_ALERT',
            title: 'Auction Won!',
            message: `Congratulations! You won the auction for ${product.name}. Please proceed to checkout.`,
            category: 'order',
            priority: 'high',
            data: {
              productId: product._id.toString(),
              productName: product.name
            },
            recipients: [{
              userId: product.auction.winner,
              role: 'user'
            }],
            actions: [{
              label: 'View Product',
              url: `/products/${product._id}`,
              type: 'primary'
            }]
          });
        }
      }

      console.log(`Auction ended: ${product.name}`);
    } catch (error) {
      console.error(`Error ending auction ${product._id}:`, error.message);
    }
  }

  // Get upcoming auctions (starting within specified time)
  async getUpcomingAuctions(hours = 1) {
    try {
      const now = new Date();
      const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

      return await Product.find({
        mode: 'auction',
        'auction.status': 'scheduled',
        'auction.startTime': { $gt: now, $lte: futureTime },
        isActive: true
      })
        .populate('seller', 'name')
        .sort({ 'auction.startTime': 1 });
    } catch (error) {
      console.error('Error getting upcoming auctions:', error);
      return [];
    }
  }

  // Get active auctions
  async getActiveAuctions() {
    try {
      const now = new Date();

      return await Product.find({
        mode: 'auction',
        'auction.status': 'active',
        'auction.endTime': { $gt: now },
        isActive: true
      })
        .populate('seller', 'name')
        .sort({ 'auction.endTime': 1 });
    } catch (error) {
      console.error('Error getting active auctions:', error);
      return [];
    }
  }

  // Get scheduled auctions
  async getScheduledAuctions() {
    try {
      const now = new Date();

      return await Product.find({
        mode: 'auction',
        'auction.status': 'scheduled',
        'auction.startTime': { $gt: now },
        isActive: true
      })
        .populate('seller', 'name')
        .sort({ 'auction.startTime': 1 });
    } catch (error) {
      console.error('Error getting scheduled auctions:', error);
      return [];
    }
  }
}

module.exports = new AuctionScheduler(); 