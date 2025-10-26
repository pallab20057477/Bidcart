const AuctionRequest = require('../models/AuctionRequest');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

// Create a new auction request (with product creation)
const createAuctionRequest = async (req, res) => {
    try {
        console.log('📝 Creating auction request with data:', req.body);
        
        // Check if this is a product creation request (new flow) or existing product request (old flow)
        const isProductCreation = req.body.name && req.body.description && !req.body.productId;
        
        if (isProductCreation) {
            // New flow: Create product and auction request together
            return await createAuctionProductRequest(req, res);
        }
        
        // Old flow: Create auction request for existing product
        const {
            productId,
            requestedStartTime,
            requestedEndTime,
            startingBid,
            minBidIncrement,
            reservePrice,
            buyNowPrice,
            justification
        } = req.body;

        // Get vendor ID from user
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor account not found' });
        }

        // Validate product exists and belongs to vendor
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.vendor.toString() !== vendor._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized: Product does not belong to your vendor account' });
        }

        // Check if product already has a pending auction request
        const existingRequest = await AuctionRequest.findOne({
            product: productId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'Product already has a pending auction request' });
        }

        // Validate dates
        const startTime = new Date(requestedStartTime);
        const endTime = new Date(requestedEndTime);
        const now = new Date();

        if (startTime <= now) {
            return res.status(400).json({ message: 'Start time must be in the future' });
        }

        if (endTime <= startTime) {
            return res.status(400).json({ message: 'End time must be after start time' });
        }

        // Create auction request
        const auctionRequest = new AuctionRequest({
            vendor: vendor._id,
            product: productId,
            requestedStartTime: startTime,
            requestedEndTime: endTime,
            startingBid,
            minBidIncrement: minBidIncrement || 1,
            reservePrice,
            buyNowPrice,
            justification
        });

        await auctionRequest.save();

        // Update product to reference the auction request
        product.auction = {
            ...product.auction,
            auctionRequest: auctionRequest._id,
            status: 'pending-approval'
        };
        await product.save();

        await auctionRequest.populate(['vendor', 'product']);

        // Emit socket event to admins
        const io = req.app.get('io');
        if (io) {
            io.to('admins').emit('auction-request:submitted', {
                requestId: auctionRequest._id,
                vendorName: auctionRequest.vendor.businessName,
                productName: auctionRequest.product.name,
                startingBid: auctionRequest.startingBid,
                timestamp: new Date()
            });
        }

        res.status(201).json({
            message: 'Auction request created successfully',
            auctionRequest
        });

    } catch (error) {
        console.error('Error creating auction request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all auction requests (admin only)
const getAllAuctionRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        const filter = {};
        if (status) {
            filter.status = status;
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const auctionRequests = await AuctionRequest.find(filter)
            .populate({
                path: 'vendor',
                select: 'businessName email',
                match: { _id: { $exists: true } }
            })
            .populate({
                path: 'product',
                select: 'name images category price',
                match: { _id: { $exists: true } }
            })
            .populate('adminResponse.admin', 'name email')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .limit(limitNum)
            .skip(skip);

        // Filter out auction requests with null products or vendors
        const validAuctionRequests = auctionRequests.filter(request => 
            request && request.product && request.product._id && request.vendor && request.vendor._id
        );

        const total = await AuctionRequest.countDocuments(filter);

        console.log('📊 Admin auction requests - Found:', auctionRequests.length, 'Valid:', validAuctionRequests.length, 'Total:', total);

        res.json({
            docs: validAuctionRequests,
            auctionRequests: validAuctionRequests, // Add this for compatibility
            totalDocs: total,
            limit: limitNum,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            hasNextPage: pageNum < Math.ceil(total / limitNum),
            hasPrevPage: pageNum > 1
        });

    } catch (error) {
        console.error('Error fetching auction requests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get vendor's auction requests
const getVendorAuctionRequests = async (req, res) => {
    try {
        console.log('📋 Fetching vendor auction requests for user:', req.user._id);
        const { status, page = 1, limit = 10 } = req.query;

        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor) {
            console.log('❌ Vendor account not found for user:', req.user._id);
            return res.status(404).json({ 
                success: false,
                message: 'Vendor account not found' 
            });
        }

        console.log('✅ Found vendor:', vendor._id);

        const filter = { vendor: vendor._id };
        if (status && status !== 'all') {
            filter.status = status;
        }

        console.log('🔍 Searching with filter:', filter);

        const auctionRequests = await AuctionRequest.find(filter)
            .populate({
                path: 'product',
                select: 'name images category price',
                match: { _id: { $exists: true } } // Only populate if product exists
            })
            .populate('adminResponse.admin', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Filter out auction requests with null products (deleted products)
        const validAuctionRequests = auctionRequests.filter(request => 
            request && request.product && request.product._id
        );

        const total = await AuctionRequest.countDocuments(filter);

        console.log('📊 Found auction requests:', auctionRequests.length, 'Valid requests:', validAuctionRequests.length, 'Total:', total);

        res.json({
            success: true,
            auctionRequests: validAuctionRequests,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('❌ Error fetching vendor auction requests:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get single auction request
const getAuctionRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const auctionRequest = await AuctionRequest.findById(id)
            .populate('vendor', 'businessName email')
            .populate('product')
            .populate('adminResponse.admin', 'name email');

        if (!auctionRequest) {
            return res.status(404).json({ message: 'Auction request not found' });
        }

        // Check if user has permission to view this request
        if (req.user.role !== 'admin') {
            const vendor = await Vendor.findOne({ user: req.user._id });
            if (!vendor || auctionRequest.vendor._id.toString() !== vendor._id.toString()) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
        }

        res.json(auctionRequest);

    } catch (error) {
        console.error('Error fetching auction request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Approve auction request (admin only)
const approveAuctionRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            startTime,
            endTime,
            startingBid,
            minBidIncrement,
            reservePrice,
            buyNowPrice,
            message
        } = req.body;

        const auctionRequest = await AuctionRequest.findById(id).populate('product');

        if (!auctionRequest) {
            return res.status(404).json({ message: 'Auction request not found' });
        }

        if (auctionRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Auction request is not pending' });
        }

        // Validate approved auction details
        const approvedStartTime = new Date(startTime);
        const approvedEndTime = new Date(endTime);
        const now = new Date();

        if (approvedStartTime <= now) {
            return res.status(400).json({ message: 'Approved start time must be in the future' });
        }

        if (approvedEndTime <= approvedStartTime) {
            return res.status(400).json({ message: 'Approved end time must be after start time' });
        }

        const auctionDetails = {
            startTime: approvedStartTime,
            endTime: approvedEndTime,
            startingBid,
            minBidIncrement,
            reservePrice,
            buyNowPrice
        };

        // Approve the request
        await auctionRequest.approve(req.user.id, auctionDetails, message);

        // Update the product with approved auction details
        const product = auctionRequest.product;
        product.auction = {
            ...product.auction,
            startTime: approvedStartTime,
            endTime: approvedEndTime,
            startingBid,
            currentBid: startingBid,
            minBidIncrement,
            reservePrice,
            buyNowPrice,
            status: 'scheduled',
            approvalStatus: 'approved',
            scheduledBy: req.user.id
        };
        product.mode = 'auction';
        product.isActive = true; // Activate the product
        product.approvalStatus = 'approved'; // Approve the product
        
        console.log('💾 Saving product with:', {
            id: product._id,
            name: product.name,
            mode: product.mode,
            isActive: product.isActive,
            approvalStatus: product.approvalStatus,
            auctionStatus: product.auction.status
        });
        
        await product.save();
        
        console.log('✅ Product saved successfully');

        await auctionRequest.populate(['vendor', 'product', 'adminResponse.admin']);

        // Emit socket event to vendor
        const io = req.app.get('io');
        if (io) {
            io.to(auctionRequest.vendor._id.toString()).emit('auction-request:approved', {
                requestId: auctionRequest._id,
                productName: auctionRequest.product.name,
                startTime: approvedStartTime,
                endTime: approvedEndTime,
                message: message || 'Your auction request has been approved',
                timestamp: new Date()
            });
        }

        res.json({
            message: 'Auction request approved successfully',
            auctionRequest
        });

    } catch (error) {
        console.error('Error approving auction request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Reject auction request (admin only)
const rejectAuctionRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Rejection message is required' });
        }

        const auctionRequest = await AuctionRequest.findById(id).populate('product');

        if (!auctionRequest) {
            return res.status(404).json({ message: 'Auction request not found' });
        }

        if (auctionRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Auction request is not pending' });
        }

        // Reject the request
        await auctionRequest.reject(req.user.id, message);

        // Update product status
        const product = auctionRequest.product;
        if (product.auction) {
            product.auction.status = 'rejected';
            product.auction.approvalStatus = 'rejected';
            await product.save();
        }

        await auctionRequest.populate(['vendor', 'product', 'adminResponse.admin']);

        // Emit socket event to vendor
        const io = req.app.get('io');
        if (io) {
            io.to(auctionRequest.vendor._id.toString()).emit('auction-request:rejected', {
                requestId: auctionRequest._id,
                productName: auctionRequest.product.name,
                reason: message,
                timestamp: new Date()
            });
        }

        res.json({
            message: 'Auction request rejected successfully',
            auctionRequest
        });

    } catch (error) {
        console.error('Error rejecting auction request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update auction request (vendor only, before approval)
const updateAuctionRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            requestedStartTime,
            requestedEndTime,
            startingBid,
            minBidIncrement,
            reservePrice,
            buyNowPrice,
            justification
        } = req.body;

        const auctionRequest = await AuctionRequest.findById(id);

        if (!auctionRequest) {
            return res.status(404).json({ message: 'Auction request not found' });
        }

        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor || auctionRequest.vendor.toString() !== vendor._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (auctionRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Cannot update non-pending auction request' });
        }

        // Validate dates if provided
        if (requestedStartTime || requestedEndTime) {
            const startTime = new Date(requestedStartTime || auctionRequest.requestedStartTime);
            const endTime = new Date(requestedEndTime || auctionRequest.requestedEndTime);
            const now = new Date();

            if (startTime <= now) {
                return res.status(400).json({ message: 'Start time must be in the future' });
            }

            if (endTime <= startTime) {
                return res.status(400).json({ message: 'End time must be after start time' });
            }
        }

        // Update fields
        const updateFields = {};
        if (requestedStartTime) updateFields.requestedStartTime = requestedStartTime;
        if (requestedEndTime) updateFields.requestedEndTime = requestedEndTime;
        if (startingBid !== undefined) updateFields.startingBid = startingBid;
        if (minBidIncrement !== undefined) updateFields.minBidIncrement = minBidIncrement;
        if (reservePrice !== undefined) updateFields.reservePrice = reservePrice;
        if (buyNowPrice !== undefined) updateFields.buyNowPrice = buyNowPrice;
        if (justification) updateFields.justification = justification;

        const updatedRequest = await AuctionRequest.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        ).populate(['vendor', 'product']);

        res.json({
            message: 'Auction request updated successfully',
            auctionRequest: updatedRequest
        });

    } catch (error) {
        console.error('Error updating auction request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete auction request (vendor only, before approval)
const deleteAuctionRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const auctionRequest = await AuctionRequest.findById(id).populate('product');

        if (!auctionRequest) {
            return res.status(404).json({ message: 'Auction request not found' });
        }

        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor || auctionRequest.vendor.toString() !== vendor._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (auctionRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Cannot delete non-pending auction request' });
        }

        // Remove auction request reference from product
        const product = auctionRequest.product;
        if (product.auction && product.auction.auctionRequest) {
            product.auction.auctionRequest = undefined;
            product.auction.status = undefined;
            await product.save();
        }

        await AuctionRequest.findByIdAndDelete(id);

        res.json({ message: 'Auction request deleted successfully' });

    } catch (error) {
        console.error('Error deleting auction request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get auction request statistics (admin only)
const getAuctionRequestStats = async (req, res) => {
    try {
        const stats = await AuctionRequest.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalRequests = await AuctionRequest.countDocuments();
        const recentRequests = await AuctionRequest.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        const formattedStats = {
            total: totalRequests,
            recent: recentRequests,
            byStatus: stats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {})
        };

        res.json(formattedStats);

    } catch (error) {
        console.error('Error fetching auction request stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create auction request with product creation
const createAuctionProductRequest = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            category,
            brand,
            condition,
            stock,
            tags,
            images,
            auction
        } = req.body;

        console.log('🏭 Creating product and auction request together');

        // Get vendor ID from user
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor) {
            return res.status(404).json({ 
                success: false,
                message: 'Vendor account not found' 
            });
        }

        // Create the product first
        const product = new Product({
            name,
            description,
            price,
            category,
            brand,
            condition,
            stock,
            tags: tags || [],
            images: images || [],
            seller: req.user._id, // Required field - the user who created the product
            vendor: vendor._id,
            mode: 'auction',
            isActive: false, // Will be activated when auction is approved
            approvalStatus: 'pending', // Product needs approval
            auction: {
                startTime: auction.startTime,
                endTime: auction.endTime,
                startingBid: auction.startingBid,
                currentBid: auction.startingBid,
                minBidIncrement: auction.minBidIncrement || 1,
                reservePrice: 0,
                buyNowPrice: 0,
                status: 'pending-approval' // Correct enum value
            }
        });

        await product.save();
        console.log('✅ Product created:', product._id);

        // Create the auction request
        const auctionRequest = new AuctionRequest({
            vendor: vendor._id,
            product: product._id,
            requestedStartTime: auction.startTime,
            requestedEndTime: auction.endTime,
            startingBid: auction.startingBid,
            minBidIncrement: auction.minBidIncrement || 1,
            reservePrice: 0,
            buyNowPrice: 0,
            justification: req.body.justification || `Auction request for new product: ${name}`,
            status: 'pending'
        });

        await auctionRequest.save();
        console.log('✅ Auction request created:', auctionRequest._id);

        // Link auction request to product
        product.auction.auctionRequest = auctionRequest._id;
        await product.save();

        await auctionRequest.populate(['vendor', 'product']);

        console.log('🎉 Auction product request created successfully');

        res.status(201).json({
            success: true,
            message: 'Auction request submitted successfully',
            auctionRequest,
            product
        });

    } catch (error) {
        console.error('❌ Error creating auction product request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create auction request',
            error: error.message
        });
    }
};

module.exports = {
    createAuctionRequest,
    createAuctionProductRequest,
    getAllAuctionRequests,
    getVendorAuctionRequests,
    getAuctionRequest,
    approveAuctionRequest,
    rejectAuctionRequest,
    updateAuctionRequest,
    deleteAuctionRequest,
    getAuctionRequestStats
};