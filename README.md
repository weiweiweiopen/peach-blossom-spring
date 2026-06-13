# Peach Blossom Spring / PBS

Peach Blossom Spring is inspired by **NGM / Non-Governmental Matters**. It is a LLM wiki wrapped with playful game interface. PBS is also a Karpathy-like LLM wiki experiment: instead of asking an AI to re-read a messy pile every time, the project grows a curated memory layer that can be searched, reviewed, repaired, and exported back into the game.

NGM is a research interview project about the sustainability of small, independent art and technology communities: how they organize, teach, share tools, host camps, keep friendships alive, survive funding gaps, and pass on knowledge in alternative and non-institutional ways.

The interviewees include Andreas Siagian, Anastassia Pistofidou, Giulia Tomasello, Christian Dils, Jonathan Minchin, Marc Dusseiller, Rully Shabara, Wukir Suryadi, Ryu Toru Oyama, Stephanie Pan, Stelio Manousakis, Svenja Keune, Ted Hung, Tincuta Heinzel.

<img width="1612" height="934" alt="Screenshot 2026-06-01 at 08 58 27" src="https://github.com/user-attachments/assets/840f29e0-210a-4a38-b63b-a105e81207bd" />

## The garden is made with the scene of hacker camps

PBS turns NGM into a small explorable world built with pixel office game engine and work advanture to memorize the interview held right after covid time. The world is built according to the scene of hacker camps, which is the most common format the independent art science groups use to gather people:

- NPCs are built from NGM interview transcripts and persona notes. They are not exact replicas of people; they are conversation interfaces shaped by each interviewee's words, recurring concerns, and public context. (currently dismissed due to the strong complaints from tbe interviewees;
- the campfire is a shared question place for the whole archive;
- the zine tool turns one question into a short source-grounded booklet;
- the map, ebook, and source links show where the project came from;
- the Question Pet is now a traversal health monitor for the player's current question: it watches specificity, evidence readiness, source-family spread, and missing-evidence caveats.

<img width="1620" height="933" alt="Screenshot 2026-06-01 at 08 58 52" src="https://github.com/user-attachments/assets/882955c4-ff0b-4e4d-8ff3-1e51609ce2af" />

## How to play

1. Run the game online or download it and run it locally.
2. Walk your avatar with arrow keys / WASD. On mobile, use the thumb control.
3. Move near an NPC and click / tap / press Space to open a conversation.
4. Go to the central campfire / computer to ask broader questions about NGM, communities, tools, camps, and sources.
5. Use the zine function from a question to generate a small wiki booklet.
6. Open the NGM ebook, map, and source links when you want to leave the fable and check the research material.

<img width="1616" height="934" alt="Screenshot 2026-06-01 at 08 59 22" src="https://github.com/user-attachments/assets/3a0ebd2b-4346-4bbd-94a3-d38162c59691" />

## You may use it locally with your own deployed shared memory too
The online garden exhibition above already has a deployed memory service. The downloaded local version is the one you use when you want to build your own source-first shared memory layer.

### A. The github cloud version

Open:

```text
https://weiweiweiopen.github.io/peach-blossom-spring/
```

The online version works like this:

```text
GitHub Pages UI -> Cloudflare PBS memory Worker -> Cloudflare D1 source index -> LLM proxy -> answer
```

Use it when you only want to play, test the public NGM garden, ask NPCs/campfire questions, or share the project with visitors. The online version cannot read your private files and cannot write review notes back into your downloaded repo.

### B. The local version

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

<img width="1617" height="939" alt="Screenshot 2026-06-01 at 09 00 22" src="https://github.com/user-attachments/assets/ceb8e0f5-1445-48d2-bea5-7799a475dd1c" />

## Current status

PBS is currently a working prototype:

- the public game is playable online;
- NPC and campfire conversations can use recent dialogue context;
- zine generation, map/archive entry points, and the local wiki-memory workflow are still being refined;
- the Question Pet is connected to the shared-memory traversal lint and acts as a monitor for the player's current question but not fully functioning yet.

