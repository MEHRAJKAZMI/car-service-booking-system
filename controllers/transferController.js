const Transfer = require('../models/Transfer');
const Shop = require('../models/Shop');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Get a single transfer's details
const getTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('shop', 'shopName')
      .populate('booking')
      .populate('commission');

    if (!transfer) {
      return sendError(res, 404, 'Transfer not found');
    }

    return sendSuccess(res, 200, 'Transfer fetched successfully', { transfer });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Admin actually "sends" the payment - moves a transfer from pending/processing to completed.
// This is a manual, deliberate action (matching the real-world requirement that a transfer
// should not be marked successful unless it actually happened).
const sendPayment = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);

    if (!transfer) {
      return sendError(res, 404, 'Transfer not found');
    }

    if (transfer.status === 'completed') {
      return sendError(res, 400, 'This transfer has already been completed');
    }

    // In a real system, this is where an actual bank/payment-gateway API call would happen.
    // For this project, we simulate a successful send and mark it completed.
    transfer.status = 'completed';
    transfer.completedAt = new Date();
    await transfer.save();

    return sendSuccess(res, 200, 'Payment sent to shop successfully', { transfer });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Admin: manually update a transfer's status (e.g. mark as processing, or failed with a reason)
const updateTransferStatus = async (req, res) => {
  try {
    const { status, failureReason } = req.body;

    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 400, 'Invalid transfer status');
    }

    const updateData = { status };
    if (status === 'completed') updateData.completedAt = new Date();
    if (status === 'failed') updateData.failureReason = failureReason || '';

    const transfer = await Transfer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!transfer) {
      return sendError(res, 404, 'Transfer not found');
    }

    return sendSuccess(res, 200, 'Transfer status updated successfully', { transfer });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// A shop owner's own transfers (their payout history)
const getMyTransfers = async (req, res) => {
  try {
    const myShops = await Shop.find({ registeredBy: req.user.userId }).select('_id');
    const shopIds = myShops.map((s) => s._id);

    const transfers = await Transfer.find({ shop: { $in: shopIds } })
      .populate('shop', 'shopName')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Transfers fetched successfully', { transfers });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Admin: every transfer across the platform
const getAllTransfers = async (req, res) => {
  try {
    const transfers = await Transfer.find()
      .populate('shop', 'shopName')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Transfers fetched successfully', { transfers });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// All transfers belonging to one specific shop (admin lookup by shop id)
const getShopTransfers = async (req, res) => {
  try {
    const transfers = await Transfer.find({ shop: req.params.shopId })
      .sort({ createdAt: -1 });

    const totalPending = transfers
      .filter((t) => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCompleted = transfers
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    return sendSuccess(res, 200, 'Shop transfers fetched successfully', {
      transfers,
      totalPending,
      totalCompleted
    });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  getTransfer,
  sendPayment,
  updateTransferStatus,
  getMyTransfers,
  getAllTransfers,
  getShopTransfers
};