# Layered Vault Report

Date: 2026-05-24
Session: `oc-opencode-pbs-karpathy-llm-wiki-20260524`

## Audit Summary

- Existing upper-layer pages found: `Home.md`, `Peach Blossom Spring.md`, `PBS Wiki Visual Dashboard.md`, `GRAPH_VIEW_GUIDE.md`, `VAULT_STRUCTURE.md`, `Wiki/index.md`, `Wiki/Overview.md`, `Wiki/log.md`.
- Existing association/semantic layers found: `Sources/PBS Semantic Layers/`, `Sources/PBS Entity Layers/`, `Sources/Source Categories/`, and compiled wiki folders under `Wiki/`.
- Existing evidence/raw source folders found: `Sources/Hackteria Full/`, `Sources/How To Get What You Want Full/`, `Sources/SGMK Full/`, plus source indexes and manifests.
- No raw source note contents were modified.
- No folder renames or bulk moves were performed.

## Proposed Hierarchy

```text
Public / Reading Layer
  Home.md
  Start Here.md
  Association Map.md
  Long Notes.md
  Questions.md
  Concepts.md
  Characters and NPCs.md
  Zines.md

Association / Semantic Layer
  Wiki/index.md
  Wiki/Overview.md
  Wiki/Concepts/ ... Wiki/Syntheses/
  Sources/PBS Semantic Layers/
  Sources/PBS Entity Layers/
  Sources/Source Categories/

Evidence / Raw Source Layer
  Sources/Hackteria Full/
  Sources/How To Get What You Want Full/
  Sources/SGMK Full/
  source indexes and manifests
```

## Created or Modified Files

- `docs/spec-kit/004-wiki-tool-llm-wiki-vault-alignment-mixed/spec.md`
- `docs/spec-kit/004-wiki-tool-llm-wiki-vault-alignment-mixed/layered-vault-report.md`
- `obsidian-vault/Home.md`
- `obsidian-vault/Start Here.md`
- `obsidian-vault/Association Map.md`
- `obsidian-vault/Long Notes.md`
- `obsidian-vault/Questions.md`
- `obsidian-vault/Concepts.md`
- `obsidian-vault/Characters and NPCs.md`
- `obsidian-vault/Zines.md`
- `obsidian-vault/Peach Blossom Spring.md`
- `obsidian-vault/Wiki/index.md`
- `obsidian-vault/Wiki/Overview.md`
- `obsidian-vault/Wiki/log.md`

## Skipped

- Did not modify raw source note contents.
- Did not rename `daydream-export/`.
- Did not bulk rename legacy/internal `daydream` terminology.
- Did not generate long-form synthesis notes.

## Remaining Next Steps

- Choose 2-4 source-verified themes for real long-form synthesis notes.
- Add durable compiled notes under `Wiki/Concepts`, `Wiki/Methods`, `Wiki/Materials`, or `Wiki/Syntheses` only after evidence is verified.
- Consider adding graph workspace presets later so readers can switch between reading layer, association layer, and evidence layer views.
- Decide whether `Characters and NPCs.md` should eventually become a richer public cast page or remain a pointer to `Wiki/NPCs/` and entity layers.
