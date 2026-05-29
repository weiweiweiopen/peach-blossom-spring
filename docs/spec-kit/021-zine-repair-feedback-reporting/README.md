# Zine Repair Feedback Reporting

## Scope

Replace binary zine reactions with a repair workflow that records human review, regenerates an improved evidence-bound zine, and creates a structured report for future OpenCode and vault-maintenance review.

## Decisions

- Remove heart and broken-heart feedback from generated zines.
- Ask reviewers to mark useful parts, useless or misleading parts, and the requested repair direction.
- Treat human feedback as editorial guidance only; regenerated zines must still pass the same evidence and public-validation gates.
- Public GitHub Pages cannot write repository or vault files. It stores reports in browser storage and falls back to a JSON download.
- Local Vite dev may write reports to `obsidian-vault/Review/zine-repair-reports/` through `/api/zine-repair-report`.
- Multiplayer chat is not the right storage path because the worker only broadcasts short ephemeral messages and does not persist reports.

## Report Shape

- `id`: stable report filename id.
- `reportKind`: `zine-repair-feedback`.
- `createdAt`: ISO timestamp.
- `zineTitle`, `query`, `language`, `template`.
- `originalRequestId`: request id from `localStorage:pbs:last-zine-click-trace` when available.
- `usefulParts`: human notes about useful parts.
- `uselessParts`: human notes about weak, misleading, repeated, or unsupported parts.
- `repairInstruction`: requested next-version repair.
- `evidenceSnapshot`: selected source families, search terms, matched pages, deep-read pages, wikilink trails, and public validation status.
- `suggestedVaultActions`: review-only follow-up suggestions, never raw source mutation.

## Validation

- TypeScript build should pass.
- Generated repair zines should continue through `generateBrowserAssociationZine` public validation.
- Local reports are review artifacts, not compiled Wiki notes.
