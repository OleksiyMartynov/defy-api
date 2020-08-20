import "./../jestConfig";
const request = require("supertest");
const app = require("../server/index");
const { connectDb, removeAllCollections } = require("../utils/DatabaseUtils");
const models = require("../models").default;

//TEST DATA

const ACCOUNT_ADDRESS_INVALID = "hello";
const ACCOUNT_ADDRESS_UNKNOWN = "0xd165bffbbbdd893a6f7cea402e7338643ced44a7";
const ACCOUNT_EXISTING = {
  address: "0xe325bffabbdd893a6f7cea402e7338643ced44a6",
  balance: 9999,
};

describe("Account Endpoints", () => {
  beforeAll(async () => {
    console.log("Before:");
    await connectDb(process.env.DATABASE_URL);
    await models.Account.create(ACCOUNT_EXISTING);
  });
  it("should not get balance", async () => {
    const res = await request(app)
      .get(`/accounts?account=${ACCOUNT_ADDRESS_INVALID}`)
      .send();
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("error");
  });
  it("should get balance", async () => {
    const res = await request(app)
      .get(`/accounts?account=${ACCOUNT_EXISTING.address}`)
      .send();
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("balance");
  });
  afterAll(async () => {
    await removeAllCollections();
  });
});
