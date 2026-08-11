const mongoose = require('mongoose');

// A single service offered by a shop - embedded directly inside the Shop document,
// not a separate collection. Each service gets its own auto-generated _id via
// Mongoose's default subdocument behavior, so we can still reference a specific
// service later (e.g. when a customer selects services for a booking).
const shopServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
});

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

  // Attachments
  ownerCnic: {
    type: String,
    default: null
  },
  shopLogo: {
    type: String,
    default: null
  },
  businessRegistrationCertificate: {
    type: String,
    default: null
  },

  // Services this shop offers - embedded array, added directly during registration
  services: [shopServiceSchema],

  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },

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