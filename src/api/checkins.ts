import type { components } from "./generated";
import type { ApiClient, ApiEnvelope } from "./client";

export type CheckInSession = components["schemas"]["CheckInSession"];
export type CheckInFinishResult = components["schemas"]["CheckInFinishResult"];

export class CheckInApi {
  constructor(private readonly client: ApiClient) {}

  getActive(): Promise<ApiEnvelope<CheckInSession | null>> {
    return this.client.get<CheckInSession | null>("/v1/check-ins/active");
  }

  start(): Promise<ApiEnvelope<CheckInSession>> {
    return this.client.post<CheckInSession>("/v1/check-ins", {
      idempotencyKey: createIdempotencyKey("start")
    });
  }

  finish(sessionId: string): Promise<ApiEnvelope<CheckInFinishResult>> {
    return this.client.post<CheckInFinishResult>(`/v1/check-ins/${sessionId}/finish`, {
      idempotencyKey: createIdempotencyKey("finish")
    });
  }
}

function createIdempotencyKey(action: string): string {
  return `${action}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
