const mongoose = require('mongoose');

// A wallet belongs to either a User (customer) or the platform itself (company wallet).
// "owner" is polymorphic: for a customer wallet, it's a User id. For the single
// company wallet, we use a fixed sentinel value "COMPANY" instead of a User id.
const walletSchema = new mongoose.Schema({
  ownerType: {
    type: String,
    enum: ['customer', 'company'],
    required: true
  },
  // Only set when ownerType is "customer" - references the User
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0 // balance can never go negative - this is a critical safety net
  },
  status: {
    type: String,
    enum: ['active', 'frozen'],
    default: 'active'
  }
}, {
  timestamps: true
});

// A customer can only ever have ONE wallet
walletSchema.index({ user: 1 }, { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } });

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;