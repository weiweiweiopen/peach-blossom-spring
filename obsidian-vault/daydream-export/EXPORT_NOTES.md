# PBS Daydream Corpus Export Notes

Last organized: 2026-05-16T15:34:00+08:00

Export path:

`/Users/shihweichieh/Documents/Projects/peach-blossom-spring-latest/obsidian-vault/daydream-export`

## Purpose

Public-source corpus export for mouse2 / PBS Daydream engine. This is data-only. No UI was created.

## Files

1. `sourceCards.json` — card list for public source notes.
2. `categoryGraph.json` — graph nodes/edges derived from source, tags, semantic layers, entities, source categories, and resolved wikilinks.
3. `corpusManifest.json` — export metadata, counts, source scopes, and safety rules.
4. `EXPORT_NOTES.md` — this handoff note.

## sourceCard schema

Each card contains:

- `id`: stable deterministic id, format `<source>:<sha1(path)[0:12]>`
- `title`
- `source`: `hackteria | htgwyw | sgmk`
- `path`: vault-relative Markdown path
- `url`: source URL when available, otherwise empty string
- `excerpt`: cleaned text excerpt, target 300–800 chars where source text allows
- `tags`: source/topic/category tags
- `categories`: source-native category labels when available
- `sourceCategories`: normalized source-native category labels for Daydream filtering
- `semanticLayer`: `tools | concepts | events`
- `semanticTopics`: deterministic PBS topic assignments
- `entities`: conservative `people`, `places`, `times` axes
- `outgoingLinks`: Obsidian wikilink targets found in the source note
- `keywords`: deterministic term-frequency keywords

## categoryGraph schema

- `nodes[]`: `id`, `label`, `type`; card nodes also include `source` and `path`.
- `edges[]`: `source`, `target`, `relation`, `weight`.

Relations currently used:

- `contains`: source node → card
- `categorized_as`: card → legacy/source category node
- `source_category`: card → normalized source category node
- `semantic_layer`: card → tools/concepts/events
- `semantic_topic`: card → PBS semantic topic
- `has_topic`: semantic layer → topic
- `has_entity`: entity layer → entity
- `mentions_entity`: card → entity
- `tagged`: card → tag
- `links_to`: card → card when wikilink target resolved

## Counts

- Source cards: 2357
- Hackteria cards: 1410
- HTGWYW / KOBAKANT cards: 613
- SGMK cards: 334
- Graph nodes: 2883
- Graph edges: 24696
- Source-category graph nodes: 75

## Vault layer layout

Source-native category hubs are unified under:

- `Sources/Source Categories/Hackteria/` — 31 notes
- `Sources/Source Categories/HTGWYW/` — 17 notes
- `Sources/Source Categories/SGMK/` — 11 notes

PBS interpretive thematic clusters are separate from source-native categories:

- `Sources/PBS Semantic Layers/Source Themes/SGMK/` — 13 notes

This separation is intentional: source categories preserve each community/site’s own classification system; PBS semantic/entity/source-theme layers are Daydream interpretation layers.

## Safety / scope

- Uses only public source material already present in the Obsidian vault.
- Does not include private planning notes.
- Does not modify PBS code.
- Does not touch `data/personas.json`.
- Preserves original Markdown vault/wikilinks while organizing hub notes.
- Export is deterministic for the same vault contents.

## Caveats

- Hackteria and SGMK category hubs come from public MediaWiki category metadata.
- HTGWYW / KOBAKANT category hubs come from public WordPress category metadata.
- Images/files and non-content namespaces are not mirrored unless text appeared in public page content.
