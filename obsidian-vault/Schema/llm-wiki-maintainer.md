---
type: schema
status: active
sourceRefs:
  - obsidian-vault/Schema/frontmatter-schema.md
  - obsidian-vault/Schema/lint-checklist.md
---

# LLM Wiki Maintainer Schema

## Role

Future agents maintain the PBS compiled wiki layer. They may create and update markdown notes in `obsidian-vault/Wiki/` and schema guidance in `obsidian-vault/Schema/`, but raw sources and public artifact body text must remain protected.

## Layer Rules

- Raw sources are immutable source of truth.
- Source-card, Daydream, semantic-layer, and entity-layer conventions are PBS-native infrastructure and must be preserved.
- The wiki is a compounding markdown artifact: it summarizes, cross-links, compares, and synthesizes verified source material.
- Schema guides ingest, query, lint, citation, and update workflows.

## Ingest Workflow

1. Identify the source or source set and read the relevant local files.
2. Extract claims, entities, concepts, methods, materials, social forms, and uncertainties.
3. Update existing compiled notes before creating new ones when the topic already exists.
4. Create new notes only with verified sourceRefs and evidence.
5. Update `Wiki/index.md`.
6. Append an entry to `Wiki/log.md`.

## Query Workflow

1. Read `Wiki/index.md` first.
2. Open the relevant compiled notes and their sourceRefs.
3. Answer with citations to wiki notes and sourceRefs.
4. If the answer is durable, file it as a comparison or synthesis note.
5. Update index and log when filing durable work.

## Lint Workflow

Check for:

- Contradictions between compiled notes and sourceRefs.
- Stale claims superseded by newer verified sources.
- Missing sourceRefs or evidence blocks.
- Orphan pages and missing inbound links.
- Missing cross-links between related concepts, methods, materials, theories, social forms, projects, and syntheses.
- Knowledge-terrain gaps: repeated motifs or relation neighborhoods visible in sources but not yet represented as durable compiled notes.

## Terrain-Gap Protocol

For a candidate motif such as `fermentation / 發酵 / biochromes / living material`:

1. Treat it as a candidate only.
2. Open relevant source pages before creating any note.
3. Verify evidence and sourceRefs.
4. Create or update the durable note only after verification.
5. Link it to methods, materials, theories, social forms, projects, and syntheses where evidence supports those links.
6. Update `Wiki/index.md` and append to `Wiki/log.md`.

## Public Artifact Firewall

Do not place backend/tool/provenance/workflow/debug/source-card language into public Daydream, zine, scene, game, or artwork body text. Keep those details in wiki notes, schema, logs, colophons, or internal metadata.
