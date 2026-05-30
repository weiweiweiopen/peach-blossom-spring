# Pet Lint HUD + NPC Bubble + Zine Feedback Vault Loop

## Goal

Make the Question Pet a useful lint/knowledge-gap surface instead of a decorative HUD, fix NPC talk prompt behavior, and route zine feedback toward reviewable vault structure without mutating raw sources.

## Requirements

1. Thought-gap broadcasts should accumulate into the Question Pet HUD so players can browse currently discovered knowledge gaps.
2. The desktop Question Pet HUD should live on the right side only; the left/bottom stray panel behavior should be removed.
3. The minimized desktop HUD should use a compact mobile-style chip with numeric signals instead of an empty framed box with useless decorative lines.
4. When the player touches one NPC, only that NPC's name bubble should become `按空白鍵交談`; other NPC name bubbles should remain visible.
5. Zine feedback should immediately regenerate from the original query while also creating review artifacts that can affect the repo/vault after local review.
6. Public GitHub Pages must not write directly to `obsidian-vault/` or mutate raw sources.

## Non-Goals

- Do not implement a cloud shared memory layer in this slice.
- Do not allow public feedback to directly modify compiled Wiki notes.
- Do not change raw files under `obsidian-vault/Sources/`.

## Acceptance Criteria

- Thought-gap broadcasts appear in a browsable `知識漏洞` section in the right-side Question Pet HUD.
- The minimized HUD shows counts and numeric status (`G`, `E`, `S`, `B`) and has no redundant frame lines.
- Other NPC names remain visible while the touched NPC shows the talk prompt.
- Zine feedback still triggers immediate regeneration using the original query.
- Local Vite dev writes structured review artifacts under zine feedback inbox and question candidate folders.
- `npm --prefix webview-ui run build` passes.
