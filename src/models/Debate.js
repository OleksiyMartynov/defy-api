import mongoose from "mongoose";
import { DRAW_DURATION } from "./ModelConstants";
import Account from "./Account";
import History from "./History";
import Tag from "./Tag";

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
  //tags for searching
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    },
  ],
  //amount of sats locked up for the debate creation
  stake: { type: Number, min: 100, required: true },
  //dont set manually
  created: { type: Date, default: Date.now },
  //Seconds untill the debate outcome is finalized
  duration: { type: Number, default: DRAW_DURATION },
  //Updated after a new opinion is created
  lastUpdateTime: { type: Date, default: Date.now },
});
debateSchema.statics.createDebate = async function createDebate(
  address,
  title,
  description,
  tags,
  stake,
  duration=DRAW_DURATION
) {
  const account = await Account.accountForAddress(address);
  if (!account) {
    throw new Error("Unknown account address");
  } else if (tags.length > 5) {
    throw new Error("Too many tags");
  }
  const tagDocs = await Tag.getOrCreate(tags);

  const createdDebate = new Debate({
    creator: account._id,
    title,
    description,
    tags: tagDocs.map((t) => t._id),
    stake: Math.abs(stake),
    duration
  });

  tagDocs.forEach((tag) => {
    tag.debates.push(createdDebate._id);
    tag.save();
  });
  await Account.updateBalance(account.address, stake, "debate_created", createdDebate._id);
  return createdDebate.save();
};
debateSchema.methods.isPastEndTime = function isPastEndTime(){
  const now = new Date();
  const endTime = this.lastUpdateTime.getTime() + this.duration;
  return now.getTime() > endTime;
}
debateSchema.methods.isCreatorPaid = function isCreatorPaid(){
  return History.findOne({account:this.creator, schemaId:this._id, action:"debate_finished"})
}
debateSchema.methods.completeDebate = async function completeDebate(){
  if(!this.isPastEndTime()){
    throw new Error("Cannot complete debate before end time");
  }
  const isCreatorPaid = await this.isCreatorPaid();
  if(isCreatorPaid){
    throw new Error("Debate already completed");
  }
  //todo consider finishing opinions and votes here
  const account = await Account.findById(this.creator)
  await Account.updateBalance(account.address, this.stake, "debate_finished", this._id);
  return this.save();
}
debateSchema.set("toJSON", { getters: true, virtuals: true });
const Debate = mongoose.model("Debate", debateSchema);
export default Debate;
