# Spec Kit — PBS zine PDF and feedback buttons

Date: 2026-05-25
Scope: local main repo, generated association zine viewer only.

## Problem

On desktop Safari/local PBS, the generated zine feedback buttons at the bottom of the zine page are visible but do not respond:

- Love feedback button
- Broken-heart feedback button
- Zine PDF button

The PDF button must generate a real downloadable/openable PDF, not merely rely on browser print.

## Expected Behavior

1. Buttons are clickable inside the generated zine panel on desktop.
2. Feedback buttons visibly press and store feedback if browser storage is available.
3. PDF button shows an in-progress state immediately.
4. PDF button creates a PDF from the generated zine page and either downloads it or opens it in a new tab/window.
5. If PDF generation fails, show/log the reason and fall back to `window.print()` only as a last resort.

## Constraints

- Do not change the zine visual template more than necessary.
- Do not reintroduce public-facing backend/workflow/debug language into zine body text.
- Keep this fix isolated to the local main repo.
- If any operation takes over one minute without result, report the current step and likely cause before continuing.

## Investigation Checklist

- Verify `iframe` sandbox allows scripts, downloads, and popups for generated final documents.
- Verify generated HTML actually contains the feedback script after public safety validation.
- Verify no overlay or CSS `pointer-events` setting blocks button clicks.
- Verify Safari permits download/open behavior from a click event inside the iframe.

## Success Criteria

- Build passes.
- Generated zine feedback buttons can receive click handlers in the iframe.
- PDF button no longer appears inert on desktop Safari.

## Implementation Notes

- The iframe sandbox already allowed scripts/downloads/popups, so the fix does not rely only on generated inline script execution.
- Parent React now attaches control handlers after final-document iframe load.
- Parent-side handlers force `.pbs-zine-button` pointer events on, add visible press states, and handle feedback button pressed state.
- Parent-side PDF generation reads the same-origin blob iframe DOM, renders the zine page into an SVG/Canvas snapshot, slices it into A4-ish pages, wraps JPEG pages into a PDF blob, downloads it, and also attempts to open it in a new tab.
- Safari can block windows/downloads if they are opened only after async canvas work. The parent now opens a progress window synchronously inside the click event, then redirects it to the generated PDF blob when ready.
- Do not use `noopener` for the temporary progress window; Safari may leave `about:blank` inaccessible/empty from the opener side. The progress window is now opener-controlled and receives explicit progress/failure HTML.
- SVG-to-canvas image decoding has a 15 second timeout so Safari failures surface instead of appearing as a permanently blank tab.
- A parent-level `下載小誌 PDF` control is rendered above the iframe so PDF generation does not depend on iframe button event delivery.
- If parent-side PDF generation fails, it logs the error and falls back to iframe print.

## 2026-05-25 Follow-Up: Safari Loading Error

- Desktop Safari opens the progress tab but the HTML snapshot strategy fails with `Loading error` during SVG/foreignObject image decoding.
- Continue with a simpler, more reliable path: extract visible zine text from the same-origin iframe and typeset it into Canvas pages, then encode those pages into the existing image-PDF writer.
- Keep only the bottom zine PDF button; remove the extra parent-level button to avoid duplicate controls.
- The PDF does not need to preserve the exact zine visual layout in this pass. Priority is a real generated PDF with readable zine content.
- Implemented direction: bottom button is still used, but parent React handles its click. The generator extracts visible zine text from the iframe, typesets it into Canvas pages, and writes those images into a PDF. This avoids Safari's SVG/foreignObject `Loading error` path.

## 2026-05-25 Follow-Up: Two-Phase PDF Strategy

Observed result: the text-only PDF now generates, but it loses the zine visual language and includes internal trace/debug text. This is only a functional fallback, not the target.

Phase 1: immediate stable path

1. Keep the bottom in-zine `小誌 PDF` button as the only visible PDF control.
2. Stop using SVG `foreignObject` and stop using the text-only Canvas PDF fallback as the primary path.
3. The button should call `window.print()` from inside the zine iframe.
4. Add print CSS / `@page` rules to preserve the existing PBS zine HTML layout as a print-to-PDF document.
5. Hide feedback controls and trace/debug sections in print.

Phase 2: better print pipeline

1. Evaluate and, if useful, introduce Paged.js for print-ready paged preview.
2. Keep Vivliostyle as a future formal publishing option, not current scope.
3. Do not use DrawBot for the browser button; reserve it for offline/poster/Python workflows.

Success update for Phase 1:

- Bottom button opens the browser print/save-PDF dialog reliably.
- PDF excludes trace/debug/private process text.
- Saved PDF preserves the generated zine layout better than the text-only fallback.

Implementation update:

- Removed the parent-side Canvas/image-PDF path from the runtime; it remains rejected because it either failed Safari (`foreignObject`) or produced a text-only PDF.
- The bottom `小誌 PDF` button now calls `iframe.contentWindow.print()`.
- Generated zine HTML now includes print CSS with `@page`, print color adjustment, per-page breaks, PBS sheet/frame styling, and hidden trace/feedback controls.

### 2026-05-25 Print Button Follow-Up

Observed result: button text briefly changes to `開啟列印...`, but no print dialog opens. This means click handling works, but the browser blocks the print modal.

Likely cause:

- The zine runs inside a sandboxed iframe. `window.print()` is modal-like browser UI and can be blocked unless the sandbox includes `allow-modals`.
- The generated feedback script still contained the older async PDF blob path, which can conflict with the intended Phase 1 print-only behavior.

Fix direction:

- Add `allow-modals` to final-document iframe sandbox.
- Change generated zine PDF button script to immediate `window.print()` only.
- Regenerate the zine after this change; an already-open generated zine may still contain the old inline script.

Implementation update:

- Final-document iframe sandbox now includes `allow-modals`.
- Generated feedback script no longer includes SVG/canvas/blob PDF generation. The PDF button only calls `window.focus(); window.print();` and briefly shows `開啟列印...`.
- Build passed after this change. A newly generated zine is required to verify the new inline script.

## 2026-05-25 Follow-Up: Layout, Type Scale, and Button Safety

Observed result after Phase 1:

- Print/save PDF works, but pages can overflow A4 and create blank continuation pages.
- Screen zine exposes trace/debug sections before the feedback controls; those should not be part of the reading face.
- CJK/Thai and Latin/Indonesian/German text scales diverge too much.
- Previous attempts to unify font sizing risked breaking emoji/control buttons.
- The visual frame is too nested: the blue/green outer field plus yellow body card makes text columns too narrow.

Rules for this pass:

1. Use the existing zine/layout governance path, not ad-hoc per-button hacks.
2. Type scale rules must target article content only: `.page`, `.titleBlock`, `.lead`, `.body`, `.refs`, not `.pbs-zine-button` or form/game buttons.
3. Button dimensions must be fixed independently from language font sizing.
4. Feedback controls should visually echo the PBS Computer dialogue controls: same-height square buttons, aligned beside the feedback label inside one framed row.
5. The PDF button should use a book emoji distinct from the existing wiki/book stack emoji; use `📖` for PDF/print.
6. Remove the inner yellow body block for the print/screen zine reading layout; keep a simpler cream body card inside the colored sheet.
7. Print CSS must fit one logical zine page per A4 page where possible, avoid clipping at page top, and hide trace/debug/feedback.

Success criteria:

- Print preview no longer creates mostly blank continuation pages for each section.
- Zine visible reading surface does not show private trace/debug before the feedback controls.
- CJK/Thai and Latin text appear closer in perceived size without changing button dimensions.
- Love, broken-heart, and PDF buttons are equal-size square controls with centered emoji across languages.

Implementation update:

- The existing `zineLayoutGovernanceCss()` layer in `officialTemplateRenderer.ts` is the Cargo-like layout governance path for this pass.
- Visible trace/debug section is no longer appended to the generated zine HTML; trace remains persisted in local storage for debugging.
- The reset zine layout now uses a simpler single sheet frame and wider cream body cards instead of the nested green/blue/yellow body stack.
- Content type scale is scoped to zine article areas only; `.pbs-zine-button` has fixed square dimensions and its own emoji-safe font rules.
- Feedback row is a four-column framed row: question label plus three equal 64x64 square controls.
- PDF/print control uses `📖`, distinct from the PBS wiki stack emoji.

## Verification

- `npm --prefix webview-ui run build` passed on 2026-05-25.
- Local dev server returned `HTTP/1.1 200 OK` at `http://127.0.0.1:5173/`.

## 2026-05-26 Follow-Up: Mobile Dialogue Typography and Locale Completeness

Observed result on mobile Safari:

- PBS Computer/NPC dialogue body and suggestion text can render much larger than the input field, especially in Traditional Chinese.
- The mobile dialogue layout must use the input field text size as the visual maximum for ordinary copy.
- NPC dialogue emoji controls must follow the PBS Computer pattern: fixed square icon controls, not text buttons.
- Loading/busy states must not replace emoji controls with text such as `...`.
- Some mobile-facing interface text is still hard-coded instead of using zh-TW/en/id/de/ja/th copy.

Rules for this pass:

