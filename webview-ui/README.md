# PBS Web UI / 2026.2

This Vite/React app is the playable surface for **PBS-2026.2.255**.

The web UI does not read the old generated source-note corpus or NotebookLM bridge at runtime. It consumes the static export generated from the root `Sources/Raw/` corpus by `scripts/pbs_engine.py`.

The canonical knowledge layer is the local PBS Markdown/wiki memory that can be opened, diffed, forked, backed up, reviewed, and moved outside a cloud product.

## Runtime Roles

- **PBS Computer**: query entrance for public source questions.
- **Association zine**: turns source-grounded traces into printable public artifacts.
- **Question pet**: marks thin claims, missing evidence, and promotion opportunities.
- **NPC dialogue**: uses persona context plus source-first local memory evidence.
- **Campfire**: shared local-memory question surface.
- **Editor mode**: local layout and world-building surface.

## 2026.2 Data Boundary

Raw public sources remain source of truth. The web UI renders exported packets, but durable knowledge changes should go through review/promotion into `obsidian-vault/Wiki/`; it should not silently mutate `Sources/Raw/`.

Do not commit or send to external services:

- API keys, cookies, or tokens
- private player memory
- unpublished interviews
- sensitive community data
- any local-only trace marked private

## Expected Source Flow

```text
Sources/Raw
→ scripts/pbs_engine.py export-game-index
→ webview-ui/src/generated/pbsLocalMemoryIndex.json
→ zine / dialogue writer
→ optional review queue
→ promoted wiki memory
```

Promotion is cumulative and auditable: reviewed traces can create or update Markdown pages, add backlinks, keep contradictions visible, and leave git-readable history.

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
