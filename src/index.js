import "dotenv/config";
const server = require("./server");
const { startFinalizer } = require("./service/finalizer");

import { connectDb } from "./utils/DatabaseUtils";
import EventBus, { instance as EventBusInstance } from "./utils/EventBus";
import { instance as SlackBotInstance } from "./utils/SlackBot";
import { instance as TweetBotInstance } from "./utils/TweetBot";
import { EVENTS } from "./constants";

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

EventBusInstance.addListener(
  new EventBus.Listener(
    EVENTS.DEBATE_CREATED,
    "serverEventCreated",
    (payload) => {
      const msg = `New debate: ${
        payload.title.length > 180
          ? payload.title.substring(0, 180) + "..."
          : payload.title
      } (${payload.stake}sats) https://defy.fyi/debate/${payload._id}`;
      SlackBotInstance.postToChannel(process.env.SLACK_CHANNEL, msg);
      TweetBotInstance.postTweet(msg);
    }
  )
);
