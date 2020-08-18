import { Router } from "express";
import { verifyPubKeyRoute } from "../middleware/SignatureVerifier";
import {
  isValidAccountAddress,
  isBodyValidHistory,
  queryToPageInfo,
  addressToId,
} from "../utils/ParamValidators";

const router = Router();

router.get("/", async (req, res, next) => {
  const account = req.query.account;
  if (!isValidAccountAddress(account)) {
    res.status(400);
    return res.send({ error: "Invalid account address" });
  }
  const accountModel = await req.context.models.Account.accountForAddress(
    account
  );
  if (accountModel) {
    return res.send({
      balance: accountModel.balance,
      lockedBalance: accountModel.lockedBalance,
    });
  } else {
    res.send({
      balance: 0,
      lockedBalance: 0,
    });
  }
});

router.post("/history", verifyPubKeyRoute, async (req, res) => {
  if (req.validSignature) {
    const validationData = isBodyValidHistory(req.body);
    if (validationData.isValid) {
      try {
        const { page, pageSize } = queryToPageInfo(req.query);
        const callerAddressId = await addressToId(validationData.data.address);
        const find = {
          account: callerAddressId,
        };
        req.context.models.History.find(find)
          .select("action schemaId amount timestamp fromModel")
          .populate("schemaId")
          .limit(pageSize)
          .sort({ timestamp: "desc" })
          .skip(pageSize * page)
          .exec(function (err, historyList) {
            if (err) {
              console.log(err);
              res.status(500).send({ error: "Failed to get history" });
            } else {
              req.context.models.History.countDocuments(find).exec(function (
                err,
                count
              ) {
                if (err) {
                  res.status(500).send({ error: "Failed to count opinions" });
                } else {
                  res.send({
                    history: historyList,
                    page: page,
                    pages: Math.ceil(count / pageSize),
                  });
                }
              });
            }
          });
      } catch (ex) {
        res.status(400).send({ error: ex.message });
      }
    } else {
      res.status(400).send({ error: validationData.data });
    }
  } else {
    res.send({ error: "Invalid Signature" });
  }
});

export default router;
