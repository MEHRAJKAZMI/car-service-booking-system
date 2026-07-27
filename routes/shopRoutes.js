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
  changeShopStatus
} = require('../controllers/shopController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authorizeMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { registerShopValidation } = require('../utils/validators');

// Note: validation runs AFTER multer (upload.fields) because express-validator
// needs req.body to be parsed first, which multer handles for multipart/form-data
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

module.exports = router;