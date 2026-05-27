# Spec 011: Compact 32x32 Editor Map And Asset Ingestion

Status: planning

Deployment note: this work must preserve the public Peach Blossom Spring flow. The compact map and asset-import workflow are for editor/development mode first, not a public gameplay redesign unless explicitly promoted later.

## Problem

The current Peach Blossom Spring scene is too large for layout editing. The editor opens on a wide map, making furniture placement slow and visually noisy. The original pixel office editor also exposes menu items such as `Add Asset Directory`, but on GitHub Pages those actions cannot access local folders or write back to the repository.

The user wants to add CraftPix `Main Character's Home` assets. Those assets are mostly spritesheets such as `exterior.png`, `Interior.png`, and `walls_floor.png`, not individual furniture PNG files. The current PBS asset pipeline expects individual object PNGs plus `manifest.json` files, so the spritesheets cannot be dropped in directly as placeable furniture.

## Required Outcomes

### 1. Compact 32x32 Editor Scene

- Add a `32x32` compact editor scene for `?editor=1`.
- The compact scene should make layout editing practical on laptop screens.
- The normal public Peach Blossom Spring map must not shrink unless explicitly requested later.
- The compact scene should preserve enough gameplay landmarks for orientation:
  - player spawn
  - PBS Computer or a placeholder edit anchor
  - walkable floor area
  - a small test wall/furniture area
- Avoid placing characters/HUDs in ways that block the editor.

### 2. Preserve Existing Game Compatibility

- Normal URL `/` keeps current map size and current gameplay behavior.
- `?editor=1` may use the compact `32x32` layout.
- Existing procedural `createPeachBlossomLayout()` should remain available for the public scene.
- Character placement must not crash if saved positions exceed compact bounds; editor mode should clamp or use editor-specific spawn positions.
- Camera pan/zoom must still work with smaller bounds.

### 3. Clarify Asset Import Reality

- `Add Asset Directory` is an original webview/editor affordance and does not work on GitHub Pages because browsers cannot read arbitrary local folders or commit files back to the repo.
- For this project, new assets should be added through the repository asset pipeline:
  - copy PNG into `webview-ui/public/assets/furniture/<ASSET_ID>/<ASSET_ID>.png`
  - add `webview-ui/public/assets/furniture/<ASSET_ID>/manifest.json`
  - ensure browser mock / asset loader sees the asset directory
  - run build/visual checks
  - commit/push/deploy
- Optional later feature: add a browser-only import tool that accepts dropped image files and exports generated manifest JSON, but it still cannot write to GitHub Pages by itself.

### 4. CraftPix Spritesheet Processing

- CraftPix `exterior.png` is a spritesheet (`240x800` in the user's screenshot), not a single placeable object.
- It cannot be used as one furniture item unless intentionally treated as one giant decorative image, which is not useful for map editing.
- Required pipeline:
  1. identify the tile/object grid size, likely `16x16` or `32x32` depending on the sheet.
  2. slice out individual objects or tiles.
  3. remove transparent padding only when it does not break tile alignment.
  4. name each object with stable IDs, e.g. `CRAFTPIX_TREE_SMALL`, `CRAFTPIX_WELL`, `CRAFTPIX_FENCE_H`.
  5. create one manifest per placeable furniture object.
  6. classify each as `decor`, `wall`, `storage`, `misc`, etc.
  7. define `footprintW` / `footprintH` for collision and placement.

### 5. First Asset Import Target

- Start with 3-5 simple CraftPix objects, not the full pack:
  - one tree or bush from `exterior.png`
  - one fence segment
  - one house/detail object if it fits a clean footprint
  - one interior furniture object from `Interior.png`
- Validate they appear in the editor palette and can be placed on the compact map.

## Existing Asset Format

Example from `DOUBLE_BOOKSHELF`:

```json
{
  "id": "DOUBLE_BOOKSHELF",
  "name": "Double Bookshelf",
  "category": "wall",
  "type": "asset",
  "canPlaceOnWalls": true,
  "canPlaceOnSurfaces": false,
  "backgroundTiles": 0,
  "width": 32,
  "height": 32,
  "footprintW": 2,
  "footprintH": 2
}
```

New CraftPix object folders should match this shape.

## Proposed Implementation

### Phase 1: Compact Editor Layout

- Add `createCompactEditorLayout()` or similar in `webview-ui/src/world/peachBlossomWorld.ts`.
- Use `cols = 32`, `rows = 32`.
- Keep the public layout path unchanged.
- In `App.tsx`, choose compact layout only when `editorEntryEnabled` is true, if the current architecture allows local layout selection without disrupting the extension message loader.
- If layout is loaded from `default-layout-modern-taoyuan.json`, add a separate `default-layout-editor-32.json` instead.

### Phase 2: Asset Slicing Script

- Add a small script under `webview-ui/scripts/` for local development:
  - input: source spritesheet path
  - input: crop rectangles or grid config
  - output: furniture folders with PNG + manifest
- Prefer explicit crop metadata for the first pass instead of automatic object detection, because spritesheets often contain adjacent objects with shadows.

### Phase 3: First CraftPix Asset Batch

- Slice 3-5 objects manually or through the script.
- Add manifests.
- Confirm they appear in the editor `Furniture` palette.
- Place one object on the `32x32` editor scene.

## Non-Goals

- Do not import the entire CraftPix pack at once.
- Do not make GitHub Pages write local files.
- Do not change public scene dimensions in this step.
- Do not use full spritesheets as giant furniture unless creating a deliberate background/tileset layer.
- Do not replace existing PBS furniture assets.

## Verification

### Static Guards

- Public map path remains unchanged without `?editor=1`.
- Compact editor layout is gated behind editor mode.
- New CraftPix furniture manifests include `id`, `category`, `width`, `height`, `footprintW`, and `footprintH`.

### Browser Smoke Tests

- Open `/`: public scene is unchanged.
- Open `/?editor=1` and press `PRESS START`:
  - scene bounds are compact (`32x32`).
  - editor toolbar is visible.
  - `Layout` opens editor tools.
  - `Furniture` palette includes existing assets such as `DOUBLE_BOOKSHELF`.
  - after first import batch, CraftPix test assets appear in the palette.

### Commands

- `npm --prefix webview-ui run check:visual-layout`
- `npm --prefix webview-ui run build`

## Open Questions

- Should the compact `32x32` editor layout be saved as JSON or generated procedurally?
- Which CraftPix sheet should be imported first: `exterior.png`, `Interior.png`, or `walls_floor.png`?
- Do we want CraftPix objects as furniture only, or also floor/wall tiles?
- Should editor-mode saves remain temporary on GitHub Pages, or should we add an explicit `Export Layout JSON` path?
