import mongoose from "mongoose";
import { DRAW_DURATION } from "./ModelConstants";

const debateSchema = new mongoose.Schema({
  //address of the creator
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  //debate title
  title: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 180,
  },
  //description of the debate
  description: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 30000,
  },
  //amount of sats locked up for the debate creation
  stake: { type: Number, min: 100, required: true },
  //dont set manually
  created: { type: Date, default: Date.now },
  //Seconds untill the debate outcome is finalized
  duration: { type: Number, default: DRAW_DURATION },
  //Updated after a new opinion is created
  lastUpdateTime: { type: Date, default: Date.now },
});

debateSchema.set("toJSON", { getters: true, virtuals: true });
const Debate = mongoose.model("Debate", debateSchema);
export default Debate;
