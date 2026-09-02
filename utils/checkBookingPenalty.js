const createNotification = require('./createNotification');
const Wallet = require('../models/Wallet');

const NO_SHOW_PENALTY_AMOUNT = 200;
const NO_SHOW_WINDOW_MINUTES = 30;
const CUSTOMER_LATE_PENALTY_AMOUNT = 150;
const CUSTOMER_GRACE_MINUTES = 10;

// Deducts a penalty from the customer's wallet safely - if the wallet doesn't
// exist or has insufficient balance, we still record the penalty on the booking
// (so it shows up on the next invoice) but skip the wallet deduction rather than crash.
//
// NOTE: walletService is required INSIDE this function (not at the top of the
// file) on purpose - this breaks a circular dependency chain:
// bookingController -> checkBookingPenalty -> walletService -> (models only, safe)
// If walletService were required at the top, and something down that chain
// ever required checkBookingPenalty back, Node would give a circular
// dependency warning because the files load before their exports are ready.
const tryDeductPenaltyFromWallet = async (customerId, amount, bookingId, description) => {
  const { debitWallet } = require('../services/walletService');
  try {
    const wallet = await Wallet.findOne({ user: customerId });
    if (!wallet) return;
    await debitWallet({
      walletId: wallet._id,
      amount,
      reason: 'penalty',
      relatedBooking: bookingId,
      description
    });
  } catch (error) {
    console.error('Penalty wallet deduction skipped:', error.message);
  }
};

const checkAndApplyPenalty = async (booking) => {
  if (booking.status !== 'pending' || booking.penaltyApplied) {
    return booking;
  }

  const cutoff = new Date(booking.scheduledAt.getTime() + NO_SHOW_WINDOW_MINUTES * 60 * 1000);
  if (new Date() < cutoff) {
    return booking;
  }

  booking.penaltyApplied = true;
  booking.penaltyAmount = NO_SHOW_PENALTY_AMOUNT;
  await booking.save();

  await tryDeductPenaltyFromWallet(booking.customer, NO_SHOW_PENALTY_AMOUNT, booking._id, 'No-show penalty');

  await createNotification({
    recipient: booking.customer,
    title: 'Late Booking Penalty Applied',
    message: `A penalty of Rs. ${NO_SHOW_PENALTY_AMOUNT} has been deducted from your wallet because your booking was not actioned within ${NO_SHOW_WINDOW_MINUTES} minutes of the scheduled time.`,
    type: 'general',
    relatedBooking: booking._id
  });

  return booking;
};

const checkCustomerLatePenalty = async (booking) => {
  if (
    booking.bookingType !== 'shop_visit' ||
    booking.customerArrivedAt ||
    booking.customerLatePenaltyApplied ||
    !booking.customerExpectedArrivalTime ||
    booking.status === 'cancelled' ||
    booking.status === 'completed'
  ) {
    return booking;
  }

  if (new Date() < booking.customerExpectedArrivalTime) {
    return booking;
  }

  booking.customerLatePenaltyApplied = true;
  booking.customerLatePenaltyAmount = CUSTOMER_LATE_PENALTY_AMOUNT;
  await booking.save();

  await tryDeductPenaltyFromWallet(booking.customer, CUSTOMER_LATE_PENALTY_AMOUNT, booking._id, 'Late arrival penalty');

  await createNotification({
    recipient: booking.customer,
    title: 'Late Arrival Penalty Applied',
    message: `A penalty of Rs. ${CUSTOMER_LATE_PENALTY_AMOUNT} has been deducted from your wallet because you did not arrive at the shop within your estimated time (plus grace period).`,
    type: 'general',
    relatedBooking: booking._id
  });

  return booking;
};

const checkAllPenalties = async (booking) => {
  booking = await checkAndApplyPenalty(booking);
  booking = await checkCustomerLatePenalty(booking);
  return booking;
};

const checkAllPenaltiesForMany = async (bookings) => {
  for (let i = 0; i < bookings.length; i++) {
    bookings[i] = await checkAllPenalties(bookings[i]);
  }
  return bookings;
};

module.exports = {
  checkAndApplyPenalty,
  checkCustomerLatePenalty,
  checkAllPenalties,
  checkAllPenaltiesForMany,
  NO_SHOW_PENALTY_AMOUNT,
  NO_SHOW_WINDOW_MINUTES,
  CUSTOMER_LATE_PENALTY_AMOUNT,
  CUSTOMER_GRACE_MINUTES
};