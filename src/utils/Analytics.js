import ua from "universal-analytics";
const UA = process.env.GOOGLE_ANALYTICS_ID;

class Analytics {
  static sendEvent(ip, pubKey, eventCat, eventAction, label, value) {
    var visitor = ua(UA, ip, { strictCidFormat: false, uid: pubKey });
    visitor.event(eventCat, eventAction, label, value).send();
  }
}

export default Analytics;