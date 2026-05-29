---
type: integration-decision
status: active
sourceRefs:
  - obsidian-vault/PBS Wiki Visual Map.canvas
  - docs/spec-kit/019-pbs-llm-wiki-hybrid-rag-evidence-linter/follow-up.md
  - scripts/wiki_tool.py
---

# Obsidian App Integration Decision

## Decision

Use Obsidian native Canvas, Graph View, Markdown links, and local PBS CLI tooling as the current integration layer. Do not install or require community plugins in this stage.

## Current State

- Native Canvas is used for the main PBS system diagram: `PBS Wiki Visual Map.canvas`.
- Native Graph View is supported by `GRAPH_VIEW_GUIDE.md` and existing source/category/semantic/entity links.
- PBS-specific maintenance is handled by `scripts/wiki_tool.py`:
  - `hybrid-search`
  - `build-note`
  - `lint-evidence`
  - `terrain-gap-lint`
- No Obsidian community plugin is currently installed in this vault.

## Plugin Evaluation

| Tool | Current Decision | Reason |
|---|---|---|
| Obsidian Graph View | Use now | Built in, no dependency, already reflects wikilinks/tags/folders. |
| Obsidian Canvas | Use now | Built in, good for hand-authored system diagrams. |
| Dataview | Defer | Useful later for dashboards, but would make vault reading dependent on a plugin. |
| Excalibrain | Defer | Good for concept maps, but PBS first needs stronger reviewed note links. |
| Local vector DB | Defer | Useful for semantic retrieval later; current stage uses local source-card hybrid search without heavy dependencies. |

## Safe Integration Rule

Raw source folders stay canonical and are not rewritten by plugins or runtime agents. Generated artifacts go to `Wiki/`, `Review/`, or `Wiki/Logs/` with `sourceRefs` and review status.

## Next Safe Step

Add a local `export-knowledge-graph` command after the compiled Wiki layer has stronger citation coverage. The export should write review-only JSON and should not require an Obsidian plugin.
