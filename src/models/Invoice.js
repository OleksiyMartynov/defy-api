import mongoose from "mongoose";
import { HISTORY_EVENT_TYPES, INVOICE_EXPIRY } from "./ModelConstants";
import Account from "./Account";
const invoiceSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  data: {
    type: String,
    required: true,
    maxlength: 700,
  },
  type: {
    type: String,
    enum: [
      HISTORY_EVENT_TYPES[0],
      HISTORY_EVENT_TYPES[1],
      HISTORY_EVENT_TYPES[8],
      HISTORY_EVENT_TYPES[9],
    ],
    required: true,
  },
  status: {
    type: String,
    enum: ["paid", "pending", "failed"],
    trim: true,
    default: "pending",
  },
  amount: {
    type: Number,
    default: 0,
  },
  expiry: {
    type: Number,
    default: INVOICE_EXPIRY,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  expiryTimestamp: {
    type: Date,
    required: true,
  },
});

invoiceSchema.statics.createDepositInvoice = async function createDepositInvoice(
  creatorAddress,
  data,
  expiryDuration = INVOICE_EXPIRY
) {
  const existing = await this.getInvoiceForData(data);
  if (existing) {
    throw new Error("Invoice with same data field exists");
  }
  const account = await Account.accountForAddress(creatorAddress);
  if (!account) {
    throw new Error("Unknown account address");
  }
  return Invoice.create({
    creator: account._id,
    data,
    type: HISTORY_EVENT_TYPES[0],
    status: "pending",
    expiryTimestamp: new Date(Date.now() + expiryDuration),
    expiry: expiryDuration,
  });
};

invoiceSchema.statics.createWithdrawalInvoice = async function createWithdrawalInvoice(
  creatorAddress,
  data,
  amount,
  expiryDuration = INVOICE_EXPIRY
) {
  const existing = await this.getInvoiceForData(data);
  if (existing) {
    throw new Error("Invoice with same data field exists");
  }
  const account = await Account.accountForAddress(creatorAddress);
  if (!account) {
    throw new Error("Fund your account first");
  }
  const createdInvoice = await Invoice.create({
    creator: account._id,
    data,
    type: HISTORY_EVENT_TYPES[8],
    status: "pending",
    amount,
    expiryTimestamp: new Date(Date.now() + expiryDuration),
    expiry: expiryDuration,
  });
  await Account.updateBalance(
    account.address,
    -amount,
    HISTORY_EVENT_TYPES[8],
    createdInvoice._id,
    0,
    "Invoice"
  );
  return createdInvoice;
};

invoiceSchema.statics.getInvoiceForData = async function getInvoiceForData(
  data
) {
  return this.findOne({ data: { $eq: data } });
};

invoiceSchema.statics.getValidDepositInvoice = async function getValidDepositInvoice(
  account
) {
  return this.findOne({
    creator: account._id,
    status: { $eq: "pending" },
    type: { $eq: HISTORY_EVENT_TYPES[0] },
    expiryTimestamp: { $gt: new Date() },
  });
};

invoiceSchema.statics.getValidWithdrawInvoice = async function getValidWithdrawInvoice(
  account
) {
  return this.findOne({
    creator: account._id,
    status: { $eq: "pending" },
    type: { $eq: HISTORY_EVENT_TYPES[8] },
    expiryTimestamp: { $gt: new Date() },
  });
};

invoiceSchema.methods.markDepositPaid = async function markDepositPaid(amount) {
  if (this.status !== "pending") {
    throw new Error("Attempted to pay paid/failed invoice");
  }
  const account = await Account.findById(this.creator);
  await Account.updateBalance(
    account.address,
    amount,
    "deposit",
    this._id,
    0,
    "Invoice"
  );
  this.amount = amount;
  this.status = "paid";
  return this.save();
};

invoiceSchema.methods.markWithdrawalPaid = async function markWithdrawalPaid() {
  if (this.status !== "pending") {
    throw new Error("Attempted to pay paid/failed invoice");
  }
  const account = await Account.findById(this.creator);
  await Account.updateBalance(
    account.address,
    this.amount,
    HISTORY_EVENT_TYPES[1],
    this._id,
    0,
    "Invoice"
  );
  this.type = HISTORY_EVENT_TYPES[1];
  this.status = "paid";
  return this.save();
};

invoiceSchema.methods.markWithdrawalFailure = async function markWithdrawalFailure() {
  if (this.status !== "pending") {
    throw new Error("Attempted to pay paid/failed invoice");
  }
  const account = await Account.findById(this.creator);
  await Account.updateBalance(
    account.address,
    this.amount,
    HISTORY_EVENT_TYPES[9],
    this._id,
    0,
    "Invoice"
  );
  this.type = HISTORY_EVENT_TYPES[9];
  this.status = "failed";
  return this.save();
};

invoiceSchema.set("toJSON", { getters: true, virtuals: true });
const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
