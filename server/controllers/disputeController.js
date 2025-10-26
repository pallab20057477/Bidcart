const Dispute = require('../models/Dispute');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const createDispute = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Missing required fields: title, description, and category are required' });
    }
    

    
    // Simplified - no automatic respondent assignment
    // Admins will assign respondents manually as needed
    
    // Handle file uploads (evidence)
    const evidence = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        evidence.push({
          type: file.mimetype.startsWith('image/') ? 'image' : 'document',
          url: `/uploads/disputes/${file.filename}`,
          filename: file.filename,
          originalName: file.originalname,
          uploadedBy: req.user.id
        });
      });
    }
    
    // Create dispute - respondent will be assigned by admin
    const dispute = new Dispute({
      title,
      description,
      complainant: req.user.id,
      respondent: null, // Will be assigned by admin
      category,
      priority: priority || 'medium',
      evidence
    });
    
    await dispute.save();
    
    // Populate the dispute before sending response
    await dispute.populate('complainant respondent', 'name email');
    
    res.status(201).json({ 
      message: 'Dispute created successfully',
      dispute 
    });
  } catch (error) {
    console.error('Error creating dispute:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserDisputes = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    const query = {
      $or: [
        { complainant: req.user.id },
        { respondent: req.user.id }
      ]
    };
    if (status) query.status = status;
    if (category) query.category = category;
    const disputes = await Dispute.find(query)
      .populate('complainant respondent', 'name email')
      .populate('order', 'orderNumber totalAmount')
      .populate('product', 'name images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Dispute.countDocuments(query);
    res.json({
      disputes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('complainant respondent', 'name email')
      .populate('order', 'orderNumber totalAmount status')
      .populate('product', 'name images price')
      .populate('messages.sender', 'name email role')
      .populate('resolvedBy', 'name email role');
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    
    // Check authorization - handle null respondent
    const isComplainant = dispute.complainant && dispute.complainant._id.toString() === req.user.id;
    const isRespondent = dispute.respondent && dispute.respondent._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isComplainant && !isRespondent && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(dispute);
  } catch (error) {
    console.error('Error fetching dispute:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const addDisputeMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    
    // Check authorization - handle null respondent
    const isComplainant = dispute.complainant && dispute.complainant.toString() === req.user.id;
    const isRespondent = dispute.respondent && dispute.respondent.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isComplainant && !isRespondent && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    dispute.messages.push({
      sender: req.user.id,
      message,
      attachments: [] // No file attachments for messages
    });
    await dispute.save();
    await dispute.populate('messages.sender', 'name email role');
    
    // Real-time update for dispute messages
    const io = req.app.get('io');
    if (io) {
      const newMessage = dispute.messages[dispute.messages.length - 1];
      
      // Emit to specific dispute room
      io.to(`dispute-${dispute._id}`).emit('dispute-message-received', {
        disputeId: dispute._id,
        message: newMessage
      });
      
      // Emit to individual user rooms for notifications
      if (dispute.complainant) {
        io.to(dispute.complainant.toString()).emit('dispute-notification', {
          type: 'new_message',
          disputeId: dispute._id,
          disputeTitle: dispute.title,
          message: 'New message in your dispute'
        });
      }
      if (dispute.respondent) {
        io.to(dispute.respondent.toString()).emit('dispute-notification', {
          type: 'new_message',
          disputeId: dispute._id,
          disputeTitle: dispute.title,
          message: 'New message in your dispute'
        });
      }
      
      // Emit to admin monitoring room
      io.to('disputes-monitoring').emit('dispute-activity', {
        type: 'new_message',
        disputeId: dispute._id,
        disputeTitle: dispute.title,
        activity: `New message from ${req.user.name}`
      });
    }
    res.json({
      message: 'Message added successfully',
      newMessage: dispute.messages[dispute.messages.length - 1]
    });
  } catch (error) {
    console.error('Error adding dispute message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const addDisputeEvidence = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    
    // Check authorization - handle null respondent
    const isComplainant = dispute.complainant && dispute.complainant.toString() === req.user.id;
    const isRespondent = dispute.respondent && dispute.respondent.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isComplainant && !isRespondent && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { evidence } = req.body;
    if (!evidence || !Array.isArray(evidence) || evidence.length === 0) {
      return res.status(400).json({ message: 'No evidence provided' });
    }
    dispute.evidence.push(...evidence);
    await dispute.save();
    res.json({
      message: 'Evidence added successfully',
      evidence: evidence
    });
  } catch (error) {
    console.error('Error adding dispute evidence:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateDisputeStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    dispute.status = status;
    if (notes) {
      dispute.internalNotes = notes;
    }
    await dispute.save();
    
    // Real-time update for dispute status
    const io = req.app.get('io');
    if (io) {
      // Emit to specific dispute room
      io.to(`dispute-${dispute._id}`).emit('dispute-status-changed', {
        disputeId: dispute._id,
        status: dispute.status,
        updatedBy: req.user.name
      });
      
      // Emit to individual user rooms for notifications
      if (dispute.complainant) {
        io.to(dispute.complainant.toString()).emit('dispute-notification', {
          type: 'status_change',
          disputeId: dispute._id,
          disputeTitle: dispute.title,
          status: dispute.status,
          message: `Dispute status changed to ${dispute.status.replace('_', ' ')}`
        });
      }
      if (dispute.respondent) {
        io.to(dispute.respondent.toString()).emit('dispute-notification', {
          type: 'status_change',
          disputeId: dispute._id,
          disputeTitle: dispute.title,
          status: dispute.status,
          message: `Dispute status changed to ${dispute.status.replace('_', ' ')}`
        });
      }
      
      // Emit to admin monitoring room
      io.to('disputes-monitoring').emit('dispute-activity', {
        type: 'status_change',
        disputeId: dispute._id,
        disputeTitle: dispute.title,
        status: dispute.status,
        activity: `Status changed to ${dispute.status.replace('_', ' ')} by ${req.user.name}`
      });
    }
    
    res.json({
      message: 'Dispute status updated successfully',
      dispute
    });
  } catch (error) {
    console.error('Error updating dispute status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const resolveDispute = async (req, res) => {
  try {
    const { resolution, resolutionAmount, resolutionNotes } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    await dispute.resolve(resolution, resolutionAmount, resolutionNotes, req.user.id);
    if (resolution === 'refund_full' || resolution === 'refund_partial') {
      // Integrate with payment system to process refunds if needed
    }
    if (resolution === 'account_suspended' && dispute.respondent) {
      const userToSuspend = dispute.respondent;
      await User.findByIdAndUpdate(userToSuspend, { 
        status: 'suspended',
        suspendedAt: Date.now(),
        suspensionReason: `Dispute resolution: ${resolutionNotes}`
      });
    }
    await dispute.populate('complainant respondent', 'name email');
    
    // Real-time update for dispute resolution
    const io = req.app.get('io');
    if (io) {
      // Emit to specific dispute room
      io.to(`dispute-${dispute._id}`).emit('dispute-resolved', {
        disputeId: dispute._id,
        resolution: dispute.resolution,
        resolutionNotes: dispute.resolutionNotes,
        resolvedBy: req.user.name
      });
      
      // Emit to individual user rooms for notifications
      if (dispute.complainant) {
        io.to(dispute.complainant.toString()).emit('dispute-notification', {
          type: 'resolved',
          disputeId: dispute._id,
          disputeTitle: dispute.title,
          resolution: dispute.resolution,
          message: `Your dispute has been resolved: ${resolution.replace('_', ' ')}`
        });
      }
      if (dispute.respondent) {
        io.to(dispute.respondent.toString()).emit('dispute-notification', {
          type: 'resolved',
          disputeId: dispute._id,
          disputeTitle: dispute.title,
          resolution: dispute.resolution,
          message: `Dispute has been resolved: ${resolution.replace('_', ' ')}`
        });
      }
      
      // Emit to admin monitoring room
      io.to('disputes-monitoring').emit('dispute-activity', {
        type: 'resolved',
        disputeId: dispute._id,
        disputeTitle: dispute.title,
        resolution: dispute.resolution,
        activity: `Dispute resolved with ${resolution.replace('_', ' ')} by ${req.user.name}`
      });
    }
    
    res.json({
      message: 'Dispute resolved successfully',
      dispute
    });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const escalateDispute = async (req, res) => {
  try {
    const { escalationReason } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    await dispute.escalate(escalationReason, req.user.id);
    
    // Real-time update for dispute escalation
    const io = req.app.get('io');
    if (io) {
      // Emit to specific dispute room
      io.to(`dispute-${dispute._id}`).emit('dispute-escalated', {
        disputeId: dispute._id,
        escalationReason: dispute.escalationReason,
        escalatedBy: req.user.name
      });
      
      // Emit to individual user rooms for notifications
      if (dispute.complainant) {
        io.to(dispute.complainant.toString()).emit('dispute-notification', {
          type: 'escalated',
          disputeId: dispute._id,
          disputeTitle: dispute.title,
          message: 'Your dispute has been escalated for further review'
        });
      }
      if (dispute.respondent) {
        io.to(dispute.respondent.toString()).emit('dispute-notification', {
          type: 'escalated',
          disputeId: dispute._id,
          disputeTitle: dispute.title,
          message: 'Dispute has been escalated for further review'
        });
      }
      
      // Emit to admin monitoring room
      io.to('disputes-monitoring').emit('dispute-activity', {
        type: 'escalated',
        disputeId: dispute._id,
        disputeTitle: dispute.title,
        escalationReason: dispute.escalationReason,
        activity: `Dispute escalated by ${req.user.name}: ${escalationReason}`
      });
    }
    res.json({
      message: 'Dispute escalated successfully',
      dispute
    });
  } catch (error) {
    console.error('Error escalating dispute:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllDisputesAdmin = async (req, res) => {
  try {
    const { status, priority, category, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { disputeId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const disputes = await Dispute.find(query)
      .populate('complainant respondent', 'name email')
      .populate({
        path: 'order',
        select: 'orderNumber totalAmount vendor',
        populate: {
          path: 'vendor',
          select: 'name email'
        }
      })
      .populate({
        path: 'product',
        select: 'name images vendor',
        populate: {
          path: 'vendor',
          select: 'name email'
        }
      })
      .populate({
        path: 'auction',
        select: 'title seller',
        populate: {
          path: 'seller',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Dispute.countDocuments(query);
    res.json({
      disputes,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching admin disputes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getDisputeStats = async (req, res) => {
  try {
    const stats = await Dispute.getStats();
    const overdueDisputes = await Dispute.getOverdueDisputes();
    const totalDisputes = await Dispute.countDocuments();
    const openDisputes = await Dispute.countDocuments({ status: 'open' });
    const resolvedDisputes = await Dispute.countDocuments({ status: 'resolved' });
    res.json({
      stats,
      totalDisputes,
      openDisputes,
      resolvedDisputes,
      overdueDisputes: overdueDisputes.length,
      overdueDisputesList: overdueDisputes
    });
  } catch (error) {
    console.error('Error fetching dispute stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const assignRespondent = async (req, res) => {
  try {
    const { respondentId } = req.body;
    
    if (!respondentId) {
      return res.status(400).json({ message: 'Respondent ID is required' });
    }
    
    // Validate respondent exists
    const respondent = await User.findById(respondentId);
    if (!respondent) {
      return res.status(404).json({ message: 'Respondent not found' });
    }
    
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    
    // Update respondent
    dispute.respondent = respondentId;
    await dispute.save();
    
    // Populate for response
    await dispute.populate('complainant respondent', 'name email');
    
    // Real-time notification
    const io = req.app.get('io');
    if (io) {
      // Notify the newly assigned respondent
      io.to(respondentId.toString()).emit('dispute-notification', {
        type: 'assigned',
        disputeId: dispute._id,
        disputeTitle: dispute.title,
        message: 'You have been assigned to a dispute'
      });
      
      // Notify complainant
      if (dispute.complainant) {
        io.to(dispute.complainant.toString()).emit('dispute-notification', {
          type: 'respondent_assigned',
          disputeId: dispute._id,
          disputeTitle: dispute.title,
          message: `${respondent.name} has been assigned to your dispute`
        });
      }
      
      // Notify admin monitoring
      io.to('disputes-monitoring').emit('dispute-activity', {
        type: 'respondent_assigned',
        disputeId: dispute._id,
        disputeTitle: dispute.title,
        activity: `${respondent.name} assigned as respondent by ${req.user.name}`
      });
    }
    
    res.json({
      message: 'Respondent assigned successfully',
      dispute
    });
  } catch (error) {
    console.error('Error assigning respondent:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteDispute = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    dispute.evidence.forEach(evidence => {
      const filePath = path.join(__dirname, '..', evidence.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    await Dispute.findByIdAndDelete(req.params.id);
    res.json({ message: 'Dispute deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get disputes by orders (for user's order history)
const getDisputesByOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's orders
    const orders = await Order.find({ user: userId }).select('_id');
    const orderIds = orders.map(order => order._id);
    
    // Get disputes related to these orders
    const disputes = await Dispute.find({
      $or: [
        { complainant: userId },
        { respondent: userId },
        { order: { $in: orderIds } }
      ]
    })
    .populate('complainant', 'name email')
    .populate('respondent', 'name email')
    .populate('order', 'orderNumber totalAmount')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      disputes
    });
  } catch (error) {
    console.error('Error fetching disputes by orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch disputes'
    });
  }
};

module.exports = {
  createDispute,
  getUserDisputes,
  getDisputesByOrders,
  getDisputeById,
  addDisputeMessage,
  addDisputeEvidence,
  updateDisputeStatus,
  resolveDispute,
  escalateDispute,
  getAllDisputesAdmin,
  getDisputeStats,
  assignRespondent,
  deleteDispute,
}; 