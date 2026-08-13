const createNotification = require('./createNotification');

// The fixed penalty amount for a late/no-show booking
const PENALTY_AMOUNT = 200;

// The grace period after scheduledAt before a penalty can be applied
const PENALTY_WINDOW_MINUTES = 30;

// Checks a SINGLE booking document and applies a penalty if it qualifies:
// - still "pending" (never confirmed, never cancelled)
// - scheduledAt + 30 minutes has already passed
// - hasn't already been penalized
//
// This is called lazily whenever a booking is fetched (rather than running
// a background job/cron), which keeps things simple for this project while
// still catching every overdue booking whenever someone actually looks at it.
const checkAndApplyPenalty = async (booking) => {
  if (booking.status !== 'pending' || booking.penaltyApplied) {
    return booking;
  }

  const cutoff = new Date(booking.scheduledAt.getTime() + PENALTY_WINDOW_MINUTES * 60 * 1000);

  if (new Date() < cutoff) {
    return booking;
  }

  booking.penaltyApplied = true;
  booking.penaltyAmount = PENALTY_AMOUNT;
  await booking.save();

  await createNotification({
    recipient: booking.customer,
    title: 'Late Booking Penalty Applied',
    message: `A penalty of Rs. ${PENALTY_AMOUNT} has been applied because your booking was not actioned within ${PENALTY_WINDOW_MINUTES} minutes of the scheduled time.`,
    type: 'general',
    relatedBooking: booking._id
  });

  return booking;
};

// Convenience version for checking a whole array of bookings at once
const checkAndApplyPenaltyToMany = async (bookings) => {
  for (const booking of bookings) {
    await checkAndApplyPenalty(booking);
  }
  return bookings;
};

module.exports = { checkAndApplyPenalty, checkAndApplyPenaltyToMany, PENALTY_AMOUNT, PENALTY_WINDOW_MINUTES };