import mongoose from "mongoose";
import { HISTORY_EVENT_TYPES } from "./ModelConstants";
const invoiceSchema = new mongoose.Schema({
  creator: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
  ],
  data: {
    type: String,
    required: true,
    maxlength: 700,
  },
  expiry: {
    type: Number,
    default: 3600,
  },
  status: {
    type: String,
    enum: ["paid", "pending", "failed"],
    trim: true,
    default: "pending",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

invoiceSchema.statics.getOrCreate = async function getOrCreate(names) {
  //   const out = [];
  //   const toSave = [];
  //   for await (let name of names) {
  //     let tag = await this.findOne({ name });
  //     if (!tag) {
  //         toSave.push({name});
  //     }
  //   }
  //   await this.insertMany(toSave);
  //   for await (let name of names) {
  //     let tag = await this.findOne({ name });
  //     out.push(tag);
  //   }
  //todo
  return out;
};

invoiceSchema.set("toJSON", { getters: true, virtuals: true });
const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
