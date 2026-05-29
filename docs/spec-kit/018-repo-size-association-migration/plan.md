# Plan

## Phase 1: Safe Public Asset Cleanup

1. Remove unused `CRAFTPIX_EXTERIOR_01..60`, `CRAFTPIX_INTERIOR_01..22`, and `CRAFTPIX_HOUSE_DETAIL_02..07` furniture slices.
2. Keep `CRAFTPIX_EXTERIOR_TEMPLE_HOUSE` because the compact editor layout references it.
3. Remove old generated `thronglets/mvp` frames and `thronglets/pet-sheets` source sheets from Git.
4. Remove generated `modern-taoyuan-scene-plan.json` and its local generation script from Git.
5. Add ignore rules for these local-only/generated assets.

## Phase 2: Local-Only Map Editing

1. Gate `?editor=1` behind `import.meta.env.DEV`.
2. Keep editor tools available in local Vite dev.
3. Hide non-working asset-directory controls outside local dev.
4. Verify public mode still starts normally.

## Phase 3: Association Rename

1. Wait for dirty `webview-ui/src/daydream/*` edits to be either committed or intentionally included.
2. Rename `webview-ui/src/daydream/` to `webview-ui/src/association/`.
3. Rename test files and script files with `daydream` in their filenames.
4. Update imports, npm scripts, visual guards, generated output names, and type names where practical.
5. Build and run tests.
6. Rename `obsidian-vault/daydream-export/` to `obsidian-vault/association-export/` only after runtime and wiki tooling read the new path.

## Phase 4: Data Weight Follow-Up

1. Measure `association-export` payload sizes.
2. Consider a runtime-only compact search index while keeping full source-card exports local/wiki-side.
3. Keep source-bounded evidence available for zines before deleting any data fields.
