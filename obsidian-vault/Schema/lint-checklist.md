---
type: schema
status: active
sourceRefs:
  - specs/003-modern-PBS-scene/contracts/wiki-vault-contract.md
---

# Lint Checklist

- Required folders exist.
- Required schema docs exist.
- NPC pages include sourceRefs and evidence.
- Wukir page declares domain boundary and redirects.
- Question Page and Concept Page templates avoid private dialogue dumps.
- `source-manifest.jsonl` references local files only.
- `Wiki/index.md`, `Wiki/log.md`, and `Wiki/Overview.md` exist and reflect the current compiled wiki spine.
- Compiled wiki category READMEs exist for Concepts, Methods, Materials, Theories, SocialForms, Projects, Comparisons, and Syntheses.
- Compiled notes separate verified evidence/sourceRefs from speculative creative propagation.
- Public Daydream, zine, scene, game, and artwork body text contains no backend/tool/provenance/workflow/debug/source-card language.
- Lint checks for contradictions, stale claims, orphan pages, missing cross-links, missing sourceRefs, and unresolved data gaps.
- Lint also discovers knowledge-terrain gaps: repeated source motifs or relation neighborhoods that lack durable compiled wiki nodes.
- Terrain-gap candidates are not promoted to factual notes until sourceRefs and evidence are verified.
- `terrain-gap-lint` writes review artifacts under `Review/terrain-gaps/`; it must not modify raw sources or compiled wiki notes.
- Question Pet lint state must remain local-first: pet broadcasts may point to missing durable nodes, but private dialogue and raw runtime memory are not written to Obsidian automatically.
- A promoted terrain-gap candidate must move through review: candidate report -> verified sourceRefs/evidence -> compiled note draft -> log entry.
- Zine heart/comment feedback is reception metadata. It may inform `Wiki/Zines`, `Wiki/Questions`, or `Wiki/log`, but must not be copied into source pages as evidence.

Target: 0 warnings, 0 errors.
