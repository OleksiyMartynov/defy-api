import "./../jestConfig";
import { connectDb, removeAllCollections } from "../utils/DatabaseUtils";
import models from "../models";
import { HISTORY_EVENT_TYPES } from "../models/ModelConstants";
import { sleep, createRandomString } from "../utils/Common";
import PaymentService from "./PaymentService";
import Account from "../models/Account";
import Invoice from "../models/Invoice";

//TEST DATA
const ACCOUNT_EXISTING = {
  address: "0xc115bffabbdd893a6f7cea402e7338643ced44a6",
  balance: 9999,
};

const ACCOUNT_EXISTING_2 = {
  address: "0xc115bffabbdd893a6f7cea402e7338643ced5555",
  balance: 9999,
};

const ACCOUNT_EXISTING_3 = {
  address: "0xc115bffabbdd893a6f7cea402e7338643ced5135",
  balance: 9999,
};

const QUICK_EXPIRY = 5 * 1000;
const MOCK_PAYMENT_INVOICE = {
  payment_request:
    "lnbc1u1p0n2fvqpp5zpzje0xj0qrqkmt3ka5n38wmk5dkxj5w6uuzad90we232szr3k2qdqc2p5x7etwd9uzqurp09kk2mn5xqrrss9qtzqqqqqq9qsqsp50vgx65qjt95wvxmxk88s3vytjp5amy400xunelt3c8kn2vn87ngqrzjqwryaup9lh50kkranzgcdnn2fgvx390wgj5jd07rwr3vxeje0glclla44vnx426engqqqqlgqqqqqeqqjqspng43efajlftxujmyaurd6lcj0rer9r7pwte8w26sly6n23nvdk2zmh3ylzcca4afnpd24x7mtmfczht2z8gxptry2h56r875ft8dcp43gkal",
};

const MOCK_PAYMENT_REVEIVED_SUCCESS = {
  memo: "",
  r_preimage: {
    type: "Buffer",
    data: [68, 40],
  },
  r_hash: {
    type: "Buffer",
    data: [106, 9],
  },
  value: "0",
  value_msat: "0",
  settled: true,
  creation_date: "1597318418",
  settle_date: "1597318439",
  payment_request:
    "lnbc1p0n2fgjpp5dgys3l7ykwsjckysz6tj2780zm8azgwq4z53987j4jcc22ek39esdqqcqzpgxq9rdm5qsp5qm96pjgnuk3dwanksq95ksuc32utvjgasp3wl58dp8l3yvfqlats9qy9qsqeant249jchvhfuw27vp5utv3lqy7h8puupyfp6zaje944jrqgdpyjhs29jxcnzfevzu9nszz6acsmlzaarzw7szdz3akn3ehgzvw8ksphj5aaa",
  description_hash: { type: "Buffer", data: [] },
  expiry: "3600000",
  fallback_addr: "",
  cltv_expiry: "40",
  route_hints: [],
  private: false,
  add_index: "29",
  settle_index: "14",
  amt_paid: "100000",
  amt_paid_sat: "100",
  amt_paid_msat: "100000",
  state: "SETTLED",
  htlcs: [
    {
      chan_id: "706918906493337600",
      htlc_index: "3",
      amt_msat: "100000",
      accept_height: 643514,
      accept_time: "1597318439",
      resolve_time: "1597318439",
      expiry_height: 643555,
      state: "SETTLED",
      custom_records: {},
      mpp_total_amt_msat: "100000",
    },
  ],
};

const MOCK_PAYMENT_REQUESTED = {
  destination:
    "027176ddff5536a257474f61056a8f4eddc7147c600f3f32e061b5ab266aab599a",
  payment_hash:
    "10452cbcd278060b6d71b769389ddbb51b634a8ed7382eb4af76551540438d94",
  num_satoshis: "100",
  timestamp: "1597318528",
  expiry: "3600",
  description: "Phoenix payment",
  description_hash: "",
  fallback_addr: "",
  cltv_expiry: "9",
  payment_addr: {
    type: "Buffer",
    data: [123, 16],
  },
  num_msat: "100000",
};

