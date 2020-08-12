import LightningService from "./LightningService";
import Invoice from "../models/Invoice";
import Account from "../models/Account";
export default class PaymentService {
  constructor() {
    this.lightning = new LightningService(this.onDepositInvoicePaid);
  }
  async onDepositInvoicePaid(invoiceData) {
    console.log(invoiceData);
    const pendingInvoice = await Invoice.getInvoiceForData(
      invoiceData.payment_request
    );
    if (pendingInvoice) {
      pendingInvoice.markDepositPaid(parseInt(invoiceData.amt_paid_sat));
    } else {
      console.warn("Got unknown invoice payment!");
    }
  }
  async withdrawFunds(invoice, address) {
    //TODO: handle invoice that has previously failed!
    //check if user already has pending withdrawal
    const account = await Account.accountForAddress(address);
    const hasPending = await Invoice.getValidWithdrawInvoice(account);
    if (hasPending) {
      throw new Error("Finish pending withdrawal first");
    } else {
      //check balance
      const invoiceData = await this.lightning.decodePaymentRequest(invoice);
      console.log(invoiceData);
      //TODO: handle unset amount
      const amt = parseInt(invoiceData.num_satoshis);
      if (amt > account.balance) {
        throw new Error("not enough balance");
      }
      try {
        let invoiceModel = await Invoice.createWithdrawalInvoice(
          address,
          invoice,
          amt
        );
        const paymentResponse = await this.lightning.payInvoice(invoice);
        console.log(paymentResponse);
        if (!paymentResponse.payment_preimage) {
          return invoiceModel.markWithdrawalFailure();
        }
        return invoiceModel.markWithdrawalPaid();
      } catch (ex) {
        console.log();
        return invoiceModel.markWithdrawalFailure();
      }
    }
  }

  async getOrCreateDepositInvoice(address) {
    const account = await Account.accountForAddress(address);
    let invoiceModel = await Invoice.getValidWithdrawInvoice(account);
    if (!invoiceModel) {
      const lndInvoice = await this.lightning.createInvoice();
      console.log(lndInvoice.payment_request);
      invoiceModel = await Invoice.createDepositInvoice(
        address,
        lndInvoice.payment_request
      );
    }
    return invoiceModel;
  }
}
