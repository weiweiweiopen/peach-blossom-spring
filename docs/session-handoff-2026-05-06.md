# Session Handoff - 2026-05-06

## Current Direction

Peach Blossom Spring now follows the Solar Oracle Walkman-style production model: the GitHub Pages frontend calls the Cloudflare Worker chat proxy, and the Worker owns the DeepSeek API key as a Cloudflare secret. Do not reintroduce frontend API key UI, local key prompts, or hardcoded keys.

## Important Decisions

- Production dialogue should call the Worker URL from `webview-ui/index.html` meta `pbs-chat-api`.
- Do not expose, render, log, commit, or hardcode any real DeepSeek API key.
- Do not silently fall back to generic local NPC text for production proxy failures. Surface and fix proxy/key/CORS issues instead.
- Keep `RpgDialogue` and `ExpeditionPanel` lazy-loaded; do not import them into the homepage bundle eagerly.
- Canonical transcript folders are only `docs/transcripts_en` and `docs/transcripts_zh`.
- Old source/draft transcript artifacts were intentionally removed: `docs/transcripts`, `docs/NGM_Interviews`, `docs/NGM texts.txt`, `docs/NGM 全文.pdf`, and `docs/NGM.pages`.
- `data/personas.json` and `data/extra-personas.json` now use `transcripts.en` and `transcripts.zh`, not a single `transcript` path.
- `data/wiki/interviewees/*/links.json` is metadata/prompt context only. DeepSeek does not fetch those URLs itself.

## Dialogue Notes

- Suggested dialogue questions are generated locally and cheaply from templates, persona role, player mission/skills, and transcript snippets. They should not call DeepSeek just to vary button text.
- The top row of fixed dialogue buttons should remain direct beginner questions: `你是誰？`, `這裡是哪裡？`, `你可以給我一些意見嗎？`.
- Generated questions should sound like a person who just met the NPC, for example: `你說你是生物藝術策展？你對「玩家設定的問題」有什麼看法？`
- Avoid awkward transcript-fragment prompts such as `關於「...」我應該怎麼理解？` when they read like extracted interview headings rather than speech.

## Expedition Notes

- Expedition output must respond to player setup fields: mission, constraints, and skills.
- Do not make every round end with the same `質疑 / 新線索 / 下一個問題` sentence.
- NPC transcripts are grounding material, not answer boundaries. NPCs should extrapolate from their worldview into the player's task.
- Chinese expedition output should avoid leaking English internal profile/rule text.
- The expedition panel intentionally covers the whole screen with a solid background so the map is not visible behind it.
- The final expedition report supports Markdown download.

## Known Non-Blocking Warning

Build/test currently emit a non-fatal warning from `shared/assets/pngDecoder.ts` because it imports `pngjs`, which is not installed in the webview dependency graph. The build and tests pass despite this warning. Do not confuse this with the DeepSeek/Worker work.

## Verification Commands Used

- `npm --prefix webview-ui run check:secrets`
- `npm --prefix webview-ui run build`
- `npm --prefix webview-ui run test`

All passed before the latest deploy commit.

## Latest Relevant Commits

- `e322793 improve dialogue prompts and expedition grounding`
- `34c0991 improve mobile talk flow and localized expedition output`
- `cb4195a fix proxy prompt size for npc dialogue`
- `2e2e1a0 route npc dialogue through Cloudflare DeepSeek proxy`
