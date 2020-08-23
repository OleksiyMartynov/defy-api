export const HISTORY_EVENT_TYPES = [
  "deposit",
  "withdrawal",
  "debate_created",
  "debate_finished",
  "opinion_created",
  "opinion_finished",
  "vote_created",
  "vote_finished",
  "withdrawal_created",
  "withdrawal_failed",
];

export const MIN_OPINION_START_STAKE = 100;
export const MIN_VOTE_STAKE = 1;
export const DRAW_DURATION = 24 * 60 * 60 * 1000;
export const INVOICE_EXPIRY = 60 * 60 * 1000;
export const DRAW_DESCRIPTION_PREVIEW_LENGTH = 200;
export const WINNING_OPINION_FEE = 0.01;

export const OPINION_TYPES = {
  link: {
    name: "link",
    isContentValid: function (content) {
      var expression = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
      var regex = new RegExp(expression);
      return content.match(regex);
    },
    isStakeValid: async function (schema, stake, debateId) {
      var topOpinionQuery = schema
        .find({ debate: debateId })
        .sort({ stake: -1 })
        .limit(1);
      const topOpinion = await topOpinionQuery.exec();

      const prevMaxStake = topOpinion[0]
        ? topOpinion[0].stake
        : MIN_OPINION_START_STAKE - 1;
      return prevMaxStake < stake;
    },
    createdEvent: "opinion_created",
    finishedEvent: "opinion_finished",
  },
  vote: {
    name: "vote",
    isContentValid: function (content) {
      return !content;
    },
    isStakeValid: async function (schema, stake, debateId) {
      return stake >= MIN_VOTE_STAKE;
    },
    createdEvent: "vote_created",
    finishedEvent: "vote_finished",
  },
};
