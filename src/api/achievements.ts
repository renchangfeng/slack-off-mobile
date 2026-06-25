import type { components } from "./generated";
import type { ApiClient, ApiEnvelope } from "./client";

export type AchievementList = components["schemas"]["AchievementList"];
export type Achievement = components["schemas"]["Achievement"];
export type AchievementRecommendation = components["schemas"]["AchievementRecommendation"];
export type CosmeticInventory = components["schemas"]["CosmeticInventory"];
export type OwnedCosmetic = components["schemas"]["OwnedCosmetic"];
export type CosmeticEquipResult = components["schemas"]["CosmeticEquipResult"];

export class AchievementApi {
  constructor(private readonly client: ApiClient) {}

  getAchievements(): Promise<ApiEnvelope<AchievementList>> {
    return this.client.get<AchievementList>("/v1/achievements");
  }

  getCosmetics(): Promise<ApiEnvelope<CosmeticInventory>> {
    return this.client.get<CosmeticInventory>("/v1/cosmetics");
  }

  equipCosmetic(id: string): Promise<ApiEnvelope<CosmeticEquipResult>> {
    return this.client.post<CosmeticEquipResult>(`/v1/cosmetics/${id}/equip`);
  }
}
