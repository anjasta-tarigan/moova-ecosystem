import { useEffect } from "react";

type CalendarStreamPayload = {
  type?: string;
  action?: string;
  event?: unknown;
  data?: unknown;
  id?: string;
  eventId?: string;
  timestamp?: string;
  [key: string]: unknown;
};

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

const safeParse = (raw: string): CalendarStreamPayload | null => {
  try {
    const parsed = JSON.parse(raw || "{}");
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed as CalendarStreamPayload;
  } catch {
    return null;
  }
};

export const useCalendarStream = (
  onUpdate: (payload: CalendarStreamPayload) => void,
  enabled = true,
) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const source = new EventSource(
      `${API_BASE_URL}/api/events/stream?role=PUBLIC`,
    );

    const handleMessage = (message: MessageEvent) => {
      const payload = safeParse(message.data);
      if (!payload) {
        return;
      }

      if (payload.type === "connected" || payload.type === "heartbeat") {
        return;
      }

      onUpdate(payload);
    };

    const handleError = () => {
      // Native EventSource will retry automatically; keep connection alive.
    };

    source.addEventListener("event-update", handleMessage as EventListener);
    source.addEventListener("message", handleMessage as EventListener);
    source.addEventListener("error", handleError as EventListener);

    return () => {
      source.removeEventListener(
        "event-update",
        handleMessage as EventListener,
      );
      source.removeEventListener("message", handleMessage as EventListener);
      source.removeEventListener("error", handleError as EventListener);
      source.close();
    };
  }, [enabled, onUpdate]);
};
