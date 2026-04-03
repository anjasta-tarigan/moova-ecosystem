import { EventEmitter } from "events";

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

const channel = (eventId: string) => `event:${eventId}`;

export const publishEventUpdate = (eventId: string, payload: any) => {
  emitter.emit(channel(eventId), {
    ...payload,
    timestamp: new Date().toISOString(),
  });
};

export const subscribeEventUpdates = (
  eventId: string,
  callback: (payload: any) => void,
) => {
  const key = channel(eventId);
  emitter.on(key, callback);

  return () => {
    emitter.off(key, callback);
  };
};
