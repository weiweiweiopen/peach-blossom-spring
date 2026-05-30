# Plan

1. Document the slice in spec-kit and add it to the spec index.
2. Add a local Question Pet lint-gap inbox backed by `localStorage`.
3. Append thought-gap broadcasts to that inbox whenever the in-world broadcast fires.
4. Render the inbox in the right-side Question Pet HUD with recent gaps and counts.
5. Restyle the minimized HUD as a compact chip aligned with the mobile stats bar.
6. Remove the `!promptPosition` gate that hides all NPC name tags and instead suppress only the nearby NPC's name tag.
7. Expand zine repair reports with vault routing fields and local review artifact writing.
8. Run type/build/static checks and deploy.

## Notes

- Public builds can only use browser storage or downloaded JSON; local Vite can write review artifacts.
- Review artifacts are not compiled Wiki notes until manually promoted.
