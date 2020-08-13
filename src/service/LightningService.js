import fs from "fs";
import grpc from "grpc";
import { INVOICE_EXPIRY } from "../models/ModelConstants";

const m = fs.readFileSync(process.env.LND_FILES_PATH + "/admin.macaroon");

// build meta data credentials
const metadata = new grpc.Metadata();
metadata.add("macaroon", m.toString("hex"));
const macaroonCreds = grpc.credentials.createFromMetadataGenerator(
  (_args, callback) => {
    callback(null, metadata);
  }
);

// build ssl credentials using the cert the same as before
const lndCert = fs.readFileSync(process.env.LND_FILES_PATH + "/tls.cert");
const sslCreds = grpc.credentials.createSsl(lndCert);

// combine the cert credentials and the macaroon auth credentials
// such that every call is properly encrypted and authenticated
const credentials = grpc.credentials.combineChannelCredentials(
  sslCreds,
  macaroonCreds
);

// Pass the crendentials when creating a channel
const lnrpcDescriptor = grpc.load(process.env.LND_FILES_PATH + "/rpc.proto");
const lightning = new lnrpcDescriptor.lnrpc.Lightning(
  process.env.LND_NODE,
  credentials
);

export default class LightningService {
  constructor(invoicePaidListener) {
    if (!invoicePaidListener) {
      throw new Error("Please provide an invoice listener");
    }
    this.invoicePaidListener = invoicePaidListener;
    lightning.subscribeInvoices({}).on("data", function (invoice) {
      if (invoice.state === "SETTLED") {
        invoicePaidListener(invoice);
      }
    });
  }
  setInvoicePaidListener(listener) {
    this.invoicePaidListener = listener;
  }
  async createInvoice(expiry = INVOICE_EXPIRY) {
    return new Promise((resolve, reject) => {
      lightning.addInvoice(
        { expiry, memo: "Deposit to defy.fyi" },
        (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }
  async payInvoice(invoice) {
    return new Promise((resolve, reject) => {
      lightning.sendPaymentSync({ payment_request: invoice }, function (
        error,
        response
      ) {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
  async decodePaymentRequest(invoice) {
    return new Promise((resolve, reject) => {
      lightning.decodePayReq(
        {
          pay_req: invoice,
        },
        function (error, response) {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }
}
