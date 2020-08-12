import "./../jestConfig";
import { connectDb, removeAllCollections } from "../utils/DatabaseUtils";
import models from "../models";
import { HISTORY_EVENT_TYPES } from "../models/ModelConstants";
import { sleep } from "../utils/Common";

//TEST DATA
const ACCOUNT_EXISTING = {
  address: "0xc115bffabbdd893a6f7cea402e7338643ced44a6",
  balance: 9999,
};

const ACCOUNT_EXISTING_2 = {
  address: "0xc115bffabbdd893a6f7cea402e7338643ced5555",
  balance: 9999,
};

const QUICK_EXPIRY = 5 * 1000;

describe("Invoice Model", () => {
  beforeAll(async () => {
    await connectDb(process.env.DATABASE_URL);
    await models.Account.create(ACCOUNT_EXISTING);
    await models.Account.create(ACCOUNT_EXISTING_2);
  });
  afterAll(async () => {
    await removeAllCollections();
  });

  it("Should create deposit invoice correctly", async () => {
    const timestamp = Date.now();
    const account = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    const data = createFakeInvoice();
    const invoice = await models.Invoice.createDepositInvoice(
      ACCOUNT_EXISTING.address,
      data,
      QUICK_EXPIRY
    );
    expect(invoice.creator).toStrictEqual(account._id);
    expect(invoice.data).toBe(data);
    expect(invoice.type).toBe(HISTORY_EVENT_TYPES[0]);
    expect(invoice.status).toBe("pending");
    expect(invoice.amount).toBe(0);
    expect(invoice.expiry).toBe(QUICK_EXPIRY);
    expect(invoice.expiryTimestamp.getTime()).toBeGreaterThan(
      timestamp + QUICK_EXPIRY
    );
    expect(invoice.expiryTimestamp.getTime()).toBeLessThan(
      timestamp + QUICK_EXPIRY + 2000
    );

    const accountUpdated = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    expect(account.balance).toBe(accountUpdated.balance);
    expect(account.lockedBalance).toBe(accountUpdated.lockedBalance);
  });

  it("Should create withdrawal invoice correctly", async () => {
    const timestamp = Date.now();
    const account = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    const data = createFakeInvoice();
    const amount = 100;
    const invoice = await models.Invoice.createWithdrawalInvoice(
      ACCOUNT_EXISTING.address,
      data,
      amount,
      QUICK_EXPIRY
    );
    expect(invoice.creator).toStrictEqual(account._id);
    expect(invoice.data).toBe(data);
    expect(invoice.type).toBe(HISTORY_EVENT_TYPES[8]);
    expect(invoice.status).toBe("pending");
    expect(invoice.amount).toBe(amount);
    expect(invoice.expiry).toBe(QUICK_EXPIRY);
    expect(invoice.expiryTimestamp.getTime()).toBeGreaterThan(
      timestamp + QUICK_EXPIRY
    );
    expect(invoice.expiryTimestamp.getTime()).toBeLessThan(
      timestamp + QUICK_EXPIRY + 2000
    );

    const accountUpdated = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    expect(account.balance).toBe(accountUpdated.balance + amount);
    expect(account.lockedBalance).toBe(accountUpdated.lockedBalance - amount);
  });

  it("Should find existing invoice given invoice data", async () => {
    const data = createFakeInvoice();
    const invoice = await models.Invoice.createDepositInvoice(
      ACCOUNT_EXISTING.address,
      data,
      QUICK_EXPIRY
    );
    const foundInvoice = await models.Invoice.getInvoiceForData(data);
    expect(invoice.creator).toStrictEqual(foundInvoice.creator);
    expect(invoice.data).toBe(foundInvoice.data);
    expect(invoice.type).toBe(foundInvoice.type);
    expect(invoice.status).toBe(foundInvoice.status);
    expect(invoice.amount).toBe(foundInvoice.amount);
    expect(invoice.expiry).toBe(foundInvoice.expiry);
    expect(invoice.expiryTimestamp.getTime()).toBe(
      foundInvoice.expiryTimestamp.getTime()
    );
  });

  it("Should not find invoice given invalid invoice data", async () => {
    const data = createFakeInvoice();
    await models.Invoice.createDepositInvoice(
      ACCOUNT_EXISTING.address,
      data,
      QUICK_EXPIRY
    );
    const data2 = createFakeInvoice();
    const foundInvoice = await models.Invoice.getInvoiceForData(data2);
    expect(foundInvoice).toBeNull();
  });

  it("Should get valid depoist invoice", async () => {
    const timestamp = Date.now();
    const account = await models.Account.accountForAddress(
      ACCOUNT_EXISTING_2.address
    );
    const data = createFakeInvoice();
    await models.Invoice.createDepositInvoice(
      ACCOUNT_EXISTING_2.address,
      data,
      QUICK_EXPIRY
    );

    const invoice = await models.Invoice.getValidDepositInvoice(
      account,
      QUICK_EXPIRY
    );
    expect(invoice.creator).toStrictEqual(account._id);
    expect(invoice.data).toBe(data);
    expect(invoice.type).toBe(HISTORY_EVENT_TYPES[0]);
    expect(invoice.status).toBe("pending");
    expect(invoice.amount).toBe(0);
    expect(invoice.expiry).toBe(QUICK_EXPIRY);
    expect(invoice.expiryTimestamp.getTime()).toBeGreaterThan(
      timestamp + QUICK_EXPIRY
    );
    expect(invoice.expiryTimestamp.getTime()).toBeLessThan(
      timestamp + QUICK_EXPIRY + 2000
    );

    const accountUpdated = await models.Account.accountForAddress(
      ACCOUNT_EXISTING_2.address
    );
    expect(account.balance).toBe(accountUpdated.balance);
    expect(account.lockedBalance).toBe(accountUpdated.lockedBalance);
  });

  it("Should get valid withdrawal invoice", async () => {
    const timestamp = Date.now();
    const account = await models.Account.accountForAddress(
      ACCOUNT_EXISTING_2.address
    );
    const data = createFakeInvoice();
    const amount = 412;
    await models.Invoice.createWithdrawalInvoice(
      ACCOUNT_EXISTING_2.address,
      data,
      amount,
      QUICK_EXPIRY
    );

    const invoice = await models.Invoice.getValidWithdrawInvoice(
      account,
      QUICK_EXPIRY
    );
    expect(invoice.creator).toStrictEqual(account._id);
    expect(invoice.data).toBe(data);
    expect(invoice.type).toBe(HISTORY_EVENT_TYPES[8]);
    expect(invoice.status).toBe("pending");
    expect(invoice.amount).toBe(amount);
    expect(invoice.expiry).toBe(QUICK_EXPIRY);
    expect(invoice.expiryTimestamp.getTime()).toBeGreaterThan(
      timestamp + QUICK_EXPIRY
    );
    expect(invoice.expiryTimestamp.getTime()).toBeLessThan(
      timestamp + QUICK_EXPIRY + 2000
    );

    const accountUpdated = await models.Account.accountForAddress(
      ACCOUNT_EXISTING_2.address
    );
    expect(account.balance).toBe(accountUpdated.balance + amount);
    expect(account.lockedBalance).toBe(accountUpdated.lockedBalance - amount);
  });

  it("Should NOT get valid depoist invoice", async () => {
    const timestamp = Date.now();
    const account = await models.Account.accountForAddress(
      ACCOUNT_EXISTING_2.address
    );
    const data = createFakeInvoice();
    await models.Invoice.createDepositInvoice(
      ACCOUNT_EXISTING_2.address,
      data,
      QUICK_EXPIRY
    );
    await sleep(QUICK_EXPIRY);
    const invoice = await models.Invoice.getValidDepositInvoice(
      account,
      QUICK_EXPIRY
    );
    expect(invoice).toBeNull();
  });

  it("Should mark deposit invoice paid", async () => {
    const timestamp = Date.now();
    const account = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    const data = createFakeInvoice();
    const invoice = await models.Invoice.createDepositInvoice(
      ACCOUNT_EXISTING.address,
      data,
      QUICK_EXPIRY
    );
    const amount = 210;
    const invoicePaid = await invoice.markDepositPaid(amount);
    expect(invoicePaid.creator).toStrictEqual(account._id);
    expect(invoicePaid.data).toBe(data);
    expect(invoicePaid.type).toBe(HISTORY_EVENT_TYPES[0]);
    expect(invoicePaid.status).toBe("paid");
    expect(invoicePaid.amount).toBe(amount);
    expect(invoicePaid.expiry).toBe(QUICK_EXPIRY);
    expect(invoicePaid.expiryTimestamp.getTime()).toBeGreaterThan(
      timestamp + QUICK_EXPIRY
    );
    expect(invoicePaid.expiryTimestamp.getTime()).toBeLessThan(
      timestamp + QUICK_EXPIRY + 2000
    );

    const accountUpdated = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    expect(account.balance).toBe(accountUpdated.balance - amount);
    expect(account.lockedBalance).toBe(accountUpdated.lockedBalance);
  });

  it("Should NOT mark deposit invoice paid twice", async () => {
    const account = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    const data = createFakeInvoice();
    const invoice = await models.Invoice.createDepositInvoice(
      ACCOUNT_EXISTING.address,
      data,
      QUICK_EXPIRY
    );
    const amount = 210;
    const invoiceInstanceOne = await models.Invoice.getInvoiceForData(data);
    const invoiceInstanceTwo = await models.Invoice.getInvoiceForData(data);
    const invoiceInstanceThree = await models.Invoice.getInvoiceForData(data);
    invoiceInstanceOne.markDepositPaid(amount);
    invoiceInstanceTwo.markDepositPaid(amount);
    await invoiceInstanceThree.markDepositPaid(amount);

    const invoiceInstanceFour = await models.Invoice.getInvoiceForData(data);
    await expect(invoiceInstanceFour.markDepositPaid(amount)).rejects.toThrow(
      "Attempted to pay paid/failed invoice"
    );

    const accountUpdated = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    expect(account.balance).toBe(accountUpdated.balance - amount);
    expect(account.lockedBalance).toBe(accountUpdated.lockedBalance);
  });

  it("Should mark withdrawal invoice paid", async () => {
    const timestamp = Date.now();
    const account = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    const data = createFakeInvoice();

    const amount = 210;
    const invoice = await models.Invoice.createWithdrawalInvoice(
      ACCOUNT_EXISTING.address,
      data,
      amount,
      QUICK_EXPIRY
    );
    const accountPending = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    expect(account.balance).toBe(accountPending.balance + amount);
    expect(account.lockedBalance).toBe(accountPending.lockedBalance - amount);

    const invoicePaid = await invoice.markWithdrawalPaid();
    expect(invoicePaid.creator).toStrictEqual(account._id);
    expect(invoicePaid.data).toBe(data);
    expect(invoicePaid.type).toBe(HISTORY_EVENT_TYPES[1]);
    expect(invoicePaid.status).toBe("paid");
    expect(invoicePaid.amount).toBe(amount);
    expect(invoicePaid.expiry).toBe(QUICK_EXPIRY);
    expect(invoicePaid.expiryTimestamp.getTime()).toBeGreaterThan(
      timestamp + QUICK_EXPIRY
    );
    expect(invoicePaid.expiryTimestamp.getTime()).toBeLessThan(
      timestamp + QUICK_EXPIRY + 2000
    );

    const accountUpdated = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    expect(accountPending.balance).toBe(accountUpdated.balance);
    expect(account.lockedBalance).toBe(accountUpdated.lockedBalance);
  });

  it("Should NOT mark withdrawal invoice paid", async () => {
    const account = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    const data = createFakeInvoice();

    const amount = 210;
    await models.Invoice.createWithdrawalInvoice(
      ACCOUNT_EXISTING.address,
      data,
      amount,
      QUICK_EXPIRY
    );
    const accountPending = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    expect(account.balance).toBe(accountPending.balance + amount);
    expect(account.lockedBalance).toBe(accountPending.lockedBalance - amount);

    const invoiceInstanceOne = await models.Invoice.getInvoiceForData(data);
    const invoiceInstanceTwo = await models.Invoice.getInvoiceForData(data);
    const invoiceInstanceThree = await models.Invoice.getInvoiceForData(data);
    invoiceInstanceOne.markWithdrawalPaid();
    invoiceInstanceTwo.markWithdrawalPaid();
    await invoiceInstanceThree.markWithdrawalPaid();

    const invoiceInstanceFour = await models.Invoice.getInvoiceForData(data);
    await expect(invoiceInstanceFour.markWithdrawalPaid()).rejects.toThrow(
      "Attempted to pay paid/failed invoice"
    );

    const accountUpdated = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    expect(accountPending.balance).toBe(accountUpdated.balance);
    expect(accountPending.lockedBalance).toBe(
      accountUpdated.lockedBalance + amount
    );
  });

  it("Should mark withdrawal invoice as failed", async () => {
    const timestamp = Date.now();
    const account = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    const data = createFakeInvoice();

    const amount = 210;
    const invoice = await models.Invoice.createWithdrawalInvoice(
      ACCOUNT_EXISTING.address,
      data,
      amount,
      QUICK_EXPIRY
    );
    const accountPending = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    expect(account.balance).toBe(accountPending.balance + amount);
    expect(account.lockedBalance).toBe(accountPending.lockedBalance - amount);

    const invoicePaid = await invoice.markWithdrawalFailure();
    expect(invoicePaid.creator).toStrictEqual(account._id);
    expect(invoicePaid.data).toBe(data);
    expect(invoicePaid.type).toBe(HISTORY_EVENT_TYPES[9]);
    expect(invoicePaid.status).toBe("failed");
    expect(invoicePaid.amount).toBe(amount);
    expect(invoicePaid.expiry).toBe(QUICK_EXPIRY);
    expect(invoicePaid.expiryTimestamp.getTime()).toBeGreaterThan(
      timestamp + QUICK_EXPIRY
    );
    expect(invoicePaid.expiryTimestamp.getTime()).toBeLessThan(
      timestamp + QUICK_EXPIRY + 2000
    );

    const accountUpdated = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    expect(accountPending.balance).toBe(accountUpdated.balance - amount);
    expect(accountPending.lockedBalance).toBe(
      accountUpdated.lockedBalance + amount
    );
  });

  it("Should NOT mark withdrawal invoice as failed", async () => {
    const account = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    const data = createFakeInvoice();

    const amount = 210;
    const invoice = await models.Invoice.createWithdrawalInvoice(
      ACCOUNT_EXISTING.address,
      data,
      amount,
      QUICK_EXPIRY
    );
    const accountPending = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    expect(account.balance).toBe(accountPending.balance + amount);
    expect(account.lockedBalance).toBe(accountPending.lockedBalance - amount);

    await invoice.markDepositPaid(amount);

    const repaidInvoice = await models.Invoice.getInvoiceForData(data);

    await expect(repaidInvoice.markWithdrawalPaid()).rejects.toThrow(
      "Attempted to pay paid/failed invoice"
    );
  });

  function createFakeInvoice(length = 360) {
    var result = "";
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return `lnbc${result}`;
  }
});
