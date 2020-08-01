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
    for (let i = 0; i < 25; i++) {
      const d = await models.Debate.createDebate(
        ACCOUNT_EXISTING.address,
        "Debate Title " + i,
        "Debate Description " + i,
        ["testTag"],
        100
      );
      await models.Opinion.createOpinion(
        ACCOUNT_EXISTING.address,
        d._id,
        "www.google.com",
        "link",
        100,
        true
      );
    }
  });
  it("should get debates", async () => {
    const res = await request(app).get("/debates").send();
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("debates");
    expect(res.body.debates).toHaveLength(10);
    expect(res.body.page).toEqual(0);
    expect(res.body.pages).toEqual(3);

    const res2 = await request(app).get("/debates?page=1").send();
    expect(res2.statusCode).toEqual(200);
    expect(res2.body).toHaveProperty("debates");
    expect(res2.body.debates).toHaveLength(10);
    expect(res2.body.page).toEqual(1);
    expect(res2.body.pages).toEqual(3);

    const res3 = await request(app).get("/debates?page=2").send();
    expect(res3.statusCode).toEqual(200);
    expect(res3.body).toHaveProperty("debates");
    expect(res3.body.debates).toHaveLength(5);
    expect(res3.body.page).toEqual(2);
    expect(res3.body.pages).toEqual(3);

    const res4 = await request(app).get("/debates?page=3").send();
    expect(res4.statusCode).toEqual(200);
    expect(res4.body).toHaveProperty("debates");
    expect(res4.body.debates).toHaveLength(0);
  });
  it("should get debate details", async () => {
    const debate = await models.Debate.findOne();
    const DEBATE_ID = debate._id;
    const res = await request(app).get(`/debates/${DEBATE_ID}`).send();
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("debate");
    expect(res.body).toHaveProperty("history");
    console.log(JSON.stringify(res.body));
    expect(res.body.debate).toHaveProperty("created");
    expect(res.body.debate).not.toHaveProperty("creator");
    expect(res.body.debate).toHaveProperty("title");
    expect(res.body.debate).toHaveProperty("description");
    expect(res.body.debate).toHaveProperty("tags");
    expect(res.body.debate).toHaveProperty("stake");
    expect(res.body.debate).toHaveProperty("duration");
    expect(res.body.debate).toHaveProperty("finished");
  });
  it("should fail posting new debate", async () => {
    const title = "New Debate Title";
    const description = "New Debate Description";
    const tags = ["newTag", "newTag2"];
    const stake = 100;
    const message = "Hello world";
    const signature = await MOCK_WALLET.signMessage(message);
    //unfunded address
    const res = await request(app).post("/debates/new").send({
      address: "0xc115bffabaed893a6f7cea402e7338643ced44a6",
      signature,
      message,
      title,
      description,
      tags,
      stake,
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("error");
    //wrong signature
    const res2 = await request(app).post("/debates/new").send({
      address: ACCOUNT_EXISTING.address,
      signature: "0x000000000123231231234533423",
      message,
      title,
      description,
      tags,
      stake,
    });
    expect(res2.statusCode).toEqual(400);
    expect(res2.body).toHaveProperty("error");
    //wrong message
    const res3 = await request(app).post("/debates/new").send({
      address: ACCOUNT_EXISTING.address,
      signature,
      message: "not the initial payload",
      title,
      description,
      tags,
      stake,
    });
    expect(res3.statusCode).toEqual(400);
    expect(res3.body).toHaveProperty("error");
    //missing title
    const res4 = await request(app).post("/debates/new").send({
      address: ACCOUNT_EXISTING.address,
      signature,
      message,
      description,
      tags,
      stake,
    });
    expect(res4.statusCode).toEqual(400);
    expect(res4.body).toHaveProperty("error");
    //missing description
    const res5 = await request(app).post("/debates/new").send({
      address: ACCOUNT_EXISTING.address,
      signature,
      message,
      title,
      tags,
      stake,
    });
    expect(res5.statusCode).toEqual(400);
    expect(res5.body).toHaveProperty("error");
    //wrong tag format
    const res6 = await request(app)
      .post("/debates/new")
      .send({
        address: ACCOUNT_EXISTING.address,
        signature,
        message,
        title,
        description,
        tags: [{ title: "hello" }],
        stake,
      });
    expect(res6.statusCode).toEqual(400);
    expect(res6.body).toHaveProperty("error");
    //another wrong tag format
    const res7 = await request(app)
      .post("/debates/new")
      .send({
        address: ACCOUNT_EXISTING.address,
        signature,
        message,
        title,
        description,
        tags: ["#sup"],
        stake,
      });
    expect(res7.statusCode).toEqual(400);
    expect(res7.body).toHaveProperty("error");
    //bad stake
    const res8 = await request(app).post("/debates/new").send({
      address: ACCOUNT_EXISTING.address,
      signature,
      message,
      title,
      description,
      tags,
      stake: -20,
    });
    expect(res8.statusCode).toEqual(400);
    expect(res8.body).toHaveProperty("error");
    //another bad stake
    const res9 = await request(app).post("/debates/new").send({
      address: ACCOUNT_EXISTING.address,
      signature,
      message,
      title,
      description,
      tags,
      stake: 99999999,
    });
    expect(res9.statusCode).toEqual(400);
    expect(res9.body).toHaveProperty("error");
  });
  it("should post new debate", async () => {
    const title = "New Debate Title";
    const description = "New Debate Description";
    const tags = ["newTag", "newTag2"];
    const stake = 100;
    const message = "Hello world";
    const signature = await MOCK_WALLET.signMessage(message);
    const res = await request(app).post("/debates/new").send({
      address: ACCOUNT_EXISTING.address,
      signature,
      message,
      title,
      description,
      tags,
      stake,
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("debate");
    expect(res.body.debate.title).toEqual(title);
    expect(res.body.debate.description).toEqual(description);
    expect(res.body.debate.stake).toEqual(stake);
    expect(res.body.debate.tags).toHaveLength(tags.length);
  });
  afterAll(async () => {
    await removeAllCollections();
  });
});
