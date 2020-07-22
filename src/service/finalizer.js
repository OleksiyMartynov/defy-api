import { Account, Debate, Opinion } from "../models";
import { DRAW_DURATION } from "../models/ModelConstants";

export const finalize = async () => {
  const debatesFinished = [];
  const opinionsFinished = [];
  let finishTime = new Date(Date.now().getTime() + DRAW_DURATION);
  const debates = Debate.find({
    updated: { $gte: finishTime },
    finished: { $eq: false },
  });
  for (debate in debates) {
    const opinions = Opinion.find({
      debate: debate._id,
      finished: { $eq: false },
    });
    for (Opinion in opinions) {
      await opinion.completeOpinion();
    }
    await debate.completeDebate();
  }
  let log;
  if (debatesFinished.length > 0) {
    log += `Finished Debates: ${debatesFinished.length}\n`;
  }
  if (opinionsFinished.length > 0) {
    log += `Finished Opinions: ${opinionsFinished.length}\n`;
  }
  if (debatesFinished.length > 0 || opinionsFinished.length > 0) {
    const fullLog =
      `=============${new Date()}=============\n` +
      log +
      "================================================================================";
    console.log(fullLog);
  }
};

export const startFinalizer = () => {
  setInterval(finalize, 60 * 1000);
};
