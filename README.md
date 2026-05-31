# Peach Blossom Spring / PBS

**PBS-2026.2.255** is Peach Blossom Spring rebuilt around the `pbs-local-memory` source-first workspace plus the existing playable game layer.

Play the public version: https://weiweiweiopen.github.io/peach-blossom-spring/

## Core Idea

PBS no longer treats a cloud notebook or a giant dirty working corpus as canonical memory.

The new loop is:

1. Ask a public-source question.
2. Search `Sources/Raw/` through the source-first memory engine.
3. Export a static game index into `webview-ui/src/generated/pbsLocalMemoryIndex.json`.
4. Let NPCs, the question pet, the campfire, zines, and the map read through the browser adapter.
5. Draft uncertain syntheses into `obsidian-vault/Review/`.
6. Promote only reviewed notes into `obsidian-vault/Wiki/`.

Short version:

```text
Sources + obsidian-vault = source-first public corpus + review-first wiki
PBS game = playable interface over the local/community memory commons
```

Operational metaphor:

```text
The game reads a static memory export; the editable knowledge land stays in local Markdown, SQLite indexes, and review notes.
```

## Local Memory Module

The source-first memory engine lives at the repository root, matching `pbs-local-memory`:

- `Sources/Raw/`: public raw-ish source pages.
- `scripts/pbs_engine.py`: crawl, index, search, draft, promote, and export commands.
- `obsidian-vault/Review/`: generated drafts awaiting review.
- `obsidian-vault/Wiki/`: reviewed durable shared memory.
- `webview-ui/src/pbsLocalMemory.ts`: browser adapter used by campfire, NPC evidence, pet chat, and zine source cards.

Refresh the game-facing index from the repository root:

```bash
python3 scripts/pbs_engine.py export-game-index \
  --target "$PWD/webview-ui/src/generated/pbsLocalMemoryIndex.json"
```

## Karpathy-Style Wiki Memory

PBS keeps a markdown memory bank under `obsidian-vault/Wiki/`, but that memory should grow through promotion, not startup bulk preprocessing.

This layer is the canonical memory and source-of-ownership for PBS. Search results and zines are not durable knowledge until reviewed. A useful answer should become a review draft first; after review, it can create or update wiki pages, repair contradictions, add backlinks, record uncertainty, or spawn a new question.

Promotion path:

```text
source-first search result
→ Review draft
→ promoted source snapshot / question / zine / concept / method / material / social-form note
→ playable memory used by NPCs, pet, map, and campfire
```

Generated `Wiki/SourceNotes/` are disabled in PBS-2026.2. The wiki index should contain curated and promoted notes, not thousands of generated source-note anchors.

Promotion should be cumulative and auditable:

- preserve raw source references instead of overwriting sources
- write reviewed observations into Markdown notes
- update old wiki pages when new evidence changes them
- keep contradictions and unresolved questions visible
- use git history as the audit trail for knowledge changes
- prefer portable files over account-bound cloud artifacts

## Privacy Boundary

The browser game reads a static public-memory export. Do not commit `.env` files, API keys, cookies, Google auth state, unpublished interviews, sensitive community data, or private player memory.

SQLite indexes under `obsidian-vault/Knowledge/` are local generated files and are ignored by git. Regenerate them with `python3 scripts/pbs_engine.py index` when needed.

## How To Play

Open the public site and press start.

- Walk through the garden.
- Talk to NPCs by moving near them and clicking or pressing Space.
- Use the PBS computer / question interface to ask research questions.
- Generate zines from source-grounded traces.
- Let the question pet mark weak evidence, missing links, and promotion candidates.
- Treat zines as artifacts that can be repaired, saved, and promoted.

## Local Development

Install and run the web UI:

```bash
npm --prefix webview-ui install
npm --prefix webview-ui run dev
```

Validate before deploying:

```bash
npm --prefix webview-ui run check:secrets
npm --prefix webview-ui run check:visual-layout
npm --prefix webview-ui run build
```

Useful local tools:

```bash
python3 scripts/pbs_engine.py --help
python3 scripts/pbs_engine.py search "e-textile sensor workshop" --limit 8
```

## Project Status

PBS is part digital garden, part LLM wiki, part zine machine, part virtual camp. The 2026.2 direction is:

```text
source-first local memory, playable knowledge commons
```

The point is not to finish the garden. The point is to keep it alive while preserving who asked, what was cited, what remained uncertain, and what the community chose to remember.
