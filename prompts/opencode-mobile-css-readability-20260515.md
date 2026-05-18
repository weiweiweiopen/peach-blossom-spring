# OpenCode Prompt — PBS mobile readability / report overflow CSS pass

You are working in this repo:

`/Users/weiweiweiwei/Documents/Projects/peach-blossom-spring-latest`

Role: senior CSS / responsive UI engineer for a pixel-art web game. Optimize mobile readability and content dimensions while preserving the existing art direction.

## User problem

Mobile UI currently has several readability/layout issues:

- Many texts are too large on phone. This may be caused by forced universal L2 typography. Stop forcing one universal L2 size everywhere.
- Message/status bars are clipped/truncated.
- Conversation/dialog windows leave too little room for typing.
- Dialogue controls/select/input/button consume too much vertical space on mobile.
- Final report / dream report content has severe image and text occlusion on both mobile and desktop.
- Some popovers/modals overlay content without enough scrollable area or safe-area padding.

## Hard constraints

- Do NOT push or deploy.
- Do NOT delete data.
- Do NOT touch API keys, secrets, env, deployment config.
- Do NOT modify chatbot / RAG / DeepSeek / persona logic.
- Do NOT modify `data/personas.json`.
- Do NOT rewrite the UI architecture.
- Do NOT change game mechanics, multiplayer logic, NPC content, localization system, or dream/report generation logic.
- Only change typography, spacing, dimensions, overflow, responsive CSS, and if absolutely necessary tiny className/wrapper adjustments needed for layout.
- Preserve the existing pixel-art / cargo / retro aesthetic.
- Make the smallest practical patch.

## Files to inspect first

- `webview-ui/src/index.css`
- `webview-ui/src/App.tsx`
- `webview-ui/src/components/RpgDialogue.tsx`
- any report / archive / dialogue panel components or CSS referenced from those files

## Likely symptom areas from screenshots

1. Mobile game screen:
   - floating message bubbles overlap and are too large
   - character labels / Question Pet text are too large and clipped
   - bottom HUD/status row is cramped and may be truncated
   - Safari mobile viewport safe area is not respected enough

2. Dialogue / Wander & Talk panel:
   - panel almost fills phone width with too little internal breathing room
   - heading and controls too large relative to body
   - select/input/button stack consumes vertical space
   - text input area too small or missing usable typing room
   - title should be larger than body, but not dramatically larger

3. Archive / Wiki / menu panels:
   - text size too large for phone
   - overlay/popover lacks proper max-height and scroll area
   - close/header areas consume too much content space

4. Final report / Wiki Daydream report:
   - image and text are severely covered/occluded on mobile and desktop
   - report container needs safe max-width, max-height, overflow-y:auto, and image sizing
   - images should use max-width:100%, height:auto, object-fit:contain where applicable
   - long text must wrap, not disappear behind fixed bars

## Required design direction

- Use responsive `clamp()` typography instead of one forced universal L2.
- Reduce mobile font sizes across dense UI while keeping title > body.
- Suggested mobile ranges:
  - body dense UI: 12–14px
  - dialogue body: 13–15px
  - titles/headings: 15–18px
  - tiny HUD/status/meta: 10–12px
- Keep line-height readable, usually 1.25–1.45 depending on component.
- Add `min-width: 0`, `overflow-wrap: anywhere`, `word-break` only where needed for long names/URLs.
- Add mobile `max-height` + `overflow-y:auto` to modals/panels/report bodies.
- Respect `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)` for phone browser UI.
- Avoid hiding interactive controls behind fixed bottom/status bars.
- Use media queries around common phone dimensions: `max-width: 700px`, `max-height: 760px`, and maybe `max-width: 430px`.
- Maintain desktop aesthetics; do not make desktop tiny.
- Fix desktop final report occlusion too.

## Implementation tasks

### Task A — Audit typography tokens / forced L2

Find any global or broad rule forcing L2/large title styles onto too many components.

- Stop broad forced title sizing if present.
- Replace with component-specific responsive sizing.
- Titles remain bigger than body, but only slightly.

### Task B — Mobile dialogue readability

For RPG/dialogue/Wander & Talk panels:

- Ensure panel fits mobile viewport with safe padding.
- Ensure message/history area and input area both have usable space.
- Make controls stack cleanly on small screens.
- Reduce header/control font sizes on mobile.
- Give textarea/input a practical min-height.
- Avoid the Talk button or select consuming excessive vertical height.
- Add scroll to dialogue history/report areas, not the whole page when possible.

### Task C — Message/status bar truncation

For bottom status/HUD and floating message bubbles:

- Reduce dense UI font size on mobile.
- Let text wrap or ellipsize intentionally, not get clipped unpredictably.
- Increase row height/padding only as needed.
- Add safe-area bottom padding so Safari toolbar does not cover the HUD.
- Use `min-width:0` on flex children to prevent overflow.

### Task D — Report / dream report occlusion

Find final report / dream report / archive content containers.

- Give report modal/panel desktop and mobile max dimensions.
- Make report body scrollable.
- Ensure images are never larger than container:
  - `max-width: 100%`
  - `height: auto`
  - `object-fit: contain`
- Ensure text wraps and remains visible.
- Avoid fixed-height image/text blocks that clip content.
- Ensure both mobile and desktop report content are not hidden under headers/footers.

### Task E — Verify minimal scope

After edits, inspect `git diff` and confirm only CSS/dimension/layout files changed, except tiny className/wrapper changes if unavoidable.

## Tests / verification

Run:

```bash
cd "/Users/weiweiweiwei/Documents/Projects/peach-blossom-spring-latest/webview-ui"
npm test
npm exec -- tsc -b
```

If test or tsc failure is pre-existing or unrelated, report it clearly; do not fix unrelated logic.

If possible, also run or check build:

```bash
npm run build
```

## Output report

When done, report:

1. Files changed
2. What layout/readability fixes were made
3. What was deliberately NOT changed
4. Tests run and results
5. Any remaining visual risks / suggested next pass

Remember: fix mobile readability and report occlusion through typography, spacing, dimensions, overflow, safe-area, and responsive CSS. Preserve art style. Do not touch logic.
