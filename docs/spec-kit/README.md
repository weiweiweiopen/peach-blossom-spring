# PBS Spec-Kit Index

Spec-kit is the project planning ledger for scoped PBS changes. Each folder should describe one implementation slice: what problem it solves, what files/flows it may touch, what it must not change, and how to verify it.

## How Spec-Kit Works

1. Create or choose a spec folder before implementation.
2. Write `spec.md` for intent, constraints, non-goals, and acceptance criteria.
3. Add `plan.md` when a task needs staged architecture or migration steps.
4. Add `tasks.md` when the work has checklist-style execution steps.
5. Implement the code/docs/assets in the repo.
6. Run the verification commands listed in the spec.
7. Mark the spec status and tasks when complete.
8. Keep review artifacts separate from raw evidence; specs should not mutate `obsidian-vault/Sources/` automatically.

## Folder Map

| Folder | Responsibility |
|---|---|
| `004-wiki-tool-llm-wiki-vault-alignment-mixed` | Mixed first-pass LLM Wiki alignment: vault structure, Karpathy-style wiki model, source/schema/wiki planning. |
| `005-zine-pdf-feedback-buttons` | Zine feedback controls and PDF/download behavior. |
| `006-ui-multilingual-system-contract` | Multilingual UI typography, button geometry, visual QA contract. |
| `007-mixed-zine-trace-schema-control-room` | Mixed zine trace display, schema control room, news/menu cleanup, generation controls. |
| `008-mixed-zine-trace-schema-typography-quality-repair` | Mixed repair for zine trace prose, schema page, typography consistency, zine writing quality. |
| `009-editor-url-gated-layout-entry` | URL-gated layout editor entry via `?editor=1`. |
| `010-editor-pixel-office-compat-mode` | Pixel-office editor compatibility mode and editor interaction priority. |
| `011-mixed-editor-compact-map-asset-ingestion` | Mixed compact editor map plus repository asset ingestion/CraftPix pipeline. |
| `012-editor-craftpix-compact-room-ram-aware` | RAM-aware CraftPix compact room and selective static asset slicing. |
| `013-campfire-multi-mind-wiki-entry` | Campfire as multi-mind PBS Wiki entry point. |
| `014-mixed-editor-campfire-mobile-npc-fixes` | Mixed editor, campfire, mobile dialogue/zine, NPC appearance, and save/collision fixes. |
| `015a-zine-print-16-page-signature-target` | Zine print target around 16 pages / 8-page signature logic. |
| `015b-wiki-tool-obsidian-terrain-gap-broadcast` | Wiki tool terrain-gap lint and in-world thought-gap broadcast planning. |
| `016-campfire-collision-dialogue-polish` | Campfire bounds, collision, talk prompts, and dialogue avatar/input polish. |
| `017-zine-16-page-quality-repair` | Repair 16-page zine quality without blank/filler pages; restore coherent four-section structure. |
| `018-mixed-repo-size-editor-association-migration` | Mixed repo-size cleanup, local-only editor rules, and staged daydream-to-association migration. |
| `019-wiki-tool-hybrid-search-build-note-evidence-linter` | Wiki tool phase one: hybrid search, build-note, evidence lint, sample compiled note, pet/visualization follow-up. |
| `020-wiki-tool-zine-runtime-rag-cross-community-gaps` | Wiki tool runtime RAG: export compiled Wiki JSON, feed zine prompts, cross-community gap reports. |
| `021-zine-repair-feedback-reporting` | Replace binary zine reactions with repair feedback, report artifacts, and evidence-bound regeneration. |
| `022-ingest-graphrag-pipeline-reset` | Downgrade legacy player seed pipeline and add real ingest/query/routing-gap Wiki tooling. |
| `023-pet-lint-hud-npc-zine-feedback-vault-loop` | Connect lint/thought gaps to the Question Pet HUD, fix NPC talk bubbles, and route zine feedback into vault review structure. |

## Naming Rules

- Prefix with the sequence number: `020-...`.
- Include the domain first when possible: `zine`, `editor`, `campfire`, `ui`, `wiki-tool`.
- Add `mixed` when the folder combines multiple unrelated or only loosely related workstreams.
- Add `wiki-tool` when the spec changes `scripts/wiki_tool.py`, Wiki export/lint behavior, or Obsidian review artifacts.
