import { buildSemanticVectorContext, type SemanticVectorContext } from "./connectedPapers.js";
import {
  generateDaydreamReport,
  type DaydreamCorpus,
  type DaydreamReport,
  type SourceCard,
} from "./engine.js";
import {
  generateResearchTopicCandidates,
  type ResearchTopicCandidate,
} from "./researchTopics.js";
import { buildEditorialBrief, type DaydreamEditorialBrief } from "./editorialBrief.js";
import { buildPublicArtifactContent, type DaydreamPublicArtifactContent } from "./publicArtifactContent.js";

export interface DaydreamWorkflowResult {
  seed: string;
  step1: {
    report: DaydreamReport;
    evidenceCards: SourceCard[];
  };
  step2: {
    semanticContext: SemanticVectorContext;
  };
  step3: {
    researchTopics: ResearchTopicCandidate[];
    selectedTopic?: ResearchTopicCandidate;
  };
  step4: {
    outputPlan: DaydreamOutputPlan;
    editorialBrief: DaydreamEditorialBrief;
    publicArtifact: DaydreamPublicArtifactContent;
  };
}

export interface DaydreamOutputPlan {
  format: "zine" | "wiki-page" | "workshop-score" | "reading-route";
  title: string;
  thesis: string;
  sections: Array<{
    title: string;
    purpose: string;
    evidence: Array<Pick<SourceCard, "id" | "title" | "url" | "source">>;
  }>;
  caveats: string[];
}

export function runDaydreamWorkflow(seed: string, corpus: DaydreamCorpus): DaydreamWorkflowResult {
  const report = generateDaydreamReport(seed, corpus);
  const evidenceCards = dedupeBySourceFamily(dedupeCards([
    ...report.matchedCards,
    ...report.linkedCards.map((trail) => trail.card),
    ...report.expandedCards,
    ...report.deepReadCards,
  ]), 32);
  const semanticContext = buildSemanticVectorContext(corpus, evidenceCards);
  const researchTopics = generateResearchTopicCandidates(report, semanticContext);
  const selectedTopic = isReadyForTopicSelection(report) ? selectTopic(researchTopics) : undefined;
  const outputPlan = buildOutputPlan(selectedTopic, report, evidenceCards);
  const editorialBrief = buildEditorialBrief({ seed, report, selectedTopic, outputPlan, evidenceCards });
  const publicArtifact = buildPublicArtifactContent({ seed, report, selectedTopic, evidenceCards });

  return {
    seed,
    step1: { report, evidenceCards },
    step2: { semanticContext },
    step3: { researchTopics, selectedTopic },
    step4: { outputPlan, editorialBrief, publicArtifact },
  };
}

function isReadyForTopicSelection(report: DaydreamReport): boolean {
  // Association is an inspirational, source-grounded publication generator,
  // not a peer-reviewed paper pipeline. Allow emergence/noise when retrieval is
  // strong enough, but keep the harder gate for truly polished publication.
  return report.depthMetrics.depthScore >= 40 &&
    report.depthMetrics.directMatches >= 4 &&
    report.depthMetrics.deepReadExpansions > 0 &&
    report.depthMetrics.sourceDiversity >= 1;
}

function selectTopic(topics: ResearchTopicCandidate[]): ResearchTopicCandidate | undefined {
  return [...topics].sort((a, b) => {
    const patternPriority = patternWeight(b.relationPattern) - patternWeight(a.relationPattern);
    if (patternPriority !== 0) return patternPriority;
    return b.maturityScore - a.maturityScore;
  })[0];
}

function patternWeight(pattern: ResearchTopicCandidate["relationPattern"]): number {
  if (pattern === "translation") return 6;
  if (pattern === "tension") return 5;
  if (pattern === "missing_bridge") return 4;
  if (pattern === "complement") return 3;
  if (pattern === "risk") return 2;
  return 1;
}

function buildOutputPlan(
  selectedTopic: ResearchTopicCandidate | undefined,
  report: DaydreamReport,
  evidenceCards: SourceCard[],
): DaydreamOutputPlan {
  if (!selectedTopic) {
    return {
      format: "reading-route",
      title: "低證據白日夢：先補深讀路線",
      thesis: "目前 evidence 不足，Association 應停在閱讀路線與待查問題，不應生成完成小誌。",
      sections: [
        {
          title: "需要補讀的來源",
          purpose: "把薄 source card 變成可支撐題目的厚來源。",
          evidence: evidenceCards.slice(0, 6).map(citationFor),
        },
      ],
      caveats: report.depthMetrics.warnings,
    };
  }

  return {
    format: "zine",
    title: selectedTopic.title,
    thesis: selectedTopic.researchQuestion,
    sections: [
      {
        title: "1. 來源如何變厚",
        purpose: "展示題目不是從摘要跳出來，而是由可追溯的閱讀路線變厚。",
        evidence: report.linkedCards.slice(0, 6).map((trail) => citationFor(trail.card)),
      },
      {
        title: "2. 第二層深讀",
        purpose: `把可解析的下一層文字重新收進證據；關鍵詞：${selectedTopic.firstReadingRoute.concat(report.deepReadKeywords).slice(0, 8).join("、") || "待補"}。`,
        evidence: report.deepReadCards.slice(0, 6).map(citationFor),
      },
      {
        title: "3. 關係場",
        purpose: `說明 ${selectedTopic.relationPattern} 關係如何在來源之間形成。`,
        evidence: selectedTopic.evidenceTrail,
      },
      {
        title: "4. Research topic",
        purpose: selectedTopic.whyInteresting,
        evidence: selectedTopic.evidenceTrail,
      },
      {
        title: "5. 公開輸出",
        purpose: "把研究題目壓縮成可分享、可延伸、可回到 vault 的編輯 artifact。",
        evidence: selectedTopic.evidenceTrail.slice(0, 4),
      },
    ],
    caveats: [selectedTopic.riskCaveat, ...report.depthMetrics.warnings].filter(Boolean),
  };
}

function citationFor(card: SourceCard): Pick<SourceCard, "id" | "title" | "url" | "source"> {
  return { id: card.id, title: card.title, url: card.url, source: card.source };
}

function dedupeCards(cards: SourceCard[]): SourceCard[] {
  const seen = new Set<string>();
  const result: SourceCard[] = [];
  for (const card of cards) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    result.push(card);
  }
  return result;
}

function dedupeBySourceFamily(cards: SourceCard[], max: number): SourceCard[] {
  const seen = new Set<string>();
  const result: SourceCard[] = [];
  for (const card of cards) {
    const key = sourceFamilyKey(card);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(card);
    if (result.length >= max) break;
  }
  return result;
}

function sourceFamilyKey(card: SourceCard): string {
  const titleKey = normalizeSourceFamilyText(card.title || card.path || card.url || card.id);
  const sourceKey = normalizeSourceFamilyText(card.source ?? "").split(" ").slice(0, 3).join(" ");
  return `${sourceKey}:${titleKey}`.trim();
}

function normalizeSourceFamilyText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/synthetic biology for artists and designers/g, "workshop materials")
    .replace(/artsciencebangalore/g, "artscience bangalore")
    .replace(/hackteria relationship layer/g, "hackteria")
    .replace(/\b(part|session|day|year|edition)\s*\d+\b/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .trim();
}
