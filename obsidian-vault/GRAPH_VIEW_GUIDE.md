# Graph View Guide — PBS Wiki Corpus

## Why the graph looked like concentric circles

The circles came from structure, not meaning:

1. Giant index notes linked to hundreds/thousands of pages, creating hub-and-spoke rings.
2. `How To Get What You Want` WordPress posts have fewer native wiki-to-wiki links than MediaWiki pages, so many posts become weakly connected or orphan-like.
3. Old seed folders remained after full crawls, so Obsidian showed both seed and full imports.
4. Obsidian graph has no real edge-weight model; it uses wikilinks/backlinks/tags and force layout. Repeated medium-strength relationships must be encoded as links/tags/category hubs.

## Current useful folders

Use these as canonical corpus folders:

- `Sources/Hackteria Full/` — 1410 pages
- `Sources/How To Get What You Want Full/` — 613 posts
- `Sources/SGMK Full/` — 334 pages
- `Sources/Source Categories/` — unified source-native category hubs for Hackteria / HTGWYW / SGMK
- `Sources/PBS Semantic Layers/Source Themes/` — PBS thematic clusters derived from source content
- `daydream-export/` — JSON export for PBS Daydream engine, not meant for graph reading

## Old seed folders

These older seed imports were removed after the full crawls existed:

- `Sources/Hackteria/`
- `Sources/How To Get What You Want/`

Use the canonical `Full` folders instead.

## Recommended graph filter

This has been written into `.obsidian/graph.json`:

```text
(#pbs/source/hackteria OR #pbs/source/htgwyw OR #pbs/source/sgmk OR path:"Sources/Source Categories" OR path:"Sources/PBS Semantic Layers" OR path:"Sources/PBS Entity Layers") -path:"Sources/Hackteria Full Index" -path:"Sources/How To Get What You Want Full Index" -path:"Sources/SGMK Full Index" -path:"daydream-export"
```

Settings changed:

- hide unresolved links: on
- show orphans: off
- show attachments: off
- arrows: on
- stronger link force, lower center force
- color groups by source folder

## Better structure still needed

For a truly meaningful PBS Daydream graph, the next pass should create cross-source semantic bridge notes, e.g.:

- `Concepts/E-textile sensors`
- `Concepts/DIY microscopy`
- `Concepts/Workshop pedagogy`
- `Concepts/Bio art wetware`
- `People/SGMK and Hackteria overlaps`
- `Methods/Arduino / Bela / textile interfaces`

Those bridge notes should link selectively to strong cards from all three sources. That creates topology that is meaningful to PBS, not just faithful to source websites.
