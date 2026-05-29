# Spec 018: Repo Size Cleanup And Association Migration

Status: active implementation

## Goal

Reduce repository weight and browser startup work without damaging the public Peach Blossom Spring game. Finish the terminology migration from legacy `daydream` names to `association` names through a staged, validated path.

## Current Size Baseline

- Workspace checkout: about `314M`.
- `webview-ui/node_modules`: about `177M`, local dependency cache only.
- `dist`: about `19M`, generated build output and already ignored.
- `obsidian-vault/daydream-export`: about `28M`, source-card export used by runtime search and zine generation.
- `webview-ui/public/assets`: about `9.4M`, public runtime assets.
- Git object database: about `25.75 MiB` packed.

## Requirements

1. Remove public assets that are not referenced by the current public map, compact editor map, tests, or runtime code.
2. Keep source packs, generated proof sheets, screenshots, and test output local-only through `.gitignore` rather than committing them.
3. Keep the public GitHub Pages game loading the official committed map from `webview-ui/public/assets/pbs-editor-layout.json`.
4. Make map editing tools local-dev only. Public GitHub Pages should not expose a working `?editor=1` editing mode.
5. Rename legacy `daydream` file and folder names to `association` only through build-verified steps. Do not mix a mass rename with unrelated dirty edits.
6. Preserve existing public wording: `association / 聯想` is the public term; backend names should not leak into zine body text.

## Non-Goals

- Do not delete source evidence or reviewed wiki artifacts.
- Do not remove the committed public map.
- Do not rewrite generated zine semantics while doing repository cleanup.
- Do not rewrite Git history or use destructive history cleanup unless explicitly approved later.

## Daydream To Association Migration Contract

The migration has three layers:

1. Public terminology: already uses `association / 聯想`; keep it.
2. Runtime code paths: rename `webview-ui/src/daydream/` to `webview-ui/src/association/`, update imports, test names, script names, and guard checks in one isolated commit.
3. Data export paths: rename `obsidian-vault/daydream-export/` only after runtime imports and wiki tooling can read the new `association-export` path. Do not rename this data folder in the same commit as unrelated source edits.

Temporary compatibility aliases are allowed only inside one migration commit if needed for build stability. Remove aliases before declaring migration complete.

## Cleanup Rules

- Safe to remove from repo when no runtime reference exists: unused sliced furniture directories, old generated pet sheets, old MVP sprite frames, generated scene-plan JSON, and local generation scripts.
- Keep locally ignored: source spritesheet packs, Playwright/test artifacts, generated proof outputs, local editor exports, and regenerated experimental furniture slices.
- Keep in repo: current public map JSON, active furniture referenced by layouts, home-pet boot assets, active pet animation frame folders, campfire frames, and wiki source-card exports until a lighter data format replaces them.

## Acceptance Criteria

- `npm --prefix webview-ui run build` passes.
- `npm --prefix webview-ui run check:visual-layout` passes or is updated to the new association paths.
- Public `/peach-blossom-spring/` still loads the game map.
- Public `?editor=1` does not enter editing mode; local dev `?editor=1` still can.
- `daydream` no longer appears in tracked file names after the staged migration is complete, except historical docs that explicitly describe legacy migration.
- Repo size and startup work decrease by removing unused public assets from the asset catalog.
