# PBS Daydream Architecture Brief for GPT-5.5 Pro

Date: 2026-05-16  
Repo: `/Users/weiweiweiwei/Documents/Projects/peach-blossom-spring-latest`  
Project: Peach Blossom Spring / PBS  
Status: MVP draft, not yet committed; needs deep review and redesign guidance.

---

## 1. Purpose of this document

This brief summarizes the current Daydream MVP concept, data structures, code layout, failure modes, and proposed next architecture. It is intended as input for GPT-5.5 Pro or another senior architecture reviewer.

The user wants Daydream to become a PBS mode that can take a creative/research seed and generate evidence-grounded future scenarios by associating it with wiki / interview / archive / persona-adjacent source material.

Important: the current implementation is only a small local MVP. It should not be treated as the final architecture.

---

## 2. One-sentence concept

**Daydream is a Seed-to-Future Association Engine:**

> A player provides a seed such as a poem, song, artwork explanation, curatorial note, or research fragment; PBS extracts traits from it, matches relevant source cards from a clean knowledge index, builds associations, and generates several future scenarios with evidence and caveats.

It is not meant to be a generic chatbot. It should be closer to an evidence-first creative forecasting / associative research instrument.

---

## 3. Intended conceptual pipeline

```text
Seed input
  ↓
Perception / encoding layer
  - parse keywords
  - extract latent traits
  - identify materials, affects, techniques, social context, places, practices
  ↓
Evidence matching layer
  - match SourceCard[]
  - expand through graph/category edges
  - preserve citations
  ↓
Association layer
  - build relation paths
  - cluster possible directions
  - mark confidence and missing evidence
  ↓
Future decoding layer
  - generate future scenarios
  - produce caveats
  - return structured DaydreamReport
  ↓
UI/report layer
  - show seed, keywords/traits, evidence, associations, futures, caveats
```

A useful analogy is a **VAE-inspired symbolic latent layer**, not a real ML VAE yet:

```text
seed → symbolic encoder → latent traits/associations → symbolic decoder → future report
```

This should remain deterministic/testable in the near term. Do **not** introduce actual VAE training in the MVP.

---

## 4. Current code layout

Current Daydream files:

```text
webview-ui/src/daydream/
  DaydreamPanel.css
  DaydreamPanel.tsx
  corpus.ts
  engine.ts

webview-ui/test/
  daydream-engine.test.ts

webview-ui/src/App.tsx
  imports DaydreamPanel
  adds isDaydreamOpen state
  adds floating "Daydream" button
```

Current git status includes untracked noisy folders that should not be part of the coding-agent context:

```text
?? obsidian-vault/
?? prompts/
?? multiplayer-worker/.wrangler/
```

The `obsidian-vault/` folder is large enough to pollute agent context: previously observed around 21MB / 2727 files.

---

## 5. Current TypeScript data structures

Current `webview-ui/src/daydream/engine.ts` defines:

```ts
export interface SourceCard {
  id: string;
  title: string;
  excerpt: string;
  keywords?: string[];
  categories?: string[];
  tags?: string[];
  outgoingLinks?: string[];
  source?: string;
  url?: string;
}

export interface CategoryGraphEdge {
  relation: string;
  source: string;
  target: string;
  weight?: number;
}

export interface DaydreamCorpus {
  cards: SourceCard[];
  edges: CategoryGraphEdge[];
  manifest: {
    schemaVersion?: string;
    generatedAt?: string;
    counts?: {
      sourceCards?: number;
      graphEdges?: number;
    };
  };
}

export interface DaydreamFuture {
  title: string;
  scenario: string;
  confidence: "low" | "medium" | "high";
  caveat?: string;
  citations: Array<Pick<SourceCard, "id" | "title" | "url">>;
}

export interface DaydreamReport {
  seed: string;
  question: string;
  keywords: string[];
  matchedCards: SourceCard[];
  expandedCards: SourceCard[];
  futures: DaydreamFuture[];
  corpusSummary: string;
}
```

Current primary functions:

```ts
parseSeedKeywords(seed: string, limit = 12): string[]
generateDaydreamReport(seed: string, corpus: DaydreamCorpus): DaydreamReport
```

Internal helpers:

```ts
rankCards(cards, keywords)
scoreCard(card, keywords)
expandViaGraph(seedCards, corpus)
buildFutures(seed, keywords, evidenceCards)
dedupeCards(cards)
trimForDisplay(text, maxLength)
```

---

## 6. Current sample corpus

Current `corpus.ts` uses a tiny checked-in sample corpus, not the full vault.

Sample cards include:

- `sample-diy-microscopy`
- `sample-handmade-sensors`
- `sample-repair-table`
- `sample-curatorial-score`
- `sample-public-notebook`

Sample graph edges connect source card IDs to category-like targets:

```ts
{ source: "sample-diy-microscopy", target: "community-lab", relation: "tagged", weight: 1 }
{ source: "sample-handmade-sensors", target: "repair-practice", relation: "related", weight: 0.8 }
```

Current manifest:

```ts
schemaVersion: "mvp-sample-v1"
generatedAt: "checked-in sample corpus"
counts: { sourceCards, graphEdges }
```

---

## 7. Current algorithm behavior

### 7.1 Keyword extraction

`parseSeedKeywords()`:

- lowercases seed
- removes apostrophes/control characters
- tokenizes with unicode letter/number regex
- removes a small STOP_WORDS set
- counts token frequencies
- sorts by frequency then alphabetically
- returns up to 12 keywords

### 7.2 Matching

`rankCards()` scores cards against keywords:

- exact keyword match: +8
- tag match: +7
- title contains keyword: +6
- category contains keyword: +4
- excerpt contains keyword: +2

Then it takes the top matches.

### 7.3 Graph expansion

`expandViaGraph()`:

1. Starts from matched card IDs.
2. Finds graph target nodes reached by matched cards.
3. Finds other source cards sharing those graph target nodes.
4. Returns related cards sorted by relation/weight.

This is currently symbolic and simple.

### 7.4 Future generation

`buildFutures()`:

- builds 3–5 future cards
- derives a theme from top keywords
- sets confidence based on evidence count:
  - `high` if evidenceCards >= 6
  - `medium` if evidenceCards >= 3
  - otherwise `low`
- if low confidence, adds caveat:
  > Local corpus evidence is thin; treat this as a tentative association rather than a grounded forecast.
- uses hardcoded Chinese future verbs such as:
  - `變成一套可被重複使用的田野方法`
  - `長成一個小型社群協作原型`
  - `轉化為工作坊、展演與維修行動的混合場景`
  - `變成一份可持續累積的公共知識索引`
  - `成為連結身體、材料與地方記憶的慢速基礎設施`

---

## 8. Current tests

`webview-ui/test/daydream-engine.test.ts` currently checks:

1. parser extracts seed keywords:

```ts
parseSeedKeywords('DIY microscopy, handmade sensors, sensors!')
// expects ['sensors', 'diy', 'handmade']
```

2. report retrieves source cards and generates cited futures.

3. no-match seed becomes low confidence and has caveat.

The tests are useful but too shallow for the intended final architecture.

---

## 9. What went wrong in the first OpenCode prompt/workflow

Original setup context was roughly:

```text
Current PBS direction:
- Daydream mode = Seed-to-Future Association Engine.
- Player gives a seed: poem/song/artwork explanation/curatorial text/photo artwork explanation.
- Engine finds related local wiki/interview/persona content.
- Generates associations and future scenarios:
  “這個東西的未來可以變成什麼？”
- Manual/testable report engine, no cron and no background automation.

Guardrails:
- Do not edit data/personas.json.
- Do not push/deploy unless explicitly asked.
- Do not delete data.
- Do not expose secrets.
- Do not rewrite the whole UI.
- Do not import/copy the whole mirofish project.
- Do not touch untracked folders:
  - multiplayer-worker/.wrangler/
  - obsidian-vault/
  - prompts/
- Avoid unrelated language/menu/layout changes.

Working style:
- Small vertical slice.
- Before editing: run pwd, git rev-parse --show-toplevel, git status --short --branch.
- After editing: run tests/build if available.
- Report files changed, commands run, and caveats.
```

Problems:

1. **Scope was still too broad.** It invited engine design, wiki association, UI integration, tests, and build verification in one run.
2. **“Seed-to-Future Association Engine” was conceptually open-ended.** It encouraged architecture exploration.
3. **`obsidian-vault/` was inside the repo.** Even with “do not touch,” the agent saw many untracked files.
4. **Verification was too heavy.** “Run tests/build if available” caused full test/build loops instead of targeted tests.
5. **Multiple OpenCode sessions were active.** This created CPU/RAM pressure and risk of overlapping edits.

Observed incident data from 2026-05-16:

- Heavy OpenCode worker PID: `69299`
- tmux session: `3`
- Context: about 52.9K tokens
- Observed peak: up to 885% CPU, 39.3% memory
- Elapsed: about 4h04m
- CPU time: about 398m54s

---

## 10. Design interpretation: repo layer vs vault layer

The user’s architectural question:

> Is the perception layer built in the repo and then connected to the wiki vault layer?

Recommended answer: **yes**.

### Repo layer

The PBS repo should contain:

- stable type definitions
- pure Daydream engine
- symbolic perception/encoding layer
- scoring/matching logic
- graph/association logic
- report schema
- sample corpus for tests
- UI/report renderer

### Vault layer

The Obsidian/wiki vault should contain:

- raw notes
- public wiki extracts
- interview notes
- reading notes
- source material
- human-readable knowledge base

### Adapter/export layer

A separate script should convert vault/wiki material into a clean artifact:

```text
obsidian-vault markdown / wiki export
  ↓
export script / build-time adapter
  ↓
sourceCards.generated.json
  ↓
DaydreamCorpus / SourceCard[]
  ↓
Daydream engine
```

The game runtime should not directly scan or import the whole vault.

---

## 11. Recommended next architecture

### 11.1 Split current engine into explicit stages

Proposed function names:

```ts
type SeedInput = {
  text: string;
  kind?: "poem" | "song" | "artwork_note" | "curatorial_note" | "research_note" | "freeform";
  language?: string;
  userTags?: string[];
};

function encodeSeed(seed: SeedInput): SeedEncoding;
function matchSourceCards(encoding: SeedEncoding, corpus: DaydreamCorpus): RankedSourceCard[];
function expandAssociations(matches: RankedSourceCard[], corpus: DaydreamCorpus): AssociationPath[];
function decodeFutureScenarios(input: {
  seed: SeedInput;
  encoding: SeedEncoding;
  matches: RankedSourceCard[];
  associations: AssociationPath[];
}): DaydreamFuture[];
function buildDaydreamReport(seed: SeedInput, corpus: DaydreamCorpus): DaydreamReport;
```

### 11.2 Add symbolic latent traits

Instead of only `keywords`, add an explicit latent/encoding object:

```ts
type SeedEncoding = {
  keywords: string[];
  materials: string[];
  techniques: string[];
  affects: string[];
  socialForms: string[];
  temporalHints: string[];
  places: string[];
  uncertainties: string[];
};
```

This is the VAE-inspired part: not a real neural VAE, but an interpretable latent representation.

### 11.3 Make evidence objects first-class

Current `citations` are too thin. Use explicit evidence spans:

```ts
type EvidenceRef = {
  sourceId: string;
  title: string;
  url?: string;
  excerpt?: string;
  matchedFields: Array<"title" | "excerpt" | "keywords" | "tags" | "categories" | "graph">;
  score?: number;
};
```

