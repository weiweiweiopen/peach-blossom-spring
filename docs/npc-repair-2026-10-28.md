# NPC regression repair after the user screenshot — 2026-10-28

## Actual failures

The preceding release passed campfire and layout checks but did not exercise
ordinary NPC conversation. The user's Marc/Hackteria screenshot exposed:

1. `askNpc()` discarded its persona argument and used only a document-search gate.
   “你是誰” therefore became an empty search rather than a character introduction.
2. Chinese place names were not connected to country/city equivalents. “現在泰國
   有什麼活動” missed existing Chiang Mai CoLabs/CNX sources.
3. The render layer anonymized the player's chosen name and original utterance,
   displaying the player `abao` as `campers`.
4. The public tree contained no interview Markdown. The local Projects checkout
   had the files, but they were untracked and were not deployed.
5. Even after importing the files, `import.meta.glob('*.md?raw')` did not load
   them. Vite requires the Markdown pattern plus `query: '?raw'`, and its map keys
   do not include that query suffix.

## Changes

- Basic identity, greetings, thanks and help use the selected, localized character
  profile. They do not require research evidence or a model call. Opinions/advice
  have a separately checked conversational path; they are not treated as facts.
- Factual answers still use original passages. The selected profile anchors voice,
  and its interview is first-person attributed testimony, not independent fact.
- Player and assistant roles are explicit. The player name and words are displayed
  unchanged; anonymous character naming remains in the assistant presentation.
- The user explicitly authorized publication of the configured interview files.
  Only the 14 main research profiles' 28 referenced files were imported, byte for
  byte, using the repair worktree's index. Other untracked local documents were
  not included. Wukir's two files explicitly say the transcript is pending; the
  application reports that gap instead of inventing interview material. Thus
  there are 13 substantive bilingual interviews and one pending profile.
- Full interview bodies are retained; bounded source passages are selected after
  loading. Overview queries sample across the interview instead of reading only
  its beginning.
- Geographic containment is separate from subject synonyms. Thailand includes
  Chiang Mai; a Bangkok query must actually match Bangkok. Venue pages are
  preferred over nationality references in Swiss residency biographies. Current
  queries prefer dated passages; numeric passage offsets break score ties.
- Current requests can refresh already relevant Hackteria pages through its public
  CORS-enabled MediaWiki API. At most two pages are read, with a 12-second timeout
  and a five-minute cache. The exact revision URL, text hash, read time and source
  offsets are retained. Other origins remain dated archive evidence. This is not
  unrestricted web search or a complete verified current-events calendar.
- The current-information response explicitly distinguishes today's read time from
  original event dates. Historical leads remain useful without being described as
  events happening today. “Past” can be computed from an explicit source date and
  the supplied clock; it need not literally appear in the quotation.
- An unsupported draft gets one bounded repair using the same evidence and the
  independent review's reasons. Failed second attempts are still withheld;
  transport errors are not retried as evidence repairs.

## Verification

`npm test` passes 71 tests, including the exact screenshot questions, all configured
roles' six-language identity replies, location relevance, date handling, bounded
repair, and deployed interview presence.

`npm run test:npc` exercises the production build's actual NPC window with Marc's
profile and player name `abao`, in six languages. It sends identity, current Thai
activities, identity again, an NGM interview question, and an opinion/advice
question. Only model and external-wiki responses are stubbed by default; the real
corpus, actual lazy-loaded interview chunks and actual browser UI are used.

An opt-in live mode reads real Hackteria pages and calls the real model. The
screenshot sequence, interview and advice also passed locally in WebKit. Local
live model requests are forwarded by the test runner to accommodate the production
proxy's CORS policy; deployed-site live tests use direct browser requests:

```sh
npm run build
npm run test:npc
PBS_NPC_WEBKIT=1 PBS_NPC_LIVE=1 PBS_NPC_LANGUAGE=zh-TW npm run test:npc
PBS_NPC_VERIFY_URL=https://weiweiweiopen.github.io/peach-blossom-spring/ PBS_NPC_LIVE=1 PBS_NPC_LANGUAGE=zh-TW npm run test:npc
```

Screenshots and JSON transcripts are retained in `webview-ui/test-results/npc/`
or `npc-live/`. The Pages workflow now runs and saves the NPC functional suite in
addition to its prior page/layout/PDF checks. These are defined regression cases,
not a promise of zero model error or a universal accuracy percentage.
