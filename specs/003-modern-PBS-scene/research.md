# Research: Modern PBS Integrated Repair

## Decisions
- Canonical repo: `/Users/weiweiweiwei/Documents/Projects/peach-blossom-spring-latest`.
- Canonical spec dir: `specs/003-modern-PBS-scene/`.
- Spec Kit: github/spec-kit v0.8.11, CLI 0.8.11.
- Use existing pixel-office assets first; no large art pack without approval.
- Public zines use official HTML template 1 only.
- Question Page is the electronic pet body; Concept Page is semantic terrain.

## Risks
- Zine retry language can drift from original request language.
- Writer/validation failure can be hidden by local fallback success.
- Final zine HTML may be validated before appended sections.
- `source graph` and localized process terms may leak.
- `default-layout-30.json` may become default via asset selection.
- Existing scene counts can pass while visual concept fails.
- Vault lint success does not prove runtime source-bounded dialogue.

## Dedicated reports
- `zine-repair-audit-report.md`
- `pixel-office-scene-rewrite-report.md`
- `question-concept-page-design-report.md`
- `complete-spec-kit-analysis-report.md`
