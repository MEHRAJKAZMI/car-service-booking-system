const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Who this notification is for
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  // What kind of event triggered this - lets the frontend show different icons/styling
  type: {
    type: String,
    enum: ['booking_created', 'booking_confirmed', 'booking_status_changed', 'booking_cancelled', 'general'],
    default: 'general'
  },
  // Optional link back to the booking this notification is about
  relatedBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;