import type { components } from "./generated";
import type { ApiClient, ApiEnvelope } from "./client";

export type ActivityAssignment = components["schemas"]["ActivityAssignment"];
export type ActivityCompleteResult = components["schemas"]["ActivityCompleteResult"];

export class ActivityApi {
  constructor(private readonly client: ApiClient) {}

  random(): Promise<ApiEnvelope<ActivityAssignment>> {
    return this.client.post<ActivityAssignment>("/v1/activities/random");
  }

  complete(assignmentId: string): Promise<ApiEnvelope<ActivityCompleteResult>> {
    return this.client.post<ActivityCompleteResult>(`/v1/activities/${assignmentId}/complete`);
  }
}
