import "./../jestConfig";
const request = require("supertest");
const app = require("../server/index");

//TEST DATA
const ACCOUNT_ADDRESS = "0xd115bffabbdd893a6f7cea402e7338643ced44a7";

describe("Account Endpoints", () => {
  it("todo mock the invoice creation ", async () => {
      expect(true).toBe(true);
  })
    // it("should get invoice", async () => {
    //     const res = await request(app)
    //       .get(`/payment/getInvoice?account=${ACCOUNT_ADDRESS}&value=5`)
    //       .send();
    //     expect(res.statusCode).toEqual(200);
    //     expect(res.body).toHaveProperty("payment_request");
    //   });
})