import { Router } from "express";
import PaymentService from "../service/PaymentService";
import { verifyPubKeyRoute } from "../middleware/SignatureVerifier";

const router = Router();
const paymentService = new PaymentService();

router.post("/deposit", verifyPubKeyRoute, async (req, res) => {
  if (req.validSignature) {
    try {
      const invoice = await paymentService.getOrCreateDepositInvoice(
        req.body.address
      );
      return res.send({ invoice });
    } catch (ex) {
      console.trace(ex);
      res.status(500).send({ error: "Failed to generate invoice" });
    }
  } else {
    return res.send({ error: "Invalid Signature" });
  }
});

router.post("/withdraw", verifyPubKeyRoute, async (req, res) => {
  if (req.validSignature) {
    try {
      const withdrawal = await paymentService.withdrawFunds(
        req.body.invoice,
        req.body.address
      );
      return res.send({ withdrawal });
    } catch (ex) {
      console.trace(ex);
      res.status(500).send({ error: "Failed to pay invoice" });
    }
  } else {
    return res.send({ error: "Invalid Signature" });
  }
});

export default router;
