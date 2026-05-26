# Spec 008: Zine, Schema, Typography Repair

Status: active repair

## Problem

The previous fixes made the UI mechanically testable, but the rendered result is still not acceptable:

- The zine retrieval path is displayed as raw JSON, which reads like an engineer report instead of a zine page.
- Schema still contains obsolete "Why?" gameplay language from an older design.
- Schema layout is visually weak, monolingual, and its title wraps vertically in the split-panel chrome.
- Chinese and Latin text still render at visibly different sizes inside the same UI surfaces.
- Button/input heights still diverge when text scale changes.
- The zine article generator drifts into filler sections instead of producing research-seminar style insight grounded in evidence.
- Question Pet / Tamagotchi concept is not yet connected to lint/question-maturity behavior.

## Required Outcomes

### 1. Zine Trace As Zine Page

- Replace raw JSON trace output with compact prose/cards.
- Keep full trace information, but group it into readable sections:
  - question / seed
  - interpretation
  - search terms
  - source families
  - entry notes
  - matched pages
  - linked paths
  - deep-read pages
  - what the writer used
  - validation / caveats
- Use designed compact layout, not a monospace JSON block.
- Must fit visually as a zine appendix page and not dominate the article.

### 2. Current Schema Page Only

- Remove obsolete "Why?" wording from Schema intro and UI text where it describes current gameplay.
- Current gameplay description:
  - player explores Peach Blossom Spring
  - player talks to NPC interview memories
  - player asks PBS Computer / LLM Wiki questions
  - generated zines connect evidence across wiki/source layers
  - Question Pet turns questions into lint/maturity signals
- Schema page must be multilingual for `zh-TW`, `en`, `id`, `de`, `ja`, `th`.
- Split-panel title must remain one line and match other window title scale.
- Controls should visually match the game/zine frame: pixel borders, compact cards, no oversized academic wall of text.

### 3. Typography Strategy

- Stop mixing Latin pixel font and CJK fallback at incompatible visual sizes inside the same sentence.
- Protected runtime UI should use a single per-language font stack, not interleaved fallback stacks that make mixed-language text jump in size.
- Prefer system UI fonts for dense multilingual text surfaces if the pixel font cannot support equal visual scale.
- Keep emoji/icon controls geometrically fixed.
- Text input and icon buttons in dialogue footers must have identical rendered height.
- Chinese, English, Indonesian, German, Japanese, and Thai UI text must use comparable visual size by role, not by raw CSS px only.

### 4. Zine Writing Mechanism

- Zine output should read like a research seminar note / short position paper:
  - identifies a fuzzy player question
  - clarifies what the archive can and cannot answer
  - uses evidence to support, contest, or redirect the question
  - finds meaningful cross-knowledge-system links
  - proposes future research directions
- Avoid filler sections that merely satisfy a template.
- Avoid forcing material/making/protocol language unless the query and evidence actually warrant it.
- Prompt/schema/lint should prioritize insight, counter-evidence, caveats, and research potential.

### 5. Question Pet As Lint Medium

- Add a first visible connection between Question Pet and lint/question maturation.
- The pet should represent question maturity rather than only decorative simulation.
- Initial slice can be local/static:
  - show a lint/maturity card for the current pet question
  - include signals such as specificity, evidence readiness, cross-system potential, and next revision
  - no backend required yet.

## Verification

- Static guard must check:
  - no raw `JSON.stringify(trace, null, 2)` zine trace rendering.
  - Schema copy does not contain obsolete `Why?` current-flow wording.
  - Schema copy exists for all supported languages.
  - UI system defines per-language font stacks and fixed footer heights.
- Build must pass: `npm --prefix webview-ui run build`.
- Visual guard must pass: `npm --prefix webview-ui run check:visual-layout`.

## Notes

- Screenshot QA from Spec 007 is not sufficient for this repair because it missed perceptual font-size problems. Keep it as a regression tool, but do not treat it as proof that typography is visually correct.
- Do not commit unrelated dirty files or deleted thronglet assets.
