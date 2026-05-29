# Spec 017: Zine Sixteen Page Quality Repair

Status: active repair

Deployment note: this repair is expected to deploy through GitHub Pages on every push to `main`.

## Problem

The previous 16-page attempt forced separate pages with fixed page heights and expanded the article into eight sections plus four next-step pages. That produced large blank areas, repeated headings, and repetitive filler prose. It also generated 17 pages when the feedback controls were printed.

## Repository Finding

- The repo has zine proof scripts and contracts, but no browser/PDF pagination engine that can count final printed pages before the print dialog.
- The useful existing pattern is the older four-section zine article structure in `generate-private-zine-proof.ts` and the zine generation contracts.
- Therefore this repair must not pretend to know exact PDF page count by adding empty pages or hard page breaks.

## Required Outcomes

- Restore the coherent four-section article structure.
- Keep the original natural flowing print layout; do not force each `.page` section onto its own paper page.
- Reach toward 16 pages by increasing useful prose inside existing article parts only:
  - cover opening/proposition
  - four section bodies
  - four protocol/future-research notes
  - quiet caveat
- Do not create empty padding pages.
- Do not create low-density fixed-height pages.
- Do not repeat the same section title twice on the same section.
- Do not split trace just to add pages.
- Do not print feedback controls as a final mostly-empty page.
- Extra text must add concrete evidence, comparison, caveat, counter-evidence, future research directions, or close reading of named pages.
- Repetition of section topics, future-research notes, or generic statements should be treated as a quality failure.
- Do not change the original semantic generation logic: retrieval, section focus, evidence selection, four-section argument structure, and protocol logic must remain the same. Only length targets and print/layout density may change.

## Implementation Plan

- Revert renderer structure to 1 cover + 4 section pages + 1 closing/protocol section + reading materials + one readable trace.
- Remove fixed `257mm` page height and `page-break-after: always` from print CSS.
- Preserve readable print typography and let the browser paginate naturally.
- Increase text-length instructions moderately beyond the pre-repair version, not by adding separate filler pages.
- Add static guards against forced page heights, eight-section rendering, and split trace filler.

## Verification

- Static guard must check four-section rendering.
- Static guard must reject forced fixed-height print pages.
- Static guard must reject split trace filler pages.
- Build must pass: `npm --prefix webview-ui run build`.
- Visual guard must pass: `npm --prefix webview-ui run check:visual-layout`.
