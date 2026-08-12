const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Shop = require('../models/Shop');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Overall revenue report - total revenue collected, optionally filtered by date range
// Query params: ?startDate=2026-01-01&endDate=2026-12-31
const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, shop } = req.query;

    const filter = { status: 'paid' };

    if (startDate || endDate) {
      filter.paidAt = {};
      if (startDate) filter.paidAt.$gte = new Date(startDate);
      if (endDate) filter.paidAt.$lte = new Date(endDate);
    }

    if (shop) {
      filter.shop = shop;
    }

    const payments = await Payment.find(filter);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount + p.penaltyAmount, 0);
    const totalPenalties = payments.reduce((sum, p) => sum + p.penaltyAmount, 0);

    return sendSuccess(res, 200, 'Revenue report generated successfully', {
      totalRevenue,
      totalPenalties,
      totalPayments: payments.length
    });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Booking statistics - counts grouped by status
const getBookingStats = async (req, res) => {
  try {
    // Mongoose aggregation: groups all bookings by their "status" field and counts each group
    const statusCounts = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const totalBookings = await Booking.countDocuments();

    // Reshape the aggregation result into a cleaner object: { pending: 3, completed: 5, ... }
    const breakdown = {};
    statusCounts.forEach((item) => {
      breakdown[item._id] = item.count;
    });

    return sendSuccess(res, 200, 'Booking stats generated successfully', {
      totalBookings,
      breakdown
    });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Top shops - ranked by number of completed bookings
const getTopShops = async (req, res) => {
  try {
    const topShops = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$shop', completedBookings: { $sum: 1 } } },
      { $sort: { completedBookings: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'shops',
          localField: '_id',
          foreignField: '_id',
          as: 'shopDetails'
        }
      },
      { $unwind: '$shopDetails' },
      {
        $project: {
          _id: 0,
          shopId: '$_id',
          shopName: '$shopDetails.shopName',
          completedBookings: 1
        }
      }
    ]);

    return sendSuccess(res, 200, 'Top shops fetched successfully', { topShops });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// User growth - how many new users registered per month
const getUserGrowthStats = async (req, res) => {
  try {
    const growth = await User.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const totalUsers = await User.countDocuments();

    return sendSuccess(res, 200, 'User growth stats fetched successfully', {
      totalUsers,
      growth
    });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  getRevenueReport,
  getBookingStats,
  getTopShops,
  getUserGrowthStats
};