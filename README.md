# Peach Blossom Spring / PBS

Peach Blossom Spring is a digital exhibition garden for **NGM / Non-Governmental Matters**.

NGM is a research interview project by **Shih Wei Chieh** about the sustainability of small, independent art and technology communities: how they organize, teach, share tools, host camps, keep friendships alive, survive funding gaps, and pass on knowledge without becoming institutions too quickly.

The interviewees include Andreas Siagian, Anastassia Pistofidou, Giulia Tomasello, Christian Dils, Jonathan Minchin, Marc Dusseiller, Rully Shabara, Wukir Suryadi, Ryu Toru Oyama, Stephanie Pan, Stelio Manousakis, Svenja Keune, Ted Hung, Tincuta Heinzel, and Abao / Shih Wei Chieh.

Play the public version: https://weiweiweiopen.github.io/peach-blossom-spring/

<img width="1612" height="934" alt="Screenshot 2026-06-01 at 08 58 27" src="https://github.com/user-attachments/assets/840f29e0-210a-4a38-b63b-a105e81207bd" />

## What this garden is

PBS turns NGM into a small explorable world:

- interview memories become NPCs you can talk to;
- the campfire is a shared question place for the whole archive;
- the zine tool turns one question into a short source-grounded booklet;
- the map, ebook, and source links show where the project came from;
- the Question Pet is now a traversal health monitor for the player's current question: it watches specificity, evidence readiness, source-family spread, and missing-evidence caveats.

The tone is playful, but the archive logic is serious: the garden should help people remember fragile community knowledge without flattening it into a report or dashboard.

<img width="1620" height="933" alt="Screenshot 2026-06-01 at 08 58 52" src="https://github.com/user-attachments/assets/882955c4-ff0b-4e4d-8ff3-1e51609ce2af" />

## How to play

1. Open the public site and enter Peach Blossom Spring.
2. Walk with arrow keys / WASD. On mobile, use the thumb control.
3. Move near an NPC and click / tap / press Space to open a conversation.
4. Go to the central campfire / computer to ask broader questions about NGM, communities, tools, camps, and sources.
5. Use the zine function from a question to generate a small wiki booklet.
6. Open the NGM ebook, map, and source links when you want to leave the fable and check the research material.

NPCs are built from NGM interview transcripts and persona notes. They are not exact replicas of people; they are conversation interfaces shaped by each interviewee's words, recurring concerns, and public context.

<img width="1616" height="934" alt="Screenshot 2026-06-01 at 08 59 22" src="https://github.com/user-attachments/assets/3a0ebd2b-4346-4bbd-94a3-d38162c59691" />

## How do I use it?

There are two different ways to use PBS. The online GitHub version is an exhibition garden that already has a deployed memory service. The downloaded local version is the one you use when you want to build your own source-first shared memory layer.

### A. Use the online exhibition

Open:

```text
https://weiweiweiopen.github.io/peach-blossom-spring/
```

The online version works like this:

```text
GitHub Pages UI -> Cloudflare PBS memory Worker -> Cloudflare D1 source index -> LLM proxy -> answer
```

Use it when you only want to play, test the public NGM garden, ask NPCs/campfire questions, or share the project with visitors. The online version cannot read your private files and cannot write review notes back into your downloaded repo.

### B. Download PBS and make your own local memory layer

Clone the repo:

```bash
git clone https://github.com/weiweiweiopen/peach-blossom-spring.git
cd peach-blossom-spring
npm --prefix webview-ui install
```

Run the local full-memory version:

```bash
./scripts/run_pbs_local_game.sh
```

Or run the steps manually:

```bash
npm --prefix webview-ui run build
python3 scripts/pbs_engine.py index
python3 scripts/pbs_game_server.py --host 127.0.0.1 --port 4173
```

Open:

```text
http://127.0.0.1:4173/
```

The local downloaded version works like this:

```text
local browser UI -> scripts/pbs_game_server.py -> scripts/pbs_engine.py -> Sources/Raw + Knowledge -> LLM proxy -> answer + Review draft
```

### C. Customize your own sources

PBS is source-first. Put your source material under:

```text
Sources/Raw/<your-source-family>/
```

Use plain Markdown or text files. A practical pattern is:

```text
Sources/Raw/my-community/interview-001.md
Sources/Raw/my-community/workshop-notes.md
Sources/Raw/my-community/public-links.md
```

Then rebuild the local memory index:

```bash
python3 scripts/pbs_engine.py index
python3 scripts/pbs_engine.py query --query "your test question" --limit 8
```

For the current public PBS corpus, source families are also listed in `pbs_sources.json`. The built-in hydrators can refresh some known public sources, for example:

```bash
python3 scripts/pbs_engine.py hydrate-mediawiki --family hackteria --query "microscopy" --limit 10
python3 scripts/pbs_engine.py index
```

The important rule: raw sources stay in `Sources/Raw/`; generated search/index state goes into `Knowledge/`; reviewable drafts go into `Review/compiled-note-drafts/`.

### D. Bind your own LLM

PBS should not put private API keys in frontend code. Use an LLM proxy or local endpoint that accepts the PBS chat payload, then point the local server/UI to it.

For the local Python server:

```bash
export PBS_DEEPSEEK_PROXY_URL="https://your-llm-proxy.example.com/chat"
export PBS_DEEPSEEK_ORIGIN="http://127.0.0.1:4173"
# Optional, only if your proxy expects a key forwarded by the local server:
export DEEPSEEK_API_KEY="your-key-kept-out-of-git"
./scripts/run_pbs_local_game.sh
```

For the browser build, copy `webview-ui/.env.example` to `webview-ui/.env.local` and set:

```bash
VITE_DEEPSEEK_PROXY_URL=https://your-llm-proxy.example.com/chat
```

Never commit `.env.local`, API keys, screenshots containing keys, or logs containing keys. If you deploy a public version, keep the real LLM key in the Worker/proxy secret store, not in GitHub Pages.

### E. Turn local answers into reviewable memory

Local mode can create review drafts instead of silently changing the source corpus. Drafts are written to:

```text
Review/compiled-note-drafts/
```

This keeps the shared memory layer auditable: ask questions, inspect retrieved sources, draft notes, review them as a human, then decide what belongs in the curated memory layer.

## Two Ways To Run PBS

PBS now has two deliberately different runtimes. Use the cloud version for the public exhibition. Use the local version when you want the full source-first memory engine and local Review drafts.

### 1. Public Cloud Exhibition

The public site is the multiplayer/exhibition build:

```text
https://weiweiweiopen.github.io/peach-blossom-spring/
```

Cloud runtime:

```text
GitHub Pages game UI
-> pbs-memory-api meta tag
-> Cloudflare Worker: peach-blossom-spring-memory
-> Cloudflare D1 SQLite / FTS source index
-> DeepSeek proxy
-> cited answer / source links / traversal lint
```

Cloud mode can search the deployed source index and return source-grounded answers. It cannot write to the downloaded repo, your local `Knowledge/` store, or your local `Review/` drafts. `/api/memory/draft` returns Markdown for review with `stored:false`.

Cloud source/deploy files:

```text
webview-ui/                         # React game UI published by GitHub Pages
webview-ui/index.html               # pbs-memory-api meta tag
pbs-memory-worker/                  # Cloudflare Worker API
pbs-memory-worker/d1/source-index.sql
multiplayer-worker/                 # optional multiplayer/presence Worker
shared/assets/                      # shared generated asset helpers
```

Refresh the cloud source index:

```bash
python3 scripts/pbs_engine.py export-d1-sql --target pbs-memory-worker/d1/source-index.sql
cd pbs-memory-worker
npx wrangler d1 execute peach-blossom-spring-memory-db --remote --file d1/source-index.sql
npx wrangler deploy
```

Deploy the public game UI:

```bash
npm --prefix webview-ui run build
git push origin main
```

Pushing `main` triggers `.github/workflows/pages.yml`, which publishes `dist/webview` to GitHub Pages.

### 2. Local Full-Memory Version

The local version is for a cloned/downloaded repo on your machine. It runs a Python server and the full source-first engine. Unlike the online GitHub Pages version, the downloaded version can build a local SQLite index, read the local source corpus, and write local review drafts.

```text
browser game UI
-> scripts/pbs_game_server.py
-> scripts/pbs_engine.py
-> local SQLite / Sources/Raw / Knowledge
-> DeepSeek
-> answer / source links / local Review draft
```

Current local structure:

```text
Sources/Raw/                  # canonical public markdown source corpus
Knowledge/                    # generated local SQLite, passages, claims, query runs, cache
Review/compiled-note-drafts/  # local draft notes created for human review
scripts/pbs_engine.py         # source-first indexing/search/draft/export engine
scripts/pbs_game_server.py    # local game API/server
webview-ui/                   # browser game UI
```

Do not recreate the old `obsidian-vault/` runtime layout for current PBS. `pbs_engine.py` keeps a legacy `VAULT = ROOT` name only for compatibility.

Run it:

```bash
./scripts/run_pbs_local_game.sh
```

Manual local commands:

```bash
npm --prefix webview-ui run build
python3 scripts/pbs_engine.py index
python3 scripts/pbs_game_server.py --host 127.0.0.1 --port 4173
```

Open:

```text
http://127.0.0.1:4173/
```

Local Review drafts can be written to:

```text
Review/compiled-note-drafts/
```

## LLM wiki / shared memory

PBS is also a Karpathy-like LLM wiki experiment: instead of asking an AI to re-read a messy pile every time, the project grows a curated memory layer that can be searched, reviewed, repaired, and exported back into the game.

Current public source fields include:

- NGM interview transcripts and persona notes;
- Hackteria Wiki;
- SGMK Wiki;
- Fabricademy / Textile Academy Wiki;
- Design+Posthumanism;
- KUBU / Kulturhus Björkboda;
- Radiona makerspace;
- Green Fab Lab project pages;
- selected public source pages connected to NGM people, workshops, tools, camps, and communities.

Important boundary: **the online version and the local downloaded version use different memory runtimes**. See `LOCAL_MEMORY_GAME.md` for the operational checklist.

```text
Cloud online: GitHub Pages UI -> PBS memory Worker -> Cloudflare D1 / FTS source index -> DeepSeek -> answer
Local download: game UI -> local server -> pbs_engine.py -> SQLite / Sources/Raw / Knowledge -> DeepSeek -> answer -> Review draft
```

<img width="1617" height="939" alt="Screenshot 2026-06-01 at 09 00 22" src="https://github.com/user-attachments/assets/ceb8e0f5-1445-48d2-bea5-7799a475dd1c" />

## Current status

PBS is currently a working prototype:

- the public game is playable online;
- NPC and campfire conversations can use recent dialogue context;
- source links are filtered so the game should not force unrelated links when no reliable source is found;
- zine generation, map/archive entry points, and the local wiki-memory workflow are still being refined;
- the Question Pet is connected to the shared-memory traversal lint and acts as a monitor for the player's current question;
- the next work is to keep simplifying the public explanation, improve source coverage, and make the local shared-memory workflow easier for non-technical users.

The goal is not to finish a perfect archive. The goal is to keep a living garden where small community knowledge can be asked, cited, repaired, and passed on.
