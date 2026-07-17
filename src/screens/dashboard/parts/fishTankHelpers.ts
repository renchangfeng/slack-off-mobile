import type {
  CareInteractionResult,
  DecorationInventoryItem,
  EquipDecorationResult,
  FishTankFish,
  FishTankSummary,
  HatchResult,
  TankMood
} from "../../../api/fishTank";

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

export type DecorSlotGroup = {
  slot: string;
  label: string;
  equipped: DecorationInventoryItem | null;
  items: DecorationInventoryItem[];
};

export const SLOT_LABELS: Record<string, string> = {
  background: "背景",
  plant: "水草",
  prop: "小景",
  ambient: "水景"
};

export function deriveDecorSlotGroups(summary: FishTankSummary | null): DecorSlotGroup[] {
  if (!summary?.decorations?.inventory) {
    return [];
  }

  const bySlot = new Map<string, DecorationInventoryItem[]>();
  for (const item of summary.decorations.inventory) {
    const list = bySlot.get(item.type) ?? [];
    list.push(item);
    bySlot.set(item.type, list);
  }

  const equippedBySlot = new Map<string, DecorationInventoryItem>();
  for (const item of summary.decorations.equipped) {
    const inventoryItem = summary.decorations.inventory.find((i) => i.definitionId === item.definitionId) ?? null;
    if (inventoryItem) {
      equippedBySlot.set(item.slot, { ...inventoryItem, equipped: true, slot: item.slot });
    } else {
      equippedBySlot.set(item.slot, {
        definitionId: item.definitionId,
        code: item.code,
        name: item.name,
        type: item.type,
        rarity: item.rarity,
        artKey: item.artKey,
        unlockHint: "",
        owned: true,
        equipped: true,
        slot: item.slot
      });
    }
  }

  return ["background", "plant", "prop", "ambient"].map((slot) => ({
    slot,
    label: SLOT_LABELS[slot] ?? slot,
    equipped: equippedBySlot.get(slot) ?? null,
    items: (bySlot.get(slot) ?? []).sort((a, b) => Number(b.owned) - Number(a.owned) || a.code.localeCompare(b.code))
  }));
}

export function deriveDecorItemAction(item: DecorationInventoryItem): {
  actionable: boolean;
  actionLabel: string;
  state: "equipped" | "owned" | "locked";
} {
  if (item.equipped) {
    return { actionable: false, actionLabel: "已装备", state: "equipped" };
  }
  if (item.owned) {
    return { actionable: true, actionLabel: "装备", state: "owned" };
  }
  return { actionable: false, actionLabel: "未解锁", state: "locked" };
}

export function deriveMoodPresentation(mood: TankMood | null | undefined) {
  if (!mood) {
    return {
      code: "idle",
      title: "一起发呆",
      copy: "小鱼游得很慢，看起来对 KPI 没有意见。",
      ambientArtKey: "tank-mood-idle"
    };
  }
  return {
    code: mood.code,
    title: mood.title,
    copy: mood.copy,
    ambientArtKey: mood.ambientArtKey
  };
}

export type PrimaryAction =
  | { kind: "feed"; available: boolean; cooldownSeconds: number }
  | { kind: "bubble"; available: boolean; cooldownSeconds: number }
  | { kind: "hatch"; available: boolean }
  | { kind: "companionship"; available: true };

export function derivePrimaryAction(summary: FishTankSummary | null): PrimaryAction {
  if (!summary || !summary.initialized) {
    return { kind: "companionship", available: true };
  }
  const feed = summary.careAvailability.feed;
  const bubble = summary.careAvailability.bubble;
  const feedCost = summary.costs?.feed ?? 1;
  const bubbleCost = summary.costs?.bubble ?? 1;
  const feedResourced = hasResource(summary, "food") >= feedCost;
  const bubbleResourced = hasResource(summary, "bubble") >= bubbleCost;
  if (feed?.available && feedResourced) {
    return { kind: "feed", available: true, cooldownSeconds: 0 };
  }
  if (bubble?.available && bubbleResourced) {
    return { kind: "bubble", available: true, cooldownSeconds: 0 };
  }
  if (summary.hatchAvailability?.available) {
    return { kind: "hatch", available: true };
  }
  return { kind: "companionship", available: true };
}

export function deriveActionButtonLabel(action: PrimaryAction, nowMs: number, receivedAtMs: number): string {
  if (action.kind === "feed") {
    if (action.available) return "投喂小鱼";
    const seconds = calculateLiveCooldownSecondsFromValues(action.cooldownSeconds, nowMs, receivedAtMs);
    return `投喂冷却 ${formatCooldownCompact(seconds)}`;
  }
  if (action.kind === "bubble") {
    if (action.available) return "吹个气泡";
    const seconds = calculateLiveCooldownSecondsFromValues(action.cooldownSeconds, nowMs, receivedAtMs);
    return `气泡冷却 ${formatCooldownCompact(seconds)}`;
  }
  if (action.kind === "hatch") {
    return "孵化新邻居";
  }
  return "一起发呆";
}

export function deriveResourceBalance(summary: FishTankSummary | null): {
  food: number;
  bubble: number;
  hatchProgress: number;
} {
  if (!summary?.resourceSummary?.resources) {
    return { food: 0, bubble: 0, hatchProgress: 0 };
  }
  const find = (type: string) => summary.resourceSummary!.resources.find((r) => r.resourceType === type)?.quantity ?? 0;
  return {
    food: find("food"),
    bubble: find("bubble"),
    hatchProgress: find("hatch_progress")
  };
}

export function hasResource(summary: FishTankSummary | null, resourceType: "food" | "bubble" | "hatch_progress"): number {
  const balances = deriveResourceBalance(summary);
  if (resourceType === "hatch_progress") return balances.hatchProgress;
  return balances[resourceType];
}

export function deriveResourceGuidance(summary: FishTankSummary | null): {
  foodSourceLabel: string;
  bubbleSourceLabel: string;
} {
  const guidance = summary?.guidance;
  return {
    foodSourceLabel: guidance?.foodSource === "collection" ? "去收藏换" : "去抽豆",
    bubbleSourceLabel: guidance?.bubbleSource === "collection" ? "去收藏换" : "去抽豆"
  };
}

export function formatCooldownCompact(totalSeconds: number): string {
  if (totalSeconds <= 0) return "即可";
  if (totalSeconds < 60) return `${totalSeconds} 秒`;
  if (totalSeconds < 3600) return `${Math.ceil(totalSeconds / 60)} 分`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.ceil((totalSeconds % 3600) / 60);
  return minutes > 0 ? `${hours} 时 ${minutes} 分` : `${hours} 时`;
}

export function calculateLiveCooldownSecondsFromValues(
  cooldownRemainingSeconds: number,
  nowMs: number,
  receivedAtMs: number
): number {
  const elapsedSeconds = Math.floor((nowMs - receivedAtMs) / 1000);
  return Math.max(0, cooldownRemainingSeconds - elapsedSeconds);
}

export function deriveDisplayedFishSlots(summary: FishTankSummary | null): FishTankFish[] {
  if (!summary?.initialized || !summary.displayedFish) {
    return [];
  }
  return summary.displayedFish.slice(0, 3);
}

export function deriveEligibleFishForPicker(summary: FishTankSummary | null): FishTankFish[] {
  if (!summary?.initialized || !summary.eligibleFish) {
    return [];
  }
  return summary.eligibleFish;
}

export function derivePickerCapacityLabel(selectedCount: number): string {
  return `${Math.min(3, selectedCount)}/3`;
}

export function companionshipLine(): string {
  const lines = [
    "你和鱼缸同时静止了一秒。",
    "小鱼没说什么，但水面平静了一点。",
    "假装两个人都在认真工作。",
    "这一刻没有进度条，也挺好。"
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

export function deriveCareResultPresentation(result: CareInteractionResult | null) {
  if (!result) {
    return null;
  }
  return {
    title: result.resultCopy,
    replayed: result.replayed,
    outcomeCode: result.outcomeCode,
    resourceType: result.resourceType,
    cost: result.cost,
    resourceBalance: result.resourceBalance
  };
}

export function deriveEquipResultPresentation(result: EquipDecorationResult | null) {
  if (!result) {
    return null;
  }
  return {
    title: result.resultTitle,
    copy: result.resultCopy,
    replayed: result.replayed,
    outcomeCode: result.outcomeCode,
    equippedName: result.equipped.name,
    equippedSlot: result.equipped.slot,
    equippedArtKey: result.equipped.artKey
  };
}