const MOCK_PAYMENT_FINALIZED = {
  payment_error: "",
  payment_preimage: {
    type: "Buffer",
    data: [173, 52],
  },
  payment_route: {
    total_time_lock: 643670,
    total_fees: "1",
    total_amt: "101",
    total_fees_msat: "1010",
    total_amt_msat: "101010",
  },
  payment_hash: {
    type: "Buffer",
    data: [16, 69],
  },
};

const MOCK_LND_SERVICE = class LightningService {
  constructor(invoicePaidListener) {
    this.invoicePaidListener = invoicePaidListener;
  }
  async createInvoice(expiry = QUICK_EXPIRY) {
    return new Promise((resolve, reject) => {
      if (this.shouldRejectCreateInvoice) {
        reject(new Error(""));
      } else {
        resolve(this.createInvoiceData);
      }
    });
  }

  async payInvoice(invoice) {
    return new Promise(async (resolve, reject) => {
      await sleep(1000);
      console.log("this.shouldRejectWithdrawInvoice");
      console.log(this.shouldRejectWithdrawInvoice);
      if (this.shouldRejectWithdrawInvoice) {
        reject(new Error(""));
      } else {
        resolve(this.withdrawInvoiceResult);
      }
    });
  }

  async decodePaymentRequest(invoice) {
    return new Promise((resolve, reject) => {
      resolve(this.decodedInvoice);
    });
  }

  //mock specific
  async triggerInvoicePaid() {
    await this.invoicePaidListener(this.payInvoiceData);
  }

  setCreateInvoiceResult(shouldReject, invoice) {
    this.shouldRejectCreateInvoice = shouldReject;
    this.createInvoiceData = invoice;
  }

  setPayInvoiceResult(shouldReject, invoice) {
    this.shouldRejectPayInvoice = shouldReject;
    this.payInvoiceData = invoice;
  }

  setDecodedInvoiceResult(decodedInvoice) {
    this.decodedInvoice = decodedInvoice;
  }

  setWithdrawInvoiceResult(shouldReject, invoice) {
    this.shouldRejectWithdrawInvoice = shouldReject;
    this.withdrawInvoiceResult = invoice;
  }
};

const MOCK_PAYMENT_SERVICE = new PaymentService(MOCK_LND_SERVICE);

