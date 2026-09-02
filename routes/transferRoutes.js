const express = require('express');
const router = express.Router();
const {
  getTransfer,
  sendPayment,
  updateTransferStatus,
  getMyTransfers,
  getAllTransfers,
  getShopTransfers
} = require('../controllers/transferController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authorizeMiddleware');

// Note: there's no "Create Transfer" API exposed here either - a Transfer is
// created automatically alongside the Commission when a booking payment
// completes (see paymentController.updatePaymentStatus).
router.get('/my-transfers', protect, getMyTransfers);
router.get('/:id', protect, authorize('Wallet Management'), getTransfer);
router.put('/:id/send', protect, authorize('Wallet Management'), sendPayment);
router.put('/:id/status', protect, authorize('Wallet Management'), updateTransferStatus);
router.get('/', protect, authorize('Wallet Management'), getAllTransfers);
router.get('/shop/:shopId', protect, authorize('Wallet Management'), getShopTransfers);

module.exports = router;