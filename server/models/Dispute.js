const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'document', 'screenshot', 'other'],
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  attachments: [evidenceSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const disputeSchema = new mongoose.Schema({
  // Basic Information
  disputeId: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Parties Involved
  complainant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  respondent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  
  // Related Items
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction'
  },
  
  // Dispute Details
  category: {
    type: String,
    enum: [
      'delivery_issue',
      'fake_bidding',
      'item_not_as_described',
      'payment_issue',
      'refund_request',
      'seller_misconduct',
      'buyer_misconduct',
      'technical_issue',
      'other'
    ],
    required: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  status: {
    type: String,
    enum: [
      'open',
      'under_review',
      'evidence_required',
      'admin_review',
      'resolved',
      'closed',
      'escalated'
    ],
    default: 'open'
  },
  
  // Resolution Details
  resolution: {
    type: String,
    enum: [
      'refund_full',
      'refund_partial',
      'replacement',
      'compensation',
      'warning_issued',
      'account_suspended',
      'dispute_dismissed',
      'mediation_required'
    ]
  },
  
  resolutionAmount: {
    type: Number,
    min: 0
  },
  
  resolutionNotes: {
    type: String
  },
  
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  resolvedAt: {
    type: Date
  },
  
  // Evidence and Communication
  evidence: [evidenceSchema],
  messages: [messageSchema],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Escalation
  escalatedAt: {
    type: Date
  },
  
  escalatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  escalationReason: {
    type: String
  },
  
  // Auto-resolution
  autoResolveAt: {
    type: Date
  },
  
  // Tags for categorization
  tags: [{
    type: String
  }],
  
  // Internal notes (admin only)
  internalNotes: {
    type: String
  }
});

// Generate dispute ID
disputeSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.disputeId = `DIS-${Date.now()}-${count + 1}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Indexes for better performance
disputeSchema.index({ status: 1, priority: 1, createdAt: -1 });
disputeSchema.index({ complainant: 1, status: 1 });
disputeSchema.index({ respondent: 1, status: 1 });

// Virtual for time since creation
disputeSchema.virtual('timeSinceCreation').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for is overdue (more than 7 days)
disputeSchema.virtual('isOverdue').get(function() {
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return this.status === 'open' && (Date.now() - this.createdAt.getTime()) > sevenDays;
});

// Methods
disputeSchema.methods.addMessage = function(senderId, message, attachments = []) {
  this.messages.push({
    sender: senderId,
    message,
    attachments
  });
  return this.save();
};

disputeSchema.methods.addEvidence = function(evidence) {
  this.evidence.push(evidence);
  return this.save();
};

disputeSchema.methods.resolve = function(resolution, resolutionAmount, resolutionNotes, resolvedBy) {
  this.status = 'resolved';
  this.resolution = resolution;
  this.resolutionAmount = resolutionAmount;
  this.resolutionNotes = resolutionNotes;
  this.resolvedBy = resolvedBy;
  this.resolvedAt = Date.now();
  return this.save();
};

disputeSchema.methods.escalate = function(reason, escalatedBy) {
  this.status = 'escalated';
  this.escalationReason = reason;
  this.escalatedBy = escalatedBy;
  this.escalatedAt = Date.now();
  return this.save();
};

// Static methods
disputeSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgResolutionTime: {
          $avg: {
            $cond: [
              { $eq: ['$status', 'resolved'] },
              { $subtract: ['$resolvedAt', '$createdAt'] },
              null
            ]
          }
        }
      }
    }
  ]);
  
  return stats;
};

disputeSchema.statics.getOverdueDisputes = function() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return this.find({
    status: 'open',
    createdAt: { $lt: sevenDaysAgo }
  }).populate('complainant respondent');
};

module.exports = mongoose.model('Dispute', disputeSchema); 