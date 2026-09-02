const mongoose = require('mongoose');

// Represents a financial payout destination - typically a shop's bank account
// where Transfer amounts are ultimately sent. Separate from Wallet (which is
// an in-system balance) and separate from User (which is login/identity).
const accountSchema = new mongoose.Schema({
  // Who this account belongs to - a User (shop owner) in this system
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Optional link to a specific Shop, since one owner could theoretically run multiple shops
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    default: null
  },
  accountType: {
    type: String,
    enum: ['bank', 'mobile_wallet'],
    required: true
  },
  accountTitle: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    required: true,
    trim: true
  },
  bankName: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;