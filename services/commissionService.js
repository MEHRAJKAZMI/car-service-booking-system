const Commission = require('../models/Commission');

// The platform-wide commission rate. Kept as a single named constant here
// instead of hardcoded inline numbers - if the business wants this configurable
// via environment variable or an admin-editable settings collection later,
// this is the one place to change it.
const COMMISSION_RATE_PERCENT = Number(process.env.COMMISSION_RATE_PERCENT) || 5;

// Calculates and PERMANENTLY RECORDS the commission split for a booking.
// Called exactly once per booking, at the moment its payment is completed.
// Throws if a commission already exists for this booking (prevents double-charging).
const calculateAndRecordCommission = async ({ booking, payment, shop, grossAmount }) => {
  const existing = await Commission.findOne({ booking });
  if (existing) {
    throw new Error('Commission has already been calculated for this booking');
  }

  const commissionAmount = Math.round((grossAmount * COMMISSION_RATE_PERCENT) / 100 * 100) / 100;
  const shopAmount = grossAmount - commissionAmount;

  const commission = await Commission.create({
    booking,
    payment,
    shop,
    grossAmount,
    commissionRate: COMMISSION_RATE_PERCENT,
    commissionAmount,
    shopAmount
  });

  return commission;
};

module.exports = { calculateAndRecordCommission, COMMISSION_RATE_PERCENT };