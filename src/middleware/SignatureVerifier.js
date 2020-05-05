import { ethers } from "ethers";

export const chargePubKey = async function(req, res, next) {
  const { pubKey, amount } = req.body;
  const account = await req.context.models.Account.findOne({
    pubKey: decodeURI(pubKey)
  });
  if (!account) {
    return res.send({ error: "Account Balance low or missing" });
  } else {
    const price = Math.abs(parseFloat(amount));
    if (account.balance >= price) {
      account.balance -= price;
      req.paid = true;
      await account.save();
      next();
    } else {
      req.paid = false;
      return res.send({ error: "Account Balance Too Low" });
    }
  }
};

export const verifyPubKeyRoute = async function(req, res, next) {
  const { pubKey, signature, message } = req.body;
  try {
    req.validSignature = await verifyPubKey(
      decodeURI(pubKey),
      decodeURI(signature),
      message
    );
    next();
  } catch (error) {
    console.log(error);
    req.validSignature = false;
    return res.send({ error: "Invalid Signature" });
  }
};

export const verifyPubKey = async (
  publicKeyArmored,
  detachedSignature,
  originalData
) => {
  try {
    //verify
    const address = ethers.utils.verifyMessage(originalData, detachedSignature);
    return address === publicKeyArmored;
  } catch (ex) {
    console.log(ex);
    return false;
  }
};
