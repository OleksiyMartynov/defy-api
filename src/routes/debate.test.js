import "./../jestConfig";
import {ethers} from "ethers";
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
      await models.Debate.createDebate(
        ACCOUNT_EXISTING.address,
        "Debate Title " + i,
        "Debate Description " + i,
        ["testTag"],
        100
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
    expect(res.body.debate).toHaveProperty("created");
    expect(res.body.debate).toHaveProperty("creator");
    expect(res.body.debate).toHaveProperty("title");
    expect(res.body.debate).toHaveProperty("description");
    expect(res.body.debate).toHaveProperty("tags");
    expect(res.body.debate).toHaveProperty("stake");
    expect(res.body.debate).toHaveProperty("duration");
    expect(res.body.debate).toHaveProperty("finished");
  });
  //   it("should not post new debate", async () => {
  //     const res = await request(app).post("/debates/new").send({
  //         title: "Debate title",
  //       });
  //       expect(res.statusCode).toEqual(400);
  //       expect(res.body).toHaveProperty("post");
  //   });
    it("should post new debate", async () => {
      const title = "New Debate Title";
      const description = "New Debate Description";
      const tags=["newTag", "newTag2"];
      const stake=100;
      const message = "Hello world";
      const signature = await MOCK_WALLET.signMessage(message);
      const res = await request(app).post("/debates/new").send({
          address:ACCOUNT_EXISTING.address,
          signature,
          message,
          title,
          description,
          tags,
          stake
        });
        console.log(res.body)
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
