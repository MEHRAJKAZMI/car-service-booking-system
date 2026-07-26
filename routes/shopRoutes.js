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

// Register Shop - any logged-in user can register (Shop Owner for themselves),
// OR an Admin with "Shop Management" permission can also register on someone's behalf.
// We only require "protect" (logged in) here, not "authorize", since the task says
// a Shop Owner (a regular user) should be able to register their own shop freely.
//
// upload.fields([...]) tells Multer to expect these 3 specific file fields
router.post(
  '/',
  protect,
  upload.fields([
    { name: 'ownerCnic', maxCount: 1 },
    { name: 'shopLogo', maxCount: 1 },
    { name: 'businessRegistrationCertificate', maxCount: 1 }
  ]),
  registerShop
);

// The rest of the shop management actions require the "Shop Management" permission
router.get('/', protect, authorize('Shop Management'), getAllShops);
router.get('/:id', protect, authorize('Shop Management'), getShopDetails);
router.put('/:id', protect, authorize('Shop Management'), updateShop);
router.delete('/:id', protect, authorize('Shop Management'), deleteShop);
router.put('/:id/approve', protect, authorize('Shop Management'), approveShop);
router.put('/:id/reject', protect, authorize('Shop Management'), rejectShop);
router.put('/:id/status', protect, authorize('Shop Management'), changeShopStatus);

module.exports = router;