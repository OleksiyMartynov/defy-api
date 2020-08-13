import Invoice from "../models/Invoice";
import Account from "../models/Account";
import { logInvoice } from "../middleware/Logger";
import { INVOICE_EXPIRY } from "../models/ModelConstants";
export default class PaymentService {
  constructor(lndClass) {
    this.lightning = new lndClass(this.onDepositInvoicePaid);
  }
  async onDepositInvoicePaid(invoiceData) {
    logInvoice(invoiceData, "PAYMENT_RECEIVED");
    const pendingInvoice = await Invoice.getInvoiceForData(
      invoiceData.payment_request
    );
    if (pendingInvoice) {
      return pendingInvoice.markDepositPaid(parseInt(invoiceData.amt_paid_sat));
    } else {
      console.warn("Got unknown invoice payment!");
    }
  }
  async withdrawFunds(invoice, address) {
    const account = await Account.accountForAddress(address);
    if (!account) {
      throw new Error("Cannot withdraw without depositing first");
    }
    const hasPending = await Invoice.getValidWithdrawInvoice(account);
    if (hasPending) {
      throw new Error("Finish pending withdrawal first");
    } else {
      //check balance
      const invoiceData = await this.lightning.decodePaymentRequest(invoice);
      logInvoice(invoiceData, "PAYMENT_REQUESTED");

      const amt = parseInt(invoiceData.num_satoshis);
      if (amt > account.balance) {
        throw new Error("Not enough balance");
      } else if (amt === 0) {
        throw new Error("Cannot withdraw without an amount set");
      }

      let invoiceModel = await Invoice.getInvoiceForData(invoice);
      if (invoiceModel && invoiceModel.type === "deposit") {
        throw new Error("Cannot withdraw to deposit invoice");
      }
      if (!invoiceModel) {
        invoiceModel = await Invoice.createWithdrawalInvoice(
          address,
          invoice,
          amt
        );
      }
      try {
        const paymentResponse = await this.lightning.payInvoice(invoice);
        logInvoice(paymentResponse, "PAYMENT_FINALIZED");
        if (
          !paymentResponse.payment_preimage ||
          paymentResponse.payment_error
        ) {
          return invoiceModel.markWithdrawalFailure();
        }
        return invoiceModel.markWithdrawalPaid();
      } catch (ex) {
        console.trace(ex);
        return invoiceModel.markWithdrawalFailure();
      }
    }
  }

  async getOrCreateDepositInvoice(address, expiryDuration = INVOICE_EXPIRY) {
    const account = await Account.accountForAddress(address);
    let invoiceModel;
    if (account) {
      //not first deposit
      invoiceModel = await Invoice.getValidDepositInvoice(account);
    } else {
      //first time deposit
      await Account.create({ address });
    }

    if (!invoiceModel) {
      const lndInvoice = await this.lightning.createInvoice();
      logInvoice(lndInvoice, "PAYMENT_INVOICE_CREATED");
      invoiceModel = await Invoice.createDepositInvoice(
        address,
        lndInvoice.payment_request,
        expiryDuration
      );
    }
    return invoiceModel;
  }
}
