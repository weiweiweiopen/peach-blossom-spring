# Spec 010: Pixel Office Editor Compatibility Mode

Status: planning

Deployment note: this must remain safe for the public Peach Blossom Spring game. Editor behavior is only enabled by an explicit URL flag and must not affect the normal visitor flow.

## Problem

The original pixel office layout editor is partially reachable through `?editor=1`, but it is not usable inside the current Peach Blossom Spring runtime:

- The Question Pet / tamagotchi HUD overlaps the bottom editor toolbar.
- Top-right Peach / language buttons and NPC name bubbles remain visible and visually block editor surfaces.
- The settings modal can open, but the old layout tool interactions are confused by current game overlays and interaction handlers.
- Clicking toolbar functions can appear to do nothing because the current game mode still owns map interaction, HUD focus, and dialogue proximity UI.

We need a compatibility mode that restores pixel office editing without breaking the existing game experience.

## Required Outcomes

### 1. Explicit Editor Compatibility Mode

- `?editor=1` enables a dedicated editor compatibility mode.
- Normal public URLs must behave exactly as they do now.
- Editor compatibility mode should be visually obvious enough for maintainers, but not presented as a public gameplay mode.
- The mode should not require `qa-ui=1` or a test-only profile.

### 2. Hide Game HUDs While Editing

When `?editor=1` is active, hide or suspend always-on game UI that blocks the editor:

- Hide left/bottom Question Pet / tamagotchi HUD.
- Hide right/top Peach archive and language buttons, unless they are intentionally needed for editor testing.
- Hide NPC name bubbles and proximity prompts.
- Hide PBS Computer proximity card / talk prompt.
- Hide zine/dialogue/pet panels unless explicitly opened before entering editor mode; preferred behavior is to close them on editor entry.
- Keep map zoom controls only if they do not overlap the editor toolbar; otherwise move or hide them in editor mode.

### 3. Restore Pixel Office Editor Interaction Priority

When editor compatibility mode is active:

- `Layout` toggles `editor.isEditMode` reliably.
- `Furniture`, `Floor`, `Wall`, and `Erase` tools receive map clicks before gameplay handlers.
- Furniture placement should use the existing `EditorToolbar`, `EditorState`, `useEditorActions`, and `OfficeCanvas` editor hooks.
- Editor toolbar, dirty action bar, furniture palette, and settings modal must sit above the game map and not behind game UI.
- Escape/key bindings should match original editor behavior.

### 4. Keep Current Game Flow Compatible

Normal mode must not regress:

- No editor toolbar on the public URL without `?editor=1`.
- Question Pet HUD remains visible in normal play.
- NPC name bubbles and PBS Computer prompts remain visible in normal play.
- Archive/language controls remain visible in normal play.
- Existing mobile/touch gameplay should not be changed unless `?editor=1` is active.

### 5. Direct Layout Editing Remains Supported

Fixed production placements can still be done directly in code/data:

- Procedural Peach Blossom layout: `webview-ui/src/world/peachBlossomWorld.ts`, `addFurniture(...)`.
- Saved/default layouts: `webview-ui/public/assets/default-layout-*.json` where applicable.
- Furniture assets: `webview-ui/public/assets/furniture/*/manifest.json` plus PNG sprite.
- `DOUBLE_BOOKSHELF` remains the first target asset for validating the editor path.

## Proposed Implementation

### Phase 1: Editor Mode State

- Keep `readEditorModeParam()` as the only public gate.
- Derive a local boolean such as `isEditorCompatMode` from `?editor=1`.
- Pass or apply this mode consistently to HUD rendering, prompts, and editor UI.

### Phase 2: UI Suppression In Editor Mode

- Wrap always-visible PBS HUDs with `!isEditorCompatMode` guards:
  - `floating-ui-layer` Peach/language controls
  - Question Pet status panel / tamagotchi HUD
  - NPC labels and talk prompts if they are React-rendered outside the canvas
  - PBS Computer prompt/card if separate from canvas
- If name bubbles are canvas-rendered, add an editor render flag so labels are not drawn in editor mode.

### Phase 3: Editor Input Priority

- Ensure `OfficeCanvas` receives `isEditMode` and editor handlers unchanged.
- In `handleClick` / mobile tap paths, return early to editor handlers when `editor.isEditMode` or editor tool state is active.
- Prevent dialogue/proximity side effects while editor mode is active.
- Keep zoom/pan behavior available if it does not conflict with furniture placement.

### Phase 4: Layering And Layout

- Use a dedicated `.pbs-editor-toolbar` CSS class with `position: fixed` and a high z-index.
- Use a dedicated editor overlay layer if needed, rather than placing editor controls inside game HUD layers.
- Ensure `EditActionBar` appears above the map and below modal dialogs.
- Avoid Tailwind arbitrary z-index as the only guarantee; use explicit CSS so production CSS generation cannot miss it.

## Non-Goals

- Do not redesign the pixel office editor UI.
- Do not import CraftPix assets in this spec.
- Do not change normal player onboarding, NPC dialogue, zine generation, language switching, or Question Pet gameplay outside editor mode.
- Do not expose editing tools to normal visitors.
- Do not make editor saves automatically public without the existing save path.

## Compatibility Risks

- Existing PBS UI overlays may be rendered both in React and canvas; both paths need review before implementation.
- Some old editor toolbar actions were built for VS Code webview assumptions. Browser/GitHub Pages save behavior may not persist in the same way.
- Hiding HUDs must not remove state permanently; it should be render suppression only.
- If editor mode is entered before player setup, the app may still show the boot/start screen. Implementation should decide whether `?editor=1` auto-starts a safe editor profile or simply shows toolbar after normal start.
- Public GitHub Pages cannot write back to repo layout files. Browser editing may be temporary unless save is wired to local storage or a downloadable/exportable layout.

## Verification

### Static Guards

- `BottomToolbar` is only rendered behind `readEditorModeParam()` / `isEditorCompatMode`.
- Normal HUD rendering is guarded so Question Pet and top-right controls are hidden in editor mode.
- Editor toolbar uses explicit `.pbs-editor-toolbar` fixed positioning and high z-index.

### Browser Smoke Tests

- Open `/?editor=1`:
  - toolbar is visible without `qa-ui=1`.
  - Question Pet HUD is hidden.
  - top-right Peach/language controls are hidden.
  - NPC name bubbles do not cover the editor.
  - clicking `Layout` opens editor tools.
  - clicking `Furniture` shows furniture palette.
  - selecting `DOUBLE_BOOKSHELF` and clicking a valid tile places/ghosts furniture.
- Open `/` without editor flag:
  - toolbar is absent.
  - Question Pet, Peach/language buttons, name bubbles, and normal gameplay remain visible.

### Commands

- `npm --prefix webview-ui run check:visual-layout`
- `npm --prefix webview-ui run build`
- If changing screenshot QA, add or update a `?editor=1` fixture that checks the editor toolbar is visible and PBS HUDs are hidden.

## Open Decisions Before Implementation

- Should `?editor=1` auto-start the game/editor profile, or require pressing `PRESS START` first?
- Should GitHub Pages editor save to localStorage, export JSON, or remain non-persistent until run in the original webview environment?
- Should top-right language/archive controls be fully hidden or moved into editor settings?
