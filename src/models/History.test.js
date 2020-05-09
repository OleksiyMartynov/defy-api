import "./../jestConfig";
import { connectDb, removeAllCollections } from "../utils/DatabaseUtils";
import models from "../models";
import { HISTORY_EVENT_TYPES } from "../models/ModelConstants";
import { sleep } from "../utils/Common";

//TEST DATA
const MOCK_ADDRESS = "0xa215bffabbdd391a6f7cea402e7338643ced44a7";
const ACCOUNT_EXISTING = {
  address: "0xc415bffabbdd893a6f7cea402e7338643ced44a6",
  balance: 9999,
};

describe("History Model", () => {
  beforeAll(async () => {
    await connectDb(process.env.DATABASE_URL);
    await models.Account.create(ACCOUNT_EXISTING);
  });
  it("Should create correct history for Account funding", async ()=>{
    const balanceDelta = 2;
    const reason = "deposit";
    const timestamp = Date.now();
    const existing = await models.Account.accountForAddress(MOCK_ADDRESS);
    expect(existing).toBeNull();
    const returnedAccount = await models.Account.updateBalance(
      MOCK_ADDRESS,
      balanceDelta,
      reason
    );
    const historyItem = await models.History.findOne({account:returnedAccount._id, timestamp:{"$gte": timestamp}});
    expect(historyItem).toHaveProperty("action", reason);
    expect(historyItem).toHaveProperty("amount", balanceDelta);
    expect(historyItem).toHaveProperty("account", returnedAccount._id);
    expect(historyItem).toHaveProperty("schemaId", returnedAccount._id);
  });
  it("Should create correct history for Account withdrawal", async ()=>{
    const balanceDelta = -2;
    const reason = "withdrawal";
    const timestamp = Date.now();

    const returnedAccount = await models.Account.updateBalance(
      MOCK_ADDRESS,
      balanceDelta,
      reason
    );
    const historyItem = await models.History.findOne({account:returnedAccount._id, timestamp:{"$gte": timestamp}});
    expect(historyItem).toHaveProperty("action", reason);
    expect(historyItem).toHaveProperty("amount", balanceDelta);
    expect(historyItem).toHaveProperty("account", returnedAccount._id);
    expect(historyItem).toHaveProperty("schemaId", returnedAccount._id);
  });
  it("Should create correct history for Debate creation", async ()=>{
    const timestamp = Date.now();
    const stake = 100;
    const title = "title";
    const description = "hello world";
    const tags = ["testTag1", "testTag2", "testTag3"];
    const accountDoc = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      title,
      description,
      tags,
      stake
    );
    const historyItem = await models.History.findOne({
      account: accountDoc._id,
      timestamp: { $gte: timestamp },
    });
    expect(historyItem).toHaveProperty("action", "debate_created");
    expect(historyItem).toHaveProperty("amount", -stake);
    expect(historyItem).toHaveProperty("account", accountDoc._id);
    expect(historyItem).toHaveProperty("schemaId", debate._id);
  });
  it("Should create correct history for Debate completion", async ()=>{
    const stake = 100;
    const title = "title";
    const description = "hello world";
    const tags = ["testTag1", "testTag2", "testTag3"];
    const duration = 1000;
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      title,
      description,
      tags,
      stake,
      duration
    );
    const accountDoc = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    const initialBalance = accountDoc.balance;
    const timestamp = Date.now();
    await sleep(duration + 1);
    await debate.completeDebate();
    
    const historyItem = await models.History.findOne({
      account: accountDoc._id,
      timestamp: { $gte: timestamp },
    });
    expect(historyItem).toHaveProperty("action", "debate_finished");
    expect(historyItem).toHaveProperty("amount", stake);
    expect(historyItem).toHaveProperty("account", accountDoc._id);
    expect(historyItem).toHaveProperty("schemaId", debate._id);
  });
  it("Should create correct history for Opinion creation", async ()=>{
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
      
      const historyItem = await models.History.findOne({
        account: accountDoc._id,
        timestamp: { $gte: timestamp },
      });
      expect(historyItem).toHaveProperty("action", "opinion_created");
      expect(historyItem).toHaveProperty("amount", -stake);
      expect(historyItem).toHaveProperty("account", accountDoc._id);
      expect(historyItem).toHaveProperty("schemaId", opinion._id);
  });
  it("Should create correct history for Opinion completion", async ()=>{
    const duration = 1000;
    const debate = await models.Debate.createDebate(
        ACCOUNT_EXISTING.address,
        "Test Debate",
        "Some description",
        ["someTag"],
        100,
        duration
      );
      const accountDoc = await models.Account.accountForAddress(
        ACCOUNT_EXISTING.address
      );
      const contentType = "link";
      const content = "www.google.com";
      const stake = 101;
      const opinionPro = true;
      const opinion = await models.Opinion.createOpinion(
        ACCOUNT_EXISTING.address,
        debate._id,
        content,
        contentType,
        stake,
        opinionPro
      );
      await sleep(duration + 1);

      const timestamp = Date.now();
      await opinion.completeOpinion();
      const historyItem = await models.History.findOne({
        account: accountDoc._id,
        timestamp: { $gte: timestamp },
      });
      expect(historyItem).toHaveProperty("action", "opinion_finished");
      expect(historyItem).toHaveProperty("amount", stake);
      expect(historyItem).toHaveProperty("account", accountDoc._id);
      expect(historyItem).toHaveProperty("schemaId", opinion._id);
  });
  it("Should create correct history for Vote creation", async ()=>{
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
      const stake = 101;
      const votePro = true;
      const timestamp = Date.now();
      const vote = await models.Opinion.createVote(
        ACCOUNT_EXISTING.address,
        debate._id,
        stake,
        votePro
      );
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
  it("Should create correct history for Vote completion", async ()=>{
    const duration = 1000;
    const debate = await models.Debate.createDebate(
        ACCOUNT_EXISTING.address,
        "Test Debate",
        "Some description",
        ["someTag"],
        100,
        duration
      );
      const accountDoc = await models.Account.accountForAddress(
        ACCOUNT_EXISTING.address
      );
      const stake = 101;
      const opinionPro = true;
      const vote = await models.Opinion.createVote(
        ACCOUNT_EXISTING.address,
        debate._id,
        stake,
        opinionPro
      );
      await sleep(duration + 1);

      const timestamp = Date.now();
      await vote.completeOpinion();
      const historyItem = await models.History.findOne({
        account: accountDoc._id,
        timestamp: { $gte: timestamp },
      });
      expect(historyItem).toHaveProperty("action", "vote_finished");
      expect(historyItem).toHaveProperty("amount", stake);
      expect(historyItem).toHaveProperty("account", accountDoc._id);
      expect(historyItem).toHaveProperty("schemaId", vote._id);
  });
  afterAll(async () => {
    await removeAllCollections();
  });
});