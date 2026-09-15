const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');

// Internal helper - the ONLY place in the whole codebase that should ever
// change a wallet's balance. Every other module (Payment, Booking, Penalty,
// Commission, Transfer) calls THIS function instead of touching Wallet.balance directly.
// This keeps the "money never disappears" rule enforceable in one place.

// Credits (adds money to) a wallet, and writes the matching ledger entry
const creditWallet = async ({ walletId, amount, reason, relatedBooking, relatedPayment, description, session }) => {
  if (amount <= 0) {
    throw new Error('Credit amount must be greater than zero');
  }

  const wallet = await Wallet.findById(walletId).session(session || null);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  if (wallet.status !== 'active') {
    throw new Error('Cannot credit a frozen wallet');
  }

  wallet.balance += amount;
  await wallet.save({ session });

  await WalletTransaction.create([{
    wallet: wallet._id,
    type: 'credit',
    amount,
    balanceAfter: wallet.balance,
    reason,
    relatedBooking: relatedBooking || null,
    relatedPayment: relatedPayment || null,
    description: description || ''
  }], { session });

  return wallet;
};

// Debits (removes money from) a wallet - throws if insufficient balance,
// which is the core safety check preventing a wallet from going negative
const debitWallet = async ({ walletId, amount, reason, relatedBooking, relatedPayment, description, session }) => {
  if (amount <= 0) {
    throw new Error('Debit amount must be greater than zero');
  }

  const wallet = await Wallet.findById(walletId).session(session || null);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  if (wallet.status !== 'active') {
    throw new Error('Cannot debit a frozen wallet');
  }

  if (wallet.balance < amount) {
    throw new Error('Insufficient wallet balance');
  }

  wallet.balance -= amount;
  await wallet.save({ session });

  await WalletTransaction.create([{
    wallet: wallet._id,
    type: 'debit',
    amount,
    balanceAfter: wallet.balance,
    reason,
    relatedBooking: relatedBooking || null,
    relatedPayment: relatedPayment || null,
    description: description || ''
  }], { session });

  return wallet;
};

// Gets (or lazily creates) the single company wallet - there is only ever one
const getOrCreateCompanyWallet = async (session) => {
  let companyWallet = await Wallet.findOne({ ownerType: 'company' }).session(session || null);
  if (!companyWallet) {
    const wallets = await Wallet.create([{ ownerType: 'company', balance: 0 }], { session });
    companyWallet = wallets[0];
  }
  return companyWallet;
};

module.exports = { creditWallet, debitWallet, getOrCreateCompanyWallet };
