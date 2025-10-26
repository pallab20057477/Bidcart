const VendorRequest = require('../models/VendorRequest');
const Vendor = require('../models/Vendor');
const User = require('../models/User');

const submitVendorRequest = async (req, res) => {
  try {
    // Support both legacy (message + businessDetails) and current frontend payload shape
    const {
      message,
      businessDetails,
      documents,
      bankInfo,
      categories,
      taxId,
      // Newer payload fields from frontend VendorApplication.jsx
      businessName,
      businessDescription,
      businessAddress,
      contactInfo,
      businessType,
    } = req.body;

    // Normalize businessDetails
    let parsedBusinessDetails = businessDetails;
    if (!parsedBusinessDetails) {
      parsedBusinessDetails = {
        businessName: businessName || undefined,
        businessType: businessType || undefined,
        businessAddress: businessAddress || undefined,
        phone: contactInfo?.phone || undefined,
        website: contactInfo?.website || undefined,
      };
    } else if (typeof businessDetails === 'string') {
      try {
        parsedBusinessDetails = JSON.parse(businessDetails);
      } catch (parseError) {
        return res.status(400).json({ message: 'Invalid business details format' });
      }
    }

    // Normalize message
    const finalMessage = message || businessDescription || 'Vendor application submitted';

    // Basic guards
    const existingRequest = await VendorRequest.findOne({ user: req.user._id, status: 'pending' });
    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending vendor request' });
    }

    const existingVendor = await Vendor.findOne({ user: req.user._id });
    if (existingVendor) {
      return res.status(400).json({ message: 'You are already a vendor' });
    }

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ message: 'At least one document is required' });
    }

    // Create request document
    const vendorRequest = new VendorRequest({
      user: req.user._id,
      message: finalMessage,
      businessDetails: parsedBusinessDetails,
      documents,
      bankInfo,
      categories,
      taxId
    });

    await vendorRequest.save();

    // Emit socket event to admins
    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('vendor-request:new', vendorRequest);
    }

    res.status(201).json({
      message: 'Vendor request submitted successfully',
      request: vendorRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMyVendorRequest = async (req, res) => {
  try {
    const request = await VendorRequest.findOne({ user: req.user._id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    if (!request) {
      return res.status(404).json({ message: 'No vendor request found' });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const debugAllVendorRequests = async (req, res) => {
  try {
    const requests = await VendorRequest.find({})
      .populate('user', 'name email')
      .lean();
    res.json({
      message: 'Debug data logged to console',
      count: requests.length,
      requests: requests.map(req => ({
        id: req._id,
        user: req.user?.name,
        businessDetails: req.businessDetails,
        status: req.status,
        createdAt: req.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllVendorRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    const requests = await VendorRequest.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await VendorRequest.countDocuments(filter);
    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getVendorRequestById = async (req, res) => {
  try {
    const request = await VendorRequest.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('adminResponse.respondedBy', 'name email');
    if (!request) {
      return res.status(404).json({ message: 'Vendor request not found' });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const approveVendorRequest = async (req, res) => {
  try {
    const { responseMessage } = req.body;
    const request = await VendorRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Vendor request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }
    await request.approve(req.user._id, responseMessage);
    const vendor = new Vendor({
      user: request.user,
      businessName: request.businessDetails?.businessName || 'Vendor Business',
      businessDescription: request.message,
      businessAddress: request.businessDetails?.businessAddress || {},
      contactInfo: {
        phone: request.businessDetails?.phone || '',
        email: request.user.email,
        website: request.businessDetails?.website || ''
      },
      businessType: request.businessDetails?.businessType || 'individual',
      status: 'approved',
      approvalDate: new Date(),
      approvedBy: req.user._id
    });
    await vendor.save();
    await User.findByIdAndUpdate(request.user, { role: 'vendor' });
    res.json({
      message: 'Vendor request approved successfully',
      request,
      vendor
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const rejectVendorRequest = async (req, res) => {
  try {
    const { responseMessage } = req.body;
    const request = await VendorRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Vendor request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }
    await request.reject(req.user._id, responseMessage);
    res.json({
      message: 'Vendor request rejected',
      request
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getVendorRequestStatsOverview = async (req, res) => {
  try {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const pending = await VendorRequest.countDocuments({ status: 'pending' });
    const approved = await VendorRequest.countDocuments({ status: 'approved', createdAt: { $gte: currentMonth } });
    const rejected = await VendorRequest.countDocuments({ status: 'rejected', createdAt: { $gte: currentMonth } });
    res.json({
      pending,
      approved,
      rejected
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  submitVendorRequest,
  getMyVendorRequest,
  debugAllVendorRequests,
  getAllVendorRequests,
  getVendorRequestById,
  approveVendorRequest,
  rejectVendorRequest,
  getVendorRequestStatsOverview,
};