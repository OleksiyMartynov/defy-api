import { Router } from "express";
import { verifyPubKeyRoute } from "../middleware/SignatureVerifier";
import { queryToPageInfo, queryToFilter, isBodyValidOpinion } from "../utils/ParamValidators";
const router = Router();

router.get("/", async (req, res) => {
  const { page, pageSize } = queryToPageInfo(req.query);
  const { find, sort } = await queryToFilter(req.query);
  const { debateId } = req.query;
  if (!debateId) {
    res.status(400).send({ error: "Missing debate id" });
  } else {
    find.debate = debateId;
    req.context.models.Opinion.find(find)
      .select("debate creator contentType content stake pro created")
      .populate([{ path: "creator", select: "address" }])
      .limit(pageSize)
      .skip(pageSize * page)
      .sort(sort)
      .exec(function (err, opinions) {
        if (err) {
          res.status(500).send({ error: "Failed to get opinions" });
        } else {
          req.context.models.Opinion.countDocuments(find).exec(function (
            err,
            count
          ) {
            if (err) {
              res.status(500).send({ error: "Failed to count opinions" });
            } else {
              res.send({
                opinions: opinions,
                page: page,
                pages: Math.ceil(count / pageSize),
              });
            }
          });
        }
      });
  }
});
router.post("/new", verifyPubKeyRoute, async (req, res) => {
  if (!req.validSignature) {
    res.status(400).send({ error: "Invalid signature provided" });
  } else {
    const validationData = isBodyValidOpinion(req.body);
    if (validationData.isValid) {
      try {
        const opinion = await req.context.models.Opinion.createOpinion(
          validationData.data.address,
          validationData.data.debateId,
          validationData.data.content,
          validationData.data.contentType,
          validationData.data.stake,
          validationData.data.pro
        );
        req.context.models.Opinion
          .findById(opinion._id)
          .select("debate creator contentType content stake pro created")
          .populate([{ path: "creator", select: "address" }])
          .exec(function (err, opinion) {
            if (err) {
              res.status(500).send({ error: "Failed to get opinion" });
            } else {
              res.send({ opinion });
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
