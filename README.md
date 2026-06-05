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

Cloud mode can search the deployed source index and return source-grounded answers. It cannot write to your local vault. `/api/memory/draft` returns Markdown for review with `stored:false`.

Cloud source/deploy files:

```text
pbs-memory-worker/
pbs-memory-worker/d1/source-index.sql
webview-ui/index.html   # pbs-memory-api meta tag
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

The local version is for a cloned/downloaded repo on your machine. It runs a Python server and the full source-first engine:

```text
browser game UI
-> scripts/pbs_game_server.py
-> scripts/pbs_engine.py
-> local SQLite / Sources/Raw / obsidian-vault/Wiki / obsidian-vault/Schema
-> DeepSeek
-> answer / source links / local Review draft
```

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
obsidian-vault/Review/compiled-note-drafts/
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

Important boundary: **the online version and the local version use different memory runtimes**. See `LOCAL_MEMORY_GAME.md` for the operational checklist.

```text
Cloud: game UI -> PBS memory Worker -> D1 SQLite / FTS source index -> DeepSeek -> answer
Local: game UI -> local server -> pbs_engine.py -> SQLite / Sources / Wiki / Schema -> DeepSeek -> answer -> Review draft
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
