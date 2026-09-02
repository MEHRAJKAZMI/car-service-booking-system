const express = require('express');
const router = express.Router();
const {
  createAccount,
  getAllAccounts,
  getAccount,
  getAccountByUser,
  updateAccount,
  deactivateAccount
} = require('../controllers/accountController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authorizeMiddleware');

// Any logged-in user (typically a shop owner) can create/manage their OWN account
router.post('/', protect, createAccount);
router.get('/user/:userId', protect, getAccountByUser);
router.put('/:id', protect, updateAccount);
router.put('/:id/deactivate', protect, deactivateAccount);

// Admin-only
router.get('/', protect, authorize('Wallet Management'), getAllAccounts);
router.get('/:id', protect, authorize('Wallet Management'), getAccount);

module.exports = router;