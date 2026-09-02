const express = require('express');
const router = express.Router();
const {
  getRevenueReport,
  getBookingStats,
  getTopShops,
  getUserGrowthStats,
  getWalletReport,
  getCommissionReport,
  getShopEarningsReport,
  getTransferReport,
  getFinancialReport
} = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authorizeMiddleware');

router.get('/revenue', protect, authorize('Reports'), getRevenueReport);
router.get('/bookings', protect, authorize('Reports'), getBookingStats);
router.get('/top-shops', protect, authorize('Reports'), getTopShops);
router.get('/user-growth', protect, authorize('Reports'), getUserGrowthStats);

router.get('/wallet', protect, authorize('Wallet Management'), getWalletReport);
router.get('/commission', protect, authorize('Wallet Management'), getCommissionReport);
router.get('/shop-earnings', protect, authorize('Wallet Management'), getShopEarningsReport);
router.get('/transfers', protect, authorize('Wallet Management'), getTransferReport);
router.get('/financial', protect, authorize('Wallet Management'), getFinancialReport);

module.exports = router;