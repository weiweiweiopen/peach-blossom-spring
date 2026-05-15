# UI Editing Rules

Peach Blossom Spring is a pixel-art interface with shared systems for layout, controls, and typography. Keep UI changes professional, predictable, and scoped.

## Scope guardrails

- Small UI fixes must stay scoped to the exact UI being repaired.
- Do not change unrelated files, map data, persona content, NPC logic, pet movement logic, or unrelated styles/content.
- Prefer shared layout systems over one-off nudges, offsets, or magic numbers.
- All always-visible top-right global controls must use `.floating-ui-layer`.
- Use the centralized typography tokens and utility classes (`.type-display`, `.type-title`, `.type-heading`, `.type-subheading`, `.type-body-large`, `.type-body`, `.type-label`, `.type-caption`, `.type-micro`) instead of introducing scattered font-size values.

## Required checks

- Test mobile at approximately 390px wide.
- Test iPhone safe-area behavior for top/right/bottom insets.
- Verify floating controls do not overlap language, chat, close, zoom, embedded-link, conversation, pet-detail, or creation controls.
- Verify pet UI changes do not affect pet animation or movement logic.

## Final report requirements

Every final UI report must list:

- Changed files.
- Reason for each change.
- Tests performed.
- Known risks or follow-up notes.
