import type { components } from "./generated";
import type { ApiClient, ApiEnvelope } from "./client";

export type FishTankSummary = components["schemas"]["FishTankSummary"];
export type FishTankFish = components["schemas"]["FishTankFish"];
export type FishTankHatchAvailability = components["schemas"]["FishTankHatchAvailability"];
export type FishCollectionSummary = components["schemas"]["FishCollectionSummary"];
export type FishCollectionItem = components["schemas"]["FishCollectionItem"];
export type TankMood = components["schemas"]["TankMood"];
export type DecorationsSummary = components["schemas"]["DecorationsSummary"];
export type EquippedDecoration = components["schemas"]["EquippedDecoration"];
export type DecorationInventoryItem = components["schemas"]["DecorationInventoryItem"];
export type CareInteractionRequest = components["schemas"]["CareInteractionRequest"];
export type CareInteractionResult = components["schemas"]["CareInteractionResult"];
export type HatchRequest = components["schemas"]["HatchRequest"];
export type HatchResult = components["schemas"]["HatchResult"];
export type EquipDecorationRequest = components["schemas"]["EquipDecorationRequest"];
export type EquipDecorationResult = components["schemas"]["EquipDecorationResult"];
export type DisplayedFishReorderRequest = components["schemas"]["DisplayedFishReorderRequest"];
export type DisplayedFishReorderResult = components["schemas"]["DisplayedFishReorderResult"];
export type FishTankCareError = components["schemas"]["FishTankCareError"];
export type FishTankResourceOutcome = components["schemas"]["FishTankResourceOutcome"];
export type FishTankResourceType = components["schemas"]["FishTankResourceType"];

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
      idempotencyKey: createFishTankIdempotencyKey(`fish_tank_${interactionType}`)
    });
  }

  hatch(idempotencyKey: string): Promise<ApiEnvelope<HatchResult>> {
    return this.client.post<HatchResult>("/v1/fish-tank/hatch", {
      idempotencyKey
    });
  }

  equipDecoration(
    slot: EquipDecorationRequest["slot"],
    decorationDefinitionId: EquipDecorationRequest["decorationDefinitionId"],
    idempotencyKey: string
  ): Promise<ApiEnvelope<EquipDecorationResult>> {
    return this.client.post<EquipDecorationResult>("/v1/fish-tank/decorations/equip", {
      slot,
      decorationDefinitionId,
      idempotencyKey
    });
  }

  reorderDisplayedFish(
    displayedFishIds: DisplayedFishReorderRequest["displayedFishIds"]
  ): Promise<ApiEnvelope<DisplayedFishReorderResult>> {
    return this.client.post<DisplayedFishReorderResult>("/v1/fish-tank/displayed-fish/reorder", {
      displayedFishIds,
      idempotencyKey: createFishTankIdempotencyKey("fish_tank_reorder")
    });
  }
}

export function createFishTankIdempotencyKey(action: string): string {
  return `${action}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
