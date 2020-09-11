import botHelper from "slackbots";
class SlackBot {
  constructor() {
    this.botHelper = new botHelper({
        token: `${process.env.SLACK_BOT_TOKEN}`,
        name: "Defy.fyi",
      });
    if (!SlackBot.instance) {
      SlackBot.instance = this;
    }
    return SlackBot.instance;
  }
  postToChannel(channelName, message) {
    if(process.env.SLACK_ENABLED === "true"){
      try{
        this.botHelper.postMessageToChannel(
            channelName,
            message
          );
      }catch(ex){
          console.trace(ex);
      }
    }
  }
}

export const instance = new SlackBot();
Object.freeze(instance);

export default SlackBot;
