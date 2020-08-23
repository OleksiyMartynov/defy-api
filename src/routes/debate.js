import { Router } from "express";
import { verifyPubKeyRoute } from "../middleware/SignatureVerifier";
import {
  queryToPageInfo,
  queryToFilter,
  isBodyValidDebate,
  addressToId,
} from "../utils/ParamValidators";
import { expandDebateAggregates } from "../utils/DatabaseUtils";
import {
  MIN_VOTE_STAKE,
  DRAW_DESCRIPTION_PREVIEW_LENGTH,
  WINNING_OPINION_FEE,
} from "../models/ModelConstants";
import { trimStringToLength } from "../utils/Common";
const router = Router();

router.get("/", async (req, res) => {
  const { page, pageSize } = queryToPageInfo(req.query);
  const { find, sort } = await queryToFilter(req.query);
  const { callerAddress } = req.query;
  req.context.models.Debate.find(find)
    .select(
      "creator title description tags stake created duration finished updated totalPro totalCon totalLocked"
    )
    .populate([
      { path: "tags", select: "name" },
      { path: "creator", select: "address" },
    ])
    .limit(pageSize)
    .skip(pageSize * page)
    .sort(sort)
    .exec(function (err, debates) {
      if (err) {
        res.status(500).send({ error: "Failed to get debates" });
      } else {
        req.context.models.Debate.countDocuments(find).exec(async function (
          err,
          count
        ) {
          if (err) {
            res.status(500).send({ error: "Failed to count debates" });
          } else {
            const callerAddressId = await addressToId(callerAddress);
            const debatesList = [];
            for (const d of debates) {
              let opinionsByCaller = 0;
              if (callerAddressId) {
                opinionsByCaller = await req.context.models.Opinion.countDocuments(
                  {
                    debate: d._id,
                    creator: callerAddressId,
                  }
                );
              }
              const totalOpinions = await req.context.models.Opinion.countDocuments(
                {
                  debate: d._id,
                }
              );

              const out = { ...d.toJSON() };
              out.createdByYou = d.creator.address === callerAddress;
              out.opinionsByYou = opinionsByCaller;
              out.totalOpinions = totalOpinions;

              out.description = trimStringToLength(
                d.description,
                DRAW_DESCRIPTION_PREVIEW_LENGTH
              );
              delete out.creator;
              debatesList.push(out);
            }
            res.send({
              debates: debatesList,
              page: page,
              pages: Math.ceil(count / pageSize),
            });
          }
        });
      }
    });
});
router.get("/:objectId", async (req, res) => {
  const { callerAddress } = req.query;
  req.context.models.Debate.findById(req.params.objectId)
    .select(
      "creator title description tags stake created duration finished updated totalPro totalCon"
    )
    .populate([
      { path: "tags", select: "name" },
      { path: "creator", select: "address" },
    ])
    .exec(async function (err, debate) {
      if (err) {
        res.status(500).send({ error: "Failed to get debates" });
      } else {
        const history = await req.context.models.Opinion.getPeriodicStakeAgregates(
          debate._id
        );
        const expandedHours = expandDebateAggregates(debate, history);

        let callerTotals = null;
        if (callerAddress) {
          const callerTotalsArr = await req.context.models.Opinion.getTotals(
            debate._id,
            callerAddress
          );
          if (callerTotalsArr.length > 0) {
            callerTotals = callerTotalsArr[0];
            delete callerTotals._id;
          } else {
            callerTotals = { totalPro: 0, totalCon: 0 };
          }
        }

        var topOpinion = await req.context.models.Opinion.find({
          debate: debate._id,
        })
          .sort({ stake: -1 })
          .limit(1)
          .exec();
        const prevMaxStake = topOpinion[0]
          ? topOpinion[0].stake
          : MIN_VOTE_STAKE;
        const outDebate = debate.toJSON();
        outDebate.createdByYou = callerAddress === debate.creator.address;
        delete outDebate.creator;
        delete outDebate._id;
        res.send({
          debate: outDebate,
          history: expandedHours,
          callerTotals,
          rules: {
            minOpinionCreationStake: prevMaxStake + 1,
            minVoteCreationStake: MIN_VOTE_STAKE,
            winnerFee: WINNING_OPINION_FEE,
          },
        });
      }
    });
});
router.post("/new", verifyPubKeyRoute, async (req, res) => {
  if (!req.validSignature) {
    res.status(400).send({ error: "Invalid signature provided" });
  } else {
    const validationData = isBodyValidDebate(req.body);
    if (validationData.isValid) {
      try {
        const debate = await req.context.models.Debate.createDebate(
          validationData.data.address,
          validationData.data.title,
          validationData.data.description,
          validationData.data.tags,
          parseInt(validationData.data.stake, 10)
        );
        req.context.models.Debate.findById(debate._id)
          .select(
            "creator title description tags stake created duration finished"
          )
          .populate([
            { path: "tags", select: "name" },
            { path: "creator", select: "address" },
          ])
          .exec(function (err, debate) {
            if (err) {
              res.status(500).send({ error: "Failed to get debates" });
            } else {
              res.send({ debate });
            }
          });
      } catch (ex) {
        res.status(400).send({ error: ex.message });
      }
    } else {
      res.status(400).send({ error: validationData.data });
    }
  }
});

export default router;
