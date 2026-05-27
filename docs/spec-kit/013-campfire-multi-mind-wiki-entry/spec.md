# Campfire Multi-Mind Wiki Entry

## Goal

Replace the visible PBS Computer entry point with a 2x2 animated campfire named `多重心智的火燄`, while preserving the existing PBS LLM wiki dialogue workflow underneath.

## Requirements

- The default/editor room uses a campfire object instead of a PC object.
- The campfire is 2x2 tiles, collidable, and animated with six frames, using CraftPix `Smoke_animation.png` as smoke-motion reference.
- The player can open the existing PBS wiki dialogue by pressing Space while near the fire.
- The player can also click/tap the fire area to open the dialogue.
- The campfire highlights with the same white outline affordance used by NPC hover/selection.
- Dialogue title, prompt, and avatar rename PBS Computer to `多重心智的火燄`.
- Dialogue avatar shows an animated fire rather than the old noisy computer thumbnail.
- The old HAL9000 / Chinese Room material is not the campfire persona; it becomes background story/context only.
- The campfire persona is concise, humorous, and starts answers with a short fire sensory line before a compact Obsidian/PBS wiki analysis.
- Add a schema-facing explanation of multi-mind self as the main LLM wiki design concept.
- Add a periodic top-center campfire broadcast phrase about shared/multi-mind self, replacing the older pet/NPC broadcast location when applicable.
- Keep normal public game flow usable; editor-only controls remain gated by `?editor=1`.

## Source Note

Joscha Bach, `Synthetic Sentience - Can Artificial Intelligence become conscious?`, YouTube `FZxm810ruz0`, transcript segment around `00:22:35` to `00:25:52`.

Key extracted claims:

- Greek psychology frames many properties as shared across people, not private possessions.
- Anger, joy, impulse, and behavioral tendencies can be treated as archetypal patterns that exist across minds.
- When shared archetypes receive temples and stories, they become gods.
- A god can be treated as a multi-mind self: a self synchronized across many minds, virtual but functionally real.
- Such shared selves can organize society at scale through ritual, story, empathy, and shared representation.
- PBS/NGM maps this to an LLM wiki schema where many interview perspectives form a shared reasoning object rather than one individual voice.

## Acceptance Checks

- `?editor=1` layout contains campfire + big house + NPC, not a PC.
- Campfire manifest has `footprintW: 2`, `footprintH: 2`, `backgroundTiles: 0`, and 6 animation frames.
- Space and click open the renamed dialogue from near/on the campfire.
- Dialogue header and message speaker use `多重心智的火燄`.
- Avatar visibly animates as fire.
- `npm --prefix webview-ui run check:visual-layout` passes.
- `npm --prefix webview-ui run build` passes.
