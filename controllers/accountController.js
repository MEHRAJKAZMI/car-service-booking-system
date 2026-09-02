const Account = require('../models/Account');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const createAccount = async (req, res) => {
  try {
    const { shop, accountType, accountTitle, accountNumber, bankName } = req.body;

    const account = await Account.create({
      owner: req.user.userId,
      shop: shop || null,
      accountType,
      accountTitle,
      accountNumber,
      bankName
    });

    return sendSuccess(res, 201, 'Account created successfully', { account });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.find()
      .populate('owner', 'firstName lastName email')
      .populate('shop', 'shopName');

    return sendSuccess(res, 200, 'Accounts fetched successfully', { accounts });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('shop', 'shopName');

    if (!account) {
      return sendError(res, 404, 'Account not found');
    }

    return sendSuccess(res, 200, 'Account fetched successfully', { account });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// A user's own accounts (used by shop owners to see their own payout destinations)
const getAccountByUser = async (req, res) => {
  try {
    const accounts = await Account.find({ owner: req.params.userId });

    return sendSuccess(res, 200, 'Accounts fetched successfully', { accounts });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const updateAccount = async (req, res) => {
  try {
    const { accountTitle, accountNumber, bankName, accountType } = req.body;

    const account = await Account.findByIdAndUpdate(
      req.params.id,
      { accountTitle, accountNumber, bankName, accountType },
      { new: true, runValidators: true }
    );

    if (!account) {
      return sendError(res, 404, 'Account not found');
    }

    return sendSuccess(res, 200, 'Account updated successfully', { account });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const deactivateAccount = async (req, res) => {
  try {
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!account) {
      return sendError(res, 404, 'Account not found');
    }

    return sendSuccess(res, 200, 'Account deactivated successfully', { account });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  createAccount,
  getAllAccounts,
  getAccount,
  getAccountByUser,
  updateAccount,
  deactivateAccount
};