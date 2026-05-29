---
id: 019-plan
title: Implementation Plan
status: executed
sourceRefs:
  - docs/spec-kit/019-pbs-llm-wiki-hybrid-rag-evidence-linter/spec.md
---

# Implementation Plan

## Phase 1: Local Retrieval

- Use `obsidian-vault/daydream-export/sourceCards.enriched.json` as the retrieval base.
- Score title, keywords, categories, excerpts, semantic topics, and graph-neighbor metadata.
- Return JSON lines for easy scripting and review.

## Phase 2: Source-Bounded Draft Notes

- Generate one compiled note at a time under `obsidian-vault/Wiki/<Category>/`.
- Require local source-card evidence either by `--source-ref` or by a small retrieval query.
- Include citations and review warnings in the note body.
- Append maintenance entries to `obsidian-vault/Wiki/log.md`.

## Phase 3: Evidence Lint

- Scan only compiled Wiki folders.
- Report missing or broken sourceRefs, thin evidence, weak citation structure, duplicate titles, and overclaiming language.
- Optionally write review reports to `obsidian-vault/Wiki/Logs/`.

## Phase 4: Follow-Up

- Add visual graph exports after note quality is stable.
- Feed reviewed lint states into the Question Pet growth model without writing private runtime dialogue back to raw sources.
- Record the first visualization and pet-growth design pass in `follow-up.md` before runtime implementation.
