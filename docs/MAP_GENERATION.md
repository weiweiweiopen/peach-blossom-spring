# 桃花源室內森林地圖生成 / Map Generation

## Current stamp-based method

`webview-ui/src/world/peachBlossomWorld.ts` now uses a deterministic stamp generator. `createIndoorPeachBlossomUtopiaLayout(seed)` creates a mixed indoor floor, greenhouse canopy, river, bridge, peach forest, village, archive tree, restaurant/teahouse, open tech lab, temple, church, and workshop clearing.

The fast workflow is:

1. Paint broad terrain with `paintRiver`, `paintPath`, `paintIndoorWaterGarden`, `stampMountainBand`, and `stampIndoorCanopy`.
2. Drop buildings with `stampHouse`, `stampRestaurantTeaHouse`, `stampOpenTechLab`, `stampTemple`, and `stampChurch`.
3. Scatter living decoration with `scatterPeachTrees` / `stampOrchard` using a seed.
4. Call `applyCollisionForWaterAndBuildings` semantics through the generated `collision` array: water, mountains, and building walls block walking; bridges, paths, and doors stay walkable.

## Adding a building stamp

Add a new `BuildingType`, create a row template in `makeBuilding`, and include its type in `buildingStamps`. Use `#` for solid walls, `.` for interior floor, and `d` for a walkable door/path tile.

## Adding a zone

Append a `WorldZone` to `tamagotchiPeachForestZones` with a stable `id`, `bounds`, `kind`, and bilingual description. NPCs can then reference the zone through `tamagotchiNpcPlacements`.

## Adjusting terrain

- Peach density: change the density argument in `scatterPeachTrees(area, density, seed, furniture)`.
- River: edit the point list passed to `paintRiver(points, width, ctx)`.
- Bridge: move `stampBridge(col, row, ctx)` so it overlaps river tiles that should become walkable.
- Paths: add or adjust `paintPath(points, width, ctx)` polylines.

## Future Tiled / WorkAdventure pipeline

This repo currently renders a TypeScript layout directly, so the stamp-based generator is the safest static GitHub Pages path. A future TMJ export can map:

- `zones` -> Tiled object layer `zones`
- `collision` -> tile layer `collisions`
- `tamagotchiNpcPlacements` -> object layer `npcSpawn`
- building stamps -> Tiled templates / object layer `buildings`
- river/path terrain -> Tiled terrain brush and Automapping rules

Recommended future workflow: generate a first draft with the stamp generator, export to TMJ, refine edges with Tiled Terrain Brush, run Automapping for tree canopies/roof/collisions/water banks, then import or keep generated TMJ synchronized.

## Asset rule

Do not use unlicensed Thronglets, Netflix, Black Mirror, screenshots, watermarks, or logo assets. All lifeforms are original code-generated yellow/blue square-eyed sprites.
