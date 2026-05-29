You are OpenCode working in the PBS repository.

Task: update the existing PBS Obsidian vault structure so it becomes closer to Andrej Karpathy's LLM Wiki pattern, without breaking or flattening the current PBS-specific architecture.

Repository root:
`/Users/shihweichieh/Documents/Projects/peach-blossom-spring-main`

Target vault:
`/Users/shihweichieh/Documents/Projects/peach-blossom-spring-main/obsidian-vault`

Permanent spec-kit planning file:
`/Users/shihweichieh/Documents/Projects/peach-blossom-spring-main/docs/spec-kit/004-wiki-tool-llm-wiki-vault-alignment-mixed/spec.md`

Context to read first:
1. `/Users/shihweichieh/.openclaw/workspace/pbs-llm-wiki-compact-2026-05-24.md`
2. Karpathy LLM Wiki gist: `https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f#llm-wiki`
3. The permanent spec file above.
4. Existing PBS vault files, especially:
   - `obsidian-vault/Wiki/`
   - `obsidian-vault/Schema/`
   - `obsidian-vault/Sources/PBS Semantic Layers/`
   - `obsidian-vault/Sources/PBS Entity Layers/`
   - `obsidian-vault/daydream-export/`

Important framing:
- Karpathy's model is a pattern, not a command to replace PBS.
- PBS already has raw sources, source indexes, Daydream graph exports, semantic/entity bridge layers, schema scaffold, and a partial Wiki folder.
- The missing layer is the compiled, cited, interlinked wiki-note layer: concept/method/material/theory/social-form/project/comparison/synthesis notes with sourceRefs.

Non-negotiable PBS constraints:
- Do not delete, flatten, or rewrite existing raw source corpus folders.
- Do not remove PBS semantic/entity bridge layers; preserve them as bridge/index layers unless the human decides otherwise.
- Do not break Daydream/source-card conventions.
- Do not insert internal workflow/provenance/source-card/debug language into public Daydream/zine/artifact visible body text.
- Prefer additive markdown scaffolding over destructive restructuring.

Decision gate:
If you find a contradiction with the current PBS-specialized structure, or you do not understand the role of a PBS folder/file/convention, STOP and ask the human what decision they want before continuing planning or implementation. Do not guess.

Requested first pass:
1. Audit current vault structure and schema.
2. Write/update a concise plan/report in the permanent spec-kit folder.
3. If no blocking contradictions exist, make the smallest safe structural updates that align with Karpathy's pattern:
   - create/update `obsidian-vault/Wiki/index.md`
   - create/update `obsidian-vault/Wiki/log.md`
   - create/update `obsidian-vault/Wiki/Overview.md`
   - create missing compiled-note category folders/READMEs for Concepts, Methods, Materials, Theories, SocialForms, Projects, Comparisons, Syntheses
   - create `obsidian-vault/Schema/llm-wiki-maintainer.md`
   - make careful additive updates to `frontmatter-schema.md` and `lint-checklist.md` if appropriate
4. Do not generate hundreds of notes in this pass. At most propose 2–4 pilot notes; only create them if citations/sourceRefs can be verified from existing source files.
5. Leave a clear summary of changed files, open questions, and next recommended human decision.

Deliverable standard:
The vault should end this pass with a recognizable Karpathy-style LLM Wiki spine while still feeling like PBS: source-card/Daydream-aware, citation-preserving, graph-friendly, and safe for future agent maintenance.
