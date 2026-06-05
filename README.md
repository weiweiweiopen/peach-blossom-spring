# Peach Blossom Spring / PBS

Peach Blossom Spring is an **NGM electronic garden**.

NGM / Non-Governmental Matters is a research interview project by **Shih Wei Chieh** about small, independent art-and-technology communities: how they organize, teach, share tools, host camps, keep friendships alive, survive funding gaps, and pass on knowledge without becoming institutions too quickly.

PBS turns that research into a living digital garden. People, interviews, tools, workshops, camps, wikis, and source fragments become paths through a shared memory landscape. The game interface is important, but it is not the core by itself. The core is the **NGM electronic garden**: a source-grounded LLM wiki where fragile community knowledge can be asked, cited, repaired, and re-entered as playable memory.

Public garden:

```text
https://weiweiweiopen.github.io/peach-blossom-spring/
```

## What PBS is

PBS is not only a game and not only a chatbot. It is a public-facing research garden for NGM.

The garden has several visible forms:

- **NPC conversations**: interview memories become situated dialogue interfaces.
- **Campfire / computer questions**: visitors ask broader questions across the archive.
- **LLM wiki search**: the system searches source material before answering.
- **Source links**: answers keep a path back to public pages, transcripts, and research material.
- **Zine / booklet drafts**: one question can become a small source-grounded publication draft.
- **Question Pet / traversal lint**: the current question is monitored for specificity, evidence readiness, source-family spread, and missing-evidence caveats.
- **Map, ebook, and archive links**: the fable remains connected to the research body behind it.

The tone can be playful, but the archive logic is serious. PBS should help people remember fragile community knowledge without flattening it into a report, dashboard, or generic AI answer.

## NGM electronic garden logic

The project starts from NGM interviews and related public knowledge fields.

Interviewees and related figures include Andreas Siagian, Anastassia Pistofidou, Giulia Tomasello, Christian Dils, Jonathan Minchin, Marc Dusseiller, Rully Shabara, Wukir Suryadi, Ryu Toru Oyama, Stephanie Pan, Stelio Manousakis, Svenja Keune, Ted Hung, and Abao / Shih Wei Chieh.

PBS treats them as part of a research ecology rather than a cast of fictional characters. NPCs are not exact replicas of people. They are conversation interfaces shaped by interviews, recurring concerns, public context, and the ethics of not pretending that an LLM is the person.

The garden asks questions like:

- How do small art-and-technology communities survive?
- How do workshops transmit knowledge outside formal institutions?
- How do open hardware, DIY biology, e-textiles, sound, solar tools, and handmade electronics become social forms?
- How can wiki fragments become a navigable memory system without losing their local texture?

## LLM wiki / source-first memory layer

PBS uses an LLM wiki approach: instead of asking a model to improvise from nowhere, PBS builds and searches a curated memory layer first.

The memory layer is source-first:

```text
sources
-> source registry
-> passages
-> claims / chunks
-> SQLite / D1 search index
-> evidence packet
-> LLM answer
-> source links / review draft / zine material
```

Important rule:

```text
Player questions are not knowledge.
Raw sources are not mutated by chat.
Answers should remain connected to checkable material.
```

Current source families include:

- NGM interview transcripts and persona notes;
- Hackteria Wiki;
- SGMK Wiki;
- Fabricademy / Textile Academy Wiki;
- Design+Posthumanism;
- KUBU / Kulturhus Björkboda;
- Radiona makerspace;
- Green Fab Lab project pages;
- selected public pages connected to NGM people, workshops, tools, camps, and communities.

## How the public garden answers a question

In the public version, the browser does not contain the full archive. It calls the cloud memory worker.

```text
GitHub Pages web UI
-> meta[name="pbs-memory-api"]
-> Cloudflare Worker: peach-blossom-spring-memory
-> Cloudflare D1 SQLite / FTS source index
-> DeepSeek proxy
-> source-grounded answer
-> evidence links / traversal lint / draft markdown response
```

Public cloud files:

```text
webview-ui/
pbs-memory-worker/
pbs-memory-worker/d1/source-index.sql
webview-ui/index.html   # pbs-memory-api meta tag
```

Public API routes:

```text
/api/memory/search
/api/chat/campfire
/api/chat/npc
/api/memory/draft
```

