---
id: 019-follow-up
title: Pet Growth and Cultural Terrain Visualization Follow-Up
status: review-ready
sourceRefs:
  - docs/spec-kit/019-pbs-llm-wiki-hybrid-rag-evidence-linter/spec.md
  - obsidian-vault/Wiki/Logs/evidence-lint-2026-05-29.md
  - obsidian-vault/Wiki/Methods/sgmk-diy-electronics-workshop-kits.md
---

# Pet Growth and Cultural Terrain Visualization Follow-Up

## Current Evidence State

- `lint-evidence` reports 0 errors in compiled Wiki folders.
- The current warning is `obsidian-vault/Wiki/Concepts/concept-semantic-terrain.md lacks visible evidence/citation section`.
- The sample Method note demonstrates a safe draft shape: sourceRefs, Evidence, Citations, Draft Claims, and Open Questions.
- Raw source folders remain untouched.

## Question Pet Growth Model

The pet should grow from reviewed knowledge maintenance states, not from private chat transcripts.

Recommended growth signals:

- `evidence_found`: a new compiled note has 3 or more valid local sourceRefs.
- `gap_detected`: `terrain-gap-lint` or `lint-evidence` emits a review artifact with unresolved warnings.
- `gap_resolved`: a warning disappears after a note gains visible Evidence/Citations or stronger sourceRefs.
- `question_matured`: an Open Question is linked to at least one compiled note and one review artifact.
- `terrain_promoted`: a review candidate is manually promoted into Concept, Method, Material, SocialForm, Project, or Synthesis.

Recommended pet states:

- `seed`: only a question or weak evidence exists.
- `sprout`: at least one local sourceRef is attached.
- `branch`: multiple sourceRefs and related topics exist.
- `blossom`: evidence lint passes with no errors and no unresolved warning for the pet's topic.
- `fruit`: the note is manually reviewed and linked into the Wiki index or a curated map.

Safety rule:

- Runtime dialogue may display growth state, but private user messages should not be written into `obsidian-vault/Sources/` or compiled Wiki notes automatically.

## Visualization Direction

PBS should not imitate Connected Papers as a citation-similarity graph. It should expose cultural terrain and evidence status.

Recommended visual layers:

- Concept map: Concepts, Methods, Materials, SocialForms, Projects, and Syntheses as typed nodes.
- Evidence heat map: node color shows sourceRef count, lint warnings, and review status.
- Terrain gap overlay: review candidates from `terrain-gap-lint` appear as dotted or translucent nodes.
- Timeline: events, workshops, projects, and source import dates as temporal traces.
- Community overlap map: people, labs, festivals, workshops, and locations as relation neighborhoods.
- Material-method-social-form network: shows how a material practice becomes a workshop, project, or social infrastructure.

## Connected Papers Differentiation

- Connected Papers: academic paper network based on citation/similarity.
- PBS: cultural knowledge terrain based on local sourceRefs, semantic layers, workshop practices, materials, social forms, projects, and unresolved evidence gaps.
- PBS should show uncertainty and maintenance status as first-class visual information.

## Next Implementation Slice

- Add a local `export-knowledge-graph` command that reads compiled Wiki notes and writes a small JSON graph under `obsidian-vault/Wiki/Logs/` or `obsidian-vault/Review/`.
- Include node fields: `id`, `title`, `type`, `status`, `sourceRefCount`, `warningCount`, `path`.
- Include edge fields: `source`, `target`, `kind`, `evidence`.
- Keep the export review-only until note quality and citation coverage are stable.
