const mongoose = require('mongoose');

// This is the LEDGER - every single change to any wallet's balance creates
// one immutable record here. This is what "Financial History" reads from.
// Never edit or delete a WalletTransaction once created - to reverse something,
// create a NEW opposite transaction instead (standard accounting practice).
const walletTransactionSchema = new mongoose.Schema({
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01 // no zero or negative amount transactions allowed
  },
  // The wallet's balance AFTER this transaction was applied - kept as a
  // snapshot so history can be displayed without recalculating from scratch
  balanceAfter: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    enum: [
      'wallet_recharge',
      'booking_payment',
      'commission_received',
      'commission_income',
      'shop_payout',
      'penalty',
      'refund'
    ],
    required: true
  },
  relatedBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  relatedPayment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

module.exports = WalletTransaction;
