import type { components } from "./generated";
import type { ApiClient, ApiEnvelope } from "./client";

export type LeaderboardWindow = components["schemas"]["LeaderboardResponse"]["window"];
export type LeaderboardResponse = components["schemas"]["LeaderboardResponse"];
export type LeaderboardScope = "global" | "friends" | "squad" | "company";

export class LeaderboardApi {
  constructor(private readonly client: ApiClient) {}

  getLeaderboard(
    window: LeaderboardWindow,
    scope: LeaderboardScope = "global",
    limit = 10
  ): Promise<ApiEnvelope<LeaderboardResponse>> {
    return this.client.get<LeaderboardResponse>(
      `/v1/leaderboards?window=${encodeURIComponent(window)}&scope=${encodeURIComponent(scope)}&limit=${limit}`
    );
  }
}
