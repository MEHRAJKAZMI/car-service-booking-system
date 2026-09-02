const Commission = require('../models/Commission');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Get the commission record for a specific booking
const getCommissionByBooking = async (req, res) => {
  try {
    const commission = await Commission.findOne({ booking: req.params.bookingId })
      .populate('shop', 'shopName')
      .populate('booking');

    if (!commission) {
      return sendError(res, 404, 'No commission record found for this booking');
    }

    return sendSuccess(res, 200, 'Commission fetched successfully', { commission });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// A shop's own commission history - shows how much was deducted from their earnings
const getMyCommissionHistory = async (req, res) => {
  try {
    // req.user here belongs to whoever registered/manages the shop - in this
    // system shops are approved by admins, so "my" commission history for a
    // shop owner is looked up via the shops they registered
    const Shop = require('../models/Shop');
    const myShops = await Shop.find({ registeredBy: req.user.userId }).select('_id');
    const shopIds = myShops.map((s) => s._id);

    const commissions = await Commission.find({ shop: { $in: shopIds } })
      .populate('shop', 'shopName')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Commission history fetched successfully', { commissions });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Admin: full commission history across the whole platform
const getAllCommissionHistory = async (req, res) => {
  try {
    const commissions = await Commission.find()
      .populate('shop', 'shopName')
      .populate('booking')
      .sort({ createdAt: -1 });

    const totalCommissionEarned = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);

    return sendSuccess(res, 200, 'Commission history fetched successfully', {
      commissions,
      totalCommissionEarned
    });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = { getCommissionByBooking, getMyCommissionHistory, getAllCommissionHistory };