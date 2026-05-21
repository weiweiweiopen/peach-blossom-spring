# Implementation Plan

## Phase 0: Preflight
- Read SOUL.
- Confirm host/repo/specify 0.8.11.
- Inspect `git status --short` and avoid unrelated changes.

## Phase A: Zine repair
- Fix selectedLanguage and retry language preservation.
- Enforce error/retry on writer/validation failure.
- Validate final assembled HTML after all appends.
- Enforce official template 1 and public safety terms.
- Fix split-panel layering and feedback persistence.
- Add regression tests.

## Phase B/C: Wiki, Wukir, Pet Question Pages, Concept Pages
- Verify vault folders/schema/tool commands.
- Verify Wukir files and source-bounded behavior.
- Implement/verify local-first pet Question Page memory.
- Implement/verify Concept Page schema, sourceRefs, terrain links.
- Implement/verify HUD artifact emoji reopen.

## Phase D/E: Modern PBS scene and local validation
- Protect default layout.
- Add `?modern-pbs-scene=1` and alias handling.
- Rewrite/generate pixel-office scene around central commons, nature wayfinding, perimeter zones.
- Validate counts/reachability and Safari interaction.

## Completion rule
Do not claim completion unless A, B/C, and D/E all pass or blockers are explicitly reported.
