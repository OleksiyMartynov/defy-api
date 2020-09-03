import "./../jestConfig";
import EventBus, {instance as EventBusSingleton} from "./EventBus";

describe("EventBus", () => {
  it("Should add event listener", () => {
    const testEvent = "testEvent";
    let bus =  EventBusSingleton;
    expect(bus.getListenersForEvent(testEvent)).toBeUndefined();
    let listener = new EventBus.Listener(testEvent, "testListener", () => {});
    bus.addListener(listener);
    expect(bus.getListenersForEvent(testEvent)).toHaveLength(1);
  });
  it("Should remove event listener", () => {
    const testEvent = "testEvent2";
    let bus = EventBusSingleton;
    expect(bus.getListenersForEvent(testEvent)).toBeUndefined();
    let listener = new EventBus.Listener(testEvent, "testListener", () => {});
    bus.addListener(listener);
    expect(bus.getListenersForEvent(testEvent)).toHaveLength(1);

    bus.removeListener(listener);
    expect(bus.getListenersForEvent(testEvent)).toHaveLength(0);
  });
  it("Should call event listener", () => {
    const testEvent = "testEvent3";
    const payload = { data: "data" };
    let bus = EventBusSingleton;
    let callbackData = null;
    let listener = new EventBus.Listener(
      testEvent,
      "testListener",
      (payload) => {
        callbackData = payload;
      }
    );
    bus.addListener(listener);
    expect(callbackData).toBeNull();
    bus.sendEvent(testEvent, payload);
    expect(callbackData).toBe(payload);
  });
  it("Should not call event listener", () => {
    const testEvent = "testEvent3";
    const payload = { data: "data" };
    let bus = EventBusSingleton;
    let callbackData = null;
    let listener = new EventBus.Listener(
      testEvent,
      "testListener",
      (payload) => {
        callbackData = payload;
      }
    );
    bus.addListener(listener);
    expect(callbackData).toBeNull();
    bus.sendEvent("randomEventType", payload);
    expect(callbackData).toBeNull();
  });
});
