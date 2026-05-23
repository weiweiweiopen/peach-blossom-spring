# Implementation Plan

## Phase 0: Preflight And Audit

- Inspect `git status --short` and avoid unrelated changes.
- Confirm locale registry and supported language list.
- Map all title/subtitle render sites, menu render sites, HUD render sites, window controls, and zine generation triggers.
- Identify all old automatic/free public-note or public-short-text paths.

## Phase 1: Template Contracts

- Define the layout constitution before touching individual components.
- Choose owner files/components for each primitive and record them in the contract.
- Split CSS responsibilities into base/tokens/typography/primitives/components/utilities/overrides, even if implemented inside the existing CSS file first.
- Create/centralize UI tokens for square window controls and speech-bubble action controls.
- Replace page-specific close/menu button styling with the centralized templates.
- Add code comments only at the template boundary explaining that these are the canonical visual contracts.
- Verify exception list: peach menu, globe/language menu, wiki button, talk button.

## Phase 2: Naming, Home, Menus, And i18n

- Update title/subtitle keys and render paths.
- Add home peach menu and home language menu if missing.
- Rework peach menu to share language-menu dropdown behavior and remove close button.
- Update peach menu content and order: schema, latest news, NGM e-book, The Map.
- Complete locale keys across all supported languages.
- Run and, if needed, strengthen i18n checks for nested keys and visible hard-coded text.

## Phase 3: Typography System

- Audit current font-face, fallback, `size-adjust`, and UI font tokens.
- Define language-aware font stacks and tokenized sizes for title/subtitle/body/menu/HUD/zine.
- Avoid one-off font-size fixes in individual components.
- Validate mixed Chinese/English/Thai/Japanese/German/Indonesian text in the same UI levels.

## Phase 4: HUD Responsive Template

- Compare mobile minimized HUD and desktop minimized HUD markup/classes.
- Make desktop minimized HUD use the mobile layout family with desktop-safe placement.
- Raise or token-align HUD font sizes where too small.

## Phase 5: Zine Trigger Cleanup

- Trace all calls to zine/daydream/public artifact generators.
- Remove or disable every non-manual generation path.
- Delete stale seed/public-short-text code only when no current import/test depends on it.
- Ensure existing localStorage artifacts do not auto-open as new generated windows.
- Add regression coverage or smoke checks for idle no-auto-zine behavior.

## Phase 6: Zine Layout And Structure

- Simplify article HTML/CSS to reduce nested frames and improve line length.
- Move reading/generation path into a separate framed system section.
- Move like/dislike feedback into a separate framed system section.
- Update prompt/schema/renderer so every generated page has index/title/body.
- Replace silent `篇章` fallback with structured validation or localized designed fallback.
- Define desktop and mobile zine templates sharing the same schema and typography tokens.

## Phase 7: Verification

- Run CSS governance audit searches for duplicate primitive definitions.
- Run `npm run check:i18n`.
- Run `npm --prefix webview-ui run test` where affected tests exist or add targeted tests.
- Run `npm --prefix webview-ui run build`.
- Smoke test desktop and mobile viewport flows: home, language menu, peach menu, HUD minimized, manual wiki zine, idle no-auto-zine.
- Record any residual visual risks with screenshots or exact viewport notes.

## Completion Rule

Do not claim implementation complete until title/subtitle, menus, button templates, i18n, typography, HUD, zine trigger cleanup, and zine layout/structure all pass verification or have explicit blockers.
