# Question Page + Concept Page Design Report

## Question Page = electronic pet body
The player-created pet/thronglet is the embodied runtime form of a Question Page.
- Question Page is the durable semantic object.
- Pet is the playable/body interface.
- Pet mood/action/growth express Question Page state.
- Dialogue/NPC interactions are local-first growth traces.
- Private browser/phone memory must not be directly written to Obsidian without review.

## Concept Page = semantic terrain
Concept Pages are source-bounded terrain nodes, not NPC profiles or zines.
They link sources, NPCs, questions/pets, zines, feedback, and scene zones.

## Required fields
Question Page: id, seed/current/deepened question, status, mood/action, npc_interactions, dialogue_history, source_refs, related_concepts, zines, feedback, timestamps.
Concept Page: id, title, type: concept, status, summary, source_refs, related_questions, related_npcs, related_zines, related_scene_zones, evidence, open_questions.

## Acceptance tests
- Pet creation writes local Question Page memory.
- NPC interactions append to question history.
- Zine seed can use summarized private question history, but public HTML does not leak raw private history.
- Closed HTML/zine artifact appears as HUD emoji and reopens.
- Concept pages index as type concept with sourceRefs.
