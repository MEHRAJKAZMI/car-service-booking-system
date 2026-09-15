const express = require('express');
const router = express.Router();
const {
  createWallet,
  getMyWallet,
  getWalletByUser,
  updateWalletStatus,
  addMoney,
  deductMoney,
  getMyTransactions,
  getAllTransactions
} = require('../controllers/walletController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authorizeMiddleware');

// Customer-facing - only touches their OWN wallet
router.post('/', protect, createWallet);
router.get('/my-wallet', protect, getMyWallet);
router.post('/add-money', protect, authorize('Wallet Management'), addMoney);
router.get('/my-transactions', protect, getMyTransactions);

// Admin-facing - requires "Wallet Management" permission (or ALL)
router.get('/user/:userId', protect, authorize('Wallet Management'), getWalletByUser);
router.put('/:id/status', protect, authorize('Wallet Management'), updateWalletStatus);
router.put('/:id/deduct-money', protect, authorize('Wallet Management'), deductMoney);
router.get('/transactions/all', protect, authorize('Wallet Management'), getAllTransactions);

module.exports = router;
