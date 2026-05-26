# Spec 007: Zine Trace + Schema Control Room

Status: active implementation

## Problem

The zine and PBS Computer workflow need to be inspectable and tunable from inside the game instead of relying on hidden localStorage traces or repeated GitHub deployments.

Recent requirements override the earlier public-only zine constraint: the public article should remain readable, but the generated zine must also expose the full retrieval/generation path for inspection.

## Goals

- Keep generated zine reading materials as readable source links without duplicate secondary "open page" buttons.
- Restore complete retrieval/generation path in the generated zine, including sourceCards, seeds, query terms, wikilink traversal, deep-read pages, prompt summary, LLM call metadata, and validation data.
- Remove "latest news" from the peach archive menu.
- Treat news/updates as a free LLM wiki retrieval task, not a fixed peach-menu link list.
- Change the Schema button into an in-game LLM Wiki control room.
- Add a concise game/project introduction in the Schema control room using the supplied cultural-organization memory text, gameplay context, name origin, and expected contributions.
- Prototype controls for parameters that affect retrieval/generation results, including prompt rewriting and schema control.
- Keep screenshot QA as the rendered-geometry gate for multilingual UI stability.

## Non-Goals

- Do not implement persistent backend storage for control-room presets in this slice.
- Do not wire every prototype control into the production retrieval engine yet.
- Do not restore the fixed static "latest news" menu item elsewhere in the peach menu.
- Do not commit unrelated Obsidian/wiki/thronglet asset changes.

## Functional Requirements

### Zine Reading Materials

- Reading materials appear after the generated article.
- Each material appears once as a title hyperlink.
- Do not render a second yellow "open page" button when the title is already linked.
- Keep short cleaned descriptions only if they do not leak raw labels such as `Source`, `Excerpt`, `Content`, `Imported`, or failed plaintext boilerplate.

### Zine Retrieval / Generation Trace

- Generated zine includes a visible trace section after reading materials.
- Trace section includes JSON or equivalent structured text with:
  - requestId
  - query
  - seed
  - interpretedIntent
  - allowedSourceFamilies
  - entryNotesRead
  - searchTermsUsed
  - matchedPages / triggeredNotes
  - followedWikilinks / linkedPages
  - sourceNotesUsed / deepReadPages
  - tagsMatched
  - depthMetrics and thinSourceWarnings
  - compactPromptSummary
  - rejectedNotes
  - corpusDiagramSummary
  - DeepSeek call metadata
  - generatedArticle summary
  - publicValidation
  - errorClass / errorMessage where relevant
- Trace is printable, not hidden by print CSS.
- The readable article section still runs public artifact validation before trace is appended.

### Peach Menu

- Peach menu contains Schema, ebook/PDF, and map entries.
- Fixed "latest news" / community portal list is removed from the peach menu.
- News or updates should be discoverable by asking PBS Computer/LLM wiki search, so retrieval can query wiki/news/update materials dynamically.

### Schema Control Room

- Clicking Schema opens a split panel titled `LLM Wiki control room`.
- The panel includes a concise introduction covering:
  - small cultural organizations and independent art networks rely on key people, short-term grants, workshops, informal communication, and personal memory.
  - knowledge is scattered across interviews, wiki, Google Drive, grant files, exhibition records, workshop materials, social media, Medium posts, and oral experience.
  - Non-Governmental Matters provides first-layer field materials for AI-era knowledge preservation.
  - small cultural organizations need a cognitive system for preserving, classifying, recalling, comparing, correcting, and reusing knowledge.
  - gameplay: players enter with Why?, talk to NPC interview memories, ask the central computer, and generate inspectable zines.
  - name origin: Peach Blossom Spring as a lost-and-found path metaphor.
- The panel includes expected contributions:
  - AI as cultural emulator / ghost machine / loop.
  - LLM Wiki as memory infrastructure for small cultural organizations.
  - cultural ghosts and media archaeology become practical AI knowledge-preservation problems.
  - semantic layers, LLMs, and wiki form a human-machine cultural memory governance framework.
- The panel prototypes controls for retrieval/generation, including at minimum:
  - query rewrite prompt
  - editorial writer prompt
  - schema focus
  - source-family priority
  - retrieval depth
  - evidence threshold
  - language/tone
  - output includes / trace controls

## QA Requirements

- `npm --prefix webview-ui run check:visual-layout` must pass.
- `npm --prefix webview-ui run build` must pass.
- `npm --prefix webview-ui run check:screenshot-qa` must pass for 30 fixtures:
  - languages: `zh-TW`, `en`, `id`, `de`, `ja`, `th`
  - panels: `computer`, `npc`, `pet`, `zine`, `language`
- Screenshot QA must measure rendered icon button geometry, window action geometry, language row heights, horizontal overflow, and dialogue footer alignment.

## Implementation Notes

- Current implementation may keep the old `communityLinks` split-panel type if unused, but it must not be reachable from the peach menu.
- Public article validation may run before appending trace. Do not run the earlier public-only artifact guard on the final trace-bearing zine HTML, because trace intentionally contains sourceCards, seeds, prompt, and validation language.
- Commit only targeted files for this slice.
