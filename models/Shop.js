const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  // Basic Information
  shopName: {
    type: String,
    required: true,
    trim: true
  },
  ownerName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },

  // Business Information
  businessType: {
    type: String,
    required: true,
    trim: true
  },
  ntnNumber: {
    type: String,
    trim: true,
    default: ''
  },
  taxRegistrationNumber: {
    type: String,
    trim: true,
    default: ''
  },

  // Address
  country: {
    type: String,
    required: true,
    trim: true
  },
  province: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  completeAddress: {
    type: String,
    required: true,
    trim: true
  },
  postalCode: {
    type: String,
    trim: true,
    default: ''
  },

  // Attachments - we store the file PATH (where Multer saved it), not the file itself
  ownerCnic: {
    type: String, // file path
    default: null
  },
  shopLogo: {
    type: String, // file path
    default: null
  },
  businessRegistrationCertificate: {
    type: String, // file path, optional
    default: null
  },

  // Who registered this shop - could be the Shop Owner themself, or an Admin on their behalf
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Shop Status workflow
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },

  // Optional: store a reason if rejected, useful for the shop owner to know why
  rejectionReason: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop;