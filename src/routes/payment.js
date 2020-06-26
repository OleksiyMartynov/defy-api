import fs from "fs";
import grpc from "grpc";
import { Router } from "express";
const router = Router();

// // Lnd admin macaroon is at ~/.lnd/data/chain/bitcoin/simnet/admin.macaroon on Linux and
// // ~/Library/Application Support/Lnd/data/chain/bitcoin/simnet/admin.macaroon on Mac
// var m = fs.readFileSync(process.env.LND_FILES_PATH+"/admin.macaroon");
// var macaroon = m.toString("hex");

// // build meta data credentials
// var metadata = new grpc.Metadata();
// metadata.add("macaroon", macaroon);
// var macaroonCreds = grpc.credentials.createFromMetadataGenerator(
//   (_args, callback) => {
//     callback(null, metadata);
//   }
// );

// // build ssl credentials using the cert the same as before
// var lndCert = fs.readFileSync(process.env.LND_FILES_PATH+"/tls.cert");
// var sslCreds = grpc.credentials.createSsl(lndCert);

// // combine the cert credentials and the macaroon auth credentials
// // such that every call is properly encrypted and authenticated
// var credentials = grpc.credentials.combineChannelCredentials(
//   sslCreds,
//   macaroonCreds
// );

// // Pass the crendentials when creating a channel
// var lnrpcDescriptor = grpc.load(process.env.LND_FILES_PATH+"/rpc.proto");
// var lnrpc = lnrpcDescriptor.lnrpc;
// var lightning = new lnrpc.Lightning("173.230.189.238:10009", credentials);

// //Call to get lightning invoice
// // example path: /getInvoice?account=0x0000000&value=5
// router.get('/getInvoice', async (req, res) => { 
//   const {account, value} = req.query;
//   let memo = {to:account};
//   lightning.addInvoice({value: parseFloat(value), memo:JSON.stringify(memo)},function (err, response) {
//       if(err){
//         console.log(err);
//         res.status(400)
//         return res.send({ error: 'Unable to create LND invoice'})
//       }else{
//         console.log(response.payment_request)
//         res.json({ payment_request: response.payment_request});
//       }
//   });
// });

// router.post('/withdraw', async (req, res) => {
//     // lightning.sendPaymentSync({ payment_request: invoice }, function (err, payRes) {
//     //     console.log({err, payRes})
//     // })
// });

// var sendPaymentCall = lightning.sendPayment();
// sendPaymentCall.on('data', function(payment) {
//   console.log("Payment sent:");
//   console.log(payment);
// }).on('end', function() {
//   // The server has finished
//   console.log("Payment sent: END");
// });


// var invoicesCall = lightning.subscribeInvoices({});
// invoicesCall
//   .on("data", function(invoice) {
//     console.log(invoice);
//     if (invoice.state === "SETTLED") {
//       console.log("invoice SETTLED")
//     }
//   })
//   .on("end", function() {
//     // The server has finished sending
//     console.log("end");
//   })
//   .on("status", function(status) {
//     // Process status
//     console.log("Current status:" + status);
//   });

  export default router;