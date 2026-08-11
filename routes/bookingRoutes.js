const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingDetails,
  updateBookingStatus,
  cancelBooking
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authorizeMiddleware');

// Any logged-in customer can create a booking and view/cancel their own bookings
router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.put('/:id/cancel', protect, cancelBooking);

// Viewing details of a specific booking - the customer who owns it can check it via getBookingDetails too
// (we're not restricting this further for simplicity; could add an ownership check later if needed)
router.get('/:id', protect, getBookingDetails);

// Admin/shop-management side - requires "Shop Management" permission (or ALL)
router.get('/', protect, authorize('Shop Management'), getAllBookings);
router.put('/:id/status', protect, authorize('Shop Management'), updateBookingStatus);

module.exports = router;