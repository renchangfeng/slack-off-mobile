import type { FishTankSummary, HatchResult } from "../../../api/fishTank";

export type HatchUiState =
  | { kind: "uninitialized" }
  | { kind: "insufficient"; current: number; cost: number; missing: number }
  | { kind: "ready"; current: number; cost: number }
  | { kind: "complete"; owned: number; total: number }
  | { kind: "loading" };

export function deriveHatchUiState(summary: FishTankSummary | null, loading: boolean): HatchUiState {
  if (loading) {
    return { kind: "loading" };
  }
  if (!summary || !summary.initialized) {
    return { kind: "uninitialized" };
  }
  const availability = summary.hatchAvailability;
  if (!availability) {
    return { kind: "insufficient", current: 0, cost: 3, missing: 3 };
  }
  if (availability.reason === "catalog_complete") {
    const collection = summary.collection ?? { owned: 0, total: 0 };
    return { kind: "complete", owned: collection.owned, total: collection.total };
  }
  if (availability.available) {
    return { kind: "ready", current: availability.currentProgress, cost: availability.cost };
  }
  return {
    kind: "insufficient",
    current: availability.currentProgress,
    cost: availability.cost,
    missing: availability.missingProgress
  };
}

export function deriveHatchProgressLabel(state: HatchUiState): string {
  if (state.kind === "ready") {
    return `${state.current}/${state.cost} 可孵化`;
  }
  if (state.kind === "insufficient") {
    return `${state.current}/${state.cost} 孵化进度`;
  }
  if (state.kind === "complete") {
    return "图鉴已集齐";
  }
  if (state.kind === "uninitialized") {
    return "先放入第一条小鱼";
  }
  return "加载中…";
}

export function deriveHatchButtonLabel(state: HatchUiState): string {
  if (state.kind === "loading") {
    return "孵化中…";
  }
  if (state.kind === "ready") {
    return "孵化新邻居";
  }
  if (state.kind === "complete") {
    return "图鉴已完成";
  }
  if (state.kind === "insufficient") {
    return `还差 ${state.missing} 进度`;
  }
  return "先初始化鱼缸";
}

export function deriveHatchResultPresentation(result: HatchResult | null) {
  if (!result) {
    return null;
  }
  const fish = result.discoveredFish;
  return {
    title: result.resultTitle,
    copy: result.resultCopy,
    nextHint: result.nextHint,
    replayed: result.replayed,
    cost: result.cost,
    outcomeCode: result.outcomeCode,
    fishName: fish?.name ?? null,
    fishRarity: fish?.rarity ?? null,
    fishPersonality: fish?.personality ?? null,
    fishArtKey: fish?.artKey ?? "fish-tank-fish"
  };
}

export function deriveCollectionPreview(summary: FishTankSummary | null): Array<{
  definitionId: string;
  owned: boolean;
  name: string | null;
  sourceHint: string;
}> {
  if (!summary?.collection?.items) {
    return [];
  }
  return summary.collection.items.map((item) => ({
    definitionId: item.definitionId,
    owned: item.owned,
    name: item.name ?? null,
    sourceHint: item.sourceHint
  }));
}
