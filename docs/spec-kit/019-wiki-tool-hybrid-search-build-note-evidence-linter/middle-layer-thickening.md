---
id: 019-middle-layer-thickening
title: Compiled Wiki Middle-Layer Thickening
status: executed
sourceRefs:
  - scripts/wiki_tool.py
  - obsidian-vault/Wiki/index.md
  - obsidian-vault/Sources/PBS Semantic Layers/README.md
---

# Compiled Wiki Middle-Layer Thickening

## Purpose

PBS keeps `Sources/PBS Semantic Layers` as a source-derived bridge index. It helps find candidate topics, methods, materials, events, and cross-community gaps. It is not the compiled Wiki middle layer.

The compiled middle layer is the evidence-backed shared-memory layer under:

- `Wiki/Concepts/`
- `Wiki/Methods/`
- `Wiki/Materials/`
- `Wiki/Theories/`
- `Wiki/SocialForms/`
- `Wiki/Projects/`
- `Wiki/Comparisons/`
- `Wiki/Syntheses/`

## Thickening Rule

Do not bulk-read or recrawl all sources. Use bridge indexes and sourceCards to choose focused candidates, then return only to a small set of sourceRefs for evidence.

```text
Semantic / Entity / sourceCards bridge indexes
-> candidate topic or relation
-> hybrid-search top source cards
-> source-bounded draft note
-> lint-evidence
-> reviewed promotion later
```

## First Controlled Batch

Created 11 `source-bounded-draft` notes across the compiled Wiki folders:

- `Wiki/Concepts/temporary-commons-in-art-science-camps.md`
- `Wiki/Concepts/care-maintenance-and-failure-notes.md`
- `Wiki/Methods/e-textile-workshop-pedagogy.md`
- `Wiki/Methods/diy-microscopy-and-imaging-workshops.md`
- `Wiki/Materials/conductive-textiles-and-soft-circuits.md`
- `Wiki/SocialForms/community-labs-and-temporary-labs.md`
- `Wiki/SocialForms/camps-and-festivals-as-knowledge-infrastructure.md`
- `Wiki/Projects/8bit-mix-tape.md`
- `Wiki/Comparisons/sgmk-and-hackteria-workshop-infrastructures.md`
- `Wiki/Syntheses/material-experimentation-across-community-labs.md`
- `Wiki/Theories/open-hardware-commons-and-situated-pedagogy.md`

## Review Boundary

These notes are useful for search, zine RAG, and maintenance planning, but they remain drafts. They should not become public claims or synthesis anchors until a human checks the cited sourceRefs and strengthens evidence passages.

## Runtime Verification Rule

This work is not complete until zine generation is checked against the new middle layer. Use:

- `webview-ui/scripts/zine-smoke-test.mjs` for local browser-generator testing when a local LLM key is available.
- `webview-ui/scripts/zine-public-ui-smoke-test.mjs` after GitHub Pages deployment to run 10 public UI zine generations through the deployed site.

The public smoke test must pass 10/10 cases with no error panels, no low-relevance zine state, reading materials present, readable trace present, and concrete source/Wiki terms in the visible text.
