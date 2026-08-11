const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Create a review - only allowed for a booking that is actually completed,
// and only by the customer who made that booking
const createReview = async (req, res) => {
  try {
    const { booking, rating, comment } = req.body;

    const bookingDoc = await Booking.findById(booking);

    if (!bookingDoc) {
      return sendError(res, 404, 'Booking not found');
    }

    if (bookingDoc.customer.toString() !== req.user.userId) {
      return sendError(res, 403, 'You can only review your own bookings');
    }

    if (bookingDoc.status !== 'completed') {
      return sendError(res, 400, 'You can only review a completed booking');
    }

    const existingReview = await Review.findOne({ booking });
    if (existingReview) {
      return sendError(res, 400, 'This booking has already been reviewed');
    }

    const review = await Review.create({
      customer: req.user.userId,
      shop: bookingDoc.shop,
      booking,
      rating,
      comment
    });

    return sendSuccess(res, 201, 'Review submitted successfully', { review });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Get all reviews for a specific shop
const getShopReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ shop: req.params.shopId })
      .populate('customer', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Calculate a simple average rating for convenience
    const averageRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    return sendSuccess(res, 200, 'Reviews fetched successfully', { reviews, averageRating });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Get a single review's details
const getReviewDetails = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('customer', 'firstName lastName')
      .populate('shop', 'shopName');

    if (!review) {
      return sendError(res, 404, 'Review not found');
    }

    return sendSuccess(res, 200, 'Review fetched successfully', { review });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Update a review - only the customer who wrote it can update it
const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return sendError(res, 404, 'Review not found');
    }

    if (review.customer.toString() !== req.user.userId) {
      return sendError(res, 403, 'You can only update your own review');
    }

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    return sendSuccess(res, 200, 'Review updated successfully', { review });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Delete a review - the customer who wrote it, or an admin, can delete it
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return sendError(res, 404, 'Review not found');
    }

    const isOwner = review.customer.toString() === req.user.userId;
    if (!isOwner) {
      return sendError(res, 403, 'You can only delete your own review');
    }

    await review.deleteOne();

    return sendSuccess(res, 200, 'Review deleted successfully');

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  createReview,
  getShopReviews,
  getReviewDetails,
  updateReview,
  deleteReview
};