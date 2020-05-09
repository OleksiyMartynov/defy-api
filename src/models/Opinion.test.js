import "./../jestConfig";
import { connectDb, removeAllCollections } from "../utils/DatabaseUtils";
import models from "../models";
import { HISTORY_EVENT_TYPES } from "../models/ModelConstants";
import { sleep } from "../utils/Common";

//TEST DATA
const ACCOUNT_EXISTING = {
  address: "0xe215bffabbdd893a6f7cea402e7338643ced55a6",
  balance: 9999,
};

describe("Opinion Model", () => {
  beforeEach(async () => {
    await connectDb(process.env.DATABASE_URL);
    await models.Account.create(ACCOUNT_EXISTING);
  });
  afterEach(async () => {
    await removeAllCollections();
  });
  it("Should not create opinion with invalid parameters", async () => {
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      "Test Debate",
      "Some description",
      ["someTag"],
      100
    );
    const UNEXISTING_DEBATE_ID = "5eb6a0f66699592af79590b1";
    const UNFUNDED_ADDRESS = "0xd125bffcbbdd893a6f7cea402e7338643ced44a7";
    await expect(
      models.Opinion.createOpinion(
        UNFUNDED_ADDRESS,
        debate._id,
        "www.something.com",
        "link",
        100,
        true
      )
    ).rejects.toThrow("Unknown account address");
    await expect(
      models.Opinion.createOpinion(
        ACCOUNT_EXISTING.address,
        UNEXISTING_DEBATE_ID,
        "www.something.com",
        "link",
        100,
        true
      )
    ).rejects.toThrow("Unknown debate id");
    await expect(
      models.Opinion.createOpinion(
        ACCOUNT_EXISTING.address,
        debate._id,
        "balh",
        "link",
        100,
        true
      )
    ).rejects.toThrow("Invalid content format");
    await expect(
      models.Opinion.createOpinion(
        ACCOUNT_EXISTING.address,
        debate._id,
        "www.google.com",
        "link",
        99,
        true
      )
    ).rejects.toThrow("Stake too low for link");
  });
  it("Should not create opinion after draw completion", async () => {
    const duration = 1000;
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      "Test Debate",
      "Some description",
      ["someTag"],
      100,
      duration
    );
    await sleep(duration + 1);
    await expect(
      models.Opinion.createOpinion(
        ACCOUNT_EXISTING.address,
        debate._id,
        "www.google.com",
        "link",
        100,
        true
      )
    ).rejects.toThrow("Cannot create opinion past end time");
  });
  it("Should create opinion with correct data", async () => {
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      "Test Debate",
      "Some description",
      ["someTag"],
      100
    );
    const accountDoc = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    const initialBalance = accountDoc.balance;
    const contentType = "link";
    const content = "www.google.com";
    const stake = 101;
    const opinionPro = true;
    const timestamp = Date.now();
    const opinion = await models.Opinion.createOpinion(
      ACCOUNT_EXISTING.address,
      debate._id,
      content,
      contentType,
      stake,
      opinionPro
    );
    expect(opinion).toHaveProperty("debate", debate._id);
    expect(opinion).toHaveProperty("creator", accountDoc._id);
    expect(opinion).toHaveProperty("contentType", contentType);
    expect(opinion).toHaveProperty("content", content);
    expect(opinion).toHaveProperty("stake", stake);
    expect(opinion).toHaveProperty("pro", opinionPro);
    //check account balance
    const newBalance = (
      await models.Account.accountForAddress(ACCOUNT_EXISTING.address)
    ).balance;
    expect(newBalance).toBe(initialBalance - stake);
  });
  it("Should not create second opinion with less than previous opinions stake", async () => {
    const bigestStake = 200;
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      "Test Debate",
      "Some description",
      ["someTag"],
      100
    );
    await models.Opinion.createOpinion(
      ACCOUNT_EXISTING.address,
      debate._id,
      "www.google.com",
      "link",
      bigestStake,
      true
    );

    await expect(
      models.Opinion.createOpinion(
        ACCOUNT_EXISTING.address,
        debate._id,
        "www.google.com",
        "link",
        199,
        true
      )
    ).rejects.toThrow("Stake too low for link");
  });
  it("Should update parent debate duration correctly", async () => {
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      "Test Debate",
      "Some description",
      ["someTag"],
      100
    );
    const lastUpdateTime = (await debate.getLastUpdateTime()).getTime()
    await models.Opinion.createOpinion(
      ACCOUNT_EXISTING.address,
      debate._id,
      "www.google.com",
      "link",
      101,
      true
    );
    const updatedDebate = await models.Debate.findById(debate._id);
    expect(lastUpdateTime).toBeLessThan((await updatedDebate.getLastUpdateTime()).getTime())
  });
  it("should not be able to finish opinion before end time", async () => {
    const stake = 100;
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      "Test Debate",
      "Some description",
      ["someTag"],
      100,
    );
    const opinion = await models.Opinion.createOpinion(
      ACCOUNT_EXISTING.address,
      debate._id,
      "www.google.com",
      "link",
      stake,
      true
    );
    await expect(
      opinion.completeOpinion()
    ).rejects.toThrow("Cannot complete opinion before end time");

  });
  it("should be able to finish opinion after end time", async () => {
    const stake = 100;
    const duration = 1000;
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      "Test Debate",
      "Some description",
      ["someTag"],
      100,
      duration
    );
    const opinion = await models.Opinion.createOpinion(
      ACCOUNT_EXISTING.address,
      debate._id,
      "www.google.com",
      "link",
      stake,
      true
    );
    const accountDoc = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    const initialBalance = accountDoc.balance;
    await sleep(duration + 1);
    await opinion.completeOpinion();
    const newBalance = (
      await models.Account.accountForAddress(ACCOUNT_EXISTING.address)
    ).balance;

    expect(newBalance).toBe(initialBalance + stake);

  });
  it("should not be able to finish opinion twice", async () => {
    const stake = 100;
    const duration = 1000;
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      "Test Debate",
      "Some description",
      ["someTag"],
      100,
      duration
    );
    const opinion = await models.Opinion.createOpinion(
      ACCOUNT_EXISTING.address,
      debate._id,
      "www.google.com",
      "link",
      stake,
      true
    );
    const accountDoc = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    const initialBalance = accountDoc.balance;
    await sleep(duration + 1);
    await opinion.completeOpinion();
    const newBalance = (
      await models.Account.accountForAddress(ACCOUNT_EXISTING.address)
    ).balance;

    expect(newBalance).toBe(initialBalance + stake);
    await expect(
      opinion.completeOpinion()
    ).rejects.toThrow("Opinion already completed");

  });
  //vote opinions
  it("Should not create vote with invalid parameters", async () => {
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      "Test Debate",
      "Some description",
      ["someTag"],
      100
    );
    const UNEXISTING_DEBATE_ID = "5eb6a0f66699592af79590b1";
    const UNFUNDED_ADDRESS = "0xa236cffabbdd893a6f7cea402e7338643ced44a7";
    await expect(
      models.Opinion.createVote(
        UNFUNDED_ADDRESS,
        debate._id,
        100,
        true
      )
    ).rejects.toThrow("Unknown account address");
    await expect(
      models.Opinion.createVote(
        ACCOUNT_EXISTING.address,
        UNEXISTING_DEBATE_ID,
        100,
        true
      )
    ).rejects.toThrow("Unknown debate id");
    await expect(
      models.Opinion.createVote(
        ACCOUNT_EXISTING.address,
        debate._id,
        9999999,
        true
      )
    ).rejects.toThrow("Account does not have enough funds");
  });
  it("Should not create vote after draw completion", async () => {
    const duration = 1000;
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      "Test Debate",
      "Some description",
      ["someTag"],
      100,
      duration
    );
    await sleep(duration + 1);
    await expect(
      models.Opinion.createVote(
        ACCOUNT_EXISTING.address,
        debate._id,
        100,
        true
      )
    ).rejects.toThrow("Cannot create opinion past end time");
  });
  it("Should create vote with correct data", async () => {
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      "Test Debate",
      "Some description",
      ["someTag"],
      100
    );
    const accountDoc = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    const initialBalance = accountDoc.balance;
    const stake = 101;
    const votePro = true;
    const timestamp = Date.now();
    const vote = await models.Opinion.createVote(
      ACCOUNT_EXISTING.address,
      debate._id,
      stake,
      votePro
    );
    expect(vote).toHaveProperty("debate", debate._id);
    expect(vote).toHaveProperty("creator", accountDoc._id);
    expect(vote).toHaveProperty("stake", stake);
    expect(vote).toHaveProperty("pro", votePro);
    //check account balance
    const newBalance = (
      await models.Account.accountForAddress(ACCOUNT_EXISTING.address)
    ).balance;
    expect(newBalance).toBe(initialBalance - stake);
    //check history
    const historyItem = await models.History.findOne({
      account: accountDoc._id,
      timestamp: { $gte: timestamp },
    });
    expect(historyItem).toHaveProperty("action", "vote_created");
    expect(historyItem).toHaveProperty("amount", -stake);
    expect(historyItem).toHaveProperty("account", accountDoc._id);
    expect(historyItem).toHaveProperty("schemaId", vote._id);
  });
  it("should not be able to finish vote before end time", async () => {
    const stake = 100;
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      "Test Debate",
      "Some description",
      ["someTag"],
      100,
    );
    const vote = await models.Opinion.createVote(
      ACCOUNT_EXISTING.address,
      debate._id,
      stake,
      true
    );
    await expect(
      vote.completeOpinion()
    ).rejects.toThrow("Cannot complete opinion before end time");

  });
  it("should be able to finish vote after end time", async () => {
    const stake = 100;
    const duration = 1000;
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      "Test Debate",
      "Some description",
      ["someTag"],
      100,
      duration
    );
    const vote = await models.Opinion.createVote(
      ACCOUNT_EXISTING.address,
      debate._id,
      stake,
      true
    );
    const accountDoc = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    const initialBalance = accountDoc.balance;
    await sleep(duration + 1);
    await vote.completeOpinion();
    const newBalance = (
      await models.Account.accountForAddress(ACCOUNT_EXISTING.address)
    ).balance;

    expect(newBalance).toBe(initialBalance + stake);

  });
  it("should not be able to finish vote twice", async () => {
    const stake = 100;
    const duration = 1000;
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      "Test Debate",
      "Some description",
      ["someTag"],
      100,
      duration
    );
    const vote = await models.Opinion.createVote(
      ACCOUNT_EXISTING.address,
      debate._id,
      stake,
      true
    );
    const accountDoc = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    const initialBalance = accountDoc.balance;
    await sleep(duration + 1);
    await vote.completeOpinion();
    const newBalance = (
      await models.Account.accountForAddress(ACCOUNT_EXISTING.address)
    ).balance;

    expect(newBalance).toBe(initialBalance + stake);
    await expect(
      vote.completeOpinion()
    ).rejects.toThrow("Opinion already completed");

  });
});
