const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  // The full amount the customer paid for the service (before any split)
  grossAmount: {
    type: Number,
    required: true,
    min: 0
  },
  // The percentage used for this specific calculation - stored per-record
  // (not just read from config) so historical commissions stay accurate
  // even if the platform's rate changes later
  commissionRate: {
    type: Number,
    required: true
  },
  commissionAmount: {
    type: Number,
    required: true,
    min: 0
  },
  shopAmount: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// One commission record per booking, ever
commissionSchema.index({ booking: 1 }, { unique: true });

const Commission = mongoose.model('Commission', commissionSchema);

module.exports = Commission;