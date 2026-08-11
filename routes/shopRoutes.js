const express = require('express');
const router = express.Router();
const {
  registerShop,
  getAllShops,
  getShopDetails,
  updateShop,
  deleteShop,
  approveShop,
  rejectShop,
  changeShopStatus,
  addServiceToShop,
  updateShopService,
  removeShopService
} = require('../controllers/shopController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authorizeMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { registerShopValidation } = require('../utils/validators');

router.post(
  '/',
  protect,
  upload.fields([
    { name: 'ownerCnic', maxCount: 1 },
    { name: 'shopLogo', maxCount: 1 },
    { name: 'businessRegistrationCertificate', maxCount: 1 }
  ]),
  registerShopValidation,
  validateRequest,
  registerShop
);

router.get('/', protect, authorize('Shop Management'), getAllShops);
router.get('/:id', protect, authorize('Shop Management'), getShopDetails);
router.put('/:id', protect, authorize('Shop Management'), updateShop);
router.delete('/:id', protect, authorize('Shop Management'), deleteShop);
router.put('/:id/approve', protect, authorize('Shop Management'), approveShop);
router.put('/:id/reject', protect, authorize('Shop Management'), rejectShop);
router.put('/:id/status', protect, authorize('Shop Management'), changeShopStatus);

// Managing services embedded within a shop
router.post('/:id/services', protect, authorize('Shop Management'), addServiceToShop);
router.put('/:id/services/:serviceId', protect, authorize('Shop Management'), updateShopService);
router.delete('/:id/services/:serviceId', protect, authorize('Shop Management'), removeShopService);

module.exports = router;