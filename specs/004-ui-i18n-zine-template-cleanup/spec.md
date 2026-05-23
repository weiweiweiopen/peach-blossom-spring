# Feature Spec: UI / i18n / Zine Template Cleanup

## Scope

Repair the public-facing Peach Blossom Spring UI so that naming, menus, button shapes, multilingual typography, HUD layout, and zine generation behave consistently across desktop and mobile.

This work must also establish a maintainable layout governance layer: future UI changes should extend approved templates/tokens instead of inventing new local CSS patterns.

This feature is planning-only at creation time. Implementation must follow this spec and must not let generated or ad-hoc code redefine the visual/button/window contracts.

## User Stories

1. As a player using Traditional Chinese, I see the game title as `桃花源`, not an English title.
2. As a player on any page and any language, every main-title subtitle reads exactly `Dipatching a LLM wiki tamagotchi`.
3. As a player on the home screen, I can access both the peach menu and the language menu.
4. As a player, all window open/close controls use one square-button template, with a slightly smaller `X`; only the peach menu, globe/language menu, wiki button, and talk button use speech-bubble buttons.
5. As a maintainer, button/window/menu templates are centralized so generated code cannot drift into different specs.
6. As a multilingual player, all supported languages have complete translations and visually balanced font sizing, including CJK, Thai, Indonesian, German, and English.
7. As a player opening the peach menu, I see a peach-themed news/archive menu styled and positioned like the language dropdown, with no close button and no archive-tree/central-tree wording.
8. As a player using the desktop electronic-pet HUD, I see the same minimized layout family as mobile, with readable typography.
9. As a player, no zine/public note/free article appears unless I manually press the wiki button.
10. As a player reading a zine, I see a cleaner article layout, with reading/generation path and like/dislike controls framed as a separate system from the main article.
11. As a player moving through zine pages, every page has meaningful chapter index/title content rather than later pages falling back to `篇章`.

## Functional Requirements

### Naming And Copy

- Traditional Chinese main title MUST be `桃花源`.
- No Chinese locale page title may display the English title as its primary title.
- Every main title subtitle, across pages and languages, MUST be exactly `Dipatching a LLM wiki tamagotchi` unless this spec is revised.
- Existing product references that are body copy or explanatory paragraphs may remain localized, but primary title/subtitle slots must follow this contract.
- Localized home title text MUST remain localized and MUST NOT be forced to English, except for branded exact strings that are intentionally untranslated.

### Home Navigation

- Home screen MUST show both peach menu and language menu.
- Home menu controls MUST use the same component/template as in-game menu controls where possible.
- Peach menu and language menu MUST have matching dropdown distance, overlap behavior, z-index behavior, and responsive positioning.

### Button And Window Templates

- Create or identify a single source of truth for button/window control classes or components.
- Template source of truth MUST live in a clearly named layout system area, not scattered across feature files.
- All game window open/close controls MUST use the square template.
- Square close buttons MUST render `X` slightly smaller than the square, not oversized.
- Only these controls may use the speech-bubble button template: peach menu, globe/language menu, wiki button, talk button.
- No page-specific generated code may define a competing window-close or menu-button shape.
- All close/expand/minimize controls MUST use the same square window-control primitive used by the zine split window.
- The `X` glyph MUST be optically centered and smaller than the square.
- Legacy per-component X styles may only position the shared primitive; they must not redefine size, border, shadow, or glyph alignment.
- Multilingual typography fixes MUST NOT shrink button hit areas. Game buttons, floating peach/globe controls, wiki controls, and creator CTA controls must keep the established button dimensions and only adjust text inside them when necessary.
- Floating peach and globe menu buttons MUST have the same width, height, top alignment, border geometry, and optical emoji centering.

### Layout Governance

- Define a layout constitution that names every reusable UI primitive: shell, menu, dropdown, window, modal, HUD, button, zine article, zine system frame, title block, and responsive stack.
- Each primitive MUST have one owner file or component and one documented usage contract.
- Feature components may compose primitives but MUST NOT redefine primitive geometry, border, shadow, z-index, or responsive breakpoints locally.
- Global CSS must be organized into layers: reset/base, tokens, typography, primitives, components, utilities, overrides.
- Overrides are allowed only with a short comment naming the constraint they solve.
- Z-index, spacing, border, shadow, radius, typography, and breakpoint values MUST come from shared tokens.
- New UI work must update the contract before adding a new visual primitive.

### Peach Menu

- Peach menu is the news/archive menu.
- Remove visible `檔案大樹`, `中央大樹`, and localized equivalents from the menu header/title/body.
- Replace the tree identity with one peach emoji: `🍑`.
- Remove the peach menu close button.
- Peach menu layout and color MUST match the language menu layout and color family.
- Menu order MUST be: `schema`, latest news, `NGM e-book`, `The Map`.
- Former fourth item `about` MUST become `schema` and move to first position.
- Peach/language dropdown panels MUST NOT cover their trigger buttons.
- Home screen dropdowns MUST be closed initially and open only after player clicks the peach or globe trigger.
- Home peach menu MUST use the same visual template as the in-game peach menu: peach kicker, vertical yellow menu items, matching frame, spacing, border, shadow, and typography.

### i18n Completeness

- Supported locales are `zh-TW`, `en`, `id`, `de`, `ja`, and `th` unless implementation discovers an authoritative locale registry with more languages.
- Every key rendered on home, in-game HUD, menus, dialogs, zine panels, zine trace, feedback, and error/retry states MUST exist in every locale.
- Run `npm run check:i18n` and add targeted checks if existing tooling cannot detect nested missing keys or hard-coded visible strings.
- Mixed-language leftovers are allowed only for branded names or user-specified exact English strings such as `Dipatching a LLM wiki tamagotchi`, `NGM e-book`, and `The Map`.

### Multilingual Pixel Typography

- Preserve pixel-art visual language without breaking layout.
- Define language-aware font stacks and size-adjust rules so CJK, Japanese, Thai, Latin, and mixed text have closer perceived height at the same UI level.
- Avoid per-string manual font-size fixes. Prefer tokens/classes such as title, subtitle, body, label, caption, HUD, and menu item.
- Japanese text MUST not visually dominate or shrink compared with Chinese/English at the same token level.
- If a true pixel font is unavailable for a script, use the closest readable fallback with size-adjust and line-height normalization.
- Typography tokens MUST include script-aware optical correction hooks instead of one-off locale CSS in components.
- Any typography added during the previous UI cleanup that made desktop/mobile UI oversized MUST be reduced by 20%.
- Home title visual size MUST use the English title as the baseline across all languages.
- English visual scale is the canonical baseline for multilingual UI sizing.
- `zh-TW`, `ja`, and `th` MUST use compact script scale tokens for the game HUD, NPC bubbles, pet panel, dialogue, home screen, and menu controls.
- Compact script scale tokens MUST be moderate enough to avoid making the overall UI visibly smaller than the English baseline; they should normalize perceived glyph size, not reduce layout scale.
- Japanese mixed Latin/Japanese text MUST keep perceived Latin and Japanese size balanced.
- Emoji size MUST NOT inherit from large text/menu typography rules.

### Emoji Controls

- Peach, globe, and wiki-book emoji controls MUST use one emoji-size token.
- NPC dialogue wiki button MUST show only a book emoji, with no `Wiki` text.
- The book emoji size MUST match the globe/peach trigger emoji size.
- Emoji controls MUST pass a visual bounding-box test in `zh-TW`, `ja`, `th`, and `en`; native color emoji glyphs must be contained by a fixed wrapper rather than relying on font-size alone.
- Emoji wrappers MUST use fixed inline/block size, hidden overflow, centered layout, emoji-capable font family, and an optical transform scale when needed.
- Emoji controls MUST show the full peach/globe/book glyph with no visible clipping at close zoom.

### Player Spawn