describe("Invoice Model", () => {
  beforeAll(async () => {
    await connectDb(process.env.DATABASE_URL);
    await models.Account.create(ACCOUNT_EXISTING);
    await models.Account.create(ACCOUNT_EXISTING_2);
    await models.Account.create(ACCOUNT_EXISTING_3);
  });
  afterAll(async () => {
    await removeAllCollections();
  });

  it("Should create deposit invoice for new address", async () => {
    const newAddress = "0xc115bffabbdd893a6f7cea402e7338643ced1255";
    const acctNull = await Account.accountForAddress(newAddress);
    expect(acctNull).toBeNull();
    const data = createRandomString();
    MOCK_PAYMENT_SERVICE.lightning.setCreateInvoiceResult(false, {
      payment_request: data,
    });
    const invoice = await MOCK_PAYMENT_SERVICE.getOrCreateDepositInvoice(
      newAddress
    );
    const acct = await Account.accountForAddress(newAddress);
    expect(invoice.creator).toStrictEqual(acct._id);
  });

  it("Should create deposit invoice for existing account", async () => {
    const acct = await Account.accountForAddress(ACCOUNT_EXISTING.address);
    const existingInvoice = await Invoice.getValidDepositInvoice(acct);
    expect(existingInvoice).toBeNull();
    const data = createRandomString();
    MOCK_PAYMENT_SERVICE.lightning.setCreateInvoiceResult(false, {
      payment_request: data,
    });
    const invoice = await MOCK_PAYMENT_SERVICE.getOrCreateDepositInvoice(
      ACCOUNT_EXISTING.address
    );
    expect(invoice.creator).toStrictEqual(acct._id);
  });

  it("Should return existing deposit invoice", async () => {
    const acct = await Account.accountForAddress(ACCOUNT_EXISTING_2.address);
    const existingInvoice = await Invoice.getValidDepositInvoice(acct);
    expect(existingInvoice).toBeNull();
    const data = createRandomString();
    MOCK_PAYMENT_SERVICE.lightning.setCreateInvoiceResult(false, {
      payment_request: data,
    });
    const invoice = await MOCK_PAYMENT_SERVICE.getOrCreateDepositInvoice(
      ACCOUNT_EXISTING_2.address
    );
    expect(invoice.creator).toStrictEqual(acct._id);
    const invoiceSecond = await MOCK_PAYMENT_SERVICE.getOrCreateDepositInvoice(
      ACCOUNT_EXISTING_2.address
    );
    expect(invoice._id).toStrictEqual(invoiceSecond._id);
  });

  it("Should handle deposit invoice paid", async () => {
    MOCK_PAYMENT_SERVICE.lightning.setPayInvoiceResult(
      false,
      MOCK_PAYMENT_REVEIVED_SUCCESS
    );

    const data = MOCK_PAYMENT_REVEIVED_SUCCESS.payment_request;
    const amount = parseInt(MOCK_PAYMENT_REVEIVED_SUCCESS.amt_paid_sat);
    MOCK_PAYMENT_SERVICE.lightning.setCreateInvoiceResult(false, {
      payment_request: data,
    });
    const invoice = await MOCK_PAYMENT_SERVICE.getOrCreateDepositInvoice(
      ACCOUNT_EXISTING_3.address
    );

    await MOCK_PAYMENT_SERVICE.lightning.triggerInvoicePaid();
    const paidInvoice = await Invoice.getInvoiceForData(data);
    expect(paidInvoice.status).toBe("paid");
    expect(paidInvoice.amount).toBe(amount);
  });

  it("Should not withdraw if account does not exist", async () => {
    const unknownAddress = "0xc115bffabbdd893a6f7cea402e7338643ced4182";
    MOCK_PAYMENT_SERVICE.lightning.setDecodedInvoiceResult(
      MOCK_PAYMENT_REQUESTED
    );
    await expect(
      MOCK_PAYMENT_SERVICE.withdrawFunds(
        MOCK_PAYMENT_INVOICE.payment_request,
        unknownAddress
      )
    ).rejects.toThrow("Cannot withdraw without depositing first");
  });

  it("Should not withdraw if low balance", async () => {
    const poorAddress = "0xc115bffabbdd893a6f7cea402e7338643ced2181";
    await Account.create({ address: poorAddress, balance: 99 });
    await expect(
      MOCK_PAYMENT_SERVICE.withdrawFunds(
        MOCK_PAYMENT_INVOICE.payment_request,
        poorAddress
      )
    ).rejects.toThrow("Not enough balance");
  });

  it("Should not withdraw if already has pending", async () => {
    MOCK_PAYMENT_SERVICE.lightning.setWithdrawInvoiceResult(
      false,
      MOCK_PAYMENT_FINALIZED
    );
    const addr = "0xc115bffabbdd893a6f7cea402e7338643ced1144";
    await Account.create({ address: addr, balance: 1000 });
    MOCK_PAYMENT_SERVICE.withdrawFunds(
      MOCK_PAYMENT_INVOICE.payment_request,
      addr
    );
    await sleep(100); // sleep 100 here because MOCK_PAYMENT_SERVICE.lightning.payInvoice() sleeps for 1000
    const pending = await Invoice.getInvoiceForData(
      MOCK_PAYMENT_INVOICE.payment_request
    );
    await expect(
      MOCK_PAYMENT_SERVICE.withdrawFunds(
        MOCK_PAYMENT_INVOICE.payment_request,
        addr
      )
    ).rejects.toThrow("Finish pending withdrawal first");
    await sleep(900);
  });

  it("Should not withdraw if amount is unset", async () => {
    const copyInvoiceDecoded = { ...MOCK_PAYMENT_REQUESTED };
    copyInvoiceDecoded.num_satoshis = "0";

    MOCK_PAYMENT_SERVICE.lightning.setDecodedInvoiceResult(copyInvoiceDecoded);
    MOCK_PAYMENT_SERVICE.lightning.setWithdrawInvoiceResult(
      false,
      MOCK_PAYMENT_FINALIZED
    );
    const addr = "0xc115bffabbdd893a6f7cea402e7338643ced7239";
    await Account.create({ address: addr, balance: 1000 });

    await expect(
      MOCK_PAYMENT_SERVICE.withdrawFunds(
        MOCK_PAYMENT_INVOICE.payment_request,
        addr
      )
    ).rejects.toThrow("Cannot withdraw without an amount set");
  });

  it("Should mark withdrawal failure correctly", async () => {
    const addr = "0xc115bffabbdd893a6f7cea402e7338643ced8425";
    await Account.create({ address: addr, balance: 1000 });
    MOCK_PAYMENT_SERVICE.lightning.setDecodedInvoiceResult(
      MOCK_PAYMENT_REQUESTED
    );
    MOCK_PAYMENT_SERVICE.lightning.setWithdrawInvoiceResult(
      true,
      MOCK_PAYMENT_FINALIZED
    );
    const failedInvoice = await MOCK_PAYMENT_SERVICE.withdrawFunds(
      createRandomString(),
      addr
    );
    expect(failedInvoice.type).toBe("withdrawal_failed");
    expect(failedInvoice.status).toBe("failed");
  });

  it("Should pay previously failed withdrawal invoice", async () => {
    const addr = "0xc115bffabbdd893a6f7cea402e7338643ced8801";
    await Account.create({ address: addr, balance: 1000 });
    MOCK_PAYMENT_SERVICE.lightning.setDecodedInvoiceResult(
      MOCK_PAYMENT_REQUESTED
    );
    MOCK_PAYMENT_SERVICE.lightning.setWithdrawInvoiceResult(
      true,
      MOCK_PAYMENT_FINALIZED
    );
    const failedInvoice = await MOCK_PAYMENT_SERVICE.withdrawFunds(
      createRandomString(),
      addr
    );
    expect(failedInvoice.type).toBe("withdrawal_failed");
    expect(failedInvoice.status).toBe("failed");

    MOCK_PAYMENT_SERVICE.lightning.setWithdrawInvoiceResult(
      false,
      MOCK_PAYMENT_FINALIZED
    );

    const successInvoice = await MOCK_PAYMENT_SERVICE.withdrawFunds(
      createRandomString(),
      addr
    );
    expect(successInvoice.type).toBe("withdrawal");
    expect(successInvoice.status).toBe("paid");
  });

  it("Should mark withdrawal success correctly", async () => {
    const addr = "0xc115bffabbdd893a6f7cea402e7338643ced8801";
    await Account.create({ address: addr, balance: 1000 });
    MOCK_PAYMENT_SERVICE.lightning.setDecodedInvoiceResult(
      MOCK_PAYMENT_REQUESTED
    );
    MOCK_PAYMENT_SERVICE.lightning.setWithdrawInvoiceResult(
      false,
      MOCK_PAYMENT_FINALIZED
    );

    const successInvoice = await MOCK_PAYMENT_SERVICE.withdrawFunds(
      createRandomString(),
      addr
    );
    expect(successInvoice.type).toBe("withdrawal");
    expect(successInvoice.status).toBe("paid");
  });
});
