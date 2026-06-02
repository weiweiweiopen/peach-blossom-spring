# PBS Engine Worker on Cloudflare

This is the cloud version of the PBS source-first engine for GitHub Pages.
Cloudflare Workers cannot run `scripts/pbs_engine.py` directly, but they can host the same search layer with D1 SQLite FTS.

## Deploy flow

1. Create D1 database:

```bash
cd pbs-engine-worker
npx wrangler d1 create pbs-engine-db
```

2. Paste the returned `database_id` into `wrangler.toml`.

3. Export seed SQL from the current PBS generated memory:

```bash
npm run seed
```

4. Apply schema + seed:

```bash
npx wrangler d1 execute pbs-engine-db --remote --file seed.sql
```

5. Deploy worker:

```bash
npx wrangler deploy
```

6. Set frontend env before GitHub Pages build:

```bash
VITE_PBS_ENGINE_URL=https://pbs-engine.<account>.workers.dev
```

## Endpoints

- `POST /api/memory/search` `{ query, limit }`
- `POST /api/chat/campfire` `{ question, preferredLanguage }`
- `POST /api/chat/npc` `{ question, preferredLanguage }`

The frontend still has bundled JSON fallback if the worker is not configured.
