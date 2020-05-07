import "./../jestConfig";
const request = require("supertest");
const app = require("../server/index");
const { connectDb, removeAllCollections } = require("../utils/DatabaseUtils");
const models = require("../models").default;

//TEST DATA

const ACCOUNT_ADDRESS_INVALID = "hello";
const ACCOUNT_ADDRESS_UNKNOWN = "0xd115bffabbdd893a6f7cea402e7338643ced44a7";
const ACCOUNT_EXISTING = {
  address: "0xd115bffabbdd893a6f7cea402e7338643ced44a6",
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
      .get(`/accounts/balance?account=${ACCOUNT_ADDRESS_INVALID}`)
      .send();
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message");
  });
  it("should not get balance", async () => {
    const res = await request(app)
      .get(`/accounts/balance?account=${ACCOUNT_ADDRESS_UNKNOWN}`)
      .send();
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message");
  });
  it("should get balance", async () => {
    const res = await request(app)
      .get(`/accounts/balance?account=${ACCOUNT_EXISTING.address}`)
      .send();
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("balance");
  });
  //   it("should deposit new balance new account", async () => {
  //     const res = await request(app).post("/accounts/deposit").send({
  //       account: 0x0,
  //     });
  //     expect(res.statusCode).toEqual(200);
  //     expect(res.body).toHaveProperty("post");
  //   });
  //   it("should deposit new balance existing account account", async () => {
  //     const res = await request(app).post("/accounts/deposit").send({
  //       pubKey: 0x0,
  //     });
  //     expect(res.statusCode).toEqual(200);
  //     expect(res.body).toHaveProperty("post");
  //   });
  afterAll(async () => {
    await removeAllCollections();
  });
});
