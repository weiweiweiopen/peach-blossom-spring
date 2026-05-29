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
- Editor furniture placement must be deterministic: choosing a catalog item must immediately place that item on the next valid map click, without requiring random extra clicks or being blocked by stale Select/Pick state.
- Select must have a clear role: select existing placed furniture; clicking empty map must clear selection and return to placement when a catalog item is chosen. Pick must sample an existing placed item into the furniture placement tool.
- Saving in editor mode must update the active editor layout immediately and persist the same layout for subsequent editor sessions; it must not only affect unrelated production/public play state.
- Editor mode must not spawn or render public NGM NPCs such as Andreas; only explicit editor/test actors should appear, if any.
- Settings options that are not implemented in browser/editor mode must be hidden or disabled with a clear no-op state; Debug View must be reversible and must not trap users outside edit mode.
- Editor mode must avoid full-canvas flicker or flash-through of an alternate background when choosing furniture, painting floors, or clicking tools.
- Compact editor grass must be editable or explicitly treated as a background layer with a visible explanation; floor painting must not silently fail because a pixel background sits above the tile layer.
- The compact editor house sprite must be cropped to the visible house only; stray right-side fence/stone/path pixels must be removed from the asset and footprint/collision should stay visually aligned.
- Campfire art should visually match the NPC/house pixel density. If the source GIF is lower-resolution, upsample/detail the face and flame edges so it does not read as a different game asset pasted into the scene.

## Non-Goals

- Do not import whole CraftPix animation sheets into the furniture catalog.
- Do not expose editor-only UI on normal public play unless `?editor=1` is present.
- Do not stage unrelated dirty workspace changes.

## Validation

- `npm --prefix "webview-ui" run check:visual-layout`
- `npm --prefix "webview-ui" run build`
- `npm --prefix "webview-ui" run check:screenshot-qa`
- Manual smoke for `/?editor=1`: select/delete CraftPix item, resize map UI visible, house collision visually aligned, campfire 4x4 and opens dialogue.
- Manual smoke for `/?editor=1`: place a chair on first click after choosing it, select clears on empty click, Pick samples an existing object, Save survives refresh, Debug View exits back to editor, settings no-op controls are not misleading, no public NPCs spawn, no flicker when clicking tools, floor editing behavior is clear.
