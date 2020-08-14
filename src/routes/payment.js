import { Router } from "express";
import PaymentService from "../service/PaymentService";
import { verifyPubKeyRoute } from "../middleware/SignatureVerifier";
import LightningService from "../service/LightningService";
const router = Router();
const paymentService = new PaymentService(LightningService);

router.post("/getInvoice", verifyPubKeyRoute, async (req, res) => {
  if (req.validSignature) {
    try {
      //to do update querrie to limit invoices to req.body.address
      const invoice = await req.context.models.Invoice.getInvoiceForData(
        req.body.invoice
      );
      return res.send({ invoice });
    } catch (ex) {
      console.trace(ex);
      res.status(500).send({ error: "Failed to find invoice" });
    }
  } else {
    return res.send({ error: "Invalid Signature" });
  }
});

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
      const invoice = await paymentService.withdrawFunds(
        req.body.invoice,
        req.body.address
      );
      return res.send({ invoice });
    } catch (ex) {
      console.trace(ex);
      res
        .status(500)
        .send({ error: ex.message ? ex.message : "Failed to pay invoice" });
    }
  } else {
    return res.send({ error: "Invalid Signature" });
  }
});

export default router;
