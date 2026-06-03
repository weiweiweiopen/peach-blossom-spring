# PBS Memory Modes

PBS has two memory runtimes. Do not mix them.

## Cloud Mode

Cloud mode is for the public web game. The browser calls a Cloudflare Worker backed by Cloudflare D1 SQLite:

```text
game UI -> PBS memory Worker -> Cloudflare D1 SQLite / FTS source index -> DeepSeek proxy -> answer
```

The Cloudflare Worker cannot write files into your local Obsidian vault. Its `/api/memory/draft` endpoint returns draft Markdown for review, but `stored` is `false`.

Worker source:

```text
pbs-memory-worker/
```

Cloud D1 seed source:

```text
python3 scripts/pbs_engine.py export-d1-sql --target pbs-memory-worker/d1/seed.sql
npx wrangler d1 execute peach-blossom-spring-memory-db --remote --file d1/seed.sql
```

Deploy target:

```text
https://peach-blossom-spring-memory.dontmarryme.workers.dev
```

The web UI reads this URL from:

```html
<meta name="pbs-memory-api" content="https://peach-blossom-spring-memory.dontmarryme.workers.dev" />
```

## Local Full-Memory Mode

Local mode is for downloaded/cloned PBS on a MacBook or another local machine. It uses Python, SQLite, Markdown sources, and the Obsidian vault:

```text
game UI -> local PBS game server -> scripts/pbs_engine.py -> SQLite / Sources / Wiki / Schema -> DeepSeek -> answer -> Review draft
```

Run it with:

```bash
./scripts/run_pbs_local_game.sh
```

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
obsidian-vault/Review/compiled-note-drafts/
```

## Removed Static Snapshot Runtime

The old browser-only snapshot runtime was removed because it could make the online game pretend to have memory when it only had a small fake index.

Removed/orphaned runtime paths include:

```text
webview-ui/src/pbsLocalMemory.ts
webview-ui/src/generated/pbsLocalMemoryIndex.json
webview-ui/public/assets/pbs-local-memory-index.json
webview-ui/public/assets/pbs-wiki-index.json
```

If cloud mode needs more knowledge, regenerate the D1 seed SQL from `pbs_engine.py`, import it into Cloudflare D1, and redeploy the Worker if the Worker code changed.
