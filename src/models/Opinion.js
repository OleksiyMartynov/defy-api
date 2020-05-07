import mongoose from "mongoose";
const opinionSchema = new mongoose.Schema({
  //address of the creator
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  //describes type of content, used for frontend parsing of the data
  contentType: {
    type: String,
    enum: ["link"],
    required: true,
  },
  //contains opinion data
  content: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 30000,
  },
  //amount of sats locked up for the debate creation
  stake: { type: Number, min: 1, required: true },
  //opinion FOR the topic, or AGAINST if value is false
  pro: { type: Boolean, required: true },
  //dont set manually
  created: { type: Date, default: Date.now, required: true },
});

opinionSchema.set("toJSON", { getters: true, virtuals: true });
const Opinion = mongoose.model("Opinion", opinionSchema);
export default Opinion;
