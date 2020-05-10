import mongoose from "mongoose";
import { OPINION_TYPES } from "./ModelConstants";
import Debate from "./Debate";
import Account from "./Account";
import History from "./History";

const opinionSchema = new mongoose.Schema({
  //parent debate
  debate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Debate",
    required: true,
  },
  //address of the creator
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  //describes type of content, used for frontend parsing of the data
  contentType: {
    type: String,
    enum: Object.keys(OPINION_TYPES),
    required: true,
    minlength: 4,
    maxlength: 1000,
  },
  //contains opinion data
  content: {
    type: String,
    maxlength: 30000,
  },
  //amount of sats locked up for the debate creation
  stake: { type: Number, min: 1, required: true },
  //opinion FOR the topic, or AGAINST if value is false
  pro: { type: Boolean, required: true },
  //dont set manually
  created: { type: Date, default: Date.now, required: true },
  //Flag for query search performance
  finished: { type: Boolean, default:false}
});

opinionSchema.statics.createVote = async function createVote(
  creatorAddress,
  debateId,
  stake,
  pro
) {
  return Opinion.createOpinion(
    creatorAddress,
    debateId,
    null,
    "vote",
    stake,
    pro
  );
};

opinionSchema.statics.createOpinion = async function createOpinion(
  creatorAddress,
  debateId,
  content,
  contentType,
  stake,
  pro
) {
  const account = await Account.accountForAddress(creatorAddress);
  if (!account) {
    throw new Error("Unknown account address");
  }
  const debate = await Debate.findById(debateId);
  if (!debate) {
    throw new Error("Unknown debate id");
  }
  const contentTypeHelper = OPINION_TYPES[contentType];
  if (!contentTypeHelper) {
    throw new Error("Unknown content type");
  }
  if (!contentTypeHelper.isContentValid(content)) {
    throw new Error("Invalid content format");
  }
  if ((await debate.isPastEndTime())) {
    throw new Error("Cannot create opinion past end time");
  }

  const isStakeValid = await contentTypeHelper.isStakeValid(this, stake, debateId);

  if (!isStakeValid) {
    throw new Error("Stake too low for " + contentType);
  }

  const createdOpinion = new Opinion({
    debate: debateId,
    creator: account._id,
    contentType,
    content,
    stake,
    pro,
  });

  await Account.updateBalance(
    account.address,
    -stake,
    OPINION_TYPES[contentType].createdEvent,
    createdOpinion._id
  );
  return createdOpinion.save();
};
opinionSchema.methods.isCreatorPaid = function isCreatorPaid() {
  return History.findOne({
    account: this.creator,
    schemaId: this._id,
    action: OPINION_TYPES[this.contentType].finishedEvent,
  });
};
opinionSchema.methods.completeOpinion = async function completeOpinion() {
  const debate = await Debate.findById(this.debate);
  const isPastEndTime = await debate.isPastEndTime();
  if (!isPastEndTime) {
    throw new Error("Cannot complete opinion before end time");
  }
  const isCreatorPaid = await this.isCreatorPaid();
  if (isCreatorPaid) {
    throw new Error("Opinion already completed");
  }
  const account = await Account.findById(this.creator);
  await Account.updateBalance(
    account.address,
    this.stake,
    OPINION_TYPES[this.contentType].finishedEvent,
    this._id
  );
  this.finished = true;
  return this.save();
};
opinionSchema.statics.getPeriodicStakeAgregates = function getPeriodicStakeAgregates(
  schemaId,
  actions = ["opinion_created", "vote_created"],
  groupTimePeriodMinutes = 60
) {
  //todo test and fix
  return History.aggregate([
    {
      $match:
        $and[
          { schemaId: mongoose.Types.ObjectId(schemaId) },
          { $or: actions.map(action=>{
              return {action}
          })}
        ],
    },
    {
      $group: {
        _id: {
          year: { $year: "$timestamp" },
          dayOfYear: { $dayOfYear: "$timestamp" },
          hour: { $hour: "$timestamp" },
          interval: {
            $subtract: [
              { $minute: "$timestamp" },
              { $mod: [{ $minute: "$timestamp" }, groupTimePeriodMinutes] },
            ],
          },
        },
      },
      totalPro:  { $sum: "$oooufPro" },
      totalCon: { $sum: "$oooufCon" }
    },
  ]);
};
opinionSchema.set("toJSON", { getters: true, virtuals: true });
const Opinion = mongoose.model("Opinion", opinionSchema);
export default Opinion;
