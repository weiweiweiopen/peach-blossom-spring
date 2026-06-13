# Peach Blossom Spring / PBS

Peach Blossom Spring is exhibition garden of **NGM / Non-Governmental Matters**, a previous research made by Shih Wei Chieh; PBS is a source-fist LLM wiki wrapped with playful game interface, a Karpathy-like LLM wiki experiment: instead of asking an AI to re-read a messy pile every time, the project grows a curated memory layer that can be searched, reviewed, repaired, and exported back into the game.

NGM is a research interview project about the sustainability of small, independent art and technology communities: how they organize, teach, share tools, host camps, keep friendships alive, survive funding gaps, and pass on knowledge in alternative and non-institutional ways.

The name Peach Blossom Spring was inspired by the chinese Fables about a man found a paridise in war time, but couldnt find a way to go back. 

The game scene is inspired by the form of hacker camps, which is usually the format how small art and technnklogy groups used for gathering.

<img width="1612" height="934" alt="Screenshot 2026-06-01 at 08 58 27" src="https://github.com/user-attachments/assets/840f29e0-210a-4a38-b63b-a105e81207bd" />
<img width="1620" height="933" alt="Screenshot 2026-06-01 at 08 58 52" src="https://github.com/user-attachments/assets/882955c4-ff0b-4e4d-8ff3-1e51609ce2af" />

## How to play (cloude and local version)
Walk your avatar with arrow keys / WASD. On mobile, use the thumb control. Press space bar or click NPC to start a conversation to explore!
- the campfire is a shared question place for the whole archive;
- the zine tool turns one question into a short source-grounded booklet;
- the map, ebook, and source links show where the project came from;
- the Question Pet is now a traversal health monitor for the player's current question: it watches specificity, evidence readiness, source-family spread, and missing-evidence caveats.
<img width="1616" height="934" alt="Screenshot 2026-06-01 at 08 59 22" src="https://github.com/user-attachments/assets/3a0ebd2b-4346-4bbd-94a3-d38162c59691" />

<img width="1617" height="939" alt="Screenshot 2026-06-01 at 09 00 22" src="https://github.com/user-attachments/assets/ceb8e0f5-1445-48d2-bea5-7799a475dd1c" />


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

Download PBS when you want your own local shared-memory garden: your sources stay on your machine, PBS searches them first, and then your chosen LLM helps answer from that source context.

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

The local version works like this:

```text
local sources -> PBS local search -> your chosen LLM -> source-grounded answer -> review draft
```

PBS can connect to an LLM in two ways:

- **API model:** point PBS to your own private API/proxy for OpenAI, DeepSeek, Claude, or another hosted model. Keep the API key in that proxy or local server, not in the public website.
- **Local model:** run a model such as Gemma, Llama, or Qwen on your own computer/server with an OpenAI-compatible local endpoint, then point PBS to that local address.

In both cases, PBS keeps the sources and memory layer local. The model only helps read the retrieved source context and write an answer. Local answers can become reviewable drafts in `Review/compiled-note-drafts/`, so the memory layer stays inspectable instead of silently rewriting itself.

### C. Add your own sources

In the local game, open the source/schema interface and paste source URLs separated by commas. PBS will save the source list and use it as material for the local memory layer.

You can also add Markdown or text files directly under:

```text
Sources/Raw/<your-source-family>/
```

Then rebuild the local memory index:

```bash
python3 scripts/pbs_engine.py index
```

Raw sources stay in `Sources/Raw/`; generated search state goes into `Knowledge/`; reviewable drafts go into `Review/compiled-note-drafts/`.

## Current status

PBS is currently a working prototype:

- the public game is playable online;
- NPC and campfire conversations can use recent dialogue context;
- zine generation, map/archive entry points, and the local wiki-memory workflow are still being refined;
- the Question Pet is connected to the shared-memory traversal lint and acts as a monitor for the player's current question but not fully functioning yet.

