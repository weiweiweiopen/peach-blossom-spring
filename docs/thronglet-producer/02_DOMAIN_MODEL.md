# Thronglet Commons Producer Domain Model

This model describes the safe insertion layer between the current question-pet simulation and future producer features.

## Safe Insertion Points

Current repo map:

- Pet creation and persistence: `webview-ui/src/pets/petStore.ts`
- Thronglet simulation types: `webview-ui/src/simulation/types.ts`
- Simulation rules/ticks: `webview-ui/src/simulation/*`
- NPC expedition prompts and runner: `webview-ui/src/expedition/*`
- Main UI orchestration: `webview-ui/src/App.tsx`

Initial producer work should add a new isolated module:

- `webview-ui/src/throngletProducer/types.ts`

Do not wire it into runtime until the types and constitution review are stable.

## Core Entities

### QuestionDossier

A dossier is the evolving record of one player question. It can reference a local pet/thronglet, but should not mutate pet simulation state directly in the first slice.

Fields:

- `id`
- `questionId`
- `petId`
- `ownerId`
- `title`
- `originalQuestion`
- `createdAt`
- `updatedAt`
- `maturityStage`
- `tags`
- `evidenceItems`
- `councilReviews`
- `resourceCards`
- `proposalVersions`
- `riskChecks`
- `commonsContribution`

### CouncilReview

Structured NPC or council critique. Must separate source-grounded claims from extrapolation.

### ProposalVersion

A revisable proposal snapshot. It is not a final business plan. It should include how-to, who-for/with, commons contribution, risks, and next experiment.

### ResourceCard

External or player-provided resource with source URL, freshness, access/cost, ethics, commons score, and caution.

### RiskCheck

Structured check for cultural extraction, labor, consent, sustainability, privacy, safety, over-commercialization, and evidence confusion.

## Implementation Order

1. Add isolated TypeScript types.
2. Add tests that assert the evidence/risk vocabulary stays stable.
3. Add local-only dossier store.
4. Add read-only Dossier Panel shell.
5. Add mock council review using existing expedition outputs.
6. Only later connect LLM/resource retrieval, with explicit evidence labels.

## Protected Files

Do not modify in the first slice:

- `data/personas.json`
- `data/extra-personas.json`
- `docs/transcripts_en/*`
- `docs/transcripts_zh/*`
- `.env*`
- deployment / Cloudflare secrets or config
