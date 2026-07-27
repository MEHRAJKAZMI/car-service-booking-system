const express = require('express');
const router = express.Router();
const {
  createRole,
  getRoles,
  getRoleDetails,
  updateRole,
  deleteRole,
  assignPermissionsToRole
} = require('../controllers/roleController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authorizeMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { createRoleValidation } = require('../utils/validators');

router.post('/', protect, authorize('Role Management'), createRoleValidation, validateRequest, createRole);
router.get('/', protect, authorize('Role Management'), getRoles);
router.get('/:id', protect, authorize('Role Management'), getRoleDetails);
router.put('/:id', protect, authorize('Role Management'), updateRole);
router.delete('/:id', protect, authorize('Role Management'), deleteRole);
router.put('/:id/permissions', protect, authorize('Role Management'), assignPermissionsToRole);

module.exports = router;