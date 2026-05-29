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

Recommended terrain fields: `question_terrain.has_evidence`, `question_terrain.has_relation`, `question_terrain.has_contradiction`, `question_terrain.missing_durable_node`, `question_terrain.pet_broadcast`. These are lint/review signals, not proof by themselves.

## Concept Page

Required: `type: concept`, `id`, `title`, `status`, `summary`, `source_refs`, `related_questions`, `related_npcs`, `related_zines`, `related_scene_zones`, `evidence`, `open_questions`.

Concept Page is semantic terrain. Claims require local sourceRefs/evidence.

## Compiled Wiki Note

Applies to notes in `Wiki/Concepts`, `Wiki/Methods`, `Wiki/Materials`, `Wiki/Theories`, `Wiki/SocialForms`, `Wiki/Projects`, `Wiki/Comparisons`, and `Wiki/Syntheses`.

Recommended: `type`, `id`, `title`, `status`, `summary`, `sourceRefs` or `source_refs`, `evidence`, `related_concepts`, `related_methods`, `related_materials`, `related_theories`, `related_social_forms`, `related_projects`, `related_syntheses`, `open_questions`, `last_reviewed`.

Compiled wiki notes are maintained synthesis objects. They may cite raw sources, source-card records, semantic/entity bridge layers, and other compiled notes, but must distinguish verified evidence from proposed creative propagation.

## Wiki Index and Log

Required for `Wiki/index.md`: `type: wiki-index`, `status`, `sourceRefs`.

Required for `Wiki/log.md`: `type: wiki-log`, `status`, `sourceRefs`.

`Wiki/index.md` is content-oriented navigation. `Wiki/log.md` is chronological and append-only.

## Terrain Gap Lint Report

Required for `Review/terrain-gaps/*.md` and `Review/terrain-gaps/*.json`: `type: terrain-gap-lint-report`, `status: review-candidates`, `sourceRefs`, `candidates`.

Each candidate should include `id`, `title`, `matchedSourceCards`, `compiledNodeExists`, `candidateFolder`, `petBroadcast`, `sampleEvidence`, and `reviewStatus`.

Terrain gap reports are review artifacts. They must not be treated as compiled notes, and they must not mutate source pages or write private runtime dialogue to the vault.

## Zine Feedback Review

Zine feedback should route first to reviewed zine/question/log destinations: `Wiki/Zines/README.md` for aggregate reception, `Wiki/Questions/README.md` for repeated question candidates, and `Wiki/log.md` for review events. Source pages should not receive raw feedback.
