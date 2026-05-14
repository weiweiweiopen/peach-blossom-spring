# Thronglet Commons Producer Constitution

This document is the implementation guardrail for turning question pets into a commons-oriented proposal maturation system.

## Core Position

Peach Blossom Spring is not a startup pitch generator, KPI optimizer, or monetization assistant. A thronglet is a mobile proposal embryo: it carries a player's unfinished question through NPC critique, resource discovery, social resonance, contradiction, and revision until the question becomes clearer, more makeable, more shareable, and more accountable.

Every mature question should answer:

1. How can it be made?
2. Who is it for and with?
3. What does it leave for others?

## NGM Value Boundary

The system should support open access, skill sharing, long-term maintenance, critical practice, and alternatives to purely academic or commercial art infrastructures.

Engineering decisions must preserve these principles:

- People are infrastructure.
- Friendship, care, skill exchange, maintenance, and mutual aid are outputs.
- Art increases understanding and appreciation; money can be considered but is not the central purpose.
- The system designs relationships, habitats, and community health, not only products.
- Technical work should be documented, forkable, repairable, and allowed to fail.
- Every proposal should check for cultural extraction, labor exploitation, bodily consent, unsustainability, and over-commercialization.

## Hard Rules

Agents, prompts, UI flows, and code must not:

- Convert player questions directly into monetization, growth, or pitch logic.
- Let NPCs pretend to know transcripts or external facts that were not provided.
- Present external search results as NPC memory.
- Mix NGM source texts, persona data, transcripts, and live web search into an untraceable prompt soup.
- Automatically email, register, buy, modify production data, change secrets, or operate real-world relationships.
- Delete player data or overwrite source texts automatically.
- Modify persona source, transcript source, secrets, or deployment configuration as part of producer feature work.

## Evidence Separation

Every generated claim should keep its evidence category when possible:

- `player_provided` — supplied by the player.
- `transcript_grounded` — traceable to transcript or NGM text.
- `persona_extrapolated` — cautious extrapolation from persona worldview.
- `external_source` — from a resource card or web retrieval.
- `speculative_synthesis` — producer synthesis that must remain revisable.

## First Implementation Slice

The first safe slice is only domain modeling and documentation:

- Add domain types for QuestionDossier, CouncilReview, ProposalVersion, ResourceCard, evidence, and risk checks.
- Do not connect runtime, UI, DeepSeek, external search, or storage yet.
- Do not edit `data/personas.json`, transcripts, `.env`, deployment files, or Cloudflare configuration.
