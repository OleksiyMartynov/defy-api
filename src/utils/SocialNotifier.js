import { instance as SlackBotInstance } from "./SlackBot";
import { instance as TweetBotInstance } from "./TweetBot";
import EventBus, { instance as EventBusInstance } from "./EventBus";
import { EVENTS } from "../constants";

class SocialNotifier {
  constructor() {
    if (!SocialNotifier.instance) {
      SocialNotifier.instance = this;
    }
    return SocialNotifier.instance;
  }

  start() {
    EventBusInstance.addListener(
      new EventBus.Listener(
        EVENTS.DEBATE_CREATED,
        "serverEventCreated",
        (payload) => {
          const tags = payload.tags.map((tag) => `#${tag.name} `)?.join("");
          this.notify(
            `New debate: ${
              payload.title.length > 180
                ? payload.title.substring(0, 180) + "..."
                : payload.title
            }. (${payload.stake} sats) ${tags ?? ""} https://defy.fyi/debate/${
              payload._id
            }`
          );
        }
      )
    );

    EventBusInstance.addListener(
      new EventBus.Listener(
        EVENTS.DEBATE_FINISHED,
        "serverEventFinished",
        (payload) => {
          let winningSideName;
          const totalLocked = payload.totalPro + payload.totalCon;
          const percentPro = (payload.totalPro / totalLocked) * 100;
          const percentCon = (payload.totalCon / totalLocked) * 100;
          if (payload.totalPro > payload.totalCon) {
            winningSideName = `PRO wins by ${(percentPro - percentCon).toFixed(
              2
            )}%`;
          } else if (payload.totalPro < payload.totalCon) {
            winningSideName = `CON wins by ${(percentCon - percentPro).toFixed(
              2
            )}%`;
          } else {
            winningSideName = `Resulted in a TIE`;
          }
          this.notify(
            `Debate completed: ${
              payload.title.length > 180
                ? payload.title.substring(0, 180) + "..."
                : payload.title
            }. ${
              payload.totalLocked
            } sats were locked! ${winningSideName} https://defy.fyi/debate/${
              payload._id
            }`
          );
        }
      )
    );
  }

  notify(msg) {
    console.log(`SocialNotifier: ${msg}`);
    SlackBotInstance.postToChannel(process.env.SLACK_CHANNEL, msg);
    TweetBotInstance.postTweet(msg);
  }
}

export const instance = new SocialNotifier();
Object.freeze(instance);

export default SocialNotifier;
