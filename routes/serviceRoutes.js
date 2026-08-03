const express = require('express');
const router = express.Router();
const {
  createService,
  getAllServices,
  getServiceDetails,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authorizeMiddleware');

// Managing services requires the "Shop Management" permission (or ALL) - same as shops themselves,
// since services are essentially a sub-resource of a shop
router.post('/', protect, authorize('Shop Management'), createService);
router.get('/', protect, getAllServices); // anyone logged in can browse services (e.g. before booking)
router.get('/:id', protect, getServiceDetails);
router.put('/:id', protect, authorize('Shop Management'), updateService);
router.delete('/:id', protect, authorize('Shop Management'), deleteService);

module.exports = router;