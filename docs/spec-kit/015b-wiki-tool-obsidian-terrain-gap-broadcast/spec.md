# Obsidian Core Strengthening + Thought-Gap Broadcast

## Goal

Strengthen the PBS Obsidian core so game questions, zines, source cards, and Question Pet signals can reveal where the wiki has not yet grown durable thought.

## Context

This spec follows the Karpathy-style LLM Wiki direction and especially the report concerns around durable synthesis, source-bounded concept pages, and Question Page / pet runtime integration.

## Requirements

1. Core wiki pages must distinguish raw source pages, compiled concept/method/material/social-form pages, comparison pages, and higher-order syntheses.
2. Good zine answers and repeated player questions should become candidates for reviewed wiki notes, not automatic public writes.
3. Terrain-gap lint should identify repeated motifs, material practices, relation neighborhoods, or conceptual clusters visible in sources but missing as durable wiki nodes.
4. Runtime game broadcasts should surface selected terrain gaps as colorful in-world notices while the player is present.
5. Question Pet should eventually carry terrain-gap state, but public GitHub Pages must not run private vault lint automatically or write private dialogue memory to Obsidian.

## Current Runtime Slice

- The game can broadcast colorful `THOUGHT GAP` notices in-world.
- These notices are curated/static for now, not automatic vault writes.
- The first notices focus on SGMK DIY electronics/sound/workshop links, material practice, care/maintenance/failure notes, and evidence-vs-hypothesis marking.

## Feedback Routing Opinion

Zine heart/comment feedback should not write directly into source notes. Better targets:

1. `Wiki/Zines.md`: aggregate public zine feedback by zine title/query and date.
2. `Wiki/Questions.md`: turn repeated comments into reviewed question candidates.
3. `Wiki/log.md`: append review events, not raw comments.
4. Future `Wiki/Feedback/` folder: only if feedback volume becomes large enough to need individual records.

Directly writing feedback into source pages would blur evidence with reception. Keeping feedback near zines/questions preserves reviewability.

## Acceptance Criteria

- A maintainer can run a future lint job and receive terrain-gap candidates without mutating source pages.
- The game can display thought-gap broadcasts without exposing private debug traces.
- The pet integration remains local-first until a reviewed export/import path exists.
- Zine feedback has a meaningful reviewed destination plan before any vault write is implemented.

## Implemented Slice

- `scripts/wiki_tool.py terrain-gap-lint --limit N` writes local review artifacts to `obsidian-vault/Review/terrain-gaps/latest.md` and `latest.json`.
- `Schema/frontmatter-schema.md` now defines terrain-gap reports and Question Page terrain fields.
- `Schema/lint-checklist.md` now separates terrain-gap candidates, pet broadcasts, and zine feedback from source evidence.
- `Wiki/Questions/README.md`, `Wiki/Zines/README.md`, and `Wiki/log.md` document the reviewed route.
