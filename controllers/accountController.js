const Account = require('../models/Account');
const Role = require('../models/Role');
const Shop = require('../models/Shop');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const canManageWallets = async (roleId) => {
  const role = await Role.findById(roleId).populate('permissions');
  return Boolean(role && role.permissions.some((permission) => permission.name === 'ALL' || permission.name === 'Wallet Management'));
};

const createAccount = async (req, res) => {
  try {
    const { shop, accountType, accountTitle, accountNumber, bankName } = req.body;

    if (shop) {
      const shopDoc = await Shop.findOne({ _id: shop, registeredBy: req.user.userId });
      if (!shopDoc) return sendError(res, 403, 'You can only attach an account to your own shop');
    }
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
    if (req.params.userId !== req.user.userId && !(await canManageWallets(req.user.role))) {
      return sendError(res, 403, 'You can only view your own accounts');
    }
    const accounts = await Account.find({ owner: req.params.userId });

    return sendSuccess(res, 200, 'Accounts fetched successfully', { accounts });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const updateAccount = async (req, res) => {
  try {
    const { accountTitle, accountNumber, bankName, accountType } = req.body;

    const existingAccount = await Account.findById(req.params.id);
    if (!existingAccount) return sendError(res, 404, 'Account not found');
    if (existingAccount.owner.toString() !== req.user.userId && !(await canManageWallets(req.user.role))) {
      return sendError(res, 403, 'You can only update your own accounts');
    }
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
    const existingAccount = await Account.findById(req.params.id);
    if (!existingAccount) return sendError(res, 404, 'Account not found');
    if (existingAccount.owner.toString() !== req.user.userId && !(await canManageWallets(req.user.role))) {
      return sendError(res, 403, 'You can only deactivate your own accounts');
    }
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
