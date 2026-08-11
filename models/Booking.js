const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // The customer making this booking
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Which shop is handling this booking
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },

  // Multiple services can be selected in one booking (e.g. Tire Change + Battery Check together)
  // Each entry references the specific embedded service _id from the Shop's services array,
  // plus we snapshot the name/price at time of booking (so if the shop later changes prices,
  // this booking still reflects what the customer was actually charged/quoted)
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

  // Vehicle info captured directly on the booking (no separate Vehicle collection)
  vehicle: {
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number },
    plateNumber: { type: String, required: true, trim: true }
  },

  // The real-world core of this module: where does the service happen?
  // "roadside" - car broke down somewhere, mechanic needs to come to the customer
  // "shop_visit" - customer brings/drives the car to the shop themselves
  bookingType: {
    type: String,
    enum: ['roadside', 'shop_visit'],
    required: true
  },

  // Required only when bookingType is "roadside" - where the car currently is.
  // Validated conditionally in the controller (not at the schema level) for clearer error messages.
  address: {
    type: String,
    trim: true,
    default: ''
  },

  // When the customer wants/needs the service (roadside bookings are often "now")
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
  }
}, {
  timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;