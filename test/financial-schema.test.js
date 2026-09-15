const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const WalletTransaction = require('../models/WalletTransaction');
const Transfer = require('../models/Transfer');

const id = () => new mongoose.Types.ObjectId();

test('the ledger accepts the settlement commission-income reason', async () => {
  const transaction = new WalletTransaction({
    wallet: id(), type: 'credit', amount: 10, balanceAfter: 10,
    reason: 'commission_income'
  });
  await assert.doesNotReject(transaction.validate());
});

test('a transfer cannot be created without its corresponding commission', async () => {
  const transfer = new Transfer({ shop: id(), booking: id(), amount: 10 });
  await assert.rejects(transfer.validate(), /commission/);
});

test('a transfer with a commission reference satisfies its required fields', async () => {
  const transfer = new Transfer({ shop: id(), booking: id(), commission: id(), amount: 10 });
  await assert.doesNotReject(transfer.validate());
});
