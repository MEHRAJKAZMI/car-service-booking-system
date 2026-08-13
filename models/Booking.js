const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },

  services: [{
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],

  vehicle: {
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number },
    plateNumber: { type: String, required: true, trim: true }
  },

  bookingType: {
    type: String,
    enum: ['roadside', 'shop_visit'],
    required: true
  },

  address: {
    type: String,
    trim: true,
    default: ''
  },

  scheduledAt: {
    type: Date,
    default: Date.now
  },

  notes: {
    type: String,
    trim: true,
    default: ''
  },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },

  cancellationReason: {
    type: String,
    trim: true,
    default: ''
  },

  // Late/no-show penalty tracking
  // penaltyApplied prevents the same booking from being charged more than once
  penaltyApplied: {
    type: Boolean,
    default: false
  },
  penaltyAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;