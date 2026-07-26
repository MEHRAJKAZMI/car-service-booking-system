const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authorizeMiddleware');

// All routes require login (protect) + the "User Management" permission (authorize)
// A role with the "ALL" permission automatically passes every check
router.post('/', protect, authorize('User Management'), createUser);
router.get('/', protect, authorize('User Management'), getAllUsers);
router.get('/:id', protect, authorize('User Management'), getUserDetails);
router.put('/:id', protect, authorize('User Management'), updateUser);
router.delete('/:id', protect, authorize('User Management'), deleteUser);
router.put('/:id/activate', protect, authorize('User Management'), activateUser);
router.put('/:id/deactivate', protect, authorize('User Management'), deactivateUser);

module.exports = router;