import type {
  DecorationInventoryItem,
  EquipDecorationResult,
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
