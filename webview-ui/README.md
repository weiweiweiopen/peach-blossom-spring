# PBS Web UI / 2026.2

This Vite/React app is the playable surface for **PBS-2026.2.26701788323**.

The web UI should not start from a generated local source-note corpus. Its second-version direction is to consume a NotebookLM-backed source pack when available, render it as zines and dialogue, and save reviewable PBS traces locally before anything becomes durable wiki memory.

NotebookLM is the shovel, not the land. It can accelerate public-source exploration, but the canonical knowledge layer is the local PBS Markdown/wiki memory that can be opened, diffed, forked, backed up, reviewed, and moved outside a cloud product.

## Runtime Roles

- **PBS Computer**: query entrance for public source questions.
- **Association zine**: turns source-grounded traces into printable public artifacts.
- **Question pet**: marks thin claims, missing evidence, and promotion opportunities.
- **NPC dialogue**: uses promoted memory and persona context, not raw private player memory sent to NotebookLM.
- **Campfire**: shared notebook/session memory surface.
- **Editor mode**: local layout and world-building surface.

## 2026.2 Data Boundary

NotebookLM may be used as a fast public-source reading engine. Private memory stays in PBS.

Raw public sources remain source of truth. The web UI may render packets and traces, but durable knowledge changes should go through review/promotion into `obsidian-vault/Wiki/`; it should not silently mutate `obsidian-vault/Sources/` or treat cloud notebook context as canonical memory.

Do not send these to NotebookLM:

- API keys, cookies, or tokens
- private player memory
- unpublished interviews
- sensitive community data
- any local-only trace marked private

## Expected Source Flow

```text
NotebookLM CLI / bridge
→ PBS source pack
→ zine / dialogue writer
→ local trace
→ optional review queue
→ promoted wiki memory
```

The generated `obsidian-vault/Wiki/SourceNotes/` corpus is intentionally removed from the startup path.

Promotion is cumulative and auditable: reviewed traces can create or update Markdown pages, add backlinks, keep contradictions visible, and leave git-readable history. NotebookLM artifacts remain inputs to review, not owned PBS memory by themselves.

## Development

```bash
npm --prefix webview-ui install
npm --prefix webview-ui run dev
```

Validation:

```bash
npm --prefix webview-ui run check:secrets
npm --prefix webview-ui run check:visual-layout
npm --prefix webview-ui run build
```

Editor preview:

```text
http://localhost:5173/peach-blossom-spring/?editor=1
```

Public preview:

```text
https://weiweiweiopen.github.io/peach-blossom-spring/
```
