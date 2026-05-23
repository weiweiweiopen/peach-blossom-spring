# UI Template Contract

## Layout Constitution

The UI must be managed as a small layout system, not as feature-local CSS.

Primitive owners must be recorded before implementation:

- App shell
- Title block
- Dropdown menu
- Square window control
- Speech-bubble action button
- Modal/window panel
- Electronic-pet HUD minimized panel
- Zine article frame
- Zine system frame
- Responsive stack/container

Feature files may compose these primitives. They may not redefine primitive geometry, border, shadow, z-index, typography, or breakpoints.

## CSS Layer Order

CSS must follow this order, whether kept in `index.css` or split later:

1. reset/base
2. design tokens
3. typography tokens and script-aware font correction
4. primitives
5. feature components
6. utilities
7. documented overrides

Overrides must include a short comment explaining the layout constraint.

## Token Rule

These values must come from shared tokens for governed primitives:

- spacing
- border width
- shadow offset/color
- z-index
- breakpoints
- typography size/line-height
- menu/dropdown offsets
- HUD dimensions
- zine frame widths

## Canonical Button Shapes

### Square Window Control

- Used for all game window open/close controls.
- Shape: square.
- Border: pixel border using shared token.
- Shadow: shared pixel shadow token.
- Close glyph: `X`, visually smaller than the square and centered.
- No component may create a custom competing close-button shape.
- Glyph centering must use grid/flex centering plus fixed line-height, not font baseline assumptions.

### Speech-Bubble Action Button

- Allowed only for peach menu, globe/language menu, wiki button, and talk button.
- Shape: shared speech-bubble template.
- Border, shadow, hover, focus, and active states must be shared.
- No other control may use this shape without updating this contract.

### Emoji Action Token

- Peach, globe, and wiki-book emoji actions share one tokenized emoji size.
- Emoji descendants must use this token and must not inherit menu item or title font sizes.

## Menus

- Peach menu and language menu share dropdown placement rules.
- Peach menu and language menu share color/layout family.
- Peach menu has no close button.
- Home dropdowns are closed initially.
- Dropdown panels must open below their trigger and must not overlap the trigger.
- Language menu may keep its established menu behavior unless implementation finds a shared accessible dropdown primitive that preserves the same interaction.

## Typography Tokens

- Title, subtitle, body, menu item, HUD, zine article, zine system, caption, and micro text must use shared tokens.
- Per-component manual font-size overrides are allowed only when documented as responsive layout constraints.
- Font stacks must preserve pixel aesthetics where readable and use size-adjust/line-height normalization for mixed scripts.

## Generated Code Guardrail

- Components and generated snippets must import/use the shared templates or classes.
- Do not duplicate CSS for close buttons, menu buttons, or zine system frames inside individual generated fragments.
- Public zine HTML may contain zine-specific layout CSS, but it must use the zine template contract rather than ad-hoc nested frames.
- Any newly generated visual primitive requires a contract update first.

## Governance Audit

Before completion, audit for duplicate definitions of:

- close buttons
- menu buttons
- dropdown panels
- modal/window panels
- HUD minimized panels
- zine article frames
- zine system frames

Any remaining duplicate must be removed, moved to the primitive owner, or documented as a temporary blocker.
