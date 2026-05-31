---
type: schema
status: active
---
# PBS Source-First Maintainer Schema

## Non-negotiable rules

1. Do not use the old PBS compiled memory layer as evidence.
2. Do not use NotebookLM as canonical memory or required search tool.
3. Raw source pages in `Sources/Raw/` are source-of-truth for this prototype.
4. `Knowledge/` is retrieval/index/crawl machinery, not durable interpretation.
5. `Review/compiled-note-drafts/` is a review queue.
6. `Wiki/` is the only durable shared memory middle layer.
7. Every promoted Wiki note needs `sourceRefs` and evidence snippets.

## Workflow

```text
crawl three sources
→ index raw pages with SQLite FTS5/BM25
→ search source-backed snippets
→ draft review note
→ verify sourceRefs
→ promote to Wiki category
→ update Wiki/index.md and Wiki/log.md
```

## Source roles

- HTGWYW / KOBAKANT: e-textile, wearable technology, sensors, soft circuits, workshops, techniques.
- Hackteria: DIY/DIWO biology, open science, bioart, temporary labs, open hardware, global network.
- SGMK: mechatronic art, hackerspace culture, HOME MADE events, MechArtLab, workshops, infrastructure.
