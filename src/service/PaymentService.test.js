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

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});

  it("", async () => {});
});
