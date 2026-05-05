# Peach Blossom Spring (WorkAdventure-first)

This app is now a WorkAdventure-first explorable map prototype.

- World direction: Peach Blossom Spring / 桃花源 / NGM Persona Village
- Pixel Agents: visual inspiration for lively pixel NPCs only
- Persona knowledge source: `data/personas.json` (preserved, no regeneration)

## Current map architecture

World and interaction data lives in `src/world/peachBlossomWorld.ts`.

- `WorldZone`: named map zones with kind + bounds
- `NpcPlacement`: persona-to-zone placement with idle behavior hints
- `communityLinks`: editable archive tree portal links
- `createPeachBlossomLayout()`: hand-built prototype tile layout

The current map includes:

- river crossing + old bridge
- storyteller context near the bridge
- village houses
- school/workshop area
- restaurant/tavern area
- music theatre area
- forest + hut area
- campfire circle
- big archive tree landmark

## Interaction model

- Proximity trigger: nearby persona prompt (`Press Space to talk`)
- Dialogue trigger: Space opens a free-form persona chat box
- Dialogue response source: persona knowledge JSON + DeepSeek chat completion
- Archive trigger: enter the archive tree zone to open persona index + links
- Zone banner: active zone name + description shown while wandering

## Future map direction

- Keep current hand-built layout for safe iteration
- Next step: migrate zone/layout data to Tiled or WorkAdventure-compatible JSON
- Keep trigger architecture (zones, portals, dialogue points) compatible with that migration

## Local development

PBS reads `VITE_DEEPSEEK_API_KEY` at startup and writes it into browser `localStorage` as `peach_deepseek_api_key`, so local testing can use the same one-time key setup as GitHub Pages without committing a secret.

```bash
cat > webview-ui/.env.local <<'EOF'
VITE_DEEPSEEK_API_KEY=your_deepseek_key_here
EOF
npm --prefix webview-ui run build
npm --prefix webview-ui run test
```

For GitHub Pages, add the same value as a repository secret named `VITE_DEEPSEEK_API_KEY`; `.github/workflows/pages.yml` injects it only during the Pages build.
