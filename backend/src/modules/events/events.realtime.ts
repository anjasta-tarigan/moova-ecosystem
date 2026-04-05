import { EventEmitter } from "events";

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

const channel = (eventId: string) => `event:${eventId}`;
const audienceChannel = (audience: string) => `events:audience:${audience}`;

const normalizeAudiences = (input?: unknown) => {
  if (!Array.isArray(input) || input.length === 0) {
    return ["PUBLIC", "STUDENT", "JUDGE"];
  }

  const allowed = new Set(["PUBLIC", "STUDENT", "JUDGE"]);
  const normalized = input
    .map((value) => String(value || "").toUpperCase())
    .filter((value) => allowed.has(value));

  return normalized.length ? normalized : ["PUBLIC", "STUDENT", "JUDGE"];
};

export const publishEventUpdate = (eventId: string, payload: any) => {
  const fullPayload = {
    ...payload,
    eventId,
    timestamp: new Date().toISOString(),
  };

  emitter.emit(channel(eventId), fullPayload);

  const audiences = normalizeAudiences(payload?.audiences);
  for (const audience of audiences) {
    emitter.emit(audienceChannel(audience), fullPayload);
  }
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

export const subscribeGlobalEventUpdates = (
  audience: "PUBLIC" | "STUDENT" | "JUDGE",
  callback: (payload: any) => void,
) => {
  const key = audienceChannel(audience);
  emitter.on(key, callback);

  return () => {
    emitter.off(key, callback);
  };
};
