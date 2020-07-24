import models from "../models";
import { DRAW_DURATION } from "../models/ModelConstants";

export const finalize = async (duration = DRAW_DURATION) => {
  const debatesFinished = [];
  const opinionsFinished = [];
  let finishTime = new Date(Date.now() - duration);
  const debates = await models.Debate.find({
    updated: { $lte: finishTime },
    finished: { $eq: false },
  });
  for (const debate of debates) {
    const opinions = await models.Opinion.find({
      debate: debate._id,
      finished: { $eq: false },
    });
    for (const opinion of opinions) {
      await opinion.completeOpinion();
      opinionsFinished.push(opinion._id);
    }
    await debate.completeDebate();
    debatesFinished.push(debate._id);
  }
  let log = "";
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
