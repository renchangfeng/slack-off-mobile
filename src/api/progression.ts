import type { components } from "./generated";
import type { ApiClient, ApiEnvelope } from "./client";

export type ProgressionSummary = components["schemas"]["ProgressionSummary"];
export type ProgressionGoal = components["schemas"]["ProgressionGoal"];
export type ProgressionGoalPeriod = components["schemas"]["ProgressionGoalPeriod"];
export type ProgressionClaimResult = components["schemas"]["ProgressionClaimResult"];
export type ProgressionPeriod = ProgressionGoalPeriod["period"];

export class ProgressionApi {
  constructor(private readonly client: ApiClient) {}

  getSummary(): Promise<ApiEnvelope<ProgressionSummary>> {
    return this.client.get<ProgressionSummary>("/v1/progression/summary");
  }

  claim(period: ProgressionPeriod): Promise<ApiEnvelope<ProgressionClaimResult>> {
    return this.client.post<ProgressionClaimResult>(`/v1/progression/${period}/claim`);
  }
}
