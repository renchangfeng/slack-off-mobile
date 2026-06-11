export function createRequestId(): string {
  return createId("req");
}

export function createTraceId(): string {
  return createId("trc");
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

