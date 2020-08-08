import mongoose from "mongoose";
import History from "./History";
import { HISTORY_EVENT_TYPES } from "./ModelConstants";

const accountSchema = new mongoose.Schema({
  //public key
  address: {
    type: String,
    index: true,
    required: true,
    minlength: 42,
  },
  //balance
  balance: { type: Number, default: 0, required: true },
  //locked balance, in debate or opinion
  lockedBalance: { type: Number, default: 0, required: true },
});

accountSchema.methods.getLocked = async function getLocked() {
  History.aggregate({ $match: {} });
};
accountSchema.statics.accountForAddress = function accountForAddress(address) {
  return this.findOne({ address: address });
};
accountSchema.statics.updateBalance = async function updateBalance(
  address,
  delta,
  reason,
  receiptSchemaId,
  winnings = 0,
  schemaName
) {
  if (HISTORY_EVENT_TYPES.indexOf(reason) === -1) {
    throw new Error("Unknown balance update reason.");
  } else if (
    (reason === "deposit" ||
      reason === "debate_finished" ||
      reason === "opinion_finished" ||
      reason === "vote_finished") &&
    delta < 0
  ) {
    throw new Error("Number must be > 0 for " + reason);
  } else if (
    (reason === "withdrawal" ||
      reason === "debate_created" ||
      reason === "opinion_created" ||
      reason === "vote_created") &&
    delta > 0
  ) {
    throw new Error("Number must be < 0 for " + reason);
  }
  let account = await this.findOne({ address });
  if (!account && reason !== "deposit") {
    throw new Error("Can only create new account on deposit");
  } else if (!account && reason === "deposit") {
    account = new Account({ address });
  }

  if (account.balance + delta < 0) {
    throw new Error("Account does not have enough funds");
  }

  if (
    reason === "debate_created" ||
    reason === "opinion_created" ||
    reason === "vote_created" ||
    reason === "debate_finished" ||
    reason === "opinion_finished" ||
    reason === "vote_finished"
  ) {
    account.lockedBalance -= delta;
  }
  account.balance += delta;

  if (
    reason === "debate_finished" ||
    reason === "opinion_finished" ||
    reason === "vote_finished"
  ) {
    account.balance += winnings;
  }

  await History.create({
    account: account._id,
    action: reason,
    schemaId: receiptSchemaId ? receiptSchemaId : account._id,
    fromModel: schemaName ? schemaName : "Account",
    amount: delta,
  });
  return account.save();
};
const Account = mongoose.model("Account", accountSchema);
export default Account;
