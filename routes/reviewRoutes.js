const express = require('express');
const router = express.Router();
const {
  createReview,
  getShopReviews,
  getReviewDetails,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');

// Any logged-in customer can review (ownership/completed-booking checks happen inside the controller)
router.post('/', protect, createReview);
router.get('/shop/:shopId', protect, getShopReviews);
router.get('/:id', protect, getReviewDetails);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;