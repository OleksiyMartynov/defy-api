import mongoose from "mongoose";
import { HISTORY_EVENT_TYPES } from "./ModelConstants";
const tagSchema = new mongoose.Schema({
  debates: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Debate",
    },
  ],
  name: {
    type: String,
    required: true,
    validate: /^[a-zA-Z0-9_]{2,40}$/,
    minlength: 2,
    maxlength: 40,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

tagSchema.statics.getOrCreate = async function getOrCreate(names) {
  const out = [];
  const toSave = [];
  for await (let name of names) {
    let tag = await this.findOne({ name });
    if (!tag) {
        toSave.push({name});
    }
  }
  await this.insertMany(toSave);
  for await (let name of names) {
    let tag = await this.findOne({ name });
    out.push(tag);
  }
  return out;
};

tagSchema.set("toJSON", { getters: true, virtuals: true });
const Tag = mongoose.model("Tag", tagSchema);
export default Tag;
