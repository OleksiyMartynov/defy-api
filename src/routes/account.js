import { Router } from "express";
import { verifyPubKeyRoute } from "../middleware/SignatureVerifier";
import { isValidAccountAddress } from "../utils/ParamValidators";
const router = Router();

router.get("/balance", async (req, res, next) => {
  const account = req.query.account;
  if(!isValidAccountAddress(account)){
    res.status(400)
    return res.send({ message: 'Invalid account address'})
  }
  const accountModel = await req.context.models.Account.findOne({
    _id: account
  });
  if (accountModel) {
    return res.send({ balance: accountModel.balance });
  } else {
    res.status(400)
    return res.send({ message: 'Account address has no balance'})
  }
});

router.post("/deposit", verifyPubKeyRoute, async (req, res) => {
  console.log("/deposit");
  if (req.validSignature) {
    const account = await req.context.models.Account.findOne({
      pubKey: decodeURI(req.body.pubKey)
    });
    let newBalance = 0;
    //console.log(account);

    // console.log(req.query.initial === 1000);
    let model;
    if (!account) {
      newBalance = req.query.initial === "1000" ? 1000 : 0;
      model = await req.context.models.Account.create({
        pubKey: decodeURI(req.body.pubKey),
        balance: newBalance
      });
    } else {
      model = account;
    }

    return res.send(model);
  } else {
    return res.send({ error: "Invalid Signature" });
  }
});

export default router;
