import "dotenv/config";
const server = require('./server');

import { connectDb } from "./utils/DatabaseUtils";

connectDb(process.env.DATABASE_URL).then(async () => {
    server.listen(process.env.PORT, () =>
      console.log(`Example app listening on port ${process.env.PORT}!`)
    );
  //   looper();
  });