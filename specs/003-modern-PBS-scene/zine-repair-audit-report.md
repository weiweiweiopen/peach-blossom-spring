# Zine Repair Audit Report

## Key risks
- Retry may use global selected language instead of stored split-panel language.
- Writer/validation failure may be hidden by fallback success.
- Final HTML may be validated before appended sections/scripts.
- Process terms such as `source graph` may leak.
- Dialogue/pet panels may overlap zine split panel.

## Required behavior
- Loading appears immediately.
- Success uses official template 1 only.
- Failure shows visible retry, no stale fallback.
- Public text avoids backend/traversal/source graph/process/prompt/system language and localized equivalents.
- ❤️ and black 💔 persist to `pbs:zine-page-feedback`.

## Tests
- Start in JA/DE, switch UI, retry; output remains original language.
- Mock writer timeout and forbidden term failure; no iframe success.
- Validate returned final HTML string.
- Click feedback buttons and inspect localStorage.
- Verify split panel not overlapped.
