import { pbsLocalMemorySourceCards } from "../pbsLocalMemory.js";
import type { DaydreamCorpus } from "./engine.js";

const sourceCards = pbsLocalMemorySourceCards(200);

export const daydreamCorpus: DaydreamCorpus = {
  cards: sourceCards,
  edges: [],
  manifest: {
    schemaVersion: "pbs-local-memory-game-index-v1",
    generatedAt: "webview-ui/src/generated/pbsLocalMemoryIndex.json",
    counts: {
      sourceCards: sourceCards.length,
      graphEdges: 0,
    },
  },
};
