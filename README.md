# Peach Blossom Spring / PBS

**PBS-2026.2.26701788323** is the second-version direction for Peach Blossom Spring: a playable LLM wiki world that uses NotebookLM as a fast public-source reading engine while keeping durable knowledge memory in PBS, locally or on GitHub.

Play the public version: https://weiweiweiopen.github.io/peach-blossom-spring/

## Core Idea

PBS no longer starts from a giant preprocessed local source corpus.

The new loop is:

1. Ask a public-source question.
2. Use NotebookLM CLI as a transient high-speed reading and synthesis engine.
3. Convert NotebookLM output into a PBS source pack, trace, and zine draft.
4. Store the trace locally first.
5. Promote only reviewed traces into the Karpathy-style markdown wiki memory.
6. Let NPCs, the question pet, the campfire, zines, and the map use promoted memory as world state.

Short version:

```text
NotebookLM = fast public-source cognition
PBS = local/community memory commons + playable wiki world
```

Operational metaphor:

```text
NotebookLM can be the shovel, but PBS keeps the land.
Use NotebookLM to dig through public sources quickly, then cultivate reviewed knowledge in the local PBS LLM wiki.
```

## Why This Is Not A NotebookLM Clone

NotebookLM already does the hard fast-reading work: source parsing, chunking, retrieval, reranking, citation packing, and account-bound notebook state. PBS should not spend its energy rebuilding that from scratch when the project goal is cultural memory, play, zines, and maintainable knowledge traces.

PBS uses NotebookLM as a platform boost only for public or explicitly approved source-level questions. PBS keeps the durable layer:

- player questions
- source-pack traces
- zine drafts and repairs
- unsupported claims
- promotion decisions
- wiki notes
- NPC and pet memory
- map/campfire world state

The ethical and technical difference is knowledge ownership. NotebookLM may keep a useful cloud notebook context, but PBS treats the canonical memory as a user-owned Markdown/wiki layer that can be opened in Obsidian, committed to git, diffed, forked, backed up, and moved to another model.

PBS follows the Karpathy-style LLM Wiki split:

1. **Raw sources** are immutable source of truth. PBS tools do not silently rewrite `obsidian-vault/Sources/`.
2. **Wiki compilation layer** is durable Markdown memory. It contains reviewed people, concepts, events, questions, comparisons, zines, and synthesis notes.
3. **Schema and agent rules** define naming, citation, lint, promotion, repair, and update behavior so AI works as a knowledge-base maintainer, not just a chat interface.

## Privacy Boundary

Using NotebookLM means Google can process whatever is sent to NotebookLM. PBS therefore treats NotebookLM as suitable for public source work, not private memory.

Do not send to NotebookLM:

- private player memory
- unpublished interviews
- sensitive community data
- secrets, API keys, cookies, or tokens
- anything that should not enter a Google service

Recommended modes:

- **Platform Boost**: public sources and public questions go through NotebookLM.
- **Local Memory**: private traces and player memory stay in PBS only.
- **Hybrid**: NotebookLM answers public-source parts; PBS merges them with local memory without sending private memory back.

## NotebookLM Bridge

The current planned bridge uses the local NotebookLM CLI:

```text
/Users/shihweichieh/.openclaw/workspace/.venv-notebooklm/bin/notebooklm
```

The package currently identified is `notebooklm-py` version `0.4.1`, an unofficial Python API/CLI for NotebookLM. It is not a Google-official library, and it uses undocumented APIs. It should be treated as a prototype bridge, not permanent infrastructure.

Minimal bridge calls:

```bash
notebooklm metadata --json
notebooklm ask --prompt-file ./query.txt
notebooklm generate report --prompt-file ./prompt.txt
```

The bridge must never commit Google auth state, cookies, tokens, or browser profiles.

## PBS Trace Schema

NotebookLM output is not the final PBS truth. It becomes a reviewable trace.

Target trace shape:

```ts
type NotebookLmPbsTrace = {
  query: string;
  notebookId: string;
  answer: string;
  sources: Array<{
    title: string;
    url?: string;
    sourceId?: string;
    excerpt?: string;
    citationLabel?: string;
  }>;
  claims: Array<{
    text: string;
    sourceIndexes: number[];
    confidence: "strong" | "partial" | "unsupported";
  }>;
  suggestedQuestions: string[];
  createdAt: string;
};
```

## Karpathy-Style Wiki Memory

PBS keeps a markdown memory bank under `obsidian-vault/Wiki/`, but that memory should grow through promotion, not startup bulk preprocessing.

This layer is the canonical memory and source-of-ownership for PBS. NotebookLM can accelerate ingestion and exploration, but it must not become the final knowledge container. A useful NotebookLM answer should become a trace first; after review, it can create or update wiki pages, repair contradictions, add backlinks, record uncertainty, or spawn a new question.

Promotion path:

```text
NotebookLM answer
→ PBS trace
→ Review queue
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

## Architecture Canvas

The second-version architecture is drawn in the vault:

- `obsidian-vault/PBS 2026.2 NotebookLM Bridge Architecture.canvas`

Older architecture notes remain useful for history, but PBS-2026.2 starts from the NotebookLM bridge plus local wiki memory model.

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
python3 scripts/wiki_tool.py export-wiki-index --output webview-ui/public/assets/pbs-wiki-index.json
python3 scripts/wiki_tool.py lint-evidence
python3 scripts/pbs_engine.py --help
```

`compile-source-notes` is intentionally disabled unless run with an explicit legacy flag. PBS-2026.2 should not rely on generated full source-note corpora at startup.

## Project Status

PBS is part digital garden, part LLM wiki, part zine machine, part virtual camp. The 2026.2 direction is:

```text
cloud reading, local memory, playable knowledge commons
```

The point is not to finish the garden. The point is to keep it alive while preserving who asked, what was cited, what remained uncertain, and what the community chose to remember.
