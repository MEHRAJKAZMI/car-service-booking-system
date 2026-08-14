const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingDetails,
  updateBookingStatus,
  markCustomerArrived,
  cancelBooking
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authorizeMiddleware');

router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.put('/:id/cancel', protect, cancelBooking);
router.get('/:id', protect, getBookingDetails);

router.get('/', protect, authorize('Shop Management'), getAllBookings);
router.put('/:id/status', protect, authorize('Shop Management'), updateBookingStatus);
router.put('/:id/customer-arrived', protect, authorize('Shop Management'), markCustomerArrived);

module.exports = router;