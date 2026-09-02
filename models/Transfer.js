const mongoose = require('mongoose');

// A Transfer represents the shop's payable amount (after commission) being
// paid out to them. Created automatically alongside Commission, but its
// actual completion (money really sent) is a separate, trackable step -
// mirroring how Daraz settles sellers days after commission is calculated.
const transferSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  commission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commission',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  // Set only once the transfer actually completes
  completedAt: {
    type: Date,
    default: null
  },
  failureReason: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// One transfer per booking, ever - matches the one-commission-per-booking rule
transferSchema.index({ booking: 1 }, { unique: true });

const Transfer = mongoose.model('Transfer', transferSchema);

module.exports = Transfer;