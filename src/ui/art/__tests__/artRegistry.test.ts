import { describe, expect, it } from "vitest";
import {
  calmOfficeTheme,
  pixelRestTheme
} from "../../theme/themes";
import {
  artAssets,
  artSlotDefinitions,
  getArtSlotDefinition,
  listArtSlotDefinitions,
  listArtAssetsForTheme,
  resolveArtAsset
} from "../registry";
import type { ArtSlotId } from "../types";

describe("art registry", () => {
  it("defines a slot for every known production surface", () => {
    const slots = listArtSlotDefinitions();
    expect(slots.length).toBeGreaterThanOrEqual(5);

    const ids = slots.map((slot) => slot.id);
    expect(ids).toContain("home-check-in-character");
    expect(ids).toContain("activities-card-illustration");
    expect(ids).toContain("bean-gallery-item");
    expect(ids).toContain("achievement-badge");
    expect(ids).toContain("empty-state-generic");
  });

  it("requires every slot to carry stable layout metadata", () => {
    for (const slot of listArtSlotDefinitions()) {
      expect(slot.kind).toBeTruthy();
      expect(slot.defaultSize).toBeGreaterThan(0);
      expect(slot.aspectRatio).toBeGreaterThan(0);
      expect(slot.fallbackGlyph).toBeTruthy();
      expect(slot.alt).toBeTruthy();
    }
  });

  it("resolves a theme-specific asset when available", () => {
    const asset = resolveArtAsset(
      pixelRestTheme.id,
      "home-check-in-character"
    );
    expect(asset.themeId).toBe(pixelRestTheme.id);
    expect(asset.slotId).toBe("home-check-in-character");
    expect(asset.fallbackGlyph).toBeTruthy();
  });

  it("resolves a different theme-specific asset for calm-office", () => {
    const asset = resolveArtAsset(
      calmOfficeTheme.id,
      "home-check-in-character"
    );
    expect(asset.themeId).toBe(calmOfficeTheme.id);
    expect(asset.fallbackGlyph).not.toBe(
      resolveArtAsset(pixelRestTheme.id, "home-check-in-character").fallbackGlyph
    );
  });

  it("falls back to the default asset when the active theme has no override", () => {
    const asset = resolveArtAsset(
      calmOfficeTheme.id,
      "achievement-badge"
    );
    expect(asset.themeId).toBeUndefined();
    expect(asset.slotId).toBe("achievement-badge");
  });

  it("falls back to the slot definition for unknown slots", () => {
    const asset = resolveArtAsset(
      pixelRestTheme.id,
      "empty-state-generic"
    );
    expect(asset.slotId).toBe("empty-state-generic");
    expect(asset.fallbackGlyph).toBe(
      getArtSlotDefinition("empty-state-generic").fallbackGlyph
    );
  });

  it("falls back safely when an invalid slot id reaches the registry", () => {
    const asset = resolveArtAsset(
      pixelRestTheme.id,
      "unknown-slot" as ArtSlotId
    );
    expect(asset.slotId).toBe("empty-state-generic");
    expect(asset.fallbackGlyph).toBe(
      getArtSlotDefinition("empty-state-generic").fallbackGlyph
    );
  });

  it("never returns an asset without required metadata", () => {
    for (const slot of listArtSlotDefinitions()) {
      const asset = resolveArtAsset(pixelRestTheme.id, slot.id);
      expect(asset.kind).toBeTruthy();
      expect(asset.aspectRatio).toBeGreaterThan(0);
      expect(asset.fallbackGlyph).toBeTruthy();
      expect(asset.alt).toBeTruthy();
    }
  });

  it("lists a resolved asset for every slot in a theme", () => {
    const assets = listArtAssetsForTheme(calmOfficeTheme.id);
    expect(assets.length).toBe(listArtSlotDefinitions().length);
    for (const asset of assets) {
      expect(asset.slotId).toBeTruthy();
      expect(asset.fallbackGlyph).toBeTruthy();
    }
  });

  it("keeps placeholder metadata for all priority slots instead of real assets", () => {
    const prioritySlots: ArtSlotId[] = [
      "home-check-in-character",
      "activities-card-illustration",
      "bean-gallery-item",
      "bean-showcase-slot",
      "achievement-badge"
    ];
    for (const slotId of prioritySlots) {
      const matching = artAssets.filter((asset) => asset.slotId === slotId);
      expect(matching.length).toBeGreaterThan(0);
      for (const asset of matching) {
        expect(asset.source).toBeUndefined();
      }
    }
  });

  it("exposes slot definitions by id", () => {
    const slot = getArtSlotDefinition("bean-gallery-item");
    expect(slot.id).toBe("bean-gallery-item");
    expect(artSlotDefinitions["bean-gallery-item"]).toBe(slot);
  });
});