### 11.4 Make association paths inspectable

```ts
type AssociationPath = {
  id: string;
  fromSourceId: string;
  toSourceId?: string;
  via: string[];
  relation: string;
  weight: number;
  rationale: string;
  evidence: EvidenceRef[];
};
```

### 11.5 Make future scenarios structured

```ts
type DaydreamFuture = {
  id: string;
  title: string;
  scenario: string;
  confidence: "low" | "medium" | "high";
  futureType?: "method" | "workshop" | "artifact" | "archive" | "infrastructure" | "performance" | "research_question";
  assumptions: string[];
  caveats: string[];
  evidence: EvidenceRef[];
  associationPathIds: string[];
};
```

### 11.6 Final report schema

```ts
type DaydreamReport = {
  seed: SeedInput;
  question: string;
  encoding: SeedEncoding;
  matchedSources: RankedSourceCard[];
  associationPaths: AssociationPath[];
  futures: DaydreamFuture[];
  corpus: {
    schemaVersion: string;
    generatedAt?: string;
    sourceCardCount: number;
    graphEdgeCount: number;
  };
  warnings: string[];
};
```

---

## 12. Guardrails for GPT-5.5 Pro / next coding agent

Do not ask the coding agent to “improve Daydream” broadly.

Safer task sequence:

### Task A — Architecture review only

No code edits. Review this document and propose a typed architecture.

### Task B — Types only

Only edit/create:

```text
webview-ui/src/daydream/types.ts
webview-ui/test/daydream-types.test.ts  (if needed)
```

Do not edit UI. Do not read vault.

### Task C — Pure engine only

Only edit/create:

```text
webview-ui/src/daydream/engine.ts
webview-ui/src/daydream/fixtures.ts
webview-ui/test/daydream-engine.test.ts
```

Run only targeted Daydream tests.

### Task D — Adapter/export contract only

Only design or implement a build-time adapter that consumes a small fixture export, not the real 2700-file vault.

### Task E — UI integration only

Only once types/engine are stable, wire `DaydreamPanel` to display the report.

---

## 13. Suggested prompt for GPT-5.5 Pro

```text
You are reviewing the PBS Daydream architecture. Do not write implementation code yet.

Read the attached architecture brief. The goal is to turn Daydream into an evidence-first Seed-to-Future Association Engine for Peach Blossom Spring.

Please produce:
1. A critique of the current MVP data model.
2. A revised TypeScript schema for SeedInput, SeedEncoding, SourceCard, EvidenceRef, AssociationPath, DaydreamFuture, and DaydreamReport.
3. A staged implementation plan split into small coding tasks, each with allowed files and forbidden files.
4. A recommendation for how the Obsidian/wiki vault should export to a lightweight artifact without polluting the game runtime.
5. Test cases that prevent hallucinated futures, uncited claims, vault-runtime imports, and over-broad UI coupling.

Constraints:
- Do not propose training a real VAE for the MVP.
- You may use a VAE-inspired symbolic latent layer as an analogy.
- Keep the engine deterministic and testable first.
- Do not directly import/read the full obsidian-vault from game runtime.
- Preserve evidence-first behavior: every future must cite matched source evidence or be marked low confidence with caveats.
```

---

## 14. Immediate recommendation

Before more OpenCode work:

1. Stop/interrupt any OpenCode worker that has already finished build/test but is stuck in model finalization.
2. Inspect and save current diff.
3. Move or ignore large untracked folders from coding-agent context:

```text
obsidian-vault/
prompts/
multiplayer-worker/.wrangler/
```

4. Ask GPT-5.5 Pro for architecture review first, not code.
5. Only then create a micro-prompt for the next coding step.

Recommended next coding step after architecture review:

> Types + pure engine only. No UI. No vault. No build. Targeted tests only.