- Player spawn MUST choose the walkable tile nearest the map center.
- Initial camera follow MUST center on the player after entering the world.

### Electronic-Pet HUD

- Desktop minimized HUD MUST use the same layout family as mobile minimized HUD.
- Desktop minimized HUD typography MUST be readable and not smaller than the agreed HUD token.
- Mobile and desktop must have separate responsive templates where needed, but share design tokens and content hierarchy.

### Zine Generation Rules

- The only trigger that may generate/open a new zine is the player's manual wiki button action.
- Remove all automatic/free-generation paths, timed/public-short-text paths, and old fixed seed public-note mechanisms.
- Remove stale files or imports that keep old public-short-text generation reachable.
- Existing generated artifacts in localStorage/session state must not re-spawn as new unsolicited windows.
- Writer/validation errors must show retry/error UI, not fallback to old public short text.

### Zine Layout

- Simplify the main article body layout so text lines have reasonable length on desktop and mobile.
- Remove excessive nested frames inside the article body.
- Put reading path / generation path in its own framed section.
- Put like/dislike feedback controls in their own framed section or a clearly separated subframe.
- The path/feedback system must be visually distinct from the article content, not visually merged with the prose.

### Zine Structure And Prompts

- Investigate why only the first page gets `01` and `聲音圖譜` chapter index/title while later pages fall back to `篇章`.
- Treat this as both a prompt/schema issue and a renderer/fallback issue until proven otherwise.
- Generated zine content must include stable structured fields for every page/section: index, title, body, and optional pull quote.
- Renderer must fail visibly or use a designed localized fallback only when fields are truly missing; it must not silently flatten all later pages into `篇章`.
- Mobile and desktop zine templates must be separate where layout differs, but must share content schema and typography tokens.

## Acceptance Criteria

- `npm run check:i18n` passes, or any failure is documented with a concrete fix task.
- `npm --prefix webview-ui run build` passes after implementation.
- Home screen displays peach menu and language menu.
- Chinese primary title displays `桃花源` and main subtitles display `Dipatching a LLM wiki tamagotchi`.
- Peach menu visually matches language menu behavior and has order `schema`, news, `NGM e-book`, `The Map`.
- Square and speech-bubble button exceptions match the template contract.
- Desktop minimized HUD visually matches mobile minimized HUD family and is readable.
- No zine appears without manual wiki-button action during a timed idle/manual smoke test.
- Generated zines show complete structured chapter index/title fields on every page.
- Zine article, path, and feedback sections are visually distinct and readable on mobile and desktop.
- Layout constitution and template contracts identify the owning file/component for each primitive.
- Search/audit confirms no duplicate ad-hoc close-button, menu-button, dropdown, HUD, or zine-frame CSS remains outside approved template files.
- Visual smoke tests cover at least desktop, narrow mobile, and mixed-script text samples for the governed primitives.
- Home language dropdown is closed on first load.
- Peach/language dropdowns open below triggers without covering the trigger buttons.
- Player enters at the centered spawn/camera position.

## Initial Code Areas To Inspect

- `webview-ui/src/App.tsx`
- `webview-ui/src/index.css`
- planned layout primitive files or existing equivalents under `webview-ui/src/components` / `webview-ui/src/daydream`
- `webview-ui/src/i18n/locales/*.ts`
- `webview-ui/src/i18n.ts` and `webview-ui/src/i18n/index.ts`
- `webview-ui/src/components/PlayerSetup.tsx`
- `webview-ui/src/components/RpgDialogue.tsx`
- `webview-ui/src/daydream/browserAssociationGenerator.ts`
- `webview-ui/src/daydream/publicArtifactHtml.ts`
- `webview-ui/src/daydream/publicArtifactContent.ts`
- `webview-ui/src/daydream/associationFeedback.ts`
- `webview-ui/src/simulation/wikiDaydream.ts`
- `webview-ui/src/simulation/thoughtTriggers.ts`
- `webview-ui/src/simulation/engine.ts`
