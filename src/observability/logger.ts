export type MobileLogLevel = "debug" | "info" | "warn" | "error";

export type MobileLogContext = {
  requestId?: string;
  traceId?: string;
  screen?: string;
  route?: string;
  statusCode?: number;
  errorCode?: string;
  [key: string]: unknown;
};

export type MobileLogEvent = {
  level: MobileLogLevel;
  event: string;
  message?: string;
  context: MobileLogContext;
  createdAt: string;
};

const events: MobileLogEvent[] = [];
const maxBufferedEvents = 100;

export function logEvent(
  level: MobileLogLevel,
  event: string,
  context: MobileLogContext = {},
  message?: string
): void {
  const entry = {
    level,
    event,
    message,
    context,
    createdAt: new Date().toISOString()
  };

  events.push(entry);
  if (events.length > maxBufferedEvents) {
    events.shift();
  }

  const log = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  log(JSON.stringify(entry));
}

export function captureError(
  error: unknown,
  event: string,
  context: MobileLogContext = {}
): void {
  const message = error instanceof Error ? error.message : "Unknown error";
  logEvent("error", event, context, message);
}

export function getBufferedEvents(): MobileLogEvent[] {
  return [...events];
}
