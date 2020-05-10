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

describe("Debate Endpoints", () => {
  beforeAll(async () => {
    await connectDb(process.env.DATABASE_URL);
    await models.Account.create(ACCOUNT_EXISTING);
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      "Debate Title",
      "Debate Description",
      ["testTag"],
      100
    );
    for (let i = 0; i < 25; i++) {
      await models.Opinion.createOpinion(
        ACCOUNT_EXISTING.address,
        debate._id,
        "someurl.co",
        "link",
        100 + i,
        i % 2 === 1
      );
    }
  });
  it("should get opinions", async () => {
    const debate = await models.Debate.findOne();
    const DEBATE_ID = debate._id;
    const res = await request(app)
      .get(`/opinions?debateId=${DEBATE_ID}`)
      .send();
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("opinions");
    expect(res.body.opinions).toHaveLength(10);
    expect(res.body.page).toEqual(0);
    expect(res.body.pages).toEqual(3);

    const res2 = await request(app)
      .get(`/opinions?debateId=${DEBATE_ID}&page=1`)
      .send();
    expect(res2.statusCode).toEqual(200);
    expect(res2.body).toHaveProperty("opinions");
    expect(res2.body.opinions).toHaveLength(10);
    expect(res2.body.page).toEqual(1);
    expect(res2.body.pages).toEqual(3);

    const res3 = await request(app)
      .get(`/opinions?debateId=${DEBATE_ID}&page=2`)
      .send();
    expect(res3.statusCode).toEqual(200);
    expect(res3.body).toHaveProperty("opinions");
    expect(res3.body.opinions).toHaveLength(5);
    expect(res3.body.page).toEqual(2);
    expect(res3.body.pages).toEqual(3);

    const res4 = await request(app)
      .get(`/opinions?debateId=${DEBATE_ID}&page=3`)
      .send();
    expect(res4.statusCode).toEqual(200);
    expect(res4.body).toHaveProperty("opinions");
    expect(res4.body.opinions).toHaveLength(0);
  });
  it("should fail posting new opinion", async () => {
    const debate = await models.Debate.findOne();
    const DEBATE_ID = debate._id;
    const message = "hello world";
    const content = "blah.co";
    const contentType = "link";
    const stake = 200;
    const pro = true;
    const signature = await MOCK_WALLET.signMessage(message);
    //nonexistant debate
    const res = await request(app).post("/opinions/new").send({
      debateId: "123",
      address: ACCOUNT_EXISTING.address,
      signature,
      message,
      content,
      contentType,
      stake,
      pro,
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("error");
    //nonexistant account
    const res1 = await request(app).post("/opinions/new").send({
      debateId: DEBATE_ID,
      address: "0xc115bffabaed893a6f7cea402e7338643ced44b7",
      signature,
      message,
      content,
      contentType,
      stake,
      pro,
    });
    expect(res1.statusCode).toEqual(400);
    expect(res1.body).toHaveProperty("error");
    //invalid signature
    const res2 = await request(app).post("/opinions/new").send({
      debateId: DEBATE_ID,
      address: ACCOUNT_EXISTING.address,
      signature: "0x000002132313",
      message,
      content,
      contentType,
      stake,
      pro,
    });
    expect(res2.statusCode).toEqual(400);
    expect(res2.body).toHaveProperty("error");
    //invalid content
    const res3 = await request(app).post("/opinions/new").send({
      debateId: DEBATE_ID,
      address: ACCOUNT_EXISTING.address,
      signature,
      message,
      content: "plaintext",
      contentType,
      stake,
      pro,
    });
    expect(res3.statusCode).toEqual(400);
    expect(res3.body).toHaveProperty("error");
    //invalid content type
    const res4 = await request(app).post("/opinions/new").send({
      debateId: DEBATE_ID,
      address: ACCOUNT_EXISTING.address,
      signature,
      message,
      content,
      contentType: "json",
      stake,
      pro,
    });
    expect(res4.statusCode).toEqual(400);
    expect(res4.body).toHaveProperty("error");
    //missing stake
    const res5 = await request(app).post("/opinions/new").send({
      debateId: DEBATE_ID,
      address: ACCOUNT_EXISTING.address,
      signature,
      message,
      content,
      contentType: "json",
      pro,
    });
    expect(res5.statusCode).toEqual(400);
    expect(res5.body).toHaveProperty("error");
  });
  it("should post new opinion", async () => {
    const debate = await models.Debate.findOne();
    const DEBATE_ID = debate._id;
    const message = "hello world";
    const content = "blah.co";
    const contentType = "link";
    const stake = 200;
    const pro = true;
    const signature = await MOCK_WALLET.signMessage(message);
    const res = await request(app).post("/opinions/new").send({
      debateId: DEBATE_ID,
      address: ACCOUNT_EXISTING.address,
      signature,
      message,
      content,
      contentType,
      stake,
      pro,
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("opinion");
    expect(res.body.opinion.content).toEqual(content);
    expect(res.body.opinion.contentType).toEqual(contentType);
    expect(res.body.opinion.stake).toEqual(stake);
    expect(res.body.opinion.pro).toEqual(pro);
  });
  it("should post new vote", async () => {
    const debate = await models.Debate.findOne();
    const DEBATE_ID = debate._id;
    const message = "hello world";
    const contentType = "vote";
    const stake = 1;
    const pro = true;
    const signature = await MOCK_WALLET.signMessage(message);
    const res = await request(app).post("/opinions/new").send({
      debateId: DEBATE_ID,
      address: ACCOUNT_EXISTING.address,
      signature,
      message,
      contentType,
      stake,
      pro,
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("opinion");
    expect(res.body.opinion.contentType).toEqual(contentType);
    expect(res.body.opinion.stake).toEqual(stake);
    expect(res.body.opinion.pro).toEqual(pro);
  });
  afterAll(async () => {
    await removeAllCollections();
  });
});
