# Daydream repair handoff — 2026-05-18

Owner/context: wisemouse_2 MacBook-side implementation session, for wisemouse_1 / future Daydream work.

## User-level conclusion

Daydream public artifacts must be generated from the community Obsidian export through a simple user need/seed, but the visible article must not expose how the system searched, traversed, scored, or selected sources. Internal traversal is a reading aid, not article content.

The key correction from today:

> Use traversal/source relations to read material, then melt the traversal away. The public artifact should show only source-grounded observations, conceptual translation, and methods useful to the user.

## Main failure diagnosed

Earlier outputs leaked backend/process language into public artifacts, even when literal banned words were removed. Examples of bad visible language:

- generated question
- path / A → B
- source paths
- research score
- seed / matched / first layer / second layer
- workflow / traversal / linkedExpansions / sourceCards
- “these sources are used as paths”
- “Static HTML / No JavaScript / ZINE DRAFT”

The deeper bug was self-reference: prompts told the model not to show workflow, but also made traversal/path structure the main narrative material.

## Engineering changes in real app code

Path: `webview-ui/src/daydream/`

### Added

- `publicArtifactContent.ts`
  - Adds `DaydreamPublicArtifactContent` public content contract.
  - Separates private trace from visible artifact fields.
  - Adds public-layout readiness logic.

### Modified

- `engine.ts`
  - Adds `meaningfulLinkedExpansions` and `thinLinkedExpansions` to depth metrics.
  - Makes `expandViaLinkedSources()` and next-layer collection consider `categoryGraph.enriched.json` `outgoing_link` edges.
  - Adds `secondary_seed` relation for thin matched pages with no meaningful outgoing readable links: use that page’s title/keywords/semantic topics/cleaned excerpt as a second query to create non-linear emergence.
  - Caps/qualifies depth when linked evidence is weak rather than reporting fake 100.
  - Adds Chinese alias coverage for: 電子音樂/音樂, 理論/論述/研究, 視覺/影像/圖像, 生物藝術.

- `daydreamWorkflow.ts`
  - Adds `step4.publicArtifact` beside `outputPlan` and `editorialBrief`.
  - Topic selection now allows Daydream-style emergence with a lower gate (inspirational research artifact, not academic paper), but still requires direct matches and second-layer evidence.

- `DaydreamPanel.tsx`
  - Displays `publicArtifact` as layout contract preview.

- `artifactGuard.ts`
  - Expanded public pollution guard against process/self-reference terms: generated question, research score, source paths, traversal, secondary seed, seed as backend term, 命中, 第一層/第二層, 來源路徑, 搜尋結果, 檢索過程, Static HTML/No JavaScript style output notes, etc.

- `layoutRegistry.ts`
  - Registers preserved visual directions: `pbs_reset_title_kinetic`, `soft_sound_commons`, `aino_motion_grid`, `aino_tui_blocks`, `glyph_mask_flow`.

- `prototypeMarkdown.ts`
  - Replaced topic-specific editorial prompt with a universal prompt.
  - Prompt no longer hard-codes bioart/synthetic biology/electronic music.
  - The model must infer: user need, core conceptual axis, user position, useful sources, and central thesis from current sources.
  - Added preprocessing format per source:
    - `title`
    - `sourceType`: article / interview / workshop / artwork / tool / event / organization / note
    - `concreteObservations`
    - `interpretivePotential`
    - `strength`: high / medium / weak
    - `risk`
  - Added helpers: `renderEditorialSourcePreprocessBlock`, `sourceTypeFor`, `concreteObservationsFor`, `interpretivePotentialFor`, `sourceStrengthFor`, `sourceRisksFor`, `cleanEditorialExcerpt`.

## Prompt principles to preserve

- Never tell the article to present traversal/path beauty.
- Traversal is private composition material only.
- Every main claim should be grounded in a concrete source observation first.
- Speculative interpretation is allowed (~20%) but must sit on a source observation.
- If a source is a workshop, short talk, course, webpage, tool doc, interview, or organization intro, do not automatically upgrade it into a complete artwork.
- Visible article should not include a sources section unless explicitly requested.
- No template/navigation/status labels as content: OPENING, BIOLOGY, VISUAL, NATURE, WEARABLE, CASES, SOURCES, METHOD, ZINE DRAFT, SPECULATIVE NOTE, Static HTML, No JavaScript.

## Secondary-seed test result

User seed:

`我在找與生物藝術理論有關的電子音樂案例，我是做視覺的，最好是和基因改造有關`

Initial strict traversal:

- Direct match mostly Hackteria synthetic biology / ArtScienceBangalore pages.
- Many Hackteria pages were thin extracts / no plaintext.
- Strict linked traversal alone blocked publication.

After secondary-seed rule:

- Thin synthetic-biology artist/designer pages could jump to useful sound/interface cases:
  - Absurd Musical Interfaces
  - The Sound of Nature
  - Knitting, hacking, hanging, sound
  - Toy Piano T-shirt workshop
  - Beautiful Circuits
  - Soft & Tiny Arduino Workshop
  - E-Textile Pecha-Kucha at Schmiede
  - eTextile Summer Camp 2014
  - Designing for the loop Workshop

Important: do not show this as paths in the article. Use them internally to choose cases.

## Best article/content result today

The better content direction used concrete wiki/source details first, then interpretation:

- ArtScienceBangalore / Synthetic Biology for Artists and Designers: adjacent wiki links included Art, Art and Politics, Ethics, Design & Technology, Ideas for Bacteria.
- Absurd Musical Interfaces: Queen Mary University of London, hackathon, questionable sonic interactions, unworkable music designs.
- The Sound of Nature: Antananarivo / Madagascar, ant research, engineering students, Madagascar Biodiversity Center, electronic textile materials.
- Toy Piano T-shirt workshop: Swedish School of Textiles, toy piano modified into wearable instrument.
- Beautiful Circuits: KiCAD / PCB / beautiful PCBs.
- Soft & Tiny Arduino: Atelier Nord, unique habits / strange abilities / eccentric desires.

## Preserved visual versions / artifacts

Snapshot directory:

`/Users/shihweichieh/.openclaw/workspace/daydream-output-visual-versions/2026-05-18/`

Includes:

- `01-pbs-reset-title-kinetic.html`
- `02-soft-sound-commons-clean-zine.html`
- `03-aino-motion-grid.html`
- `04-aino-tui-blocks-clean.html`
- `04-research-glyph-mask-flow-in-progress.html`
- `MANIFEST.md`

Important test outputs from later repair:

- `/Users/shihweichieh/.openclaw/workspace/cavalry-kinetic-js/daydream-depth-report-bioart-electronic-music-gene.md`
- `/Users/shihweichieh/.openclaw/workspace/cavalry-kinetic-js/daydream-secondary-seed-test-bioart-music-gene.md`
- `/Users/shihweichieh/.openclaw/workspace/cavalry-kinetic-js/daydream-mutant-sound-interfaces-v4-wiki-content.html`
- `/Users/shihweichieh/.openclaw/workspace/cavalry-kinetic-js/daydream-mutant-sound-interfaces-v5-aino-grid.html`

## Latest visual test

Third template / V3 Aino grid output:

`/Users/shihweichieh/.openclaw/workspace/cavalry-kinetic-js/daydream-mutant-sound-interfaces-v5-aino-grid.html`

QA:

- no `<script>`
- 4 sections
- no backend/process terms caught by visible-text scan
- content uses actual source observations
- visual issue: title can break awkwardly (`Interfaces`), and lower page space remains underused due to V3 grid style.

## Next recommended work

1. Run the new universal prompt through the actual LLM path, not hand-written builders.
2. Add automated visible-text QA that fails on self-reference/process/template terms before HTML delivery.
3. Add renderer that consumes `DaydreamPublicArtifactContent` rather than ad hoc builders.
4. Continue improving V3 title wrapping and bottom-space use.
5. Only return to glyph-mask layout after public content layer is reliable.
