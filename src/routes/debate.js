import { Router } from "express";
import { verifyPubKeyRoute } from "../middleware/SignatureVerifier";
import {
  queryToPageInfo,
  queryToFilter,
  isBodyValidDebate,
} from "../utils/ParamValidators";
import {
  expandMap,
  arrayOfNumbers,
  nowSeconds,
  hoursSince,
  componentsToDate,
  dateToComponents,
} from "../utils/Common";
const router = Router();

router.get("/", async (req, res) => {
  const { page, pageSize } = queryToPageInfo(req.query);
  const { find, sort } = await queryToFilter(req.query);
  req.context.models.Debate.find(find)
    .select(
      "creator title description tags stake created duration finished updated totalPro totalCon"
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
        req.context.models.Debate.countDocuments(find).exec(function (
          err,
          count
        ) {
          if (err) {
            res.status(500).send({ error: "Failed to count debates" });
          } else {
            res.send({
              debates: debates,
              page: page,
              pages: Math.ceil(count / pageSize),
            });
          }
        });
      }
    });
});
router.get("/:objectId", async (req, res) => {
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
        const globalTotals = { totalCon: 0, totalPro: 0 };
        const historyTotals = history.map((item) => {
          globalTotals.totalPro += item.totalPro;
          globalTotals.totalCon += item.totalCon;
          return { ...globalTotals, ...item._id };
        });
        // todo: clean up section below
        console.log(debate.created);
        const hoursSinceDebateCreated = hoursSince(debate.created.getTime());
        console.log(hoursSinceDebateCreated);
        const timePeriod = arrayOfNumbers(hoursSinceDebateCreated+2);
        console.log(timePeriod);
        console.log(historyTotals)
        const expandedHours = expandMap(
          { totalPro: 0, totalCon: 0, date:debate.created },
          timePeriod,
          historyTotals.reduce(function (map, obj) {
            
            const date = componentsToDate(
              obj.year,
              obj.month - 1,
              obj.day,
              obj.hour
            );
            console.log(date);
            console.log(new Date().toUTCString())
            const key = hoursSince(date.getTime());
            console.log(key);
            console.log({totalPro:obj.totalPro,totalCon:obj.totalCon});
            map[key] = { date, ...obj };
            return map;
          }, {})
        );
        res.send({ debate, history: expandedHours.reverse() });
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
          validationData.data.stake
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
