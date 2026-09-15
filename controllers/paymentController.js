const Payment = require('../models/Payment');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Shop = require('../models/Shop');
const Role = require('../models/Role');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const createNotification = require('../utils/createNotification');
const { settlePaidPayment, refundPaidBookingPayment } = require('../services/paymentSettlementService');

const canAccessPayment = async (user, payment) => {
  if (payment.customer.toString() === user.userId) return true;
  if (payment.shop) {
    const shop = await Shop.findById(payment.shop).select('registeredBy');
    if (shop && shop.registeredBy.toString() === user.userId) return true;
  }
  const role = await Role.findById(user.role).populate('permissions');
  return Boolean(role && role.permissions.some((permission) => ['ALL', 'Shop Management', 'Wallet Management'].includes(permission.name)));
};

// ---------------------------------------------------------
// Create Payment
// Handles BOTH:
//   paymentType = "booking"         -> pay for a completed service
//   paymentType = "wallet_recharge" -> top up customer's wallet
// ---------------------------------------------------------
const createPayment = async (req, res) => {
  try {
    const { paymentType, booking: bookingId, amount, method } = req.body;

    // ---- WALLET RECHARGE ----
    if (paymentType === 'wallet_recharge') {
      if (!amount || amount <= 0) {
        return sendError(res, 400, 'A valid recharge amount is required');
      }

      const payment = await Payment.create({
        paymentType: 'wallet_recharge',
        customer: req.user.userId,
        amount,
        method: method || 'card',
        status: 'pending'
      });

      return sendSuccess(res, 201, 'Wallet recharge payment created', { payment });
    }

    // ---- BOOKING PAYMENT (default/existing behaviour) ----
    if (!bookingId) {
      return sendError(res, 400, 'Booking is required for a booking payment');
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return sendError(res, 404, 'Booking not found');
    }
    if (booking.customer.toString() !== req.user.userId) {
      return sendError(res, 403, 'You can only create payments for your own bookings');
    }
    if (booking.status !== 'completed') {
      return sendError(res, 400, 'Only completed bookings can be paid');
    }
    const existingPayment = await Payment.findOne({ booking: booking._id, paymentType: 'booking', status: { $in: ['pending', 'paid'] } });
    if (existingPayment) {
      return sendError(res, 400, 'A pending or paid payment already exists for this booking');
    }

    const servicesTotal = booking.services.reduce((sum, s) => sum + s.price, 0);
    const totalPenalty = (booking.penaltyAmount || 0) + (booking.customerLatePenaltyAmount || 0);

    const payment = await Payment.create({
      paymentType: 'booking',
      booking: booking._id,
      customer: booking.customer,
      shop: booking.shop,
      amount: servicesTotal,
      penaltyAmount: totalPenalty,
      method: method || 'cash',
      status: 'pending'
    });

    return sendSuccess(res, 201, 'Payment created successfully', { payment });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ---------------------------------------------------------
// Update Payment Status
// Wallet debit/credit + commission + transfer happen here,
// only when status -> "paid", and only once (walletProcessed guard).
// ---------------------------------------------------------
const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return sendError(res, 404, 'Payment not found');
    }

    if (!['paid', 'refunded'].includes(status)) {
      return sendError(res, 400, 'Invalid status value');
    }

    if (payment.status === status) return sendError(res, 400, `Payment is already ${status}`);
    if (payment.status === 'refunded' || (payment.status === 'paid' && status !== 'refunded')) {
      return sendError(res, 400, 'Invalid payment status transition');
    }
    if (!(await canAccessPayment(req.user, payment))) {
      return sendError(res, 403, 'You can only view your own payment details');
    }
    if (status === 'refunded' && payment.status !== 'paid') {
      return sendError(res, 400, 'Only paid payments can be refunded');
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const transactionalPayment = await Payment.findById(payment._id).session(session);
        if (status === 'paid') {
          transactionalPayment.status = 'paid';
          await settlePaidPayment(transactionalPayment, session);
        } else {
          await refundPaidBookingPayment(transactionalPayment, session);
        }
        await transactionalPayment.save({ session });
        Object.assign(payment, transactionalPayment.toObject());
      });
    } finally {
      await session.endSession();
    }

    await createNotification({
      recipient: payment.customer,
      title: status === 'paid' && payment.paymentType === 'wallet_recharge' ? 'Wallet Recharged' : status === 'paid' ? 'Payment Received' : 'Payment Refunded',
      message: status === 'refunded' ? `Your payment of Rs. ${payment.amount + (payment.penaltyAmount || 0)} has been refunded.` : payment.paymentType === 'wallet_recharge' ? `Your wallet has been credited with Rs. ${payment.amount}.` : `Your payment of Rs. ${payment.amount + (payment.penaltyAmount || 0)} has been processed.`,
      type: 'general'
    });

    return sendSuccess(res, 200, 'Payment status updated successfully', { payment });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ---------------------------------------------------------
// Get Payment Details
// ---------------------------------------------------------
const getPaymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer', 'firstName lastName email')
      .populate('shop', 'shopName phoneNumber')
      .populate('booking');

    if (!payment) {
      return sendError(res, 404, 'Payment not found');
    }
    if (!(await canAccessPayment(req.user, payment))) {
      return sendError(res, 403, 'You can only view your own invoice');
    }

    return sendSuccess(res, 200, 'Payment fetched successfully', { payment });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ---------------------------------------------------------
// Get My Payments
// ---------------------------------------------------------
const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ customer: req.user.userId })
      .populate('shop', 'shopName')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Payments fetched successfully', { payments });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ---------------------------------------------------------
// Get All Payments (admin)
// ---------------------------------------------------------
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('customer', 'firstName lastName email')
      .populate('shop', 'shopName')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Payments fetched successfully', { payments });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ---------------------------------------------------------
// Generate Invoice
// ---------------------------------------------------------
const generateInvoice = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer', 'firstName lastName email')
      .populate('shop', 'shopName completeAddress')
      .populate('booking');

    if (!payment) {
      return sendError(res, 404, 'Payment not found');
    }

    const invoice = {
      invoiceNumber: `INV-${payment._id.toString().slice(-8).toUpperCase()}`,
      customer: payment.customer,
      shop: payment.shop,
      services: payment.booking ? payment.booking.services : [],
      subtotal: payment.amount,
      penalty: payment.penaltyAmount || 0,
      commission: payment.commissionAmount || 0,
      shopPayout: payment.shopPayoutAmount || 0,
      total: payment.amount + (payment.penaltyAmount || 0),
      status: payment.status,
      paidAt: payment.paidAt
    };

    return sendSuccess(res, 200, 'Invoice generated successfully', { invoice });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  createPayment,
  updatePaymentStatus,
  getPaymentDetails,
  getMyPayments,
  getAllPayments,
  generateInvoice
};
