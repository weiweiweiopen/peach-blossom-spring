# Spec 016: Campfire, Collision, Dialogue Polish

Status: active repair

Deployment note: this repair is expected to deploy through GitHub Pages on every push to `main`.

## Problem

- Campfire interaction is offset, so players must stand on the wrong side to open dialogue.
- Trees and furniture can be walked through when background footprint rows are ignored.
- The nearby talk prompt is too large compared with NPC name tags.
- Campfire dialogue avatar sizing differs from the player avatar frame.
- Dialogue input text is larger than body text in several language-specific overrides.
- Campfire face pixels are too small for the current NPC/pet pixel density.

## Required Outcomes

- Campfire interaction should use the actual campfire furniture bounds from the loaded layout.
- Players should be able to trigger the campfire dialogue from around the object, not only from the right side.
- Furniture and tree footprints should block walking across their full footprint.
- Nearby talk prompts should match NPC name-bubble scale and work consistently across languages.
- Campfire and player dialogue avatar frames should use one shared size; the campfire image may be centered and clipped.
- Dialogue input text should match body text size.
- Campfire eyes should be 2x2 pixel clusters and mouth pixels should be more legible.

## Verification

- Static guard must check compact talk prompt styling, shared avatar frame sizing, field/body font parity, full furniture collision, and DeepSeek token limits.
- Build must pass: `npm --prefix webview-ui run build`.
- Visual guard must pass: `npm --prefix webview-ui run check:visual-layout`.
