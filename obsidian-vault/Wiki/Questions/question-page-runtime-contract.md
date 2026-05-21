---
type: question
id: question-page-runtime-contract
seed_question: How does a player question become a pet?
current_question: How should local-first pet memory map onto durable Question Page fields?
deepened_question: What can be safely summarized for public zines without writing private dialogue into Obsidian?
status: active-schema-note
mood: curious
action: local-first-runtime
npc_interactions: []
dialogue_history: reviewed-summary-only
source_refs:
  - webview-ui/src/simulation/storage.ts
  - obsidian-vault/Schema/frontmatter-schema.md
related_concepts:
  - concept-semantic-terrain
zines: []
feedback: []
timestamps:
  created: 2026-05-20
evidence:
  - PET_DIALOGUE_HISTORY_KEY stores browser-local history.
  - buildSeedWithPetDialogueHistory summarizes local history for runtime zine seed use.
---

# Question Page Runtime Contract

The durable Question Page describes a question and its reviewed semantic state. The pet/thronglet is the embodied runtime interface. Browser-local memory may summarize recent dialogue into runtime seeds, but raw private dialogue is not automatically written to Obsidian.
