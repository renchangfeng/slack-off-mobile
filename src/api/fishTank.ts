import type { components } from "./generated";
import type { ApiClient, ApiEnvelope } from "./client";

export type FishTankSummary = components["schemas"]["FishTankSummary"];
export type FishTankFish = components["schemas"]["FishTankFish"];
export type CareInteractionRequest = components["schemas"]["CareInteractionRequest"];
export type CareInteractionResult = components["schemas"]["CareInteractionResult"];

export class FishTankApi {
  constructor(private readonly client: ApiClient) {}

  getSummary(): Promise<ApiEnvelope<FishTankSummary>> {
    return this.client.get<FishTankSummary>("/v1/fish-tank");
  }

  initializeTank(): Promise<ApiEnvelope<FishTankSummary>> {
    return this.client.post<FishTankSummary>("/v1/fish-tank/initialize");
  }

  interact(interactionType: CareInteractionRequest["interactionType"]): Promise<ApiEnvelope<CareInteractionResult>> {
    return this.client.post<CareInteractionResult>("/v1/fish-tank/interactions", {
      interactionType,
      idempotencyKey: createIdempotencyKey(`fish_tank_${interactionType}`)
    });
  }
}

function createIdempotencyKey(action: string): string {
  return `${action}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
