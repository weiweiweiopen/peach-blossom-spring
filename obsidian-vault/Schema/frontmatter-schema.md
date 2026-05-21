---
type: schema
status: active
sourceRefs:
  - specs/003-modern-PBS-scene/question-concept-page-design-report.md
---

# Frontmatter Schema

## NPC Page

Required: `type: npc`, `id`, `name`, `status`, `sourceRefs`, `evidence`, `allowed_domains`, `redirects`.

## Question Page

Required: `type: question`, `id`, `seed_question`, `current_question`, `deepened_question`, `status`, `mood`, `action`, `npc_interactions`, `dialogue_history`, `source_refs`, `related_concepts`, `zines`, `feedback`, `timestamps`.

Question Page is the durable semantic object. The pet/thronglet is the embodied runtime interface. Private dialogue history must remain local-first unless manually reviewed.

## Concept Page

Required: `type: concept`, `id`, `title`, `status`, `summary`, `source_refs`, `related_questions`, `related_npcs`, `related_zines`, `related_scene_zones`, `evidence`, `open_questions`.

Concept Page is semantic terrain. Claims require local sourceRefs/evidence.
