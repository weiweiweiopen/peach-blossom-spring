# GitHub Pages evidence and typography repair — 2026-10-28

## Release scope

This release starts from the deployed `e429570` tree in an isolated worktree. The
original Projects checkout and the uncommitted September cloud repair are not
overwritten. The September report and repair supplied the evidence contract and
regression cases; this first release makes the public Pages site independently
usable without requiring an undeployed replacement Worker.

## Public query and publication path

- Vite publishes a versioned corpus from the repository's public `Sources/Raw`
  Markdown. There are 340 usable documents at this revision. Files without a
  valid public URL, very short/empty extracts and obvious imported SEO spam are
  excluded. This is a document count, not a verified-fact count.
- Each document retains its canonical URL, repository path, raw SHA-256 and known
  capture date. Passages have exact offsets into the published normalized body.
- Finite multilingual equivalents preserve explicit topics; sensor is not an
  alias for music, and quality boosts cannot admit zero-match documents.
- Questions, NPC interviews and zines use the same passage packet. Follow-ups
  resolve against user questions, not earlier AI prose. Interview accounts remain
  attributed testimony. Full interviews are searched before selecting passages.
- Draft statements need exact original quotations and valid passage IDs. A
  separate model call checks whole-statement support and output language. This
  does not guarantee universal factual accuracy; review can share model errors.
- Empty evidence skips the model. Invalid/unsupported output is explicitly
  incomplete. There are no generic replacement chapters or meaning-changing
  e-textile replacements in the active publication path.
- Model credentials remain in the existing server-owned proxy. No API key or
  private source is added to the Pages artifact.

## UI and PDF

- `typography.css` is the named-layer typography owner. Its important declarations
  outrank old unlayered language overrides without escalating selector specificity.
  Components select semantic slots. `ui-system.css` owns geometry only.
- Japanese, Thai and Traditional Chinese fonts are bundled from Fontsource, not
  downloaded from Google Fonts at runtime. Script-specific line metrics are
  centralized. NPC role labels are localized; stale requests cannot append an old
  language after a language/character change.
- HTML and print use one evidence renderer with original quotation references.
  A4 pages flow according to content, with no sixteen-page target, filler or fixed
  sheet height. Print waits for fonts and image decoding.
- Completed HTML is saved to the same-browser shelf and can be reopened or
  downloaded. This release does **not** claim cloud background execution: closing
  the tab during generation still interrupts it. Cloud Workflows/R2 integration
  remains a later cutover from the isolated September repair.

## Reproducible checks

From `webview-ui`:

```sh
npm ci
npm test
npm run check:i18n
npm run build
npx playwright install chromium
npm run test:pages
```

The Pages browser test serves the production build under
`/peach-blossom-spring/`, uses the real corpus, and stubs only the model. It checks
six languages, five UI panels, four viewport widths, query/publication packet
continuity, no-evidence zero-call behavior, saved artifacts and actual PDF files.
Screenshots, PDFs and measurements go to `webview-ui/test-results/pages/`.

The older graph-library tests now use an explicit synthetic graph fixture rather
than incorrectly assuming the deployed four-card corpus contains unrelated
wearable pages and enough unmatched graph neighbors. Public original-text
retrieval is tested separately against the complete real corpus.

Optional real-model smoke (invokes the public proxy):

```sh
node --import tsx/esm scripts/live-evidence-check.ts
```

Before release, real-model beehive and electronic-textile questions passed exact
quotation checks and the separate review. The beehive answer preserved historical
development status rather than declaring planned sensors completed.

Local release checks passed: 57 unit/regression tests, six locales with 176
nonempty matching keys, TypeScript/production build, 12 home-screen fixtures,
120 UI-panel/viewport fixtures, and six query/publication/save/PDF flows. The
browser suite uses controlled model replies and is not an accuracy percentage.
