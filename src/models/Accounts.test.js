import "./../jestConfig";
import { connectDb, removeAllCollections } from "../utils/DatabaseUtils";
import models from "../models";
import {HISTORY_EVENT_TYPES} from "../models/ModelConstants";

//TEST DATA
const MOCK_ADDRESS = "0xd115bffabbdd893a6f7cea402e7338643ced44a7";
const ACCOUNT_EXISTING = {
  address: "0xd115bffabbdd893a6f7cea402e7338643ced44a6",
  balance: 9999,
};

describe("Account Model", () => {
  beforeAll(async () => {
    await connectDb(process.env.DATABASE_URL);
    await models.Account.create(ACCOUNT_EXISTING);
  });
  it("Should not update account balance with invalid reason", async () => {
    await expect(
      models.Account.updateBalance(MOCK_ADDRESS, 1, "halving")
    ).rejects.toThrow("Unknown balance update reason.");
  });
  it("Should create account and update balance", async () => {
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
    expect(returnedAccount).toHaveProperty("balance", balanceDelta);
    expect(returnedAccount).toHaveProperty("address", MOCK_ADDRESS);
    const persistedAccount = await models.Account.accountForAddress(
      MOCK_ADDRESS
    );
    expect(returnedAccount).toHaveProperty("_id", persistedAccount._id);
    expect(persistedAccount).toHaveProperty("balance", balanceDelta);
    expect(persistedAccount).toHaveProperty("address", MOCK_ADDRESS);
    const historyItem = await models.History.findOne({account:persistedAccount._id, timestamp:{"$gte": timestamp}});
    expect(historyItem).toHaveProperty("action", reason);
    expect(historyItem).toHaveProperty("amount", balanceDelta);
    expect(historyItem).toHaveProperty("account", persistedAccount._id);
    expect(historyItem).toHaveProperty("schemaId", persistedAccount._id);
  });
  it("Should only update balance", async () => {
    const balanceDelta = 3;
    const reason = "deposit"
    const timestamp = Date.now();
    const existing = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    expect(existing).not.toBeNull();
    await models.Account.updateBalance(
      ACCOUNT_EXISTING.address,
      balanceDelta,
      reason
    );
    const updatedAccount = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    expect(updatedAccount).toHaveProperty("_id", existing._id);
    expect(updatedAccount).toHaveProperty(
      "balance",
      ACCOUNT_EXISTING.balance + balanceDelta
    );
    expect(updatedAccount).toHaveProperty("address", ACCOUNT_EXISTING.address);
    const historyItem = await models.History.findOne({account:updatedAccount._id, timestamp:{"$gte": timestamp}});
    expect(historyItem).toHaveProperty("action", reason);
    expect(historyItem).toHaveProperty("amount", balanceDelta);
    expect(historyItem).toHaveProperty("account", updatedAccount._id);
    expect(historyItem).toHaveProperty("schemaId", updatedAccount._id);
  });
  it("Should only update and decrease balance", async () => {
    const balanceDelta = -2;
    const reason = "withdrawal";
    const timestamp = Date.now();
    const existing = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    expect(existing).not.toBeNull();
    await models.Account.updateBalance(
      ACCOUNT_EXISTING.address,
      balanceDelta,
      reason
    );
    const updatedAccount = await models.Account.accountForAddress(
      ACCOUNT_EXISTING.address
    );
    expect(updatedAccount).toHaveProperty("_id", existing._id);
    expect(updatedAccount).toHaveProperty(
      "balance",
      existing.balance + balanceDelta
    );
    expect(updatedAccount).toHaveProperty("address", ACCOUNT_EXISTING.address);
    const historyItem = await models.History.findOne({account:updatedAccount._id, timestamp:{"$gte": timestamp}});
    expect(historyItem).toHaveProperty("action", reason);
    expect(historyItem).toHaveProperty("amount", balanceDelta);
    expect(historyItem).toHaveProperty("account", updatedAccount._id);
    expect(historyItem).toHaveProperty("schemaId", updatedAccount._id);
  });
  it("Should throw when delta and reason of balance update dont match", async ()=>{
    for await (let reason of HISTORY_EVENT_TYPES) {
        if(reason==="deposit"||reason==="debate_finished"||reason==="opinion_finished"||reason==="vote_finished"){
            await expect(
                models.Account.updateBalance(MOCK_ADDRESS, -1, reason)
              ).rejects.toThrow("Number must be > 0 for " + reason);
        }else if(reason==="withdrawal"||reason==="debate_created"||reason==="opinion_created"||reason==="vote_created"){
            await expect(
                models.Account.updateBalance(MOCK_ADDRESS, 1, reason)
              ).rejects.toThrow("Number must be < 0 for " + reason);
        }else{
            expect(true).not.toBe(true);
        }
        
    }
  })
  it("Should not update account balance without enough funds", async () => {
    await expect(
      models.Account.updateBalance(MOCK_ADDRESS, -99999, "withdrawal")
    ).rejects.toThrow("Account does not have enough funds");
  });
  afterAll(async () => {
    await removeAllCollections();
  });
});
