import "dotenv/config";
const server = require('./server');

import { connectDb } from "./utils/DatabaseUtils";

connectDb(process.env.DATABASE_URL).then(async () => {
    server.listen(process.env.PORT, () =>
      console.log(`Server listening on port ${process.env.PORT}!`)
    );
    //   looper();
    //test funds
    const Account = require("./models/Account");
    Account.default.create({address:"0xF279CEA4Ebb7704C3c8B15F1911D7d114d2a4F67", balance:9999999})
  });