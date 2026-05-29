# Spec 009: Editor-Gated Layout Entry

Status: active implementation

Deployment note: this change is safe for public deployment because the original layout editor entry is hidden unless the URL explicitly includes `?editor=1`.

## Problem

The original pixel office layout editor still exists in the codebase, but its visible `Layout` button is no longer rendered by the current Peach Blossom Spring UI. This makes it hard to place existing furniture assets such as `DOUBLE_BOOKSHELF` or test newly imported CraftPix assets without editing code directly.

The editor must not return as a normal public control because visitors could accidentally enter layout editing, move furniture, or save unintended changes.

## Required Outcomes

### 1. URL-Gated Editor Entry

- Show the original layout editor entry only when the current URL has `editor=1`.
- Do not show the editor entry for normal public URLs.
- Keep the public Peach Blossom Spring HUD unchanged when `editor=1` is absent.
- Reuse the existing `BottomToolbar` / `Layout` flow instead of building a new editor UI.

### 2. Minimal Original Editor Restoration

- Restore the original `Layout` button behavior through the existing editor state:
  - click `Layout` to enter/leave edit mode
  - show `Furniture`, `Floor`, `Wall`, and `Erase` tools in edit mode
  - show `Save` / `Reset` only when dirty, as the existing editor does
- Preserve existing keyboard behavior:
  - `Esc` exits tools and then edit mode
  - `R` rotates selected/placement furniture where supported
  - delete/backspace removes selected furniture

### 3. Direct Layout Editing Path

- Document that fixed production placements can still be done in `webview-ui/src/world/peachBlossomWorld.ts` with `addFurniture(...)`.
- Existing furniture manifests under `webview-ui/public/assets/furniture/*/manifest.json` remain the source of footprint and placement behavior.
- CraftPix assets should be imported as separate furniture/floor/wall assets before being placed through the editor.

## Non-Goals

- Do not redesign the editor UI.
- Do not import the CraftPix pack in this step.
- Do not expose editor controls to normal public visitors.
- Do not change existing furniture collision or save semantics.

## Verification

- Static check: `?editor=1` is the only public URL gate for rendering the restored `BottomToolbar`.
- Build must pass: `npm --prefix webview-ui run build`.
- Manual smoke path:
  - open local app without `?editor=1`; no `Layout` button appears.
  - open local app with `?editor=1`; original bottom toolbar appears.
  - click `Layout`; editor tools appear.
  - choose `Furniture`; `DOUBLE_BOOKSHELF` remains available through the loaded asset catalog.

## Notes

- This restores access for project editing, not a public gameplay feature.
- If later needed, add a clearer editor badge so screenshots cannot be mistaken for the public site.
