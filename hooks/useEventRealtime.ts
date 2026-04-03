import { useEffect } from "react";

type EventUpdatePayload = {
  type?: string;
  timestamp?: string;
  [key: string]: unknown;
};

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

export const useEventRealtime = (
  eventId: string | undefined | null,
  onUpdate: (payload: EventUpdatePayload) => void,
  enabled = true,
) => {
  useEffect(() => {
    if (!enabled || !eventId) {
      return;
    }

    const streamUrl = `${API_BASE_URL}/api/events/${encodeURIComponent(eventId)}/stream`;
    const source = new EventSource(streamUrl);

    const handleUpdate = (message: MessageEvent) => {
      try {
        const payload = JSON.parse(message.data || "{}");
        if (payload?.type === "connected") {
          return;
        }
        onUpdate(payload);
      } catch {
        // Ignore malformed SSE payloads and keep stream alive.
      }
    };

    source.addEventListener("event-update", handleUpdate as EventListener);

    return () => {
      source.removeEventListener("event-update", handleUpdate as EventListener);
      source.close();
    };
  }, [enabled, eventId, onUpdate]);
};
