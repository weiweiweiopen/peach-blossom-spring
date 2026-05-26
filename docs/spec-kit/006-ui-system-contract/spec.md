# Spec Kit 006 — UI System Contract for Multilingual Game Windows

Date: 2026-05-26
Scope: PBS runtime UI windows, floating HUDs, dialogue panels, language menu, zine split panel chrome, and icon/button controls in `webview-ui`.

## Problem

Repeated localized visual regressions keep appearing across the game UI:

- zh-TW / ja / th text visually grows much larger than en / id / de inside the same components.
- PBS Computer dialogue, NPC dialogue, left Question Pet HUD, right selected-pet panel, language menu, and zine split-panel toolbar use inconsistent type scales.
- Some buttons have fixed icon sizes while nearby text controls use different heights, causing misaligned rows.
- Previous fixes used one-off CSS overrides, visual guards, and template-specific caps. These reduce specific failures but do not create one maintainable system.
- Mixing different font strategies per language creates more management risk and makes future UI changes hard to reason about.

The goal is not another local patch. The goal is a durable UI contract that prevents broken layout, broken buttons, and broken type scale from reappearing.

## Decision

Use a single managed UI contract with four layers:

1. **Font Policy** — one project-owned font stack, no per-component font switching.
2. **Type Slots** — fixed semantic text slots instead of arbitrary `text-xl`, `text-base`, or ad-hoc clamps.
3. **Component Recipes** — each recurring window/control gets a small recipe that maps its parts to type slots and dimensions.
4. **Visual QA Harness** — screenshot-based fixtures for all six languages and key windows, plus static guards that ban escape hatches.

This replaces the current pattern of late CSS overrides competing with Tailwind utilities and component-local sizing.

## Non-Goals

- Do not redesign the whole visual identity.
- Do not add a new downloadable webfont as the first fix.
- Do not manage one separate CSS world per language.
- Do not make buttons shrink to fit text.
- Do not remove pixel-art framing or emoji controls.
- Do not solve semantic multilingual search in this spec; that belongs to a retrieval/search spec.

## Core Principles

0. **Perceived size beats declared size.**
   - A `font-size: 18px` declaration is not proof that the UI looks correct.
   - Different scripts, fallback glyphs, line boxes, pixel fonts, browser rasterization, and mixed Latin/CJK/Thai text can produce visibly different sizes from the same CSS value.
   - Acceptance must use screenshots or measured rendered boxes, not only code inspection.
   - If the user screenshot shows a mismatch, the screenshot is treated as ground truth even when computed CSS appears consistent.

1. **Controls are geometry, not typography.**
   - Icon buttons keep fixed square dimensions.
   - Text buttons use fixed min-height and recipe-defined padding.
   - Language-specific text scaling may never change control geometry.

2. **Text uses slots, not component guesses.**
   - Components may request `title`, `subtitle`, `body`, `caption`, `field`, `button-label`, or `micro`.
   - Components may not directly choose `44px`, `text-xl`, or language-specific ad-hoc clamps.

3. **Script differences are handled at the slot layer.**
   - zh-TW / ja / th may have slot-level scale factors.
   - Those factors are centralized in one file/layer.
   - No component gets its own private CJK/Thai exception unless approved by this spec.

4. **Every recurring UI window has a recipe.**
   - PBS Computer dialogue, NPC dialogue, Question Pet HUD, selected-pet panel, language menu, and zine split toolbar must each declare part-to-slot mapping.
   - A new window cannot invent its own scale.

5. **Screenshots are the source of visual truth.**
   - Static regex guards are not enough.
   - We need six-language screenshot fixtures for the same UI state.
   - The acceptance check compares geometry and text overflow, not subjective impression.

## Font Policy

Use a single project-level font stack for the game UI:

```css
--ui-font: "FS Pixel Sans", "CJK Pixel Match", system-ui, sans-serif;
--emoji-font: "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
```

Rules:

- Do not switch PBS Computer or NPC panels to native Japanese-only fonts.
- Do not use one font for English and another for Chinese inside the same component.
- If glyph coverage requires fallback, it must happen through the shared stack, not component selectors.
- Emoji controls always use `--emoji-font` and are isolated from text slots.

Rationale:

