# PBS Cloud And Local Memory Modes

PBS has two memory runtimes. Do not mix them.

## Cloud Mode: Public Exhibition

Cloud mode is for the public web game on GitHub Pages. The browser calls a Cloudflare Worker backed by Cloudflare D1 SQLite:

```text
GitHub Pages game UI -> PBS memory Worker -> Cloudflare D1 SQLite / FTS source index -> DeepSeek proxy -> answer / source links / traversal lint
```

The Cloudflare Worker cannot write files into your downloaded repo, local `Knowledge/` store, or local `Review/` drafts. Its `/api/memory/draft` endpoint returns draft Markdown for review, but `stored` is `false`.

Use cloud mode when you want:

- the public online exhibition;
- multiplayer and browser access through GitHub Pages;
- Cloudflare D1 source search with external source URLs;
- source-grounded campfire/NPC/zine answers;
- Question Pet traversal health monitoring for the player's current question.

Do not use cloud mode when you need local draft writes, local SQLite indexing, or durable memory promotion in the downloaded repo.

Worker source:

```text
pbs-memory-worker/
```

Cloud D1 seed source:

```text
python3 scripts/pbs_engine.py export-d1-sql --target pbs-memory-worker/d1/source-index.sql
npx wrangler d1 execute peach-blossom-spring-memory-db --remote --file d1/source-index.sql
```

Deploy target:

```text
https://peach-blossom-spring-memory.dontmarryme.workers.dev
```

The web UI reads this URL from:

```html
<meta name="pbs-memory-api" content="https://peach-blossom-spring-memory.dontmarryme.workers.dev" />
```

Deploy/update cloud mode:

```bash
python3 scripts/pbs_engine.py export-d1-sql --target pbs-memory-worker/d1/source-index.sql
cd pbs-memory-worker
npx wrangler d1 execute peach-blossom-spring-memory-db --remote --file d1/source-index.sql
npx wrangler deploy
cd ..
npm --prefix webview-ui run build
git push origin main
```

`git push origin main` triggers `.github/workflows/pages.yml` for the web UI.

## Local Full-Memory Mode: Downloaded / Cloned PBS

Local mode is for downloaded/cloned PBS on a MacBook or another local machine. It uses Python, SQLite, Markdown sources, and root-level local memory folders:

```text
browser game UI -> local PBS game server -> scripts/pbs_engine.py -> SQLite / Sources/Raw / Knowledge -> DeepSeek -> answer / source links / Review draft
```

Current local structure:

```text
Sources/Raw/                  # canonical public markdown source corpus
Knowledge/                    # generated SQLite, passages, claims, query runs, cache
Review/compiled-note-drafts/  # local draft notes for human review
scripts/pbs_engine.py         # source-first indexing/search/draft/export engine
scripts/pbs_game_server.py    # local game API/server
webview-ui/                   # browser game UI
```

The old `obsidian-vault/` runtime layout is not the current PBS structure. `pbs_engine.py` keeps `VAULT = ROOT` only as a legacy compatibility name; do not recreate `obsidian-vault/` for current local mode.

Run it with:

```bash
./scripts/run_pbs_local_game.sh
```

Use local mode when you want:

- the full source-first PBS engine;
- local SQLite indexing from `Sources/Raw`;
- generated local state under `Knowledge/`;
- local Review draft writes under `Review/compiled-note-drafts/`;
- development without relying on the deployed D1 seed.

Manual commands:

```bash
npm --prefix webview-ui run build
python3 scripts/pbs_engine.py index
python3 scripts/pbs_game_server.py --host 127.0.0.1 --port 4173
```

Open:

```text
http://127.0.0.1:4173/
```

Local Review drafts are written here:

```text
Review/compiled-note-drafts/
```

## Building Your Own Local Shared Memory Layer

1. Add your own Markdown/text sources under a source family folder:

```text
Sources/Raw/my-community/interview-001.md
Sources/Raw/my-community/workshop-notes.md
Sources/Raw/my-community/public-links.md
```

2. Rebuild and test the local index:

```bash
python3 scripts/pbs_engine.py index
python3 scripts/pbs_engine.py query --query "your test question" --limit 8
```

3. Run the local game server and ask questions through the UI:

```bash
./scripts/run_pbs_local_game.sh
```

4. Review generated drafts in:

```text
Review/compiled-note-drafts/
```

5. Bind your own LLM through a proxy or local model endpoint.

PBS is not tied to one AI model. The local version can use a hosted API model through your own private proxy, or a local model running on your computer/server, such as Gemma, Llama, Qwen, or another OpenAI-style endpoint.

The idea is:

```text
PBS local sources -> PBS local search -> your chosen LLM -> answer with source context
```

Keep API keys out of frontend code and out of GitHub. Cloud model keys should live in a private proxy or local server. Local model setups can point PBS to the local endpoint.

Technical note: local server mode can be pointed at another endpoint with `PBS_DEEPSEEK_PROXY_URL`; custom browser builds can use `VITE_DEEPSEEK_PROXY_URL` in `webview-ui/.env.local`. Do not commit `.env.local`.

## Removed Static Snapshot Runtime

The old browser-only snapshot runtime was removed because it could make the online game pretend to have memory when it only had a small fake index. Current runtime memory must be either Cloud D1 or the local Python server.

Removed/orphaned runtime paths include:

```text
webview-ui/src/pbsLocalMemory.ts
webview-ui/src/generated/pbsLocalMemoryIndex.json
webview-ui/public/assets/pbs-local-memory-index.json
webview-ui/public/assets/pbs-wiki-index.json
```

If cloud mode needs more knowledge, regenerate the D1 seed SQL from `pbs_engine.py`, import it into Cloudflare D1, and redeploy the Worker if the Worker code changed.
