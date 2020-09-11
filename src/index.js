import "dotenv/config";
const server = require("./server");
const { startFinalizer } = require("./service/finalizer");

import { connectDb } from "./utils/DatabaseUtils";
import { instance as SocialNotifierInstance } from "./utils/SocialNotifier";

connectDb(process.env.DATABASE_URL).then(async () => {
  server.listen(process.env.PORT, () =>
    console.log(`Server listening on port ${process.env.PORT}!`)
  );

  SocialNotifierInstance.start();
  startFinalizer();
});


