# PBS Game Layer + Local Memory Migration

## Source Revisions

- PBS game repository source: `/Users/weiweiweiwei/Documents/Projects/peach-blossom-spring-main`
- PBS game source commit: `a8c2721d205259b766965764ced99b545bc250f5`
- Local memory source directory: `/Users/weiweiweiwei/Documents/Projects/pbs-local-memory`
- Local memory source status: directory was not an independent git repository; it was copied as a source-first memory module.
- Migration branch: `migration/pbs-game-layer-llm-wiki`

## Dirty State Isolation

The original `peach-blossom-spring-main` worktree had unrelated dirty and untracked files. Migration work was done in a clean git worktree created from `origin/main` at:

```text
/Users/weiweiweiwei/Documents/Projects/peach-blossom-spring-migration
```

Dirty state backups were written before migration under:

```text
/Users/weiweiweiwei/Documents/Projects/pbs-migration-backups/
```

The dirty files from the original worktree were not staged or copied into this migration branch.

## Moved / Added

- `local-memory/`: source-first PBS local memory engine copied from `pbs-local-memory`.
- `local-memory/scripts/pbs_engine.py`: crawl, index, search, draft, promote, and game-index export commands.
- `local-memory/Sources/Raw/`: public source markdown corpus.
- `local-memory/obsidian-vault/Wiki/`: reviewed shared memory notes.
- `local-memory/obsidian-vault/Review/`: review drafts.
- `local-memory/obsidian-vault/Schema/`: source-first maintainer rules.
- `webview-ui/src/generated/pbsLocalMemoryIndex.json`: static game-facing export generated from `local-memory/Sources/Raw/`.
- `webview-ui/src/pbsLocalMemory.ts`: browser-safe adapter for local memory search, evidence, source cards, and campfire fallback answers.

## Runtime Data Flow

```text
local-memory/Sources/Raw/*.md
  -> local-memory/scripts/pbs_engine.py index/search/draft-note/promote-note
  -> local-memory/scripts/pbs_engine.py export-game-index
  -> webview-ui/src/generated/pbsLocalMemoryIndex.json
  -> webview-ui/src/pbsLocalMemory.ts
  -> wikiSearch / NPC evidence / pet chat / Association zine source cards / campfire answers
```

The game does not call Python, SQLite, the filesystem, or an LLM provider directly for local-memory retrieval. Browser runtime reads the static JSON export through `pbsLocalMemory.ts`.

## What Was Kept

- Existing PBS game layer from `origin/main`.
- NPC dialogue UI and hidden evidence behavior.
- Campfire/PBS Computer answer surface.
- Association zine generation path.
- Question pet and role logic.
- Browser/Safari document generation fallback path.

## What Was Avoided

- No `.env`, auth, cookies, Google/NotebookLM credentials, or private data were copied.
- No SQLite database was committed; local-memory database files are ignored and can be regenerated.
- No dirty files from the original worktree were staged.
- No `daydream-export` source archive was copied or mutated.

## Follow-Up

This branch keeps the existing game functional while routing new source-first memory through `local-memory`. A later lightweight cleanup can remove old corpus artifacts and reduce bundle size after behavior is verified.
