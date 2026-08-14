const createNotification = require('./createNotification');

const NO_SHOW_PENALTY_AMOUNT = 200;
const NO_SHOW_WINDOW_MINUTES = 30;

const CUSTOMER_LATE_PENALTY_AMOUNT = 150;
const CUSTOMER_GRACE_MINUTES = 10;

// No-show penalty: booking never confirmed/actioned within 30 min of scheduledAt
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

  await createNotification({
    recipient: booking.customer,
    title: 'Late Booking Penalty Applied',
    message: `A penalty of Rs. ${NO_SHOW_PENALTY_AMOUNT} has been applied because your booking was not actioned within ${NO_SHOW_WINDOW_MINUTES} minutes of the scheduled time.`,
    type: 'general',
    relatedBooking: booking._id
  });

  return booking;
};

// Customer late-arrival penalty (shop_visit bookings only):
// customer estimated their own arrival time when booking; if they still
// haven't been checked in past that time + grace period, they get penalized.
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

  await createNotification({
    recipient: booking.customer,
    title: 'Late Arrival Penalty Applied',
    message: `A penalty of Rs. ${CUSTOMER_LATE_PENALTY_AMOUNT} has been applied because you did not arrive at the shop within your estimated time (plus grace period).`,
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