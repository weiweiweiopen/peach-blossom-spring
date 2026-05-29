# Spec 015: Zine Print Signature Pages

Status: active repair

Deployment note: this repair is expected to deploy through GitHub Pages on every push to `main`.

## Problem

Generated PBS zines currently tend to land around 12-14 printable PDF pages. That is awkward for digital printing and small-book binding, where signatures should land on an 8-page multiple.

## Required Outcomes

- Printable zine output should be 16 pages for every language.
- The 8-page signature rule remains the binding constraint, but 8-page output is not acceptable for current PBS zines.
- Do not pad with visibly empty pages.
- Expand the article by asking for slightly longer opening/proposition text, section bodies, and protocol notes.
- Render the main article as 1 cover page, 8 body-section pages, and 4 next-step pages, followed by reading material and two trace pages.
- Keep the zine evidence-grounded; extra length must add caveats, comparisons, counter-evidence, future research questions, or concrete source readings.
- Record the target print page count in the generation trace for QA.

## Verification

- Static guard must check that zine generation declares an 8-page multiple and a 16-page current target.
- Static guard must check that section body generation uses the print-binding length instruction.
- Build must pass: `npm --prefix webview-ui run build`.
- Visual guard must pass: `npm --prefix webview-ui run check:visual-layout`.

## Notes

- Browser-side code cannot reliably know the final PDF page count before the user prints, because page breaks depend on the browser print engine, paper settings, and font fallback.
- This repair controls the most stable available lever: generation length. If later PDF export is moved to a controlled renderer, exact page counting can become a post-layout check.
