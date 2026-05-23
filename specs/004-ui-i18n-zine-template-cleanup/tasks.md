# Tasks

## Phase 0 — Preflight And Audit

- [ ] T001 Inspect dirty tree and avoid unrelated changes.
- [ ] T002 Confirm supported locales and locale registry.
- [ ] T003 Find all title/subtitle render sites.
- [ ] T004 Find all peach menu and language menu render sites.
- [ ] T005 Find all square close/window controls and speech-bubble action controls.
- [ ] T006 Find mobile and desktop minimized HUD code paths.
- [ ] T007 Trace every zine/public artifact generation trigger.
- [ ] T008 Identify old fixed seed/public short text/public note mechanisms and files.

## Phase 1 — UI Template Contracts

- [ ] T010 Write layout constitution and primitive ownership map.
- [ ] T011 Define CSS layer order: base, tokens, typography, primitives, components, utilities, overrides.
- [ ] T012 Define canonical square window-control template.
- [ ] T013 Define canonical speech-bubble action-button template.
- [ ] T014 Apply square template to all game window open/close controls.
- [ ] T015 Make close `X` slightly smaller than its square button.
- [ ] T016 Apply speech-bubble template only to peach menu, globe/language menu, wiki button, and talk button.
- [ ] T017 Remove competing page-specific button shape rules.
- [ ] T018 Replace hard-coded primitive spacing/border/shadow/z-index values with shared tokens.
- [ ] T019 Add audit notes for any remaining override with reason and owner.

## Phase 2 — Copy, Home, Menus, i18n

- [ ] T020 Change Traditional Chinese primary title to `桃花源`.
- [ ] T021 Change all main-title subtitles to `Dipatching a LLM wiki tamagotchi`.
- [ ] T022 Add peach menu to home screen.
- [ ] T023 Ensure language menu is present on home screen.
- [ ] T024 Make peach menu dropdown distance/overlap/z-index match language menu.
- [ ] T025 Restyle peach menu to match language menu layout/colors.
- [ ] T026 Remove peach menu close button.
- [ ] T027 Replace archive-tree/central-tree wording with `🍑` identity.
- [ ] T028 Rename `about` to `schema` and move it to first menu item.
- [ ] T029 Complete all locale keys in zh-TW, en, id, de, ja, th.
- [ ] T030 Run `npm run check:i18n`.
- [ ] T031 Restore localized `home.title` values for every locale; normalize visual size with CSS tokens instead of replacing titles with English.
- [ ] T032 Ensure the Chinese creator CTA yellow button is Chinese-only, with no English mixed into the visible zh-TW string.

## Phase 3 — Multilingual Pixel Typography

- [ ] T040 Audit existing `@font-face`, `size-adjust`, and font tokens in `index.css`.
- [ ] T041 Define script/language-aware pixel/fallback font stacks.
- [ ] T042 Normalize perceived sizes for CJK, Japanese, Thai, Latin, German, and Indonesian.
- [ ] T043 Replace one-off component font sizes with shared typography tokens where practical.
- [ ] T044 Verify mixed-script menu/title/HUD/zine samples visually.
- [ ] T045 Reduce previous oversized desktop/mobile UI typography by 20%.
- [ ] T046 Normalize home title size to English visual baseline across all languages.
- [ ] T047 Isolate emoji size from text scaling.
- [ ] T048 Add compact script scale tokens for zh-TW, ja, and th across HUD, NPC bubbles, pet panel, dialogue, home, and menu controls.
- [ ] T049 Verify English remains the canonical visual baseline after compact script scaling.
- [ ] T049A Rebalance compact script scale so zh-TW/ja/th are not globally too small compared with English.

## Phase 4 — Electronic-Pet HUD

- [ ] T050 Compare desktop minimized HUD with mobile minimized HUD.
- [ ] T051 Make desktop minimized HUD use mobile layout family.
- [ ] T052 Increase/token-align desktop minimized HUD typography.
- [ ] T053 Verify desktop and mobile HUD do not obscure core controls.
- [ ] T054 Verify HUD typography after 20% rollback remains readable.

## Phase 4B — Dropdowns, Emoji, Window Controls, Spawn

- [ ] T055 Close home language/peach dropdowns by default.
- [ ] T056 Restore dropdown placement so panels do not cover trigger buttons.
- [ ] T057 Make peach/globe/wiki emoji use one size token.
- [ ] T058 Make NPC wiki button emoji-only.
- [ ] T058A Contain native color emoji in a fixed `.pbs-emoji-control` wrapper with overflow clipping and optical scale.
- [ ] T058B Restore NPC dialogue wiki button emoji from `📖` to `📚`.
- [ ] T058C Verify peach/globe/wiki emoji bounding boxes in en, zh-TW, ja, and th.
- [ ] T058D Restore original button hit-area dimensions after emoji/script fixes.
- [ ] T058E Align top-right peach/globe trigger heights and top edges.
- [ ] T058F Make home peach menu use the same vertical template as the in-game peach menu.
- [ ] T059 Consolidate all X/expand/minimize buttons onto the square window-control primitive.
- [ ] T059A Center X glyph optically in the square primitive.
- [ ] T059B Spawn player on walkable tile nearest map center.

## Phase 5 — Zine Trigger Cleanup

- [ ] T060 Remove automatic/free zine generation triggers.
- [ ] T061 Remove timed public short text/public note popup triggers.
- [ ] T062 Delete or disconnect old fixed seed sentence generation files.
- [ ] T063 Ensure stale localStorage/session artifacts do not auto-open.
- [ ] T064 Keep manual wiki-button generation working.
- [ ] T065 Add or update tests/smoke checks for no idle auto-zine.

## Phase 6 — Zine Layout And Structure

- [ ] T070 Simplify article body frame nesting.
- [ ] T071 Improve article line length on desktop.
- [ ] T072 Improve article line length on mobile.
- [ ] T073 Frame reading path / generation path as separate system section.
- [ ] T074 Frame like/dislike controls as separate system section.
- [ ] T075 Audit prompt/schema fields for every page index/title/body.
- [ ] T076 Fix later pages falling back to `篇章`.
- [ ] T077 Add validation for missing zine section index/title/body fields.
- [ ] T078 Define desktop zine template.
- [ ] T079 Define mobile zine template.

## Phase 7 — Verification

- [ ] T090 Audit duplicate primitive CSS definitions outside owner files.
- [ ] T091 Audit hard-coded primitive values that should use tokens.
- [ ] T092 Run `npm run check:i18n`.
- [ ] T093 Run `npm --prefix webview-ui run test`.
- [ ] T094 Run `npm --prefix webview-ui run build`.
- [ ] T095 Smoke test desktop viewport.
- [ ] T096 Smoke test mobile viewport.
- [ ] T097 Smoke test idle state for no unsolicited zine.
- [ ] T098 Smoke test manual wiki-button zine generation.
- [ ] T099 Final report with changed files, commands, outputs, blockers, and pass/fail by phase.