- Per-language font switching caused inconsistent perceived size and management complexity.
- A single stack makes the problem finite: tune slots once, apply everywhere.

## Type Slots

Define one source of truth, preferably in a new late-loaded stylesheet section or module:

```css
.pbs-ui-root {
  --type-title: 30px;
  --type-subtitle: 18px;
  --type-body: 18px;
  --type-caption: 14px;
  --type-field: 18px;
  --type-button-label: 16px;
  --type-micro: 12px;

  --line-title: 1.1;
  --line-subtitle: 1.25;
  --line-body: 1.42;
  --line-caption: 1.3;
  --line-field: 1.25;
  --line-button-label: 1.15;
  --line-micro: 1.2;
}
```

Language scale is centralized:

```css
.pbs-ui-root[data-language="zh-TW"] {
  --type-body: 17px;
  --type-field: 17px;
  --type-title: 28px;
}

.pbs-ui-root[data-language="ja"] {
  --type-body: 17px;
  --type-field: 17px;
  --type-title: 28px;
}

.pbs-ui-root[data-language="th"] {
  --type-body: 16px;
  --type-field: 16px;
  --type-title: 27px;
  --line-body: 1.55;
  --line-field: 1.4;
}
```

Important:

- These are examples, not final values.
- Final values must be measured from screenshots across all six languages.
- The input field slot is the ceiling for ordinary dialogue body text.

## Component Recipes

### PBS Computer Dialogue

Parts:

- Kicker: `caption`
- Title: `title`
- Role/subtitle: `subtitle`
- Dialogue body: `body`
- Speaker label: `body`, accent color only
- Source panel: `caption`
- Input field: `field`
- Suggestion chips: `button-label`
- `🔍`, `💬`, `📚`: icon button recipe
- Close `X`: window action recipe

Geometry:

- Footer row height is governed by the input field and icon button size.
- Icon buttons remain square.
- Text input consumes remaining width.
- No language may change icon button size.

### NPC Dialogue

Parts match PBS Computer Dialogue.

Additional rule:

- NPC and PBS Computer must share the same footer recipe. If one changes, both change.

### Question Pet HUD — Left Bottom

Parts:

- Panel title: `subtitle`
- Pet role/name: `caption`
- Stat labels: `caption`
- Stat numbers: `caption`
- Field notes/history: `caption` or `micro`
- Action buttons: text button recipe

Geometry:

- HUD has fixed max width and scrollable interior.
- Text may wrap, but may not overflow outside the panel.
- zh-TW / ja / th cannot use title/body slots for stat rows.

### Selected Pet / Local Chat Panel — Right Bottom

Parts:

- Header title: `subtitle`
- Body cards: `caption`
- Input: `field`
- Send button: text button recipe
- Expand/close: window action recipe

Geometry:

- Input + send button row must align in height.
- Send button min-width may be fixed by recipe, not by translated label.

### Language Menu

Parts:

- Menu item label: `button-label`
- Active item: same size as inactive item, only background changes.

Geometry:

- All language options use identical row height.
- Thai/Japanese labels may not visually exceed row height.
- Menu width can be fixed or max-content, but selected row cannot protrude.

### Zine Split Toolbar

Parts:

- Toolbar kicker/title: `subtitle` or `caption` depending available width.
- Progress copy: `caption`.
- Window action controls: window action recipe.

Geometry:

- Toolbar title must reserve space for right-side actions.
- It may truncate/wrap according to recipe, but cannot run under buttons.

## Control Recipes

### Icon Button

For `🔍`, `💬`, `📚`, `🍑`, `🌐`, and similar controls:

```css
--control-icon-size: 64px;
--control-icon-glyph: 30px;
```

Rules:

- Width, height, min-width, max-width, min-height, max-height are all fixed.
- Padding is `0`.
- Display is `inline-grid`; center with `place-items: center`.
- Font family is emoji font.
- Text slots never apply.

### Window Action

For `X`, expand, collapse:

```css
--control-window-size: 34px;
--control-window-glyph: 18px;
```

Rules:

- Fixed square.
- Never inherits body/title text size.

### Text Button

For translated labels:

```css
--control-text-height: 44px;
--control-text-padding-x: 12px;
--control-text-font: var(--type-button-label);
```

Rules:

