import { ethers } from "ethers";

export const verifyPubKeyRoute = async function(req, res, next) {
  const { address, signature, message } = req.body;
  if(!address || !signature || !message){
    req.validSignature = false;
    return res.send(400, { error: "Invalid Signature" });
  }
  try {
    req.validSignature = await verifyPubKey(
      address,
      signature,
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
  addressProvided,
  detachedSignature,
  originalData
) => {
  const address = ethers.utils.verifyMessage(originalData, detachedSignature);
  return address === addressProvided;
};
