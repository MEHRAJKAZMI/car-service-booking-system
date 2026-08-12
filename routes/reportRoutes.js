const express = require('express');
const router = express.Router();
const {
  getRevenueReport,
  getBookingStats,
  getTopShops,
  getUserGrowthStats
} = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authorizeMiddleware');

// Reports are admin-only - require "Reports" permission (or ALL)
router.get('/revenue', protect, authorize('Reports'), getRevenueReport);
router.get('/bookings', protect, authorize('Reports'), getBookingStats);
router.get('/top-shops', protect, authorize('Reports'), getTopShops);
router.get('/user-growth', protect, authorize('Reports'), getUserGrowthStats);

module.exports = router;