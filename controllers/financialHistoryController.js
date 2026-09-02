const WalletTransaction = require('../models/WalletTransaction');
const Wallet = require('../models/Wallet');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Logged-in customer's own full financial history (reads the ledger)
const getMyHistory = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.userId });
    if (!wallet) {
      return sendError(res, 404, 'Wallet not found');
    }

    const history = await WalletTransaction.find({ wallet: wallet._id })
      .populate('relatedBooking')
      .populate('relatedPayment')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Financial history fetched successfully', { history });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Admin: a specific user's financial history
const getHistoryByUser = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.params.userId });
    if (!wallet) {
      return sendError(res, 404, 'Wallet not found for this user');
    }

    const history = await WalletTransaction.find({ wallet: wallet._id })
      .populate('relatedBooking')
      .populate('relatedPayment')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Financial history fetched successfully', { history });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Admin: every financial transaction across the whole platform
const getAllHistory = async (req, res) => {
  try {
    const history = await WalletTransaction.find()
      .populate({ path: 'wallet', populate: { path: 'user', select: 'firstName lastName email' } })
      .populate('relatedBooking')
      .populate('relatedPayment')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Financial history fetched successfully', { history });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// One specific transaction's full detail
const getTransactionDetails = async (req, res) => {
  try {
    const transaction = await WalletTransaction.findById(req.params.id)
      .populate({ path: 'wallet', populate: { path: 'user', select: 'firstName lastName email' } })
      .populate('relatedBooking')
      .populate('relatedPayment');

    if (!transaction) {
      return sendError(res, 404, 'Transaction not found');
    }

    return sendSuccess(res, 200, 'Transaction details fetched successfully', { transaction });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = { getMyHistory, getHistoryByUser, getAllHistory, getTransactionDetails };