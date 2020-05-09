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

describe("Debate Model", () => {
  beforeEach(async () => {
    await connectDb(process.env.DATABASE_URL);
    await models.Account.create(ACCOUNT_EXISTING);
  });
  afterEach(async () => {
    await removeAllCollections();
  });
  it("Should not create debate with unknown account", async () => {
    await expect(models.Debate.createDebate("0xd215bffabbdd893a6f7cea402e7338643ced44a1")).rejects.toThrow(
      "Unknown account address"
    );
  });
  it("Should not create debate without enough balance", async () => {
    await expect(
      models.Debate.createDebate(
        ACCOUNT_EXISTING.address,
        "title",
        "description",
        [],
        ACCOUNT_EXISTING.balance + 1
      )
    ).rejects.toThrow("Account does not have enough funds");
  });
  it("should not create debate with invalid tags", async () => {
    await expect(
      models.Debate.createDebate(
        ACCOUNT_EXISTING.address,
        "title",
        "description special char tag",
        ["#noHash"],
        101
      )
    ).rejects.toThrow();
    await expect(
      models.Debate.createDebate(
        ACCOUNT_EXISTING.address,
        "title",
        "description short tag",
        ["t"],
        101
      )
    ).rejects.toThrow();
    await expect(
      models.Debate.createDebate(
        ACCOUNT_EXISTING.address,
        "title",
        "description special char end",
        ["tag+"],
        101
      )
    ).rejects.toThrow();
    await expect(
      models.Debate.createDebate(
        ACCOUNT_EXISTING.address,
        "title",
        "description too many tags",
        ["tag", "tag", "tag", "tag", "tag", "tag"],
        101
      )
    ).rejects.toThrow("Too many tags");
  });
  it("should be able to create the debate successfully", async () => {
    const timestamp = Date.now();
    const stake = 100;
    const title = "title";
    const description = "hello world";
    const tags = ["testTag1", "testTag2", "testTag3"];
    const accountDoc = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    const initialBalance = accountDoc.balance;
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      title,
      description,
      tags,
      stake
    );

    expect(debate).toHaveProperty("creator", accountDoc._id);
    expect(debate).toHaveProperty("title", title);
    expect(debate).toHaveProperty("description", description);
    expect(debate).toHaveProperty("stake", stake);
    expect(debate.tags.length).toBe(3);
    //check account balance
    const newBalance = (
      await models.Account.accountForAddress(ACCOUNT_EXISTING.address)
    ).balance;
    expect(initialBalance).toBe(newBalance + stake);
    //check tags
    const tagDocs = await models.Tag.find({ debates: debate._id });
    expect(tagDocs.length).toBe(3);
    tagDocs.forEach((tag, index) => {
      expect(tag.debates).toContainEqual(debate._id);
      expect(tag).toHaveProperty("name", tags[index]);
    });
  });
  it("should not be able to finish debate before end time", async () => {
    const stake = 100;
    const title = "title";
    const description = "hello world";
    const tags = ["testTag1", "testTag2", "testTag3"];
    const debate = await models.Debate.createDebate(
      ACCOUNT_EXISTING.address,
      title,
      description,
      tags,
      stake
    );
    await expect(debate.completeDebate()).rejects.toThrow(
      "Cannot complete debate before end time"
    );
  });
  it("should be able to finish debate after end time", async () => {
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
    const newBalance = (
      await models.Account.accountForAddress(ACCOUNT_EXISTING.address)
    ).balance;

    expect(newBalance).toBe(initialBalance + stake);

  });
  it("should not be able to finish debate twice", async () => {
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
    await sleep(duration + 1);
    await debate.completeDebate();
    await expect(debate.completeDebate()).rejects.toThrow(
      "Debate already completed"
    );
  });
});
