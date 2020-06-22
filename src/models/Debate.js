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
  updated: { type: Date, default: Date.now },
  totalPro: { type: Number, default: 0 },
  totalCon: { type: Number, default: 0 },
  //Seconds untill the debate outcome is finalized(endTime=updated+duration)
  duration: { type: Number, default: DRAW_DURATION },
  //Flag for query search performance
  finished: { type: Boolean, default:false}
});
// debateSchema.methods.getLastUpdateTime = async function getLastUpdateTime(){
//   const topOpinionQuery = Opinion.find({debate : this._id}).sort({stake : -1}).limit(1);
//   const topOpinion = await topOpinionQuery.exec();
//   return topOpinion[0]? topOpinion[0].created: this.created;
// };
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
  } else if (tags && tags.length > 5) {
    throw new Error("Too many tags");
  }
  const tagDocs = tags?(await Tag.getOrCreate(tags)):[];

  const createdDebate = new Debate({
    creator: account._id,
    title,
    description,
    tags: tagDocs.map((t) => t._id),
    stake: stake,
    duration
  });

  tagDocs.forEach((tag) => {
    tag.debates.push(createdDebate._id);
    tag.save();
  });
  await Account.updateBalance(account.address, -stake, "debate_created", createdDebate._id);
  return createdDebate.save();
};
debateSchema.methods.isPastEndTime = async function isPastEndTime(){
  const now = new Date();
  const endTime = this.updated.getTime() + this.duration;
  return now.getTime() > endTime;
}
debateSchema.methods.isCreatorPaid = function isCreatorPaid(){
  return History.findOne({account:this.creator, schemaId:this._id, action:"debate_finished"})
}
debateSchema.methods.onOpinionCreated = async function onOpinionCreated(pro, stake){
  this.updated = new Date();
  if(pro){
    this.totalPro+=stake;
  }else{
    this.totalCon+=stake;
  }
  return this.save();
}
debateSchema.methods.completeDebate = async function completeDebate(){
  if(!(await this.isPastEndTime())){
    throw new Error("Cannot complete debate before end time");
  }
  const isCreatorPaid = await this.isCreatorPaid();
  if(isCreatorPaid){
    throw new Error("Debate already completed");
  }
  const account = await Account.findById(this.creator)
  await Account.updateBalance(account.address, this.stake, "debate_finished", this._id);
  
  this.finished = true;
  return this.save();
}

debateSchema.set("toJSON", { getters: true, virtuals: true });
const Debate = mongoose.model("Debate", debateSchema);
export default Debate;