1. Do not alter existing button hit-area dimensions, emoji glyph proportions, or square icon-control sizing.
2. Mobile dialogue typography is normalized from the input field down: body copy, suggestion prompt, chips, source panels, title metadata, and errors may not exceed the input text scale.
3. Fixed emoji controls (`🔍`, `💬`, `📚`) are excluded from language/type scaling and must remain 64px square with centered emoji.
4. Add missing mobile-facing localized copy for zh-TW/en/id/de/ja/th instead of leaving mixed Chinese/English hard-coded labels.
5. Keep NPC name tags and existing non-dialogue controls untouched unless a guard proves they are affected.

Success criteria:

- Mobile PBS Computer and NPC dialogue text no longer visually overwhelms the input field in zh-TW/en/id/de/ja/th.
- PBS Computer and NPC submit buttons remain `💬` during loading; busy state is exposed through attributes, not visible replacement text.
- `🔍`, `💬`, and `📚` controls remain exactly fixed-size square controls.
- Visual guard covers mobile dialogue type caps, all-language PBS Computer copy, and emoji control invariants.

## 2026-05-25 Follow-Up: Global Multilingual Scale, PBS Computer UX, and Zine Layout V2

Observed result:

- CJK, Japanese, and Thai still read larger than English/Indonesian/German across the game UI, including name bubbles, launch prompts, dialogue windows, Tamagotchi panels, and home/loading titles.
- PBS Computer question suggestions remain Chinese-only in non-Chinese languages.
- PBS Computer text buttons take too much room; the search suggestion toggle should be a magnifying-glass emoji and the talk/submit button should be a dialogue-bubble emoji.
- The zine direction should keep a stronger frame language, but remove only the innermost yellow reading block, randomize frame colors, and never visually stack more than three frame layers.
- English/other-language print output can still overflow A4. The print layout should be document-like: full-width frames, natural flow, no requirement that title/section number/subtitle stay pinned at top.

Rules for this pass:

1. Use a single language-scale layer rooted at the active game language. Do not hand-tune every component separately.
2. Do not change global button dimensions when normalizing type. Emoji controls may use fixed square sizing.
3. Keep Phase 1 PDF as browser print/save-PDF. Do not reintroduce SVG/canvas/blob generation.
4. Keep public zine HTML free of backend/tool/provenance/workflow/debug/source-card language.
5. Zine frame nesting target: page background, sheet frame, content frame. No fourth inner body block.
6. Print should allow sections to continue naturally when text is long, instead of forcing every logical section into a clipped single A4 page.

Success criteria:

- Active language is available on the main game root for CSS language scaling.
- CJK/Japanese/Thai UI text appears closer to Latin-language size in name tags, prompts, dialogue panels, split panels, Tamagotchi/status panels, and loading/home title surfaces.
- PBS Computer question toggle is `🔍`; talk submit is `💬`; both retain accessible labels/titles.
- Suggested PBS Computer questions are localized for zh-TW/en/id/de/ja/th.
- Generated zine frames vary colors across pages while keeping at most three visible frame layers.
- Print CSS uses full A4 width, avoids top clipping/blank continuation pages, hides feedback controls, and allows overflow text to flow naturally.

## 2026-05-25 Follow-Up: Multilingual Type Verification, Stable Zine Generation, and Print Flow V3

Observed result:

- NPC name tags still show visible size mismatch across zh-TW/ja/th vs en/id/de. Name tags must be identical computed size across languages.
- General dialogue/UI multilingual sizing remains inconsistent enough to be visible in screenshots.
- Zine generation progress copy is Chinese-only in non-Chinese UI.
- Public artifact guard incorrectly rejects ordinary prose containing the word `content`, e.g. “the content builds a tool against forgetting”. This causes intermittent failed zine generation even after successful LLM calls.
- Print output still creates mostly blank pages because logical zine pages and A4 pages are fighting each other.
- The PDF button changes into text (`Opening print...`) and overflows its fixed square.
- Right-side split panel outer frame and scrollbar do not match the left dialogue panel. Use the left dialogue window as visual source of truth.

Rules for this pass:

1. NPC name tags use fixed computed `font-size`/`line-height` across all active languages. Do not apply language scale to name tags.
2. Language normalization may tune larger text surfaces, but fixed controls and name tags are excluded.
3. Add a verification script or command that asserts equal computed font size for representative multilingual name tags and UI samples before considering this fixed.
4. Localize zine progress status messages for zh-TW/en/id/de/ja/th.
5. Keep guard coverage for real backend/provenance/tooling terms, but remove false positives for ordinary editorial prose such as standalone `content`.
6. Print CSS should treat zine output as a continuous print document, not one generated section per A4 page. Frames may continue across pages with cloned decoration instead of forcing blank pages.
7. PDF print button remains emoji-only during and after click. Busy state must not replace button text.
8. Right split panel uses black pixel frame, white toolbar/content surface, and dialogue-style scrollbars.

