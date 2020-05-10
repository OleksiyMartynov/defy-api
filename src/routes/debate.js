import { Router } from "express";
import { verifyPubKeyRoute } from "../middleware/SignatureVerifier";
import {
  queryToPageInfo,
  queryToFilter,
  isBodyValidDebate,
} from "../utils/ParamValidators";
const router = Router();

router.get("/", async (req, res) => {
  const { page, pageSize } = queryToPageInfo(req.query);
  const { find, sort } = await queryToFilter(req.query);
  req.context.models.Debate.find(find)
    .select("creator title description tags stake created duration finished")
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
        req.context.models.Debate.countDocuments(find).exec(function (err, count) {
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
    .select("creator title description tags stake created duration finished")
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
