const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const createNotification = require('../utils/createNotification');
const { creditWallet, debitWallet, getOrCreateCompanyWallet } = require('../services/walletService');
const { calculateAndRecordCommission } = require('../services/commissionService');
const Transfer = require('../models/Transfer');

// Small local helper - looks up a customer's wallet by their user id.
// Throws a clear error if they don't have one yet (they must call
// POST /api/wallets once, same as before).
const getCustomerWallet = async (userId) => {
  const wallet = await Wallet.findOne({ user: userId, ownerType: 'customer' });
  if (!wallet) {
    throw new Error('This customer does not have a wallet yet');
  }
  return wallet;
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

    if (!['pending', 'paid', 'refunded'].includes(status)) {
      return sendError(res, 400, 'Invalid status value');
    }

    payment.status = status;

    if (status === 'paid') {
      payment.paidAt = new Date();

      if (!payment.walletProcessed) {

        if (payment.paymentType === 'wallet_recharge') {
          const customerWallet = await getCustomerWallet(payment.customer);

          await creditWallet({
            walletId: customerWallet._id,
            amount: payment.amount,
            reason: 'wallet_recharge',
            relatedPayment: payment._id,
            description: 'Wallet top-up'
          });

        } else {
          // paymentType === 'booking'
          const totalAmount = payment.amount + (payment.penaltyAmount || 0);
          const customerWallet = await getCustomerWallet(payment.customer);

          // 1. Debit customer for the full amount (service price + any penalty)
          await debitWallet({
            walletId: customerWallet._id,
            amount: totalAmount,
            reason: 'booking_payment',
            relatedBooking: payment.booking,
            relatedPayment: payment._id,
            description: 'Booking payment'
          });

          // 2. Split the SERVICE amount (not the penalty) into commission + shop payout
          const commission = await calculateAndRecordCommission({
            booking: payment.booking,
            payment: payment._id,
            shop: payment.shop,
            grossAmount: payment.amount
          });

          payment.commissionAmount = commission.commissionAmount;
          // Penalties stay fully with the platform, on top of the commission split
          payment.shopPayoutAmount = commission.shopAmount;

          // 3. Credit commission (+ any penalty) into the company wallet
          const companyWallet = await getOrCreateCompanyWallet();
          await creditWallet({
            walletId: companyWallet._id,
            amount: commission.commissionAmount + (payment.penaltyAmount || 0),
            reason: 'commission_income',
            relatedBooking: payment.booking,
            relatedPayment: payment._id,
            description: 'Commission + penalty income'
          });

          // 4. Create a pending payout for the shop
          await Transfer.create({
            shop: payment.shop,
            booking: payment.booking,
            amount: commission.shopAmount,
            status: 'pending'
          });
        }

        payment.walletProcessed = true;
      }

      await createNotification({
        user: payment.customer,
        title: payment.paymentType === 'wallet_recharge' ? 'Wallet Recharged' : 'Payment Received',
        message: payment.paymentType === 'wallet_recharge'
          ? `Your wallet has been credited with Rs. ${payment.amount}.`
          : `Your payment of Rs. ${payment.amount + (payment.penaltyAmount || 0)} has been processed.`,
        relatedPayment: payment._id
      });
    }

    if (status === 'refunded' && payment.paymentType === 'booking' && payment.walletProcessed) {
      const totalAmount = payment.amount + (payment.penaltyAmount || 0);
      const customerWallet = await getCustomerWallet(payment.customer);

      await creditWallet({
        walletId: customerWallet._id,
        amount: totalAmount,
        reason: 'refund',
        relatedBooking: payment.booking,
        relatedPayment: payment._id,
        description: 'Booking refund'
      });
    }

    await payment.save();

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