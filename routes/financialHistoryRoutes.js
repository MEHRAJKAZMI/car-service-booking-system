const express = require('express');
const router = express.Router();
const {
  getMyHistory,
  getHistoryByUser,
  getAllHistory,
  getTransactionDetails
} = require('../controllers/financialHistoryController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authorizeMiddleware');

router.get('/my-history', protect, getMyHistory);
router.get('/user/:userId', protect, authorize('Wallet Management'), getHistoryByUser);
router.get('/', protect, authorize('Wallet Management'), getAllHistory);
router.get('/:id', protect, authorize('Wallet Management'), getTransactionDetails);

module.exports = router;