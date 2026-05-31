# PBS Source-First Memory

Clean local-first shared memory prototype for PBS research. It intentionally ignores the old PBS compiled memory layer and starts from three source-of-truth public sources:

- Hackteria Wiki: https://www.hackteria.org/wiki/Main_Page
- SGMK Wiki: https://wiki.sgmk-ssam.ch/wiki/Main_Page
- HOW TO GET WHAT YOU WANT / KOBAKANT: https://howtogetwhatyouwant.at

No NotebookLM. No Google account. Local files + SQLite FTS5/BM25 + review-first Wiki notes.

## Quick start

```bash
cd local-memory
python3 scripts/pbs_engine.py crawl --limit 30
python3 scripts/pbs_engine.py index
python3 scripts/pbs_engine.py search "e-textile sensor workshop" --limit 8
python3 scripts/pbs_engine.py draft-note "temporary lab open science hardware" --category SocialForms --limit 8
```

## Layer contract

- `Sources/Raw/`: raw-ish fetched source pages, one markdown file per page/post. Treat as source of truth for this local prototype.
- `obsidian-vault/Knowledge/`: SQLite search index, source registry, crawl metadata.
- `obsidian-vault/Review/compiled-note-drafts/`: generated drafts awaiting human/agent review.
- `obsidian-vault/Wiki/`: reviewed shared memory middle layer.
- `obsidian-vault/Schema/`: maintenance rules.

## Rule

Search results and drafts are not durable knowledge until reviewed and promoted into `obsidian-vault/Wiki/`.

## Game-layer export

The pure CLI layer stays here. The GitHub Pages game cannot run this Python/SQLite code directly, so export a static JSON index into the game repo when you want the campfire/NPC dialogue to use the same source-first memory:

From the repository root:

```bash
python3 local-memory/scripts/pbs_engine.py export-game-index \
  --target "$PWD/webview-ui/src/generated/pbsLocalMemoryIndex.json"
```

Then rebuild/deploy the game repo. The game layer consumes the exported JSON; the local CLI remains the editable/re-crawlable memory engine.
