# Editor Campfire Mobile Fixes

## Goal

Fix the regressions reported after the multi-mind campfire deployment without changing the public non-editor game flow.

## Requirements

- The campfire wiki entry must occupy at least a 4x4 tile footprint and keep click/Space interaction reliable.
- Campfire hover affordance must follow the sprite silhouette rather than drawing a square box.
- The compact editor house must be house-only, without grass, stones, or fence in the sprite crop; collision must match the visible house footprint.
- Newly imported CraftPix decoration/furniture items must be selectable and removable in editor mode.
- Map Size UI must show one clear current numeric value and one apply control.
- CraftPix grass must be available as a floor pattern.
- Campfire intro/broadcast/prompt text must be multilingual across supported languages.
- Generated dialogue text must auto-scroll as new content arrives.
- Mobile dialogue/zine UI must stay readable and controls must remain tappable.
- NGM interviewee NPCs must use real-gender-distinct appearances, with at least 16 distinct NPC character assets. If a body template is reused, skin or clothing color must distinguish it. Marc Dusseiller must wear a yellow shirt and black pants.
- Campfire art must be native 64px pixel art, not a scaled 32px image, with an organic animated flame shape.
- Compact editor floor must default to grass across the whole playable floor area; users must not paint it tile-by-tile.
- Mobile dialogue type scale must fit normal sentence-length questions and keep avatar animation visible.
- Mobile dialogue panels should use full viewport height, with action buttons aligned to the right.
- Mobile zine panels should cover top HUD/language controls and inject a phone-readable one-column zine style without changing desktop zine layout.

## Non-Goals

- Do not import whole CraftPix animation sheets into the furniture catalog.
- Do not expose editor-only UI on normal public play unless `?editor=1` is present.
- Do not stage unrelated dirty workspace changes.

## Validation

- `npm --prefix "webview-ui" run check:visual-layout`
- `npm --prefix "webview-ui" run build`
- `npm --prefix "webview-ui" run check:screenshot-qa`
- Manual smoke for `/?editor=1`: select/delete CraftPix item, resize map UI visible, house collision visually aligned, campfire 4x4 and opens dialogue.
