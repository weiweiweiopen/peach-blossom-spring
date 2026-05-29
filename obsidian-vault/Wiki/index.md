---
type: wiki-index
status: active
sourceRefs:
  - obsidian-vault/Schema/llm-wiki-maintainer.md
---

# PBS LLM Wiki Index

This is the content-oriented navigation file for the compiled PBS wiki layer. Read this first when answering queries or planning maintenance, then open the relevant category pages and sourceRefs.

## Orientation

- [[Start Here]]: public reading entrance for the vault.
- [[Association Map]]: public association / 聯想 map for semantic navigation.
- [[Overview]]: what this wiki layer is and how it relates to PBS sources, Daydream artifacts, and schema.
- [[log]]: append-only timeline of wiki maintenance actions.

## Compiled Note Categories

- [[Concepts/README|Concepts]]: durable semantic terrain nodes with sourceRefs and evidence.
- [[Methods/README|Methods]]: repeatable practices, protocols, workflows, and techniques.
- [[Materials/README|Materials]]: matter, media, organisms, tools, substrates, and material systems.
- [[Theories/README|Theories]]: interpretive frames, discourse references, and conceptual lineages.
- [[SocialForms/README|Social Forms]]: workshops, commons, labs, exhibitions, memberships, care structures, and governance patterns.
- [[Projects/README|Projects]]: PBS-relevant projects, artworks, zines, games, scenes, and research artifacts.
- [[Comparisons/README|Comparisons]]: filed query answers that compare entities, methods, projects, or theories.
- [[Syntheses/README|Syntheses]]: higher-order analyses that connect multiple verified notes.

## Existing PBS Wiki Areas

- [[NPCs/README|NPCs]]: source-bounded character and dialogue-domain pages.
- [[Questions/README|Questions]]: durable question objects and runtime contracts.
- [[Sources/README|Sources]]: source-facing wiki navigation.
- [[SemanticMemory/README|Semantic Memory]]: reviewed semantic memory layer.
- [[Zines/README|Zines]]: zine-related wiki layer.
- [[Pets/README|Pets]]: embodied runtime interface notes.
- [[Logs/README|Logs]]: reviewed operational logs distinct from root chronological wiki log.

## Source and Bridge Layers

- `obsidian-vault/Sources/`: raw and curated source-facing corpus structures. Treat as source of truth.
- `obsidian-vault/Sources/PBS Semantic Layers/`: source-derived semantic bridge index for retrieval hints, terrain-gap detection, and note-building candidates. Preserve this structure, but do not treat it as the compiled Wiki middle layer or as final evidence-backed synthesis.
- `obsidian-vault/Sources/PBS Entity Layers/`: source-derived entity bridge layer. Preserve this structure.
- `obsidian-vault/daydream-export/`: Daydream export graph and source-card artifacts. Preserve conventions and avoid public body-text provenance leakage.

## Compiled Middle-Layer Contract

The Karpathy-style LLM Wiki core lives in the compiled category folders above, not in `Sources/PBS Semantic Layers/`. Each compiled note should include `type`, `id`, `title`, `status`, `summary`, `sourceRefs`, `evidence`, `relatedConcepts`, `relatedMethods`, `relatedMaterials`, `relatedSocialForms`, `relatedProjects`, `openQuestions`, and links to other Wiki notes.

## Maintenance Rule

When a compiled note is created or materially updated, update this index and append an entry to [[log]].

## Reader Layer

- [[Home]]
- [[Start Here]]
- [[Long Notes]]
- [[Questions]]
- [[Concepts]]
- [[Characters and NPCs|Characters / NPCs]]
- [[Zines]]
