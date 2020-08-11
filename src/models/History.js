import mongoose from "mongoose";
import { HISTORY_EVENT_TYPES } from "./ModelConstants";
const historySchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  action: {
    type: String,
    enum: HISTORY_EVENT_TYPES,
    required: true,
  },
  schemaId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "fromModel",
    required: true,
  },
  fromModel: {
    type: String,
    required: true,
    enum: ["Debate", "Opinion", "Account", "Tag", "Invoice"],
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

historySchema.set("toJSON", { getters: true, virtuals: true });
const History = mongoose.model("History", historySchema);
export default History;
