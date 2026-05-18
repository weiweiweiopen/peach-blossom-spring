import sourceCardsExport from "../../../obsidian-vault/daydream-export/sourceCards.enriched.json";
import categoryGraphExport from "../../../obsidian-vault/daydream-export/categoryGraph.enriched.json";
import corpusManifestExport from "../../../obsidian-vault/daydream-export/corpusManifest.enriched.json";
import type { CategoryGraphEdge, DaydreamCorpus, SourceCard } from "./engine.js";

type SourceCardsExport = {
  cards?: SourceCard[];
};

type CategoryGraphExport = {
  edges?: CategoryGraphEdge[];
};

type CorpusManifestExport = {
  schemaVersion?: string;
  generatedAt?: string;
  counts?: {
    sourceCards?: number;
    graphEdges?: number;
  };
};

const exportedSourceCards = sourceCardsExport as SourceCardsExport;
const exportedCategoryGraph = categoryGraphExport as CategoryGraphExport;
const exportedManifest = corpusManifestExport as CorpusManifestExport;

const sourceCards = exportedSourceCards.cards ?? [];
const categoryGraphEdges = exportedCategoryGraph.edges ?? [];

export const daydreamCorpus: DaydreamCorpus = {
  cards: sourceCards,
  edges: categoryGraphEdges,
  manifest: {
    schemaVersion: exportedManifest.schemaVersion ?? "obsidian-daydream-export-v1",
    generatedAt: exportedManifest.generatedAt ?? "obsidian-vault/daydream-export",
    counts: {
      sourceCards: exportedManifest.counts?.sourceCards ?? sourceCards.length,
      graphEdges: exportedManifest.counts?.graphEdges ?? categoryGraphEdges.length,
    },
  },
};