Success criteria:

- Build passes.
- Computed font-size verification passes for `.npc-name-tag` across zh-TW/en/id/de/ja/th with zero variance.
- Computed UI sample verification shows bounded variance across languages for dialogue text surfaces.
- A generated English zine no longer fails only because ordinary prose contains `content`.
- Print preview no longer creates empty pages after each zine section due to section/A4 page conflict.
- PDF button remains `📖` after click.

### 2026-05-26 Paged.js Evaluation

- Paged.js was checked as the Phase 2 print-preview option, but it is not currently installed or used in `webview-ui`.
- For this pass, keep Phase 1 as native browser `window.print()` / Save PDF instead of adding a new pagination dependency.
- The immediate blank-page fix is to stop treating each generated `.page` section as a forced A4 page in print CSS.
- Print output should flow as one continuous document with PBS frames preserved, allowing long text to continue naturally across A4 pages.
- Reconsider Paged.js only if native print flow remains unstable after removing the `.page` / A4 forced-break conflict.

### 2026-05-26 Visual QA Guardrails

Observed result:

- English and Japanese generated zine print flow are acceptable, but Chinese print text reads too small.
- Japanese PBS Computer title/question controls are too large on screen.
- NPC/PBS Computer talk-launch bubbles in Chinese, Japanese, and Thai are visually oversized and have insufficient line spacing compared with English.
- Feedback row text should become an actual writable comment field instead of static copy.
- Repeated visual fixes have been too subjective because the agent cannot directly perceive Safari print/browser screenshots while editing.

Rules for this pass:

1. Keep button boxes fixed; only text surfaces may change.
2. Zine print Chinese body/title scale may increase, but English/Japanese print flow must not be made larger.
3. PBS Computer dialogue title and suggestion chips get explicit Japanese/Thai caps so translated text cannot overflow the dock.
4. Talk-launch bubbles use fixed language-aware font-size/line-height caps for zh-TW/ja/th, with line-height close to English.
5. Zine feedback prompt becomes a real text input/textarea and stores the comment with the feedback click payload.
6. Avoid infinite visual tuning by defining measurable constraints before manual screenshot review: no CJK/Thai talk-launch line-height below 1.28, no Japanese/Thai talk-launch text above the English visual cap, no zine feedback row static prompt in generated HTML.
7. If a verification step takes over one minute, stop that step, report the current command/cause, and switch to a bounded alternative.

Success criteria:

- Chinese print zine text is visibly two steps larger than the prior output without increasing fixed control buttons.
- Japanese PBS Computer title and suggestion buttons no longer dominate the left panel.
- zh-TW/ja/th talk-launch bubbles have more English-like visual spacing and smaller per-line text.
- Generated zine feedback row contains a writable comment field plus the three fixed square buttons.
- Build passes after changes.

### 2026-05-26 Follow-Up: Emoji Controls and Japanese HUD Regression

Observed result:

- PBS Computer's first message and several pet HUD strings were still English-only or hard-coded Chinese.
- Japanese pet HUD text was still oversized.
- Japanese typography fixes shrank emoji buttons, violating the rule that typography normalization must not change button dimensions.
- The generated zine split-panel toolbar title was too large and collided with the frame; screen zine body text was too small.

Root cause:

- Generic `.rpg-dialogue-chip` / `.rpg-dialogue-submit` Japanese font rules matched emoji controls and text chips together.
- Later script-scale rules overrode earlier visual caps.
- Some PBS Computer and pet HUD strings lived directly in `App.tsx`, outside locale files.

Rules added:

1. Emoji controls are controls, not language text. They must have fixed 64x64 boxes and emoji-safe font sizing independent of Japanese/Thai/CJK typography.
2. Text chips may wrap/shrink by language, but `.rpg-dialogue-question-toggle`, `.rpg-dialogue-submit`, and `.pbs-game-button--bubble` must not be shrunk by text rules.
3. PBS Computer and pet HUD visible copy must be localized for zh-TW/en/id/de/ja/th.
4. Zine split toolbar text is capped independently from the generated zine iframe content.
5. Generated zine screen body text can be larger without changing print-specific CSS.

Verification update:

- `check:visual-layout` now asserts localized PBS Computer intro, localized pet HUD copy, fixed square emoji controls, capped Japanese zine toolbar, and enlarged screen zine body text.
