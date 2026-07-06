import type { components, paths } from "./generated";
import type { ApiClient, ApiEnvelope } from "./client";

export type ActivityAssignment = components["schemas"]["ActivityAssignment"];
export type ActivityCompleteResult = components["schemas"]["ActivityCompleteResult"];
export type ActivityCatalog = components["schemas"]["ActivityCatalog"];
export type ActivityCatalogItem = components["schemas"]["ActivityCatalogItem"];
export type ActivityHistory = components["schemas"]["ActivityHistory"];
export type ActivityHistorySession = components["schemas"]["ActivityHistorySession"];
export type ActivityReplayHint = components["schemas"]["ActivityReplayHint"];
export type ActivityInteractionProgress = components["schemas"]["ActivityInteractionProgress"];
export type ActivityPresentation = components["schemas"]["ActivityPresentation"];
export type ActivitySkipReason = components["schemas"]["ActivitySkipReason"];
export type ActivityFeedbackRequest = components["schemas"]["ActivityFeedbackRequest"];
export type ActivityFeedbackResponse = components["schemas"]["ActivityFeedbackResponse"];
export type ActivityFeedbackType = components["schemas"]["ActivityFeedbackType"];
export type ActivityCategory = ActivityCatalog["categories"][number];

export type ActivityRandomRequest = NonNullable<
  paths["/v1/activities/random"]["post"]["requestBody"]
>["content"]["application/json"];

export class ActivityApi {
  constructor(private readonly client: ApiClient) {}

  random(request: ActivityRandomRequest = {}): Promise<ApiEnvelope<ActivityAssignment>> {
    return this.client.post<ActivityAssignment>("/v1/activities/random", request);
  }

  getCatalog(category?: ActivityCategory): Promise<ApiEnvelope<ActivityCatalog>> {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    return this.client.get<ActivityCatalog>(`/v1/activities/catalog${query}`);
  }

  getHistory(params?: { window?: "today" | "recent"; limit?: number; cursor?: string }): Promise<ApiEnvelope<ActivityHistory>> {
    const search = new URLSearchParams();
    if (params?.window) search.set("window", params.window);
    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.cursor) search.set("cursor", params.cursor);
    const query = search.toString();
    return this.client.get<ActivityHistory>(`/v1/activities/history${query ? `?${query}` : ""}`);
  }

  complete(
    assignmentId: string,
    interaction: ActivityInteractionProgress
  ): Promise<ApiEnvelope<ActivityCompleteResult>> {
    return this.client.post<ActivityCompleteResult>(`/v1/activities/${assignmentId}/complete`, {
      interaction
    });
  }

  submitFeedback(
    assignmentId: string,
    feedback: ActivityFeedbackRequest
  ): Promise<ApiEnvelope<ActivityFeedbackResponse>> {
    return this.client.post<ActivityFeedbackResponse>(
      `/v1/activities/${assignmentId}/feedback`,
      feedback
    );
  }

  skip(
    assignmentId: string,
    reason?: ActivitySkipReason
  ): Promise<ApiEnvelope<ActivityAssignment>> {
    return this.client.post<ActivityAssignment>(
      `/v1/activities/${assignmentId}/skip`,
      reason ? { reason } : undefined
    );
  }
}
