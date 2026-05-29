# Spec Kit — PBS vault → Karpathy-style LLM Wiki alignment

Date: 2026-05-24
Owner context: Wise Mouse / PBS
Permanent planning file: keep this file as the stable spec-kit anchor for the OpenCode session.

## Intent

Update the existing PBS Obsidian vault structure so it becomes closer to Andrej Karpathy's LLM Wiki pattern while preserving PBS-specific architecture, Daydream graph work, semantic/entity bridge layers, source-card conventions, and public-artifact cleanliness rules.

This is a planning-first spec. If implementation decisions conflict with current PBS-specific design, or if the agent does not understand a PBS convention, stop and ask the human before continuing.

## Source material already read by OpenClaw

- Compact checkpoint: `/Users/shihweichieh/.openclaw/workspace/pbs-llm-wiki-compact-2026-05-24.md`
- Karpathy LLM Wiki gist: `https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f#llm-wiki`
- PBS vault target: `/Users/shihweichieh/Documents/Projects/peach-blossom-spring-main/obsidian-vault`

## Current diagnosis

PBS already has:

- large raw/public source corpus in `obsidian-vault/Sources/`
- source indexes and manifests
- Daydream/export graph artifacts
- semantic/entity bridge layers under `Sources/PBS Semantic Layers/` and `Sources/PBS Entity Layers/`
- schema scaffold under `obsidian-vault/Schema/`
- partial wiki scaffold under `obsidian-vault/Wiki/`

PBS is not merely a catalog. It is closer to a PBS Daydream corpus graph + source catalog + schema scaffold. The missing Karpathy-style core is the compiled, cited, interlinked wiki-note layer.

## Karpathy alignment principles to adopt

1. Raw sources are immutable source of truth.
2. Wiki is a persistent, compounding markdown artifact maintained by an LLM/agent.
3. Schema tells future agents how to ingest, query, lint, cite, and update the wiki.
4. `index.md` is content-oriented navigation for all wiki pages.
5. `log.md` is chronological append-only history of ingest/query/lint/planning actions.
6. Good query answers and syntheses can be filed back into the wiki.
7. Linting should find contradictions, stale claims, orphan pages, missing cross-links, and data gaps.

## PBS-specific constraints that must not be broken

- Do not flatten or replace the existing PBS Daydream graph/source-card architecture.
- Do not treat `Sources/` as disposable generated wiki content.
- Keep source cards traceable to original URLs and manifests.
- Preserve semantic/entity bridge layers; they may become bridge/index layers into the compiled wiki, not something to delete.
- Public Daydream/zine/artifact surfaces must stay clean: no backend/tool/provenance/workflow/debug/source-card language in visible artwork body.
- Source/evidence/provenance belongs in wiki notes, schemas, logs, colophons, or internal metadata, not public artwork language.
- Prefer additive restructuring before destructive moves. Ask before renaming/moving large existing folders.

## Desired target structure, subject to agent audit

Inside `obsidian-vault/`:

```text
Wiki/
  index.md                  # content-oriented map of compiled wiki notes
  log.md                    # append-only operations/history log
  Overview.md               # high-level PBS wiki overview / current synthesis
  Concepts/
  Methods/
  Materials/
  Theories/
  SocialForms/
  Projects/
  Comparisons/
  Syntheses/
  SemanticMemory/           # keep or repurpose carefully; ask if unclear
  Logs/                     # legacy or auxiliary logs; ask before merging
Schema/
  llm-wiki-maintainer.md    # agent operating instructions for PBS LLM Wiki
  frontmatter-schema.md     # update, do not break
  lint-checklist.md         # update with Karpathy-style checks
  command-reference.md      # update only if commands actually exist
  agentic-firewall.md       # preserve PBS safety/public artifact rules
Sources/
  ... existing raw/source corpus and PBS semantic/entity layers ...
```

## Minimal first implementation scope

Plan first, then make the smallest safe vault updates:

1. Audit current vault structure and schema files.
2. Identify contradictions or ambiguous PBS conventions.
3. If contradictions/ambiguities exist, stop and ask the human before implementation.
4. If safe, create/update only structural markdown scaffolding:
   - `Wiki/index.md`
   - `Wiki/log.md`
   - `Wiki/Overview.md`
   - category READMEs for missing compiled wiki-note folders
   - `Schema/llm-wiki-maintainer.md`
   - targeted additions to `Schema/frontmatter-schema.md` and `Schema/lint-checklist.md`
5. Do not generate hundreds of notes in this pass.
6. Optionally create 2–4 carefully cited pilot notes only if sourceRefs/evidence can be verified from existing source files.
7. Leave a clear implementation report in this spec folder.

## Required note contract

Compiled wiki notes should use frontmatter compatible with PBS and Karpathy-style LLM Wiki maintenance:

```yaml
type: concept | method | material | theory | social-form | project | comparison | synthesis | overview
id: stable-kebab-id
title: Human title
status: stub | draft | reviewed | needs-human-decision
created: YYYY-MM-DD
updated: YYYY-MM-DD
sourceRefs:
  - path: Sources/...
    title: ...
    url: ...
    claim: short description of what this source supports
related:
  - [[Other Wiki Note]]
```

Body sections should normally include:

- Summary
- Why it matters in PBS
- Evidence / sourceRefs
- Relations
- Tensions or contradictions
- Open questions
- Maintenance notes

## Questions gate

Before continuing, ask the human if any of these become true:

- You need to move or rename existing source folders.
- Karpathy-style structure seems to conflict with PBS Daydream graph conventions.
- `SemanticMemory`, `Logs`, semantic/entity bridge layers, or schema files have ambiguous roles.
- You cannot verify citations/sourceRefs for proposed pilot notes.
- You are tempted to create public-facing artifact text using internal workflow/provenance language.

## Success criteria

- Existing PBS source corpus remains intact.
- Vault has a recognizable Karpathy-style LLM Wiki spine: `Wiki/index.md`, `Wiki/log.md`, `Wiki/Overview.md`, compiled note categories, and maintainer schema.
- PBS-specific Daydream/source-card/semantic graph model remains respected.
- Ambiguous or conflicting choices are escalated to the human instead of guessed.
- A permanent OpenCode session can continue from this spec file.

## Phase 2: layered vault reading structure

Date: 2026-05-24

### New diagnosis

The vault has strong source coverage and useful bridge layers, but the reader entrance still points too directly at raw source indexes. This makes the vault feel like scattered imported pages rather than a PBS association brain.

### Layer model

1. Public / Reading Layer
   - Root-level human-facing notes such as `Home.md`, `Start Here.md`, `Association Map.md`, `Long Notes.md`, `Questions.md`, `Concepts.md`, `Characters and NPCs.md`, and `Zines.md`.
   - This layer should feel like an entry into PBS, not like a crawl report.
   - It should give readers a simple path from overview to themes to evidence.

2. Association / Semantic Layer
   - Existing PBS semantic/entity bridge layers and compiled wiki notes explain why source pages belong together.
   - Public-facing language should prefer `association / 聯想`.
   - `daydream` remains legacy/internal terminology for existing folders, exports, and runtime conventions. Do not bulk rename it yet.

3. Evidence / Raw Source Layer
   - Canonical raw source folders remain intact: `Sources/Hackteria Full/`, `Sources/How To Get What You Want Full/`, `Sources/SGMK Full/`, source indexes, manifests, and source category hubs.
   - These pages remain linkable and visible in graph/local graph, but they should not be the main reading entrance.

### Minimal phase-2 implementation scope

- Update the public root `Home.md` to point first to the reading layer.
- Create or update top-level reading notes only.
- Link reading notes to existing `Wiki/`, semantic/entity bridge layers, source indexes, and raw archives.
- Add a migration note that `daydream` is legacy/internal terminology and `association / 聯想` is the public-facing term.
- Do not rename folders, move sources, bulk edit source notes, or generate long-form synthesis pages in this phase.

### Reader path

The intended path is:

```text
Home
-> Start Here
-> Association Map / Concepts / Questions / Characters and NPCs / Zines / Long Notes
-> Wiki compiled notes and semantic/entity bridge layers
-> raw source indexes and source pages as evidence
```

### LLM navigation path

Future agents should navigate from public/root reading pages to `Wiki/index.md`, then to compiled notes and bridge layers, and only then descend into source pages for verification. Raw sources remain the evidence layer and should be cited before any durable synthesis is added.

## Phase 3: PBS Computer as LLM Wiki Search + Zine PDF

Date: 2026-05-25

### Runtime intent

- PBS Computer is primarily an LLM wiki search surface, not a long roleplay dialogue.
- Every ordinary PBS Computer answer should be grounded in local wiki search results and show real clickable links below the answer.
- Answer text should be concise and service-oriented: answer the question first, with only minimal PBS Computer personality.
- The left-side zine surface remains the deeper association artifact generator: it should generate insight from the query, not just mirror the chat answer.
- The zine feedback page PDF button must create a downloadable/openable PDF artifact from the generated zine page.

### UX constraints

- If an operation appears stuck for more than about one minute, report the current step, likely cause, and next correction before continuing.
- Public zine body text must still avoid backend/tool/provenance/workflow/debug/source-card language.
- True evidence links may be visible in the PBS Computer chat because that panel is explicitly a wiki search UI.
