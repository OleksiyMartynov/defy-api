import "dotenv/config";
const server = require("./server");
const { startFinalizer } = require("./service/finalizer");

import { connectDb } from "./utils/DatabaseUtils";

connectDb(process.env.DATABASE_URL).then(async () => {
  server.listen(process.env.PORT, () =>
    console.log(`Server listening on port ${process.env.PORT}!`)
  );
  startFinalizer();

  //test funds
  // const Account = require("./models/Account");
  // Account.default.create({
  //   address: "0xF279CEA4Ebb7704C3c8B15F1911D7d114d2a4F67",
  //   balance: 9999999,
  // });
});

//todo : update search criteria
//todo : add route for user history
//todo : LND deposits
//todo : LND withdrawals
//todo : charge house fees
