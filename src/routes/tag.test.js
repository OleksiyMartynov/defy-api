import "./../jestConfig";
import { ethers } from "ethers";
const request = require("supertest");
const app = require("../server/index");
const { connectDb, removeAllCollections } = require("../utils/DatabaseUtils");
const models = require("../models").default;

//TEST DATA
const MOCK_WALLET = ethers.Wallet.createRandom();
const ACCOUNT_EXISTING = {
  address: MOCK_WALLET.address,
  balance: 9999,
};

describe("Tag Endpoints", () => {
  beforeAll(async () => {
    await connectDb(process.env.DATABASE_URL);
    await models.Account.create(ACCOUNT_EXISTING);
    for (let i = 0; i < 25; i++) {
      await models.Debate.createDebate(
        ACCOUNT_EXISTING.address,
        "Debate Title " + i,
        "Debate Description " + i,
        ["testTag"],
        100
      );
    }
  });
  it("should get Tags", async () => {
      //todo
  });
  afterAll(async () => {
    await removeAllCollections();
  });
});
