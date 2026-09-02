const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Shop = require('../models/Shop');
const User = require('../models/User');
const Commission = require('../models/Commission');
const Transfer = require('../models/Transfer');
const Wallet = require('../models/Wallet');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, shop } = req.query;
    const filter = { status: 'paid' };
    if (startDate || endDate) {
      filter.paidAt = {};
      if (startDate) filter.paidAt.$gte = new Date(startDate);
      if (endDate) filter.paidAt.$lte = new Date(endDate);
    }
    if (shop) filter.shop = shop;

    const payments = await Payment.find(filter);
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount + p.penaltyAmount, 0);
    const totalPenalties = payments.reduce((sum, p) => sum + p.penaltyAmount, 0);

    const commissions = await Commission.find();
    const totalCommission = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const totalShopPayouts = commissions.reduce((sum, c) => sum + c.shopAmount, 0);

    return sendSuccess(res, 200, 'Revenue report generated successfully', {
      totalRevenue,
      totalPenalties,
      totalPayments: payments.length,
      totalCommission,
      totalShopPayouts
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getBookingStats = async (req, res) => {
  try {
    const statusCounts = await Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const totalBookings = await Booking.countDocuments();
    const breakdown = {};
    statusCounts.forEach((item) => { breakdown[item._id] = item.count; });
    return sendSuccess(res, 200, 'Booking stats generated successfully', { totalBookings, breakdown });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getTopShops = async (req, res) => {
  try {
    const topShops = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$shop', completedBookings: { $sum: 1 } } },
      { $sort: { completedBookings: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'shops', localField: '_id', foreignField: '_id', as: 'shopDetails' } },
      { $unwind: '$shopDetails' },
      { $project: { _id: 0, shopId: '$_id', shopName: '$shopDetails.shopName', completedBookings: 1 } }
    ]);
    return sendSuccess(res, 200, 'Top shops fetched successfully', { topShops });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getUserGrowthStats = async (req, res) => {
  try {
    const growth = await User.aggregate([
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, newUsers: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    const totalUsers = await User.countDocuments();
    return sendSuccess(res, 200, 'User growth stats fetched successfully', { totalUsers, growth });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getWalletReport = async (req, res) => {
  try {
    const customerWallets = await Wallet.find({ ownerType: 'customer' });
    const companyWallet = await Wallet.findOne({ ownerType: 'company' });
    const totalCustomerBalance = customerWallets.reduce((sum, w) => sum + w.balance, 0);

    return sendSuccess(res, 200, 'Wallet report generated successfully', {
      totalCustomerWallets: customerWallets.length,
      totalCustomerBalance,
      companyWalletBalance: companyWallet ? companyWallet.balance : 0
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getCommissionReport = async (req, res) => {
  try {
    const commissions = await Commission.find();
    const totalCommission = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const totalGross = commissions.reduce((sum, c) => sum + c.grossAmount, 0);

    return sendSuccess(res, 200, 'Commission report generated successfully', {
      totalTransactions: commissions.length,
      totalGross,
      totalCommission,
      averageRate: commissions.length ? commissions[0].commissionRate : 0
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getShopEarningsReport = async (req, res) => {
  try {
    const earnings = await Commission.aggregate([
      { $group: { _id: '$shop', totalEarnings: { $sum: '$shopAmount' }, totalOrders: { $sum: 1 } } },
      { $sort: { totalEarnings: -1 } },
      { $lookup: { from: 'shops', localField: '_id', foreignField: '_id', as: 'shopDetails' } },
      { $unwind: '$shopDetails' },
      { $project: { _id: 0, shopId: '$_id', shopName: '$shopDetails.shopName', totalEarnings: 1, totalOrders: 1 } }
    ]);
    return sendSuccess(res, 200, 'Shop earnings report generated successfully', { earnings });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getTransferReport = async (req, res) => {
  try {
    const statusCounts = await Transfer.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ]);
    return sendSuccess(res, 200, 'Transfer report generated successfully', { statusCounts });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getFinancialReport = async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'paid' });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount + p.penaltyAmount, 0);

    const commissions = await Commission.find();
    const totalCommission = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const totalShopPayouts = commissions.reduce((sum, c) => sum + c.shopAmount, 0);

    const transfers = await Transfer.find();
    const pendingPayouts = transfers.filter((t) => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
    const completedPayouts = transfers.filter((t) => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);

    const companyWallet = await Wallet.findOne({ ownerType: 'company' });

    return sendSuccess(res, 200, 'Financial report generated successfully', {
      totalRevenue,
      totalCommission,
      totalShopPayouts,
      pendingPayouts,
      completedPayouts,
      companyWalletBalance: companyWallet ? companyWallet.balance : 0
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  getRevenueReport,
  getBookingStats,
  getTopShops,
  getUserGrowthStats,
  getWalletReport,
  getCommissionReport,
  getShopEarningsReport,
  getTransferReport,
  getFinancialReport
};