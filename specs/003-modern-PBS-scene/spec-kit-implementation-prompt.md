# Prompt for OpenCode / Spec Kit Implementation

You are starting a new MacBook-local PBS implementation session. This prompt is the handoff from planning. Do not skip preflight. Do not implement from memory.

## Canonical repo

`/Users/weiweiweiwei/Documents/Projects/peach-blossom-spring-latest`

Do not use any mini Mac repo as source of truth.

## Required preflight

Run these first and report results before editing:

```bash
cat /Users/weiweiweiwei/.openclaw/workspace/wisemouse_2_bot/SOUL.md
cd /Users/weiweiweiwei/Documents/Projects/peach-blossom-spring-latest
hostname
pwd
git status --short
specify version | grep 'CLI Version'
```

Expected:

- host is MacBook (`APPLEs-MacBook-Pro.local` or the current MacBook host)
- pwd is the canonical repo above
- `specify` CLI Version is `0.8.11`

If any of those are false, stop.

## Read the canonical spec package

Read all files in `specs/003-modern-PBS-scene/`, especially:

- `spec.md`
- `research.md`
- `plan.md`
- `tasks.md`
- `quickstart.md`
- `validation-report.md`
- `zine-repair-audit-report.md`
- `pixel-office-scene-rewrite-report.md`
- `question-concept-page-design-report.md`
- `complete-spec-kit-analysis-report.md`
- `contracts/*.md`

Treat older directory `specs/003-pbs-modern-taoyuan-scene/` as legacy evidence only, not canonical.

## Hard constraints

- Work only in the canonical MacBook repo.
- Do not push.
- Do not overwrite `webview-ui/public/assets/default-layout-1.json` unless the user explicitly approves.
- Do not delete or move existing corpus/vault data.
- Public zine must use official HTML template 1 only unless explicitly approved.
- Public zine must not expose backend / traversal / source graph / process / prompt / system language or localized equivalents.
- Do not show stale fallback zine as formal output.
- If iCloud/dataless blocks reads/builds, record the exact error; do not randomly delete `node_modules`.
- Use Node 22 for Vite/build if Node 18 fails.
- This is all-or-nothing across A + B/C + D/E. Do not implement only one or two workstreams and claim completion.

## Use Spec Kit / OpenCode flow

Start with planning/confirmation, not blind edits:

```text
/speckit.plan
/speckit.tasks
```

Only run implementation after user approval:

```text
/speckit.implement
```

If OpenCode cannot use slash commands in this environment, manually follow the same phases from `tasks.md` and keep a command/diff log.

## Workstream A — Zine / association repair

Implement according to:

- `zine-repair-audit-report.md`
- `contracts/zine-public-artifact-contract.md`
- `tasks.md` Phase A

Required outcomes:

1. Zine generation receives current selected language.
2. Retry preserves original `splitPanel.language`, not current global UI language.
3. `AssociationZineLanguage`, `languageInstruction`, language-aware validation, and language-aware HTML remain correct.
4. Writer/validation failure shows split-panel error/retry; no stale/fixed fallback success.
5. Final assembled HTML is validated after all appended sections/scripts.
6. Official HTML template 1 only.
7. Block public process terms including exact `source graph`, `backend`, `traversal`, `internal process`, `prompt`, `system language`, and localized equivalents.
8. Feedback buttons ❤️ and black 💔 persist to `localStorage["pbs:zine-page-feedback"]`.
9. Split/loading/error/ready UI does not overlap dialogue/pet panels.
10. Add/update tests for language, retry, failure, final HTML safety, feedback, and stale fallback prevention.

## Workstream B/C — Vault / LLM Wiki / Wukir / Pet / Question Page / Concept Page

Implement according to:

- `question-concept-page-design-report.md`
- `contracts/wiki-vault-contract.md`
- `contracts/npc-placement-contract.md`
- `tasks.md` Phase B and Phase C

Required outcomes:

1. Verify/create required vault structure under `obsidian-vault/Wiki/`, `obsidian-vault/Review/`, `obsidian-vault/_templates/`, and `obsidian-vault/Schema/` without deleting/moving corpus.
2. Verify/create schema docs:
   - `agentic-firewall.md`
   - `frontmatter-schema.md`
   - `command-reference.md`
   - `lint-checklist.md`
   - `source-manifest.jsonl`
3. Verify `scripts/wiki_tool.py` supports `doctor`, `build`, `search-catalog`, `lint`, `source-coverage`.
4. Run `wiki_tool.py doctor/build/search-catalog/lint/source-coverage`; lint target is warnings 0, errors 0.
5. Ensure 15 canonical NPC draft pages exist and are source-bounded.
6. Ensure Wukir files exist and Wukir only answers music/material/sound/instrument-making/bamboo/Sustainable Sonic Engine/Senyawa; out-of-domain redirects to Rully or Marc; no invented factual claims.
7. Question Page / electronic pet: the player-created pet/thronglet is the embodied runtime form of a Question Page. Question Page is durable semantic object; pet is playable/body interface. Pet memory remains local-first in browser/phone cache and must not directly write private dialogue memory to Obsidian.
8. Concept Page: semantic terrain with sourceRefs/evidence, linking sources, NPCs, questions/pets, zines, feedback, and scene zones.
9. Add/verify pet dialogue helpers or equivalents:
   - `PET_DIALOGUE_HISTORY_KEY`
   - `readPetDialogueHistory()`
   - `writePetDialogueHistory()`
   - `appendPetDialogueHistory()`
   - `buildSeedWithPetDialogueHistory()`
10. Pet HUD must show recent pet dialogue/question history. When a generated HTML/zine window closes, store the artifact in HUD. Each artifact appears as an emoji button and clicking it reopens/maximizes the HTML artifact.

## Workstream D/E — 現代桃花源 / Modern PBS pixel-office scene + local Safari test

Implement according to:

- `pixel-office-scene-rewrite-report.md`
- `contracts/layout-zone-contract.md`
- `contracts/performance-budget-contract.md`
- `tasks.md` Phase D and Phase E

Naming:

- Canonical product naming: 現代桃花源 / Modern PBS / Modern Peach Blossom Spring.
- Do not use Taoyuan as product-facing naming.
- Legacy filenames may remain only for compatibility if required by prompt.

Scene requirements:

- 64×64 map.
- Player spawns in central commons.
- Rooms around perimeter.
- Forest, river, dock, nature feeling.
- Existing pixel-office assets first.
- No large external art pack without approval.
- Must visually read as 現代桃花源 semantic amusement park, not office rooms with plants.

Required zones:

- central commons / spawn garden
- wood cabin / field research
- computer classroom
- bio-art lab
- workshop / tool room
- sewing / textile room
- stage / performance plaza
- rehearsal / sound room
- archive reading nook
- river / dock / forest frame

Performance budget:

- furnitureInstances target 120–180
- hard cap 220
- natureProps target 40–70
- distinctFurnitureTypes <= 24
- first central viewport not too dense
- unreachableEntrances = 0

Generator and preview:

- Existing required filename may remain: `webview-ui/scripts/generate-modern-taoyuan-layout.mjs`
- But add/repair Modern PBS naming and preview selection.
- Create/repair preview param: `?modern-pbs-scene=1`
- Ensure `?modern-peach-blossom-spring=1` does not 404, or safely alias/remove it.
- Do not let `default-layout-30.json` silently become formal default layout.
- Do not overwrite `default-layout-1.json`.

Required generated files from prompt compatibility:

- `webview-ui/public/assets/default-layout-modern-taoyuan.json`
- `webview-ui/public/assets/modern-taoyuan-scene-plan.json`
- `webview-ui/public/assets/default-layout-30.json`

But user-facing/spec language must be Modern PBS / 現代桃花源.

## Required validation commands

Use MacBook local repo:

```bash
cd /Users/weiweiweiwei/Documents/Projects/peach-blossom-spring-latest
```

Wiki:

```bash
python3 scripts/wiki_tool.py doctor
python3 scripts/wiki_tool.py build
python3 scripts/wiki_tool.py search-catalog wukir --limit 5
python3 scripts/wiki_tool.py lint
python3 scripts/wiki_tool.py source-coverage
```

Web/build:

```bash
export PATH=/usr/local/Cellar/node@22/22.22.0/bin:/usr/local/opt/node@22/bin:$PATH
npm --prefix webview-ui run check:secrets
node webview-ui/node_modules/typescript/bin/tsc -b --pretty false
node webview-ui/node_modules/vite/bin/vite.js build
```

Scene generator:

```bash
node webview-ui/scripts/generate-modern-taoyuan-layout.mjs
node - <<'NODE'
const fs = require('fs');
const layout = JSON.parse(fs.readFileSync('webview-ui/public/assets/default-layout-modern-taoyuan.json', 'utf8'));
const plan = JSON.parse(fs.readFileSync('webview-ui/public/assets/modern-taoyuan-scene-plan.json', 'utf8'));
console.log({
  cols: layout.cols,
  rows: layout.rows,
  tiles: layout.tiles?.length,
  tileColors: layout.tileColors?.length,
  furniture: layout.furniture?.length,
  natureProps: plan.performance?.natureProps,
  distinctFurnitureTypes: plan.performance?.distinctFurnitureTypes,
  unreachableEntrances: plan.performance?.unreachableEntrances?.length,
});
NODE
```

Local Safari:

```bash
npm --prefix webview-ui run dev -- --host 127.0.0.1 --port 5177
open -a Safari "http://127.0.0.1:5177/?modern-pbs-scene=1"
```

If Vite uses another port, record actual URL.

Manual Safari checks:

1. Modern PBS layout selected, not old layout.
2. Player central commons spawn.
3. River / forest / dock / perimeter rooms visible.
4. Room entrances walkable.
5. NPC interaction works.
6. Pet HUD/memory works.
7. Closed HTML/zine artifacts appear as emoji buttons and reopen.
8. Zine generation follows current language.
9. Zine uses official template 1.
10. Public zine has no backend/process/source graph/traversal/prompt/system language.
11. Console has no blocking errors.

## Final report format

Final response must include:

1. Changed files
2. Commands run
3. Validation outputs
4. Safari URL
5. Screenshots/artifacts if any
6. Blockers still present
7. Whether `default-layout-1.json` was untouched
8. Whether review layout should become formal layout
9. Explicit pass/fail for A, B/C, and D/E

Do not claim completion unless all three workstreams pass.


## DeepSeek / Cloudflare Worker secret setup addendum

The zine/NPC runtime depends on a Cloudflare Worker proxy for DeepSeek. If Safari validation shows DeepSeek proxy/key failure, handle it as configuration, not as a zine logic failure.

Current frontend proxy discovery to verify:

- `webview-ui/index.html` meta `pbs-chat-api`
- `webview-ui/src/App.tsx` fallback proxy URL
- `webview-ui/src/daydream/browserAssociationGenerator.ts` fallback proxy URL
- `webview-ui/src/deepseekClient.ts`
- `webview-ui/API_KEYS.md`

Secret rules:

- Never paste, commit, log, screenshot, or print the DeepSeek API key.
- Do not put real keys in source, `index.html`, tests, docs, committed `.env`, GitHub, chat transcripts, or build output.
- Cloudflare Worker secret name should be `DEEPSEEK_API_KEY` unless existing worker code proves a different binding name.
- For local Vite dev only, `.env.local` / browser localStorage may be used as temporary fallback, but `.env.local` must stay gitignored and must not be printed.

If the Worker project exists locally, use an interactive secret command such as:

```bash
cd <cloudflare-worker-project-dir>
npx wrangler secret put DEEPSEEK_API_KEY
```

or, if this repo contains the deployed Worker config and worker name is required:

```bash
npx wrangler secret put DEEPSEEK_API_KEY --name solar-oracle-deepseek-proxy
```

Do not include the key on the command line. Let the human paste it into Wrangler's hidden prompt.

If the Worker project/config is not present in this repo:

1. Report that the frontend points to `https://solar-oracle-deepseek-proxy.dontmarryme.workers.dev/chat`.
2. Report that the missing `DEEPSEEK_API_KEY` must be set in that Cloudflare Worker deployment.
3. Do not fabricate worker source or deploy a new worker without explicit approval.
4. Do not block local UI/scene validation on the key; instead report zine/NPC live-LLM validation as blocked by missing Worker secret.

After the human confirms the Worker secret is set, validate without exposing the key:

- Open Safari and trigger one NPC or zine request.
- Confirm the proxy no longer returns missing-key/401/403 configuration errors.
- Record only status/error class, not the secret or full sensitive payload.


## Multilingual UI / interface build-check addendum

All user-facing interfaces touched by this feature must be checked across supported languages, not only English or zh-TW.

Supported UI/zine languages to verify unless the codebase proves a different list:

- `zh-TW`
- `en`
- `id`
- `de`
- `ja`
- `th`

Interfaces that require multilingual checks:

1. RPG dialogue panel and NPC wiki button.
2. Association/zine split panel loading, ready, error, and retry states.
3. Public zine HTML title/body/source-link/feedback page.
4. Feedback controls ❤️ and black 💔.
5. API/DeepSeek missing-key or proxy-failure messages.
6. Pet HUD question/history/artifact emoji reopen UI.
7. Wiki/Question Page/Concept Page visible labels if surfaced in app.
8. Modern PBS preview labels/copy/product naming.

Required checks before final pass:

- TypeScript must compile after switching/using every supported language.
- No user-facing placeholder key should appear, e.g. `dialogue.associationLoadingTitle`, `api.keyMissing`, `undefined`, `[object Object]`.
- Retry/error UI must use the stored split-panel language, not the current global language after switching.
- Public zine language must match the request language in `<html lang>`, visible copy, feedback labels, and validation behavior.
- Missing DeepSeek key/proxy errors must be understandable in the selected UI language when shown in app UI.
- Product-facing scene language must use 現代桃花源 / Modern PBS / Modern Peach Blossom Spring; do not expose legacy Taoyuan naming except internal compatibility filenames.

Suggested automated/local checks:

```bash
cd /Users/weiweiweiwei/Documents/Projects/peach-blossom-spring-latest/webview-ui
node node_modules/typescript/bin/tsc -b --pretty false
node node_modules/vite/bin/vite.js build
```

If i18n tests exist, run them. If not, add a lightweight regression test or script that imports the locale tables and verifies required keys for all supported languages, especially:

- `dialogue.associationLoadingTitle`
- `dialogue.associationLoadingCopy`
- zine error title/retry labels or their equivalents
- API missing-key/proxy-failure labels
- pet HUD/history/artifact labels
- Modern PBS preview labels if localized

Manual Safari multilingual smoke test:

For at least `zh-TW`, `en`, and one non-CJK/non-English language (`id`, `de`, or `th`):

1. Switch UI language.
2. Open NPC dialogue.
3. Click wiki/zine action.
4. Confirm loading/error/retry/ready UI is in the expected language.
5. Confirm zine public artifact uses official template 1 and the requested language.
6. Switch UI language while the zine error panel is open, click retry, and confirm retry preserves original panel language.
7. Confirm feedback labels and saved `pbs:zine-page-feedback` record language match the zine language.

If any language lacks copy, report it as a multilingual interface blocker rather than silently falling back to English unless fallback is explicitly approved.


## Vault Question/NPC interaction + Concept Page build-check addendum

The Vault layer must not stop at static folders. Final validation must explicitly check the interaction model between Question Pages, NPC Pages, and Concept Pages.

Required Vault model:

1. **Question Page as pet body**
   - A pet/thronglet is the runtime body of a durable Question Page.
   - Local browser state may hold private dialogue history.
   - Vault Question Pages store reviewed/summarized question state only, not raw private chat dumps.
   - Required vault locations:
     - `obsidian-vault/Wiki/Questions/`
     - `obsidian-vault/Wiki/Pets/`
     - `obsidian-vault/Review/pet-question-pages/`
     - `obsidian-vault/_templates/question-page.md`

2. **NPC interaction with Question Page**
   - NPC dialogue should append to local pet/question history in browser runtime.
   - Zine seed may use a safe summary of local question history.
   - Public zine must not leak raw private dialogue.
   - Review notes may later summarize NPC-question interactions in `Review/pet-question-pages/` or `Review/semantic-relations/`.
   - No direct automatic write of private browser dialogue to Obsidian.

3. **Concept Page as semantic terrain**
   - Concept Pages must live under `obsidian-vault/Wiki/Concepts/` with a template at `obsidian-vault/_templates/concept-page.md`.
   - Concept Pages must include sourceRefs/evidence and link to:
     - related sources,
     - NPCs,
     - Question Pages/pets,
     - zines,
     - feedback records,
     - scene zones.
   - Missing sourceRefs/evidence is a blocker.

4. **Required relation checks**
   - At least one Question Page example/contract links to at least one Concept Page.
   - At least one Concept Page example/contract links back to at least one Question Page and to scene zones.
   - NPC pages include sourceRefs and can be related to concepts without inventing claims.
   - Wukir page must remain source-bounded and only answer within the approved domain.

5. **Runtime/UI checks**
   - Pet local chat appends to `PET_DIALOGUE_HISTORY_KEY`.
   - Pet HUD shows recent question/dialogue history.
   - NPC/wiki zine generation calls `buildSeedWithPetDialogueHistory()` or equivalent safe summarizer.
   - Closed HTML/zine artifacts appear as emoji buttons and reopen/maximize.

Validation commands/checks:

```bash
python3 scripts/wiki_tool.py doctor
python3 scripts/wiki_tool.py build
python3 scripts/wiki_tool.py lint
python3 scripts/wiki_tool.py source-coverage
grep -R "related_concepts\|related_questions\|related_npcs\|related_scene_zones" obsidian-vault/Wiki/Questions obsidian-vault/Wiki/Concepts obsidian-vault/_templates
```

