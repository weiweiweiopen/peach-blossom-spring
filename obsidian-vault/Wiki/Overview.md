---
type: wiki-overview
status: active
sourceRefs:
  - obsidian-vault/Schema/llm-wiki-maintainer.md
---

# PBS LLM Wiki Overview

The PBS LLM Wiki is the compiled, cited, interlinked markdown layer between immutable sources and future creative or research outputs.

## Layers

- Public / Reading Layer: root notes such as [[Home]], [[Start Here]], [[Association Map]], [[Long Notes]], [[Questions]], [[Concepts]], [[Characters and NPCs|Characters / NPCs]], and [[Zines]].
- Association / Semantic Layer: compiled wiki notes plus semantic/entity bridge layers that explain why pages connect.
- Evidence / Raw Source Layer: canonical source archives and indexes under `obsidian-vault/Sources/`.
- Raw and curated sources remain the source of truth in `obsidian-vault/Sources/` and related source-card structures.
- PBS semantic and entity layers remain bridge layers for source-derived categories, people, places, times, tools, concepts, and events.
- The wiki layer contains durable notes maintained by agents: concepts, methods, materials, theories, social forms, projects, comparisons, and syntheses.
- Schema files tell future agents how to ingest, query, lint, cite, and update the wiki.

## Association Language

Use association / 聯想 for public-facing navigation. Existing `daydream` names are legacy/internal names for current folders, exports, and runtime conventions; do not bulk rename them without a separate migration plan.

## PBS-Specific Rule

Public Daydream, zine, scene, game, and artwork body text must stay clean. Backend, provenance, source-card, debug, workflow, and citation language belongs in wiki notes, schema, logs, colophons, or internal metadata.

## Maintenance Loop

1. Read `Wiki/index.md` and relevant schema.
2. Open sourceRefs before making factual claims.
3. Create or update the smallest set of compiled notes.
4. Add cross-links to related notes and source-facing bridge layers.
5. Update `Wiki/index.md`.
6. Append to `Wiki/log.md`.

## Lint as Terrain Discovery

PBS lint checks for contradictions, stale claims, missing citations, orphan pages, and missing cross-links. It also identifies knowledge-terrain gaps: repeated motifs or relation neighborhoods in sources that have not yet become durable wiki nodes.
