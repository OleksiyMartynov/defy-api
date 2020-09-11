const Twitter = require("twitter");
class TweetBot {
  constructor() {
    this.botHelper = new Twitter({
      consumer_key: `${process.env.TWITTER_CONSUMER_KEY}`,
      consumer_secret: `${process.env.TWITTER_CONSUMER_KEY_SECRET}`,
      access_token_key: `${process.env.TWITTER_ACCESS_TOKEN}`,
      access_token_secret: `${process.env.TWITTER_ACCESS_TOKEN_SECRET}`,
    });
    if (!TweetBot.instance) {
      TweetBot.instance = this;
    }
    return TweetBot.instance;
  }
  postTweet(message) {
    if(process.env.TWITTER_ENABLED === "true"){
      try {
        this.botHelper.post("statuses/update", { status: message }, function (
          error,
          tweet,
          response
        ) {
          if (error) {
            console.log(error);
          }
        });
      } catch (ex) {
        console.trace(ex);
      }
    }
  }
}

export const instance = new TweetBot();
Object.freeze(instance);

export default TweetBot;
