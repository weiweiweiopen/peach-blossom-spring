# Layout Governance Contract

## Goal

Keep Peach Blossom Spring layout maintainable after this cleanup. Future feature work should assemble approved primitives and tokens instead of creating new one-off CSS.

## Required Architecture

- One token layer for spacing, typography, border, shadow, z-index, breakpoints, menu offsets, HUD sizing, and zine widths.
- One primitive layer for reusable shapes and containers.
- Feature components may only add content-specific placement and state styling.
- Responsive behavior must be handled by primitive/container templates before feature-level overrides.

## Primitive Ownership Map

Implementation must fill this table before code changes are considered complete:

| Primitive | Owner file/component | Allowed consumers | Notes |
| --- | --- | --- | --- |
| App shell | `webview-ui/src/App.tsx`, `webview-ui/src/index.css` | runtime world, boot overlays | shell placement and floating layers live here |
| Title block | `webview-ui/src/components/RetroBootScreen.tsx`, `webview-ui/src/i18n/index.ts` | boot/home title slots | title/subtitle contract is enforced by governed i18n overrides |
| Dropdown menu | `webview-ui/src/App.tsx`, `webview-ui/src/index.css` | peach/language menus | shared offset/overlap behavior via `.global-language-options` / `.global-menu-options` |
| Square window control | `webview-ui/src/index.css` | all window open/close controls | `.pbs-frame-action` owns close X sizing |
| Speech-bubble action button | `webview-ui/src/index.css` | peach/globe/wiki/talk only | `.pbs-game-button--bubble`, `.global-language-trigger`, `.global-archive-trigger` |
| Modal/window panel | `webview-ui/src/index.css` | dialogs, archive, zine wrappers | shared pixel frame classes and z-index tokens |
| HUD minimized panel | `webview-ui/src/App.tsx`, `webview-ui/src/index.css` | pet HUD | `.question-status-panel-minimized` follows mobile compact HUD family |
| Zine article frame | `webview-ui/src/daydream/officialTemplateRenderer.ts` | public zine HTML | prose width and article frame CSS live in `zineLayoutGovernanceCss()` |
| Zine system frame | `webview-ui/src/daydream/browserAssociationGenerator.ts`, `webview-ui/src/daydream/associationFeedback.ts` | reading path, feedback | `.zine-system-frame` separates system sections from prose |
| Responsive stack/container | `webview-ui/src/index.css` | home, HUD, zine, menus | media queries and tokenized readable scales live here |

## Anti-Patterns

- Adding `font-size` in a component because one locale looks wrong.
- Creating a new close button class for a single modal.
- Copying language-menu CSS into peach-menu CSS instead of sharing a primitive.
- Adding z-index numbers directly in feature CSS.
- Solving mobile layout by shrinking text below the typography token.
- Allowing generated HTML to introduce nested frames that compete with the zine template.

## Review Checklist

- Does this change use existing primitives?
- If it adds a new primitive, was the contract updated first?
- Are all hard-coded visual values justified or tokenized?
- Does it preserve mixed-script readability without per-string hacks?
- Does desktop/mobile behavior come from shared responsive templates?
- Can a future engineer find the owner file within 30 seconds?
