class EventBus {
  constructor(){
    this.listeners = new Map();
    if(!EventBus.instance){
        this._data = [];
        EventBus.instance = this;
      }
      return EventBus.instance;
  }

  addListener(listener) {
    let eventListeners = this.listeners.get(listener.eventType);
    if (!eventListeners) {
      eventListeners = [];
    }
    eventListeners.push(listener);
    this.listeners.set(listener.eventType, eventListeners);
  }

  removeListener(listener) {
    let eventListeners = this.listeners.get(listener.eventType);
    if (eventListeners) {
      eventListeners = eventListeners.filter((item) => item !== listener);
      this.listeners.set(listener.eventType, eventListeners);
    }
  }

  getListenersForEvent(eventType) {
      return this.listeners.get(eventType);
  }

  sendEvent(eventType, payload) {
    let eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
        try {
            eventListeners.forEach(listener=> listener.callbackFunction(payload));
        } catch (err) {
            console.trace(err);
        }
    }
  }
}
EventBus.Listener = class {
  constructor(eventType, callbackId, callbackFunction) {
    this.eventType = eventType;
    this.callbackFunction = callbackFunction;
    this.callbackId = callbackId;
  }
};
export const instance = new EventBus();
Object.freeze(instance);

export default EventBus;
