# Research answers and AI handoff — 2026-10-28

## User-reported failure

The original query “怎麼製做導電縫線、織品的觸控螢幕？” was reduced to
the single concept `textile`. The top six passages contained three copies of a
KOBAKANT page and three irrelevant designposthumanism member biographies. All
candidate passages were displayed as cited links, followed by their full text.
The response prompt required a 2–4-sentence source summary rather than a useful
technical investigation. Existing QA checked citation plumbing and typography
CSS values, not whether the answer enabled the requested task.

## This revision

- Multi-language concepts distinguish conductive material, touch input, textile,
  and sensor; a query also records making/comparison intent and requested display
  or positioning capabilities. Candidate scoring prefers technical method/code
  paragraphs, retains named parts and repositories, and excludes member directories
  from technical evidence. Finite aliases are conservative and do not constitute
  open-ended semantic retrieval.
- Making and comparison answers use structured, independently reviewed source
  facts, inferences, proposals and gaps. The prompt requests usable material,
  method, connection and code details. Every non-gap item has an exact quotation;
  unsupported model output gets one evidence-preserving repair. External pages
  cannot be relabelled as the selected character's interview.
- Each answer stores its original question, role, relevant dialogue, evidence
  packet, source hash/offset, quotes, retrieval decisions, generation/review
  request and response, status, and structured claims. It does not contain hidden
  model reasoning or credentials. The export is scoped to this answer and its
  relevant dialogue, not a newly searched approximation.
- Cited pages are deduplicated by source and numbered consistently. Original
  supporting quotations are closed by default. Uncited candidates are separate
  further reading, not represented as support. The UI provides Markdown, JSON and
  copy-to-clipboard handoff, including bounded evidence, original links and an AI
  instruction. External link availability is marked unchecked: browsers cannot
  reliably inspect third-party link status because of CORS. Linked resources not
  actually read remain explicitly unverified.
- A verified research answer can be reused verbatim by the zine renderer, with
  the same packet, claim categories and citations. No new factual text is required
  when making the zine from an existing approved answer.
- Latin-script UI now uses bundled Noto Sans rather than a visually smaller pixel
  face, matching the Noto CJK and Thai families. Typography slots, mobile layout
  and icon sizing remain centralized.
- The multiplayer encounter panel is temporarily hidden while NPC, campfire or
  publication windows are open, preserving the encounter state while preventing
  its input from intercepting the research-window controls.

## Verification

```sh
npm test
npm run check:i18n
npm run build
npm run test:pages
npm run test:npc
npm run test:research
PBS_RESEARCH_WEBKIT=1 PBS_RESEARCH_LIVE=1 npm run test:research
```

The screenshot query is tested against the complete local corpus in all six
languages. The browser test exercises NPC and campfire, answer sections, unique
citations, collapsed quotes, Markdown/JSON downloads, original code links,
rejected candidates, and zine reuse. Live mode calls the real model; model review
and exact quotations are checks, not an assurance of electrical correctness.
For a production live smoke, set `PBS_RESEARCH_URL` to the deployed Pages base.
