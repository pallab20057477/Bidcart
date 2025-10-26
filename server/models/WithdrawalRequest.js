const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  payoutMethod: {
    type: String,
    default: 'bank'
  },
  notes: String,
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema); 