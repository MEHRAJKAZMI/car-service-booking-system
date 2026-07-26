const express = require('express');
const router = express.Router();
const {
  createPermission,
  getPermissions,
  getPermissionDetails,
  updatePermission,
  deletePermission
} = require('../controllers/permissionController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authorizeMiddleware');

router.post('/', protect, authorize('Permission Management'), createPermission);
router.get('/', protect, authorize('Permission Management'), getPermissions);
router.get('/:id', protect, authorize('Permission Management'), getPermissionDetails);
router.put('/:id', protect, authorize('Permission Management'), updatePermission);
router.delete('/:id', protect, authorize('Permission Management'), deletePermission);

module.exports = router;