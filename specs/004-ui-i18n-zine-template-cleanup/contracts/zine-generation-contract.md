# Zine Generation Contract

## Trigger Rule

- A new zine may be generated/opened only after the player manually presses the wiki button.
- No idle timer, simulation event, pet event, old seed sentence list, public note, or public short text may create a zine window.

## Artifact Rule

- Existing stored artifacts may be reopened only when the player explicitly chooses a reopen action.
- Stored artifacts must not reappear as newly generated unsolicited windows after reload, idle, or state hydration.

## Structure Rule

Every zine section/page must carry:

- `index`
- `title`
- `body`
- optional `pullQuote`

If a section is missing required fields, the generator/renderer must surface a validation error or use a designed localized fallback. It must not silently call all later pages `篇章`.

## Layout Rule

- Main article prose is one visual system.
- Reading path / generation path is a separate framed system.
- Like/dislike feedback is a separate framed system or visually distinct subframe.
- Avoid nested frames that make prose columns too narrow.
