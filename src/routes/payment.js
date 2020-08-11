import { Router } from "express";
import PaymentService from "../service/PaymentService";
import { verifyPubKeyRoute } from "../middleware/SignatureVerifier";

const router = Router();
const paymentService = new PaymentService();

router.post("/deposit", verifyPubKeyRoute, async (req, res) => {
  if (req.validSignature) {
    const account = await req.context.models.Account.findOne({
      pubKey: decodeURI(req.body.pubKey),
    });
    let newBalance = 0;
    //console.log(account);

    // console.log(req.query.initial === 1000);
    let model;
    if (!account) {
      newBalance = req.query.initial === "1000" ? 1000 : 0;
      model = await req.context.models.Account.create({
        pubKey: decodeURI(req.body.pubKey),
        balance: newBalance,
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
