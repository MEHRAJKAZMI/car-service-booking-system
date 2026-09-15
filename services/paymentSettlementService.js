const Booking = require('../models/Booking');
const Commission = require('../models/Commission');
const Transfer = require('../models/Transfer');
const Wallet = require('../models/Wallet');
const { creditWallet, debitWallet, getOrCreateCompanyWallet } = require('./walletService');
const { calculateAndRecordCommission } = require('./commissionService');

const getCustomerWallet = async (userId, session) => {
  const wallet = await Wallet.findOne({ user: userId, ownerType: 'customer' }).session(session);
  if (!wallet) throw new Error('This customer does not have a wallet yet');
  return wallet;
};

// Runs inside the caller's MongoDB transaction. Do not call this directly
// without a session: the wallet, ledger, commission and transfer must commit together.
const settlePaidPayment = async (payment, session) => {
  if (payment.walletProcessed) return payment;

  const customerWallet = await getCustomerWallet(payment.customer, session);
  if (payment.paymentType === 'wallet_recharge') {
    await creditWallet({
      walletId: customerWallet._id, amount: payment.amount, reason: 'wallet_recharge',
      relatedPayment: payment._id, description: 'Wallet top-up', session
    });
  } else {
    const booking = await Booking.findById(payment.booking).session(session);
    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'completed') throw new Error('Only completed bookings can be paid');

    const totalAmount = payment.amount + (payment.penaltyAmount || 0);
    await debitWallet({
      walletId: customerWallet._id, amount: totalAmount, reason: 'booking_payment',
      relatedBooking: payment.booking, relatedPayment: payment._id, description: 'Booking payment', session
    });

    const commission = await calculateAndRecordCommission({
      booking: payment.booking, payment: payment._id, shop: payment.shop,
      grossAmount: payment.amount, session
    });
    payment.commissionAmount = commission.commissionAmount;
    payment.shopPayoutAmount = commission.shopAmount;

    const companyWallet = await getOrCreateCompanyWallet(session);
    await creditWallet({
      walletId: companyWallet._id,
      amount: commission.commissionAmount + (payment.penaltyAmount || 0),
      reason: 'commission_income', relatedBooking: payment.booking,
      relatedPayment: payment._id, description: 'Commission and penalty income', session
    });

    await Transfer.create([{
      shop: payment.shop, booking: payment.booking, commission: commission._id,
      amount: commission.shopAmount, status: 'pending'
    }], { session });
  }

  payment.walletProcessed = true;
  payment.paidAt = new Date();
  return payment;
};

const refundPaidBookingPayment = async (payment, session) => {
  if (payment.paymentType !== 'booking' || payment.status !== 'paid' || !payment.walletProcessed) {
    throw new Error('Only a settled booking payment can be refunded');
  }

  const transfer = await Transfer.findOne({ booking: payment.booking }).session(session);
  if (transfer && transfer.status === 'completed') {
    throw new Error('Completed shop payouts cannot be automatically refunded');
  }
  const commission = await Commission.findOne({ payment: payment._id }).session(session);
  if (!commission) throw new Error('Commission record not found for this payment');

  const companyWallet = await getOrCreateCompanyWallet(session);
  await debitWallet({
    walletId: companyWallet._id,
    amount: commission.commissionAmount + (payment.penaltyAmount || 0),
    reason: 'refund', relatedBooking: payment.booking, relatedPayment: payment._id,
    description: 'Reversal for refunded booking payment', session
  });

  const customerWallet = await getCustomerWallet(payment.customer, session);
  await creditWallet({
    walletId: customerWallet._id, amount: payment.amount + (payment.penaltyAmount || 0),
    reason: 'refund', relatedBooking: payment.booking, relatedPayment: payment._id,
    description: 'Refund for booking payment', session
  });

  if (transfer) {
    transfer.status = 'failed';
    transfer.failureReason = 'Booking payment refunded';
    await transfer.save({ session });
  }
  payment.status = 'refunded';
  return payment;
};

module.exports = { getCustomerWallet, settlePaidPayment, refundPaidBookingPayment };
