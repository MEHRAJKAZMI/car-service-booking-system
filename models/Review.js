const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  // Link back to the specific booking this review is for - ensures a review
  // is always tied to a real completed service, not just a random rating
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// A customer can only review a specific booking once
reviewSchema.index({ customer: 1, booking: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;