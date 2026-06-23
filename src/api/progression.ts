import type { components } from "./generated";
import type { ApiClient, ApiEnvelope } from "./client";

export type ProgressionSummary = components["schemas"]["ProgressionSummary"];
export type ProgressionGoal = components["schemas"]["ProgressionGoal"];

export class ProgressionApi {
  constructor(private readonly client: ApiClient) {}

  getSummary(): Promise<ApiEnvelope<ProgressionSummary>> {
    return this.client.get<ProgressionSummary>("/v1/progression/summary");
  }
}
