# PBS Obsidian Vault Structure

This vault is the public-source research corpus for PBS / Daydream.

Vault path:

`/Users/shihweichieh/Documents/Projects/peach-blossom-spring-latest/obsidian-vault`

## Why it looks this way

The vault was built in stages:

1. **Seed import** — a few Hackteria and HTGWYW pages were imported first to prove the workflow.
2. **Full public crawls** — the seed import was replaced by complete public text crawls:
   - Hackteria Wiki public main namespace
   - How To Get What You Want / KOBAKANT public WordPress posts
   - SGMK-SSAM-WIKI public main namespace
3. **Relationship layer** — original wiki links, categories, source tags, and graph filters were added.
4. **PBS semantic layer** — source pages were bridged into PBS-useful themes: Tools / Concepts / Events.
5. **PBS entity layer** — cross-cutting entity axes were added: People / Places / Time.
6. **Daydream export** — JSON files were generated for mouse2 / PBS Daydream engine.

## Canonical source folders

Use these as the real corpus source folders:

| Folder | Meaning |
|---|---|
| `Sources/Hackteria Full/` | Hackteria Wiki public main-namespace pages. |
| `Sources/How To Get What You Want Full/` | KOBAKANT / HTGWYW public WordPress post archive. |
| `Sources/SGMK Full/` | SGMK-SSAM-WIKI public main-namespace pages. |

Each full source note has a source tag:

- `#pbs/source/hackteria`
- `#pbs/source/htgwyw`
- `#pbs/source/sgmk`

These tags are used for graph coloring.

## Source indexes and manifests

| File | Meaning |
|---|---|
| `Sources/Hackteria Full Index.md` | Human-readable index for Hackteria Full. |
| `Sources/Hackteria Full Manifest.json` | Crawl manifest for Hackteria Full. |
| `Sources/How To Get What You Want Full Index.md` | Human-readable index for HTGWYW Full. |
| `Sources/How To Get What You Want Full Manifest.json` | Crawl manifest for HTGWYW Full. |
| `Sources/SGMK Full Index.md` | Human-readable index for SGMK Full. |
| `Sources/SGMK Full Manifest.json` | Crawl manifest for SGMK Full. |

## PBS interpretation layers

These are not source websites. They are PBS / Daydream interpretation layers.

| Folder | Meaning |
|---|---|
| `Sources/PBS Semantic Layers/` | PBS / Daydream interpretation layer: Tools / Concepts / Events. |
| `Sources/PBS Semantic Layers/Source Themes/` | Source-specific PBS thematic clusters; currently SGMK themes. |
| `Sources/PBS Entity Layers/` | Entity axes: People / Places / Time. |
| `Sources/Source Categories/` | Unified source-native category hubs for Hackteria, HTGWYW, and SGMK. |

Recommended mental model:

```text
Source provenance:
  Hackteria / HTGWYW / SGMK

Source-native categories:
  Sources/Source Categories/Hackteria
  Sources/Source Categories/HTGWYW
  Sources/Source Categories/SGMK

PBS interpretation layers:
  Tools / Concepts / Events
  Source Themes

Entity axes:
  People / Places / Time

Daydream relation:
  who / where / when / using what / around which concept / in what event
```

## Daydream engine export

Folder:

`daydream-export/`

Files:

| File | Meaning |
|---|---|
| `sourceCards.json` | Per-page source cards for PBS Daydream. |
| `categoryGraph.json` | Graph nodes/edges for source, semantic, entity, tag, category relations. |
| `corpusManifest.json` | Counts, schema metadata, source scopes, safety notes. |
| `EXPORT_NOTES.md` | Human-readable export handoff for mouse2. |

## Design references

| File | Meaning |
|---|---|
| `PBS_COLOR_PALETTE.md` | Short palette pointer inside the vault. |
| `../docs/design/PBS_COLOR_PALETTE.md` | Canonical color palette note in the active repo. |
| `GRAPH_VIEW_GUIDE.md` | How to use graph filters and why hub/ring artifacts happen. |
| `PBS Wiki Visual Dashboard.md` | Human entry page for this vault. |

## Removed / cleaned up

The first seed folders were removed after full crawls existed:

- `Sources/Hackteria/`
- `Sources/How To Get What You Want/`

They only contained a handful of early test notes and were superseded by the full folders above.

## What this vault is not

- It is not private PBS planning memory.
- It should not contain secrets, credentials, internal contracts, grant finance details, or private customer data.
- It is not UI code.
- It should not modify PBS runtime data such as `data/personas.json`.
