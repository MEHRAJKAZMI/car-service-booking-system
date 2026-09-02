const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const { creditWallet, debitWallet, getOrCreateCompanyWallet } = require('../services/walletService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Create a wallet for the logged-in customer (called once, typically right after registration,
// but can also be called on-demand the first time a customer needs one)
const createWallet = async (req, res) => {
  try {
    const existingWallet = await Wallet.findOne({ user: req.user.userId });
    if (existingWallet) {
      return sendError(res, 400, 'You already have a wallet');
    }

    const wallet = await Wallet.create({
      ownerType: 'customer',
      user: req.user.userId,
      balance: 0
    });

    return sendSuccess(res, 201, 'Wallet created successfully', { wallet });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Get the logged-in customer's own wallet
const getMyWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.userId });

    if (!wallet) {
      return sendError(res, 404, 'Wallet not found. Please create one first.');
    }

    return sendSuccess(res, 200, 'Wallet fetched successfully', { wallet });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Admin: get any specific user's wallet
const getWalletByUser = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.params.userId })
      .populate('user', 'firstName lastName email');

    if (!wallet) {
      return sendError(res, 404, 'Wallet not found for this user');
    }

    return sendSuccess(res, 200, 'Wallet fetched successfully', { wallet });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Admin: freeze or reactivate a wallet
const updateWalletStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'frozen'].includes(status)) {
      return sendError(res, 400, 'Invalid wallet status');
    }

    const wallet = await Wallet.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!wallet) {
      return sendError(res, 404, 'Wallet not found');
    }

    return sendSuccess(res, 200, 'Wallet status updated successfully', { wallet });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Add money directly to the logged-in customer's wallet.
// NOTE: In the normal flow, wallet recharges go through the Payment module
// (POST /api/payments with paymentType "wallet_recharge") so a payment record
// exists first. This endpoint is a lower-level/admin utility for direct
// adjustments (e.g. manual top-up, goodwill credit) - it still uses the same
// safe creditWallet() function underneath.
const addMoney = async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return sendError(res, 400, 'A valid positive amount is required');
    }

    const wallet = await Wallet.findOne({ user: req.user.userId });
    if (!wallet) {
      return sendError(res, 404, 'Wallet not found. Please create one first.');
    }

    const updatedWallet = await creditWallet({
      walletId: wallet._id,
      amount,
      reason: 'wallet_recharge',
      description: description || 'Manual wallet top-up'
    });

    return sendSuccess(res, 200, 'Money added to wallet successfully', { wallet: updatedWallet });

  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

// Admin: deduct money from any wallet (e.g. correcting an error, manual penalty)
const deductMoney = async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return sendError(res, 400, 'A valid positive amount is required');
    }

    const wallet = await Wallet.findById(req.params.id);
    if (!wallet) {
      return sendError(res, 404, 'Wallet not found');
    }

    const updatedWallet = await debitWallet({
      walletId: wallet._id,
      amount,
      reason: 'penalty',
      description: description || 'Manual deduction'
    });

    return sendSuccess(res, 200, 'Money deducted from wallet successfully', { wallet: updatedWallet });

  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

// Get the logged-in customer's own wallet transaction history
const getMyTransactions = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.userId });
    if (!wallet) {
      return sendError(res, 404, 'Wallet not found');
    }

    const transactions = await WalletTransaction.find({ wallet: wallet._id })
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Transactions fetched successfully', { transactions });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Admin: get ALL wallet transactions across the whole system
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await WalletTransaction.find()
      .populate({
        path: 'wallet',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Transactions fetched successfully', { transactions });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  createWallet,
  getMyWallet,
  getWalletByUser,
  updateWalletStatus,
  addMoney,
  deductMoney,
  getMyTransactions,
  getAllTransactions
};