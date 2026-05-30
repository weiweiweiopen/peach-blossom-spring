---
id: 022-ingest-graphrag-pipeline-reset
title: Ingest and GraphRAG Pipeline Reset
status: implemented
sourceRefs:
  - scripts/wiki_tool.py
  - obsidian-vault/Wiki/index.md
  - docs/spec-kit/019-wiki-tool-hybrid-search-build-note-evidence-linter/spec.md
---

# Ingest and GraphRAG Pipeline Reset

## Decision

The legacy player `seed` pipeline is no longer treated as a semantic layer, ingest source, or knowledge-memory authority. It remains only a runtime query parser and UX signal for search, zine trace, and Question Pet behavior.

## Layer Contract

```text
Player Query
-> runtime intent and search terms only

SourceCards
-> source-derived candidate evidence units from exported corpus data

Semantic Bridge
-> source-derived retrieval hints and cluster candidates

Compiled Wiki
-> evidence-backed durable notes under Wiki/Concepts, Methods, Materials, SocialForms, Projects, Comparisons, Syntheses

Review Artifacts
-> query routes, routing gaps, zine repair reports, terrain gaps, repeated questions
```

Player questions may become reviewed question candidates, but they must not automatically become source evidence, semantic bridge notes, compiled Wiki notes, or GraphRAG nodes.

## Implemented Commands

- `python3 scripts/wiki_tool.py ingest-source`: reads one local source, sourceRef set, bridge note, or focused query and writes one thicker `ingest-draft` note.
- `python3 scripts/wiki_tool.py ingest-batch`: writes review-only ingest drafts under `obsidian-vault/Review/thickened-notes/`.
- `python3 scripts/wiki_tool.py query`: reads `Wiki/index.md`, scores compiled Wiki notes, expands through wikilinks, and verifies sourceRefs.
- `python3 scripts/wiki_tool.py routing-gap-lint`: reports bridge clusters without compiled notes, compiled notes without incoming links, sourceRefs without source-backed claims, all-thin sourceRefs, and optional query-without-core-note gaps.

## Non-Goals

- Do not generate more thin `source-bounded-draft` notes as the main path.
- Do not run zine smoke tests for this slice.
- Do not mutate `obsidian-vault/Sources/`.
- Do not treat public player text as durable evidence.

## Acceptance Checks

```bash
python3 scripts/wiki_tool.py ingest-source --query "e-textile summer camp temporary commons" --type Method --title "E-textile summer camp as temporary commons" --output obsidian-vault/Review/thickened-notes/e-textile-summer-camp-as-temporary-commons.md --overwrite
python3 scripts/wiki_tool.py query --query "e-textile summer camp as temporary commons"
python3 scripts/wiki_tool.py routing-gap-lint --query "e-textile summer camp as temporary commons"
```

The outputs must show sourceRefs, source readability warnings, actual Wiki traversal where links exist, and routing gaps when compiled Wiki clusters are still missing.
