import "./../jestConfig";
import { connectDb, removeAllCollections } from "../utils/DatabaseUtils";
import models from "../models";
import { HISTORY_EVENT_TYPES } from "../models/ModelConstants";
import { sleep } from "../utils/Common";
import { ethers } from "ethers";
import { finalize } from "./finalizer";

//TEST DATA
const MOCK_WALLET_1 = ethers.Wallet.createRandom();
const MOCK_WALLET_2 = ethers.Wallet.createRandom();
const MOCK_WALLET_CREATOR = ethers.Wallet.createRandom();
const MOCK_WALLETS = [MOCK_WALLET_1, MOCK_WALLET_2];
const DURATION = 10000;
describe("Opinion Model", () => {
  beforeAll(async () => {
    await connectDb(process.env.DATABASE_URL);
    await removeAllCollections();
    await models.Account.create({
      address: MOCK_WALLET_CREATOR.address,
      balance: 9999999,
    });
    const debate = await models.Debate.createDebate(
      MOCK_WALLET_CREATOR.address,
      "Debate Title",
      "Debate Description",
      ["testTag"],
      100,
      DURATION
    );
    const debateTie = await models.Debate.createDebate(
      MOCK_WALLET_CREATOR.address,
      "Debate Title Tie",
      "Debate Description Tie",
      ["testTag"],
      100,
      DURATION
    );
    let incr = 0;
    for (let i = 0; i < MOCK_WALLETS.length; i++) {
      const account = MOCK_WALLETS[i];
      await models.Account.create({
        address: account.address,
        balance: 999999,
      });
      for (let j = 0; j < 100; j++) {
        const newStake = 100 + incr;
        try {
          await models.Opinion.createOpinion(
            account.address,
            debate._id,
            "www.google.com",
            "link",
            newStake,
            i === 0
          );
        } catch (ex) {
          console.log(ex);
        }
        await models.Opinion.createOpinion(
          account.address,
          debateTie._id,
          null,
          "vote",
          10,
          i === 0
        );
        incr++;
      }
    }
  });

  it("Should not finalize debate before end time", async () => {
    // get initial balances total
    // finalize
    // get final balances total
    // winning side and losing side totals should match
    // debate attribute "finished" should be false
    expect(true);
  });
  it("Should finalize regular debate and update balance", async () => {
    // get initial balances total
    // finalize
    // get final balances total
    // check winning side total should equal initial balances total
    // check losing side todal should equal zero
  });
  it("Should finalize tie debate and update balance", async () => {
    // get initial balances total
    // finalize
    // get final balances total
    // winning side and losing side totals should match
    // debate attribute "finished" should be true
  });
});
