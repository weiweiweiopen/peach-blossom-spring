---
id: 020-wiki-tool-zine-runtime-rag
title: Wiki Tool Zine Runtime RAG
status: implemented-draft
sourceRefs:
  - docs/spec-kit/019-wiki-tool-hybrid-search-build-note-evidence-linter/spec.md
  - scripts/wiki_tool.py
  - webview-ui/src/daydream/browserAssociationGenerator.ts
---

# Wiki Tool Zine Runtime RAG

## Goal

Connect compiled PBS Wiki notes to zine generation so public zines can use curated, citation-bearing notes instead of relying only on raw source cards and entry indexes.

## Scope

- Export compiled Wiki notes into a web-readable JSON file.
- Write the JSON to `webview-ui/public/assets/pbs-wiki-index.json`.
- Let the zine generator load and rank the compiled Wiki index at runtime.
- Filter out notes with evidence-lint errors.
- Include note `sourceRefs` and citations in the zine editorial prompt.
- Add a cross-community gap report for topics that appear across source families but lack an obvious compiled Wiki note.

## Non-Goals

- No new Obsidian plugin dependency.
- No new vector database.
- No automatic mutation of raw source folders.
- No automatic promotion of gap candidates into canonical Wiki notes.
