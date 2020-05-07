import "../jestConfig";
import { ethers } from "ethers";

const MOCK_WALLET = ethers.Wallet.createRandom();

describe("SignatureVerifier tests", () => {
  beforeAll(() => {
    console.log("before");
    console.log(MOCK_WALLET.address);
  });
  it("Should not succeed ", () => {
    expect(true).toBe(true);
  });
});