If the Vault only has static schemas but no example Question/Concept relation pages, report it as a B/C blocker and add minimal source-bounded examples/contracts. If runtime only stores pet history but does not connect NPC/wiki zine seeds to question history, report it as a B/C blocker.


## Private zine generation proof / process trace addendum

Important distinction:

- The **public zine** must stay clean and editorial. It must not expose backend/process/source graph/prompt/system language.
- A **private developer/review proof report** may include the full generation process, page links, vector/relation diagram, prompts, model/proxy status, and failure details. This report is for validation/review only and must not be embedded in the public zine HTML.

Because DeepSeek/Cloudflare Worker secret may be missing, final validation must separate two proof levels:

1. **Local deterministic pipeline proof**
   - Proves the app transformed the seed through local corpus workflow:
     `seed sentence -> extracted words/keywords -> matched pages -> linked pages -> more seeds/research topics -> new keywords -> deep-read pages -> editorial brief/prompt`.
   - This can run without DeepSeek and must produce a private trace report.

2. **Live DeepSeek article proof**
   - Proves the editorial prompt was sent to the DeepSeek Worker and a meaningful article was returned by the model.
   - This requires a configured Cloudflare Worker secret `DEEPSEEK_API_KEY`.
   - If the secret is missing, live proof is blocked and must be reported as a configuration blocker, not silently replaced by local fallback.

Required private proof artifact:

Create or expose a local-only/private report for each generated zine request, e.g. under a non-public review/debug path such as:

- browser console downloadable JSON, or
- `obsidian-vault/Review/zine-feedback/` / `obsidian-vault/Review/semantic-relations/` review note, or
- a local test artifact path not served as the public zine.

The private proof report must include, at minimum:

```json
{
  "seedSentence": "...",
  "language": "zh-TW|en|id|de|ja|th",
  "petQuestionHistorySummaryUsed": true,
  "seedKeywords": [],
  "matchedPages": [
    { "id": "...", "title": "...", "path": "...", "url": "...", "score": 0, "matchedTerms": [] }
  ],
  "linkedPages": [
    { "from": "...", "to": "...", "relation": "...", "reason": "..." }
  ],
  "newSeedsOrResearchTopics": [],
  "newKeywords": [],
  "deepReadPages": [
    { "id": "...", "title": "...", "path": "...", "url": "...", "extractedTerms": [] }
  ],
  "semanticVectorDiagram": {
    "nodes": [{ "id": "...", "label": "...", "type": "seed|page|concept|npc|keyword" }],
    "edges": [{ "from": "...", "to": "...", "label": "...", "weight": 0 }]
  },
  "pageLinks": [],
  "editorialBrief": {},
  "editorialPrompt": "...",
  "modelCall": {
    "provider": "DeepSeek via Cloudflare Worker",
    "proxyUrl": ".../chat",
    "attempted": true,
    "status": "success|blocked_missing_secret|failed",
    "httpStatus": null,
    "durationMs": 0
  },
  "articleSource": "deepseek|local_fallback|blocked",
  "publicArtifactValidation": {
    "officialTemplate1": true,
    "publicSafetyPassed": true,
    "forbiddenTermsFound": []
  }
}
```

Implementation/validation requirements:

- Do not claim “DeepSeek generated article” unless a live Worker call succeeded after the secret was configured.
- If DeepSeek is blocked, mark `articleSource: "blocked"` or `"local_fallback"` explicitly in the private proof report and show an error/retry state in the UI as specified by Phase A.
- Do not let local fallback masquerade as DeepSeek output.
- The private report may include page vector diagram/page links/process; the public zine must not.
- Add a test or command that generates the private proof report from a fixed seed without network, verifying the trace contains seedKeywords, matchedPages, linked/deepRead pages, editorialBrief, and vector diagram nodes/edges.
- After Worker secret is configured, run one Safari zine request and record in the private proof report that `modelCall.status === "success"` and `articleSource === "deepseek"` without logging the API key.

Suggested fixed validation seed:

```text
How can a bamboo instrument, a bio-art lab, and a pet question page teach people to build a modern Peach Blossom Spring?
```

Required final report language:

- If DeepSeek secret is missing: “Live DeepSeek article proof is blocked by missing Cloudflare Worker secret; only local deterministic pipeline proof is available.”
- If DeepSeek call succeeds: include private proof artifact path and a summary of the seed -> keywords -> pages -> deep read -> editorial prompt -> DeepSeek response chain.
