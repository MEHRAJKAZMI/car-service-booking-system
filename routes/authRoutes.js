const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshAccessToken,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
  logout
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { registerValidation, loginValidation } = require('../utils/validators');

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.post('/refresh-token', refreshAccessToken);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/logout', protect, logout);

module.exports = router;