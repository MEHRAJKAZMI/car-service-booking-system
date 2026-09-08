const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // "booking"        -> paying for a completed service
  // "wallet_recharge" -> customer topping up their wallet
  paymentType: {
    type: String,
    enum: ['booking', 'wallet_recharge'],
    default: 'booking'
  },

  // Required only when paymentType === 'booking'
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Only relevant for booking payments
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  },

  amount: {
    type: Number,
    required: true
  },

  penaltyAmount: {
    type: Number,
    default: 0
  },

  // Filled in once a "booking" payment is marked paid
  commissionAmount: {
    type: Number,
    default: 0
  },
  shopPayoutAmount: {
    type: Number,
    default: 0
  },

  method: {
    type: String,
    enum: ['cash', 'wallet', 'card', 'bank_transfer'],
    default: 'cash'
  },

  status: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },

  // Guards against double-crediting/double-debiting the wallet
  // if updatePaymentStatus is ever called twice
  walletProcessed: {
    type: Boolean,
    default: false
  },

  paidAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;