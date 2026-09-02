const express = require('express');
const router = express.Router();
const {
  getCommissionByBooking,
  getMyCommissionHistory,
  getAllCommissionHistory
} = require('../controllers/commissionController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authorizeMiddleware');

// Note: there is no "Create/Calculate Commission" API exposed here on purpose -
// commission is calculated automatically inside the Payment flow the moment a
// booking payment is completed (see paymentController.updatePaymentStatus).
// Exposing a manual "calculate commission" endpoint would risk double-charging.
router.get('/booking/:bookingId', protect, authorize('Shop Management'), getCommissionByBooking);
router.get('/my-history', protect, getMyCommissionHistory);
router.get('/', protect, authorize('Wallet Management'), getAllCommissionHistory);

module.exports = router;