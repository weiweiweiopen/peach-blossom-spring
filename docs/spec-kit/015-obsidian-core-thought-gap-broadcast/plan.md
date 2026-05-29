# Plan

1. Keep source-card ingestion separate from compiled wiki notes.
2. Add terrain-gap lint output as a review artifact, not an automatic write.
3. Route repeated player questions and zine feedback into reviewed candidates.
4. Bind selected lint/gap findings to Question Pet mood, action, or broadcast text.
5. Only after review, promote candidates into `Wiki/Concepts`, `Wiki/Methods`, `Wiki/Materials`, `Wiki/SocialForms`, `Wiki/Comparisons`, or `Wiki/Syntheses`.
6. Use `python3 scripts/wiki_tool.py terrain-gap-lint --limit 10` to regenerate local candidates.
7. Review `Review/terrain-gaps/latest.md`; if a candidate is useful, verify its sample evidence before drafting a compiled note.
8. If a candidate becomes a pet clue, use `petBroadcast` as game-facing text and keep the detailed evidence in review files.

## Open Design Question

The best pet binding is probably not a generic lint score. A stronger model is: each pet carries one `question terrain` state, including `has evidence`, `has relation`, `has contradiction`, and `missing durable node`. The pet can broadcast the missing node as a game clue instead of showing a developer lint report.
