import mongoose from "mongoose";
import { OPINION_TYPES, WINNING_OPINION_FEE } from "./ModelConstants";
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
  finished: { type: Boolean, default: false },
  //Winnings earned by creator after opinion is finished
  winnings: { type: Number, default: 0 },
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
  if (!account || account.balance <= stake) {
    throw new Error("Fund your account first");
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
  if (await debate.isPastEndTime()) {
    throw new Error("Cannot create opinion past end time");
  }

  const isStakeValid = await contentTypeHelper.isStakeValid(
    this,
    stake,
    debateId
  );

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

  await debate.onOpinionCreated(pro, stake, contentType);
  await Account.updateBalance(
    account.address,
    -stake,
    OPINION_TYPES[contentType].createdEvent,
    createdOpinion._id,
    0,
    "Opinion"
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
    throw new Error(
      "Cannot complete opinion before end time" +
        new Date(debate.updated.getTime() + debate.duration) +
        "\nNow: " +
        new Date()
    );
  }
  const isCreatorPaid = await this.isCreatorPaid();
  if (isCreatorPaid) {
    throw new Error("Opinion already completed");
  }

  let winnings = 0;
  if (
    (debate.totalPro > debate.totalCon && this.pro) ||
    (debate.totalPro < debate.totalCon && !this.pro)
  ) {
    //opinion in majority
    if (this.pro) {
      winnings = Math.round((this.stake / debate.totalPro) * debate.totalCon);
    } else {
      winnings = Math.round((this.stake / debate.totalCon) * debate.totalPro);
    }
  } else if (debate.totalPro === debate.totalCon) {
    // tie
    winnings = 0;
  } else {
    // opinion in minority
    winnings = -this.stake;
  }

  let fee = 0;
  if (winnings > 0) {
    fee = Math.round(winnings * WINNING_OPINION_FEE);
    await Account.updateBalance(
      process.env.FEE_EARNER,
      fee,
      "deposit",
      this._id,
      0,
      "Opinion"
    );
  }

  const account = await Account.findById(this.creator);
  await Account.updateBalance(
    account.address,
    this.stake,
    OPINION_TYPES[this.contentType].finishedEvent,
    this._id,
    winnings - fee,
    "Opinion",
    fee
  );

  this.finished = true;
  this.winnings = winnings;
  return this.save();
};

opinionSchema.statics.getTotals = async function getTotals(
  debateId,
  creatorAddress
) {
  const query = [
    {
      $match: {
        debate: mongoose.Types.ObjectId(debateId),
      },
    },
    {
      $group: {
        _id: null,
        totalPro: { $sum: { $cond: [{ $eq: ["$pro", true] }, "$stake", 0] } },
        totalCon: { $sum: { $cond: [{ $eq: ["$pro", false] }, "$stake", 0] } },
      },
    },
  ];
  if (creatorAddress) {
    const account = await Account.accountForAddress(creatorAddress);
    if (account) {
      query[0].$match.creator = account._id;
      query[1].$group._id = "$creator";
    }
  }
  return Opinion.aggregate(query);
};
opinionSchema.statics.getPeriodicStakeAgregates = function getPeriodicStakeAgregates(
  debateId,
  groupTimePeriodMinutes = 60
) {
  const query = [
    {
      $match: {
        debate: mongoose.Types.ObjectId(debateId),
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$created" },
          day: { $dayOfMonth: "$created" },
          month: { $month: "$created" },
          hour: { $hour: "$created" },
          interval: {
            $subtract: [
              { $minute: "$created" },
              { $mod: [{ $minute: "$created" }, groupTimePeriodMinutes] },
            ],
          },
        },
        totalPro: { $sum: { $cond: [{ $eq: ["$pro", true] }, "$stake", 0] } },
        totalCon: { $sum: { $cond: [{ $eq: ["$pro", false] }, "$stake", 0] } },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.day": 1, "_id.month": 1, "_id.hour": 1 },
    },
  ];
  return Opinion.aggregate(query);
};
opinionSchema.set("toJSON", { getters: true, virtuals: true });
const Opinion = mongoose.model("Opinion", opinionSchema);
export default Opinion;
