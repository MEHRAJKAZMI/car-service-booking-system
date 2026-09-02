const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const createNotification = require('../utils/createNotification');
const { checkAllPenalties } = require('../utils/checkBookingPenalty');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const createPayment = async (req, res) => {
  try {
    const { booking, method } = req.body;

    let bookingDoc = await Booking.findById(booking);
    if (!bookingDoc) {
      return sendError(res, 404, 'Booking not found');
    }

    bookingDoc = await checkAllPenalties(bookingDoc);

    const existingPayment = await Payment.findOne({ booking });
    if (existingPayment) {
      return sendError(res, 400, 'A payment record already exists for this booking');
    }

    const amount = bookingDoc.services.reduce((sum, service) => sum + service.price, 0);
    const totalPenalty = bookingDoc.penaltyAmount + bookingDoc.customerLatePenaltyAmount;

    const payment = await Payment.create({
      booking,
      customer: bookingDoc.customer,
      shop: bookingDoc.shop,
      amount,
      penaltyAmount: totalPenalty,
      method: method || 'cash'
    });

    return sendSuccess(res, 201, 'Payment record created successfully', { payment });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getPaymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer', 'firstName lastName email')
      .populate('shop', 'shopName')
      .populate('booking');

    if (!payment) {
      return sendError(res, 404, 'Payment not found');
    }

    return sendSuccess(res, 200, 'Payment fetched successfully', { payment });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

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

const updatePaymentStatus = async (req, res) => {
  try {
    const { status, method } = req.body;

    const validStatuses = ['pending', 'paid', 'refunded'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 400, 'Invalid status value');
    }

    const updateData = { status };
    if (method) updateData.method = method;
    if (status === 'paid') updateData.paidAt = new Date();

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!payment) {
      return sendError(res, 404, 'Payment not found');
    }

    if (status === 'paid') {
      await createNotification({
        recipient: payment.customer,
        title: 'Payment Received',
        message: `Your payment of Rs. ${payment.amount + payment.penaltyAmount} has been received.`,
        type: 'general',
        relatedBooking: payment.booking
      });
    }

    return sendSuccess(res, 200, 'Payment status updated successfully', { payment });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const generateInvoice = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer', 'firstName lastName email phoneNumber')
      .populate('shop', 'shopName completeAddress phoneNumber')
      .populate('booking');

    if (!payment) {
      return sendError(res, 404, 'Payment not found');
    }

    const invoice = {
      invoiceNumber: `INV-${payment._id.toString().slice(-8).toUpperCase()}`,
      issuedAt: new Date(),
      customer: payment.customer,
      shop: payment.shop,
      services: payment.booking.services,
      subtotal: payment.amount,
      penalty: payment.penaltyAmount,
      total: payment.amount + payment.penaltyAmount,
      status: payment.status,
      method: payment.method,
      paidAt: payment.paidAt
    };

    return sendSuccess(res, 200, 'Invoice generated successfully', { invoice });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  createPayment,
  getPaymentDetails,
  getAllPayments,
  getMyPayments,
  updatePaymentStatus,
  generateInvoice
};