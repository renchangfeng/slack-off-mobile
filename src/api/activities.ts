import type { components } from "./generated";
import type { ApiClient, ApiEnvelope } from "./client";

export type ActivityAssignment = components["schemas"]["ActivityAssignment"];
export type ActivityCompleteResult = components["schemas"]["ActivityCompleteResult"];
export type ActivityCatalog = components["schemas"]["ActivityCatalog"];
export type ActivityCatalogItem = components["schemas"]["ActivityCatalogItem"];
export type ActivityHistory = components["schemas"]["ActivityHistory"];
export type ActivityInteractionProgress = components["schemas"]["ActivityInteractionProgress"];
export type ActivityCategory = ActivityCatalog["categories"][number];

export class ActivityApi {
  constructor(private readonly client: ApiClient) {}

  random(category?: ActivityCategory): Promise<ApiEnvelope<ActivityAssignment>> {
    return this.client.post<ActivityAssignment>(
      "/v1/activities/random",
      category ? { category } : undefined
    );
  }

  getCatalog(category?: ActivityCategory): Promise<ApiEnvelope<ActivityCatalog>> {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    return this.client.get<ActivityCatalog>(`/v1/activities/catalog${query}`);
  }

  getHistory(limit = 10): Promise<ApiEnvelope<ActivityHistory>> {
    return this.client.get<ActivityHistory>(`/v1/activities/history?limit=${limit}`);
  }

  complete(
    assignmentId: string,
    interaction: ActivityInteractionProgress
  ): Promise<ApiEnvelope<ActivityCompleteResult>> {
    return this.client.post<ActivityCompleteResult>(`/v1/activities/${assignmentId}/complete`, {
      interaction
    });
  }

  skip(assignmentId: string): Promise<ApiEnvelope<ActivityAssignment>> {
    return this.client.post<ActivityAssignment>(`/v1/activities/${assignmentId}/skip`);
  }
}
