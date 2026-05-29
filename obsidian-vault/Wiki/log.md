---
type: wiki-log
status: active
sourceRefs:
  - obsidian-vault/Schema/llm-wiki-maintainer.md
---

# PBS LLM Wiki Log

Append-only chronological record of wiki maintenance. Use entries such as `## [YYYY-MM-DD] ingest | Title`, `## [YYYY-MM-DD] query | Question`, `## [YYYY-MM-DD] lint | Scope`, or `## [YYYY-MM-DD] planning | Scope`.

## [2026-05-24] planning | Karpathy LLM Wiki first-pass spine

- Created OpenCode-authored spec-kit plan under `specs/005-pbs-karpathy-llm-wiki-opencode-authored/`.
- Added root wiki navigation, overview, log, compiled-note category READMEs, and maintainer schema.
- Updated schema and lint checklist to include PBS knowledge-terrain gap discovery.
- Did not create pilot notes because sourceRefs were not verified.

## [2026-05-24] planning | layered public reading entrance

- Added root-level reading pages for Home, Start Here, Association Map, Long Notes, Questions, Concepts, Characters / NPCs, and Zines.
- Documented three layers: Public / Reading, Association / Semantic, and Evidence / Raw Source.
- Kept raw source folders intact and did not rename legacy/internal `daydream` paths.

## [2026-05-29] lint | terrain-gap review path

- Added a local-only terrain-gap lint path for motifs and relation neighborhoods that lack durable compiled wiki nodes.
- Kept Question Pet terrain state local-first: game broadcasts may surface reviewed/candidate gaps, but runtime private dialogue is not auto-written to Obsidian.
- Routed zine feedback toward reviewed zine/question/log destinations instead of raw source pages.

## [2026-05-29] build-note | SGMK DIY electronics workshop kits

- Created `obsidian-vault/Wiki/Methods/sgmk-diy-electronics-workshop-kits.md` as source-bounded draft.
- Used 5 local source cards; raw Sources were not mutated.

## [2026-05-29] lint | evidence lint

- Wrote `obsidian-vault/Wiki/Logs/evidence-lint-2026-05-29.md`.
- Found 1 warnings and 0 errors in compiled Wiki folders.

## [2026-05-29] planning | 019 pet growth and visualization follow-up

- Completed the first review pass for Question Pet growth states and PBS cultural terrain visualization.
- Recorded follow-up under `docs/spec-kit/019-pbs-llm-wiki-hybrid-rag-evidence-linter/follow-up.md`.
- Kept runtime pet growth local-first and did not route private dialogue into raw source folders.

## [2026-05-29] diagram | PBS runtime architecture canvas

- Added `obsidian-vault/PBS Runtime Architecture.md` as the concise vault/runtime/zine/NPC process note.
- Added `obsidian-vault/Schema/obsidian-app-integration.md` to document the native Canvas/Graph-first integration decision.
- Replaced `obsidian-vault/PBS Wiki Visual Map.canvas` with the current Obsidian, wiki tooling, zine generation, NPC dialogue, review, and pet growth system diagram.
