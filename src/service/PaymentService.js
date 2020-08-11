import LightningService from "./LightningService";

export default class PaymentService {
  constructor() {
    this.lightning = new LightningService(this.onInvoicePaid);
  }
  onInvoicePaid(invoice) {
    //lookup pending invoice
    const pendingInvoice = null;
    //mark invoice as paid
    pendingInvoice.markPaid(); //increments balance of account with invoice.value
  }
  async withdrawFunds(invoice, account) {
    //check if user already has pending withdrawal
    const hasPending = account.hasPendingWithdrawal();
    if (hasPending) {
      throw new Error("Finish pending withdrawal first");
    } else {
      //check balance
      const invoiceData = await this.lightning.decodePaymentRequest(invoice);
      //TODO: handle unset amount
      const amt = parseInt(invoiceData.num_satoshis);
      if (amt > account.balance) {
        throw new Error("not enough balance");
      }
      try {
        let invoiceModel; //save invoice to db as pending withdrawal
        const paymentResponse = await this.lightning.payInvoice(invoice);
        //mark invoice as paid
        invoiceModel.markPaid();
      } catch (ex) {
        //mark invoice as faiure
        invoiceModel.markFailure(); //reverts balance
      }
    }
  }

  async getOrCreateDepositInvoice(account) {
    // check if non expired invoice exists in db
    let invoice;
    if (invoice) {
      return invoice.data;
    } else {
      const lndInvoice = this.lightning.createInvoice();
      //save lndInvoice to db as pending in the db and add expiry time
      return invoice;
    }
  }
}
