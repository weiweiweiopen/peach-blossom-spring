# Feature Spec: 現代桃花源 / Modern PBS Integrated Repair

## Scope
Repair and extend the MacBook PBS repo across three inseparable workstreams:

A. Zine / association repair.
B/C. Source-bounded Vault/LLM Wiki, Wukir NPC material, Pet as Question Page, Concept Pages.
D/E. 現代桃花源 / Modern PBS pixel-office scene and local Safari validation.

## User stories

1. As a player, clicking an NPC wiki/zine action opens a clean split panel, shows loading, then either official-template zine in the selected language or visible retry error.
2. As a maintainer, I can build/lint a source-bounded vault/wiki layer where NPCs are wiki agents, pets are embodied Question Pages, concepts are semantic terrain, and zine feedback becomes reviewable semantic memory.
3. As a player, I can play in a 64x64 Modern PBS semantic amusement park that visually reads as 現代桃花源, with central commons, forest/river/dock, and perimeter rooms.
4. As a tester, I can verify the full system locally in Safari with actual URL and validation output.

## Functional requirements

### Zine
- Use selected language for initial generation.
- Retry must preserve original panel language.
- Public output must use official HTML template 1 only.
- Writer/validation failures show error/retry, not stale fallback success.
- Validate final assembled HTML after all appended sections/scripts.
- Block public process terms: backend, traversal, source graph, internal process, prompt, system language, and localized equivalents.
- ❤️ and black 💔 persist to `pbs:zine-page-feedback`.
- Split panel must not overlap dialogue or pet UI.

### Wiki / Vault / Pet / Concept
- Required vault folders and schema docs must exist without deleting/moving corpus.
- `scripts/wiki_tool.py` must support doctor/build/search-catalog/lint/source-coverage.
- 15 canonical NPC pages must be source-bounded.
- Wukir must answer only in-domain material/music/sound/instrument-making/bamboo/Sustainable Sonic Engine/Senyawa; out of domain redirects to Rully or Marc.
- Pet/thronglet is the embodied runtime form of a Question Page.
- Question Page memory is local-first and not auto-written to Obsidian private vault without review.
- Concept Page is source-bounded semantic terrain linking sources/NPCs/questions/zines/feedback/scene zones.
- Pet HUD must show dialogue/question history and emoji buttons for closed HTML/zine artifacts; clicking reopens/maximizes.

### Scene
- Product naming: 現代桃花源 / Modern PBS / Modern Peach Blossom Spring.
- Taoyuan naming only as legacy compatibility, not product-facing.
- Add/repair preview param `?modern-pbs-scene=1`.
- Ensure `?modern-peach-blossom-spring=1` does not 404 or safely aliases.
- Do not overwrite `default-layout-1.json`.
- Do not let `default-layout-30.json` silently become formal default.
- 64x64 map with central commons spawn, river/dock/forest wayfinding, and perimeter semantic rooms.
- Use existing pixel-office assets first.

## Acceptance criteria
- TypeScript/Vite build passes with Node 22.
- Wiki doctor/build/search/lint/source-coverage run; lint target 0 warnings/0 errors.
- Scene generator outputs valid counts/reachability.
- Local Safari URL is tested and reported.
- Final report includes changed files, commands, outputs, blockers, default-layout-1 untouched status, and pass/fail for A, B/C, D/E.
