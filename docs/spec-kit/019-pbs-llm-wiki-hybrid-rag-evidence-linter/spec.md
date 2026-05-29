---
id: 019-pbs-llm-wiki-hybrid-rag-evidence-linter
title: PBS LLM Wiki Hybrid RAG and Evidence Linter
status: executed
sourceRefs:
  - scripts/wiki_tool.py
  - obsidian-vault/Schema/llm-wiki-maintainer.md
  - obsidian-vault/daydream-export/sourceCards.enriched.json
---

# PBS LLM Wiki Hybrid RAG and Evidence Linter

## Goal

Create first-stage local tooling for PBS as a long-term cultural knowledge base. The tool should help maintain compiled Wiki notes from local source cards, not behave like a chatbot demo and not mutate raw source folders.

## Requirements

- Add `hybrid-search` for lightweight keyword, metadata, and graph-neighbor retrieval over existing local source cards.
- Add `build-note` for source-bounded Concept/Method/Material/SocialForm/Project/Synthesis draft notes with sourceRefs, evidence, citations, related topics, and open questions.
- Add `lint-evidence` for compiled Wiki note checks: missing sourceRefs, broken local refs, thin evidence, missing citation/evidence sections, duplicate titles, and overclaiming language.
- Keep all writes local and reviewable.
- Do not re-crawl sources, delete existing data, process all sources at once, or add large dependencies.

## Non-Goals

- No automatic promotion of lint candidates to canonical synthesis.
- No automatic mutation of `obsidian-vault/Sources/`.
- No embedding/vector database dependency in this stage.

## Visualization Direction

PBS should differ from Connected Papers by mapping cultural terrain rather than academic citation similarity. Future views should support concept maps, relation graphs, timelines, community-overlap maps, and material-method-social-form networks.

## Pet Growth Direction

The Question Pet should grow from reviewed knowledge states: unresolved evidence gaps, newly cited notes, lint warnings resolved, and terrain neighborhoods manually promoted from review artifacts.

## Execution Artifacts

- CLI implementation: `scripts/wiki_tool.py`
- Sample source-bounded note: `obsidian-vault/Wiki/Methods/sgmk-diy-electronics-workshop-kits.md`
- Evidence lint report: `obsidian-vault/Wiki/Logs/evidence-lint-2026-05-29.md`
- Follow-up review: `docs/spec-kit/019-pbs-llm-wiki-hybrid-rag-evidence-linter/follow-up.md`