- Button height is recipe-owned.
- Text can wrap only if the recipe allows multi-line.
- Text must never force sibling icon buttons to resize.

## Implementation Strategy

### Progress Reporting Rule

- Every implementation phase must produce visible progress before continuing to the next phase.
- Any step that takes more than 60 seconds without a user-visible update is considered stalled.
- When stalled, stop and report:
  - current step,
  - what command/file/decision is blocking,
  - what will be changed next,
  - whether the task is still safe to continue.
- Do not argue that a step is not stalled because internal reasoning continued. If there is no visible progress, it is stalled from the user's point of view.
- Prefer small commits of work inside the session: spec update, inventory, first component migration, guard, verification.

### Phase 1 — Inventory and Stop the Bleeding

1. List all runtime UI components that use game frames or floating windows.
2. Mark each part with a semantic class or data part:
   - `data-ui-part="title"`
   - `data-ui-part="body"`
   - `data-ui-part="field"`
   - `data-ui-part="icon-button"`
3. Add static guard that fails if protected components use Tailwind text utilities:
   - `text-xl`
   - `text-2xl`
   - `text-base`
   - `text-sm`
   - arbitrary `text-[...]`
4. Add static guard that fails if icon buttons contain non-emoji busy replacement text.

### Phase 2 — Build the Contract Layer

1. Create a dedicated CSS section or file, e.g. `src/ui-system.css`.
2. Define type slots and control recipes.
3. Import it last, after Tailwind and legacy CSS, until legacy rules are removed.
4. Apply recipes to PBS Computer and NPC dialogue first.
5. Apply recipes to Question Pet HUD and selected-pet panel second.
6. Apply recipes to language menu and zine split toolbar third.

### Phase 3 — Remove Legacy Overrides

1. Delete duplicated late overrides that manually tune `.rpg-dialogue-panel[data-language="ja"]`, `.rpg-dialogue-panel[data-language="th"]`, etc.
2. Replace them with slot values only.
3. Delete component-specific hard caps after screenshot QA passes.
4. Keep only documented exceptions in this spec.

### Phase 4 — Screenshot QA Harness

Use Playwright or equivalent browser automation.

Fixtures:

1. PBS Computer open, language menu closed.
2. PBS Computer open, language menu open.
3. NPC dialogue open.
4. Left Question Pet HUD visible.
5. Right selected-pet panel visible.
6. Zine split panel loading.

Languages:

- zh-TW
- en
- id
- de
- ja
- th

Viewports:

- Desktop Safari-like: `1920x1200`
- Mobile portrait: `926x2010` CSS-device approximation or equivalent DPR capture
- Mobile landscape if still supported

Automated checks:

- No element with `[data-ui-part]` has scrollWidth greater than clientWidth unless explicitly scrollable.
- Icon buttons remain exact square size.
- Window action buttons remain exact square size.
- Footer input and icon buttons share aligned height.
- Language menu row heights are equal.
- HUD stat rows do not overflow panel width.
- Zine split toolbar title does not overlap action buttons.

## Acceptance Criteria

This spec is complete when:

1. All protected UI text uses type slots.
2. All protected buttons use control recipes.
3. PBS Computer and NPC dialogue share one footer recipe.
4. Left and right pet HUDs use panel recipes, not inherited dialogue/body text sizes.
5. Language menu row height is identical across six languages.
6. Zine split toolbar title is governed by the same slot system.
7. Static guard fails on new ad-hoc text utilities inside protected components.
8. Screenshot QA passes for six languages and required viewports.

## Migration Order

1. Create `ui-system.css` and part classes/data attributes.
2. Migrate PBS Computer dialogue.
3. Migrate NPC dialogue.
4. Migrate icon/window/text buttons globally.
5. Migrate left Question Pet HUD.
6. Migrate right selected-pet/local chat panel.
7. Migrate language menu.
8. Migrate zine split toolbar.
9. Delete old language-specific overrides.
10. Add screenshot QA to package scripts.

## Hard Rules Going Forward

- No new UI component may set font-size directly unless it defines a new slot in this spec.
- No new button may size itself from translated text unless it uses the text button recipe.
- No emoji/icon button may contain loading text.
- No component may introduce a language-specific font family.
- No fix is considered complete without checking all six languages.
