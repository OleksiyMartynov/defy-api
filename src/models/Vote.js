import mongoose from "mongoose";
const voteSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
    },
    //amount of sats locked up for the vote creation
    stake: { type: Number, min: 1, required: true },
    //vote FOR the topic, or AGAINST if value is false
    pro: { type: Boolean, required: true },
});

voteSchema.set("toJSON", { getters: true, virtuals: true });
const Vote = mongoose.model("Vote", voteSchema);
export default Vote;
