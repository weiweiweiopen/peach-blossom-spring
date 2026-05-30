# Peach Blossom Spring / PBS

**PBS-2026.2.36** is an ongoing digital garden, LLM wiki, and small game that grew out of **Non-Governmental Matters (NGM)**. It treats cultural memory as something you can walk through: a virtual hacker-camp garden where NPCs, question pets, sources, wiki notes, and printable zines all share the same terrain.

Play the public version: https://weiweiweiopen.github.io/peach-blossom-spring/

## What Is This?

Peach Blossom Spring is a public experiment in preserving independent cultural knowledge in the age of AI.

It began from NGM's concern that small art, technology, and education networks often live through fragile things: temporary camps, personal memory, workshop notes, half-public wikis, funding documents, oral histories, and scattered archives. PBS turns that problem into a game-like knowledge garden.

The scene is shaped like a **hacker camp** rather than a museum. You wander, ask, listen, repair questions, meet NPCs, generate zines, and slowly grow the wiki terrain.

## NGM Constitution, Short Version

This project follows a practical NGM constitution:

- Knowledge is social, situated, and maintained by people.
- Sources are not raw material to overwrite; they are evidence to care for.
- AI should expose paths, limits, and uncertainty, not pretend to be an oracle.
- Camps, workshops, kitchens, labs, and informal scenes are valid knowledge infrastructures.
- A good answer should leave better questions behind.
- Public artifacts should be readable and playful; maintenance traces stay in the vault, schema, logs, and review layers.

## What Is An LLM Wiki?

An LLM wiki is a wiki designed to be read by people and used by language models without letting the model invent the archive.

In PBS, the LLM does not simply answer from vibes. It reads a compiled middle layer of source-bounded notes, routed evidence, claim candidates, and review artifacts. Player questions can trigger retrieval and zine generation, but they do not become evidence by themselves.

The current visual map of the system lives in the Obsidian vault:

- `obsidian-vault/PBS Wiki Visual Map.canvas`
- Markdown fallback: `obsidian-vault/PBS Wiki Visual Dashboard.md`
- Architecture note: `obsidian-vault/PBS Runtime Architecture.md`

## How The Knowledge Engine Works

The rough loop is:

1. Fetch and preserve source material from public source families such as Hackteria, SGMK, and How To Get What You Want.
2. Keep raw sources under `obsidian-vault/Sources/` as evidence, not as generated answers.
3. Hydrate source stubs into `obsidian-vault/Knowledge/web-cache/` when needed.
4. Extract passages into `Knowledge/passages.jsonl`.
5. Extract source-backed claim candidates into `Knowledge/claims.jsonl`.
6. Route queries and drafts through `Knowledge/query-runs/` and `Review/compiled-note-drafts/`.
7. Promote reviewed notes into the compiled wiki layer under `obsidian-vault/Wiki/`.
8. Export runtime indexes for the game, NPCs, question pet, and zine generator.

The main evidence engine is `scripts/pbs_engine.py`. The older wiki bridge/export tool is `scripts/wiki_tool.py`.

## How To Play

Open the public site and press start.

- Walk through the garden.
- Talk to NPCs by moving near them and clicking or pressing Space.
- Use the PBS computer / question interface to ask research questions.
- Watch the question pet surface weak spots, missing evidence, and terrain gaps.
- Generate a zine when a question has enough PBS context.
- Print or save the zine as a small public artifact.
- Treat refusals or guidance as part of the game: the garden is telling you the question needs more shape.

Good prompts are specific enough to touch the terrain, for example:

- `How did e-textile camps become temporary commons?`
- `Compare Hackteria and SGMK workshop cultures.`
- `Make a zine about 8bit mix tape as open hardware pedagogy.`

## Public Use On GitHub Pages

Use the live build here:

https://weiweiweiopen.github.io/peach-blossom-spring/

The public site can run the game, dialogue surfaces, local question pet memory, zine generation UI, and editor preview. Because GitHub Pages is static, it cannot directly write new files back into the repository. When a public-page action needs to save a layout or report, it falls back to localStorage and/or downloads a JSON file.

Editor preview:

https://weiweiweiopen.github.io/peach-blossom-spring/?editor=1

## Run Locally

Clone the repo, install the web UI dependencies, and start Vite:

```bash
npm --prefix webview-ui install
npm --prefix webview-ui run dev
```

Then open the local URL Vite prints.

Useful commands:

```bash
npm --prefix webview-ui run build
npm --prefix webview-ui run check:visual-layout
python3 scripts/pbs_engine.py --help
```

Local editor mode can write layouts through the dev server endpoint. Open:

```text
http://localhost:5173/peach-blossom-spring/?editor=1
```

Then press Save and enter a filename for `webview-ui/public/assets/`.

## Tune The Answers

The answer behavior is controlled less by one magic prompt and more by schema, indexes, and evidence gates.

Start with:

- `obsidian-vault/Schema/llm-wiki-maintainer.md`
- `obsidian-vault/Schema/frontmatter-schema.md`
- `obsidian-vault/Schema/lint-checklist.md`
- `obsidian-vault/Schema/agentic-firewall.md`
- `webview-ui/src/daydream/browserAssociationGenerator.ts`
- `webview-ui/src/daydream/daydreamWorkflow.ts`

To change what answers feel like, adjust the schema and writing rules. To change what answers know, add or promote better source-bounded wiki notes. To change what the game can retrieve, rebuild or update the exported indexes.

## Project Status

PBS is an ongoing project. It is part digital garden, part LLM wiki, part zine machine, part virtual camp. Expect rough edges, changing schemas, unfinished paths, strange pets, and useful failures.

The point is not to finish the garden. The point is to keep it alive.
