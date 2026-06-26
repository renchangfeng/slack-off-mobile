# Mobile Asset Requirements

This document describes the asset format, dimensions, naming, and placement conventions for art that the mobile UI system will eventually consume. The current pixel-rest theme ships with **pseudo-pixel placeholders** (see `src/ui/components.tsx → PixelArtPlaceholder`); this file is the contract for swapping them with real artwork later.

## Kind → file path mapping

The four placeholder kinds correspond to four file paths under `assets/`:

| Kind | Default path | Consumed by |
|---|---|---|
| `bean` | `assets/beans/{theme}/{rarity}.png` | Bean collection gallery, draw result, showcase slots |
| `badge` | `assets/badges/{category}/{badgeId}.png` | Achievement unlock result, profile wall, leaderboard rows |
| `activity` | `assets/activities/{activityId}.png` | Activity preview card, history list |
| `character` | `assets/characters/{characterId}.png` | Profile avatar, empty state illustrations |

Where `{theme}` ∈ `{office, restroom, daydream}` and `{rarity}` ∈ `{common, rare, epic, legendary}`.

## Dimensions

All assets ship in a **2× base size** for retina display:

| Kind | Native size | Ship size | Aspect ratio |
|---|---|---|---|
| `bean` | 32×32 | 64×64 | 1:1 |
| `badge` | 48×48 | 96×96 | 1:1 |
| `activity` | 120×80 | 240×160 | 3:2 |
| `character` | 160×160 | 320×320 | 1:1 |

`PixelArtPlaceholder` accepts a `size` prop; the asset registry will scale the source file to that size at render time.

## Format requirements

- **Transparent PNG** — preferred for character, bean, badge, and activity illustrations. Alpha channel is required; white or solid backgrounds will look wrong against the warm-paper palette.
- **SVG** — preferred for icon glyphs, decorative borders, the home tab "stamp" marks, and any logo variants. SVG also works for activity frames if the source is geometric.
- **PSD** — accepted as **design source material only**. PSDs are not bundled in the app. The export pipeline must flatten and export to PNG/SVG before the file reaches `assets/`.

Color profile: sRGB. The pixel-rest palette is anchored on `#f4efe4` (paper) + `#17a36b` (primary mint). Artwork that depends on a non-paper background will not render correctly.

## Naming convention

```
{kind}_{theme?}_{category?}_{rarity?}_{variant?}.{ext}
```

Examples:
- `bean_office_common_01.png`
- `bean_restroom_legendary_03.png`
- `badge_streak_first-step.png`
- `activity_loading-actor_calm.png`
- `character_default_dev.png`

Rules:
- Lowercase, hyphens, no spaces.
- `theme` and `rarity` are required for beans; `category` is required for badges; `activityId` overrides the name; `variant` is an optional disambiguator.
- Don't include "v1" / "final" / "FINAL_FINAL" — version control handles history.

## How to add an asset

1. Drop the file under the matching `assets/...` path with the correct name.
2. Register the asset in `src/assets/registry.ts` (a flat object keyed by file path → `require()` or `Asset` reference).
3. The `PixelArtPlaceholder` primitive reads from the registry first, falls back to its built-in geometric shape if the file is missing.
4. Run the mobile typecheck and the UI Lab (`EXPO_PUBLIC_SHOW_UI_LAB=true npm start`) to visually confirm the new artwork.

Assets not referenced in the registry are not loaded. The bundle is tree-shaken via Metro at build time.

## Visual direction reference

The current pixel-rest theme is documented in `openspec/changes/redesign-mobile-pixel-rest-ui/` (proposal, design, audit, spec delta). New artwork should match the **soft pseudo-pixel** direction:
- Warm off-white background
- Mint green as the rest/energy signal
- Low-battery red, soft blue, amber, lilac as secondary state colors
- Bold readable Chinese labels, compact vertical rhythm
- Pixel-like borders, square-ish corners, subtle shadows
- Playful characters/illustrations (not corporate-flat)

If real pixel art is impractical, vector art with hard 1-2 px borders reads as "pseudo-pixel" and is acceptable.