The cloud worker can return draft Markdown, but it cannot write into a local vault. Cloud draft responses use `stored:false`.

## How the local full-memory garden works

The local version is for working with the full source-first engine on a cloned repo.

```text
browser UI
-> scripts/pbs_game_server.py
-> scripts/pbs_engine.py
-> local SQLite / Sources / Knowledge / Review
-> DeepSeek proxy
-> answer / source links / local Review draft
```

Run local mode:

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

Local Review drafts are written to:

```text
Review/compiled-note-drafts/
```

See also:

```text
LOCAL_MEMORY_GAME.md
```

## Repository map

Current repo structure:

```text
.github/workflows/pages.yml        GitHub Pages deployment
Sources/                           Source material entry point
Knowledge/                         Generated local memory store (ignored when absent)
Review/                            Local review drafts (created by local mode)
data/                              NPC/persona data
eslint-rules/                      Project-specific lint guards
multiplayer-worker/                Multiplayer presence worker; not the memory core
pbs-memory-worker/                 Cloudflare Worker for public memory API
pbs-memory-worker/d1/              D1 SQL seed export target
scripts/pbs_engine.py              Source-first memory engine
scripts/pbs_game_server.py         Local full-memory HTTP server
scripts/wiki_tool.py               Wiki helper tooling
scripts/notebooklm_bridge.py       NotebookLM bridge helper
shared/assets/                     Shared asset build helpers
specs/                             Design/spec notes
webview-ui/                        Vite/React garden UI
webview-ui/src/localMemoryApi.ts   Browser bridge to cloud/local memory API
```

The most important technical files for the LLM wiki are:

```text
scripts/pbs_engine.py
pbs-memory-worker/src/index.ts
scripts/pbs_game_server.py
webview-ui/src/localMemoryApi.ts
```

## PBS engine commands

The local engine supports a source-first workflow:

```bash
python3 scripts/pbs_engine.py build-registry
python3 scripts/pbs_engine.py extract-passages
python3 scripts/pbs_engine.py extract-claims
python3 scripts/pbs_engine.py index
python3 scripts/pbs_engine.py search "e-textile workshop"
python3 scripts/pbs_engine.py query --query "open hardware workshops"
python3 scripts/pbs_engine.py draft-note --query "solar sound workshop"
python3 scripts/pbs_engine.py export-d1-sql --target pbs-memory-worker/d1/source-index.sql
python3 scripts/pbs_engine.py lint
```

Cloud source index refresh:

```bash
python3 scripts/pbs_engine.py export-d1-sql --target pbs-memory-worker/d1/source-index.sql
cd pbs-memory-worker
npx wrangler d1 execute peach-blossom-spring-memory-db --remote --file d1/source-index.sql
npx wrangler deploy
```

Deploy public UI:

```bash
npm --prefix webview-ui run build
git push origin main
```

Pushing `main` triggers:

```text
.github/workflows/pages.yml
```

which publishes `dist/webview` to GitHub Pages.

## Public vs local memory modes

Do not mix the two memory runtimes.

```text
Cloud mode:
GitHub Pages UI -> PBS memory Worker -> D1 / FTS -> DeepSeek -> answer

Local mode:
Browser UI -> local Python server -> pbs_engine.py -> local SQLite / Sources / Knowledge -> DeepSeek -> answer -> Review draft
```

Use cloud mode for the public garden. Use local mode when editing, reviewing, rebuilding, or writing back into the local research workflow.

## What is secondary

PBS may include multiplayer presence, playful UI, RPG dialogue, visual maps, NPC movement, zines, and sound/video encounters. These are presentation and interaction layers.

They should serve the NGM electronic garden and the LLM wiki memory layer, not replace them as the main explanation.

## Current status

PBS is a working prototype of an NGM electronic garden:

- the public garden is playable online;
- the cloud worker can search a D1 source index and return source-grounded answers;
- local mode can rebuild/search the fuller source-first memory engine;
- NPC and campfire conversations can use recent dialogue context;
- zine generation, source coverage, and local review workflows are still being refined;
- the next work is to keep the public explanation clear while improving the memory layer's source coverage and repair workflow.

## One-sentence summary

PBS is an **NGM electronic garden powered by a source-first LLM wiki**: a place where small community knowledge can be walked through, asked about, cited, repaired, and passed on.
