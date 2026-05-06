# 桃花源：可思考的生命模擬器派遣

This app is now a WorkAdventure-first explorable map prototype.

- World direction: 桃花源：可思考的生命模擬器派遣 / indoor forest Peach Blossom Spring
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
- Dialogue trigger: Space opens persona topic dialogue
- Topic response source: existing `personas.json` responses only
- Archive trigger: enter the archive tree zone to open persona index + links
- Zone banner: active zone name + description shown while wandering

## Future map direction

- Keep current hand-built layout for safe iteration
- Next step: migrate zone/layout data to Tiled or WorkAdventure-compatible JSON
- Keep trigger architecture (zones, portals, dialogue points) compatible with that migration

## Local development

```bash
npm --prefix webview-ui run build
npm --prefix webview-ui run test
```
