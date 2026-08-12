const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPaymentDetails,
  getAllPayments,
  getMyPayments,
  updatePaymentStatus,
  generateInvoice
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authorizeMiddleware');

router.post('/', protect, authorize('Shop Management'), createPayment);
router.get('/my-payments', protect, getMyPayments);
router.get('/:id', protect, getPaymentDetails);
router.get('/:id/invoice', protect, generateInvoice);
router.get('/', protect, authorize('Shop Management'), getAllPayments);
router.put('/:id/status', protect, authorize('Shop Management'), updatePaymentStatus);

module.exports = router;