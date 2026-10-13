import type { SemanticVectorContext } from "./connectedPapers.js";
import type { DaydreamReport, SourceCard } from "./engine.js";

export type ResearchRelationPattern =
  | "translation"
  | "tension"
  | "complement"
  | "missing_bridge"
  | "risk"
  | "similarity";

export interface ResearchTopicCandidate {
  title: string;
  researchQuestion: string;
  relationPattern: ResearchRelationPattern;
  knowledgeSystems: string[];
  evidenceTrail: Array<Pick<SourceCard, "id" | "title" | "url" | "source">>;
  whyInteresting: string;
  noveltyGap: string;
  riskCaveat: string;
  firstReadingRoute: string[];
  possibleOutputs: string[];
  maturityScore: number;
}

const OUTPUTS = ["zine", "essay", "workshop score", "exhibition protocol", "wiki research page"];

export function generateResearchTopicCandidates(
  report: DaydreamReport,
  semanticContext: SemanticVectorContext,
  limit = 6,
): ResearchTopicCandidate[] {
  const evidence = dedupeCards([
    ...report.matchedCards,
    ...report.linkedCards.map((trail) => trail.card),
    ...report.expandedCards,
    ...semanticContext.relatedCards.map((item) => item.card),
    ...semanticContext.bridgeCards.flatMap((bridge) => bridge.cards),
    ...semanticContext.futureDirections.flatMap((future) => future.evidenceCards),
  ]);
  const candidates: ResearchTopicCandidate[] = [];

  for (const bridge of semanticContext.bridgeCards.slice(0, limit * 2)) {
    candidates.push(topicFromBridge(report, bridge.cards, bridge.sharedTerms, bridge.score));
  }

  for (const future of semanticContext.futureDirections.slice(0, limit * 2)) {
    candidates.push(topicFromFuture(report, future.evidenceCards, future.groundedTerms, future.score));
  }

  if (candidates.length === 0 && evidence.length > 0) {
    candidates.push(topicFromEvidencePool(report, evidence));
  }

  return dedupeTopics(candidates)
    .sort((a, b) => b.maturityScore - a.maturityScore || a.title.localeCompare(b.title))
    .slice(0, limit);
}

function topicFromBridge(
  report: DaydreamReport,
  cards: [SourceCard, SourceCard],
  sharedTerms: string[],
  bridgeScore: number,
): ResearchTopicCandidate {
  const pattern = inferRelationPattern(cards, sharedTerms, true);
  const title = buildTopicTitle(pattern, sharedTerms, cards);
  const systems = knowledgeSystemsFor(cards);
  const trail = evidenceTrailFor(cards);
  const terms = sharedTerms.slice(0, 4).join(" / ") || report.keywords.slice(0, 4).join(" / ") || "cross-source practice";

  return {
    title,
    researchQuestion: buildResearchQuestion(pattern, terms, systems),
    relationPattern: pattern,
    knowledgeSystems: systems,
    evidenceTrail: trail,
    whyInteresting: `這個題目不是把兩篇 note 擺在一起，而是把 ${systems.join("、")} 之間的 ${terms} 視為尚未被命名的研究問題。`,
    noveltyGap: "Connected-paper 層顯示它們有共享方法／材料／物件，但 vault 中沒有直接來源鏈；這個缺口可以被發展成跨知識體系題目。",
    riskCaveat: riskCaveatFor(pattern, cards, report),
    firstReadingRoute: cards.map((card) => card.title),
    possibleOutputs: OUTPUTS,
    maturityScore: Math.min(100, 42 + bridgeScore + systems.length * 6 + report.depthMetrics.depthScore / 4),
  };
}

function topicFromFuture(
  report: DaydreamReport,
  cards: SourceCard[],
  groundedTerms: string[],
  futureScore: number,
): ResearchTopicCandidate {
  const evidence = dedupeCards(cards).slice(0, 5);
  const pattern = inferRelationPattern(evidence, groundedTerms, false);
  const systems = knowledgeSystemsFor(evidence);
  const terms = groundedTerms.slice(0, 4).join(" / ") || report.keywords.slice(0, 4).join(" / ") || "future practice";

  return {
    title: buildTopicTitle(pattern, groundedTerms, evidence),
    researchQuestion: buildResearchQuestion(pattern, terms, systems),
    relationPattern: pattern,
    knowledgeSystems: systems,
    evidenceTrail: evidenceTrailFor(evidence),
    whyInteresting: `Future-paper 層把 ${terms} 標成多個社群共同出現的詞群；它適合變成研究題目，而不是直接變成作品成品。`,
    noveltyGap: "題目的新意在於把共同詞群升級成可追問的概念關係：誰使用這些方法、材料服務誰、哪些風險沒有被原始 wiki 頁面說清楚。",
    riskCaveat: riskCaveatFor(pattern, evidence, report),
    firstReadingRoute: evidence.map((card) => card.title),
    possibleOutputs: OUTPUTS,
    maturityScore: Math.min(100, 36 + futureScore + systems.length * 6 + report.depthMetrics.depthScore / 5),
  };
}

function topicFromEvidencePool(report: DaydreamReport, evidence: SourceCard[]): ResearchTopicCandidate {
  const cards = evidence.slice(0, 5);
  const terms = report.keywords.slice(0, 5);
  const pattern = inferRelationPattern(cards, terms, false);
  const systems = knowledgeSystemsFor(cards);

  return {
    title: buildTopicTitle(pattern, terms, cards),
    researchQuestion: buildResearchQuestion(pattern, terms.join(" / ") || "seed", systems),
    relationPattern: pattern,
    knowledgeSystems: systems,
    evidenceTrail: evidenceTrailFor(cards),
    whyInteresting: "這是低證據候選題；它主要來自 seed retrieval，而不是完整 connected-paper bridge。",
    noveltyGap: "需要更多 linked-source reading 才能判斷它是研究題，還是只是關鍵字相似。",
    riskCaveat: riskCaveatFor(pattern, cards, report),
    firstReadingRoute: cards.map((card) => card.title),
    possibleOutputs: ["reading route", "question memo", "wiki stub"],
    maturityScore: Math.min(55, 20 + report.depthMetrics.depthScore / 3),
  };
}

function inferRelationPattern(cards: SourceCard[], terms: string[], isBridge: boolean): ResearchRelationPattern {
  const haystack = [...terms, ...cards.flatMap(cardTerms)].join(" ").toLowerCase();
  if (/risk|safety|control|consent/.test(haystack) && /sensor|interface|body|community/.test(haystack)) return "translation";
  if (/ethic|safety|risk|pathogen|control|surveillance|consent/.test(haystack)) return "tension";
  if (isBridge) return "missing_bridge";
  if (/tool|method|workshop|documentation/.test(haystack)) return "complement";
  return "similarity";
}

function buildTopicTitle(pattern: ResearchRelationPattern, terms: string[], cards: SourceCard[]): string {
  const termLabel = humanizeTerms(terms).slice(0, 3).join("／") || "跨知識體系";
  const sourceLabel = knowledgeSystemsFor(cards).slice(0, 2).join(" × ") || "Vault";
  if (pattern === "translation") return `${termLabel} 的轉譯題：${sourceLabel} 之間的語法交換`;
  if (pattern === "tension") return `${termLabel} 的張力題：${sourceLabel} 之間的倫理與控制`;
  if (pattern === "missing_bridge") return `${termLabel} 的缺橋題：${sourceLabel} 尚未連上的研究路線`;
  if (pattern === "complement") return `${termLabel} 的互補題：${sourceLabel} 的方法組裝`;
  if (pattern === "risk") return `${termLabel} 的風險題：${sourceLabel} 的邊界條件`;
  return `${termLabel} 的相似題：${sourceLabel} 的鄰近實踐`;
}

function buildResearchQuestion(pattern: ResearchRelationPattern, terms: string, systems: string[]): string {
  const systemLabel = systems.join("、") || "不同知識體系";
  if (pattern === "translation") return `如果 ${systemLabel} 使用相似的 ${terms}，這些方法在跨領域轉譯時改變了什麼：材料、身體、責任，還是社群協定？`;
  if (pattern === "tension") return `${systemLabel} 中的 ${terms} 如何同時產生照護與控制，並要求什麼樣的倫理／安全邊界？`;
  if (pattern === "missing_bridge") return `為什麼 ${systemLabel} 已共享 ${terms}，但 vault 圖中尚未形成明確連結？這個缺口能否成為新研究題？`;
  if (pattern === "complement") return `${systemLabel} 的 ${terms} 能否組裝成一個可測試、可文件化、可回饋社群的研究方法？`;
  return `${systemLabel} 中反覆出現的 ${terms} 是否只是表面相似，還是暗示一個未被命名的共同問題？`;
}

function riskCaveatFor(pattern: ResearchRelationPattern, cards: SourceCard[], report: DaydreamReport): string {
  const haystack = cards.flatMap(cardTerms).join(" ").toLowerCase();
  const caveats: string[] = [];
  if (/risk|safety|pathogen|control|consent/.test(haystack)) caveats.push("若材料牽涉風險、控制或同意議題，輸出必須保留倫理邊界與人工核對。");
  if (pattern === "similarity") caveats.push("目前可能只是詞彙相似；需要更多 recursive reading 才能宣稱為研究題。 ");
  if (report.depthMetrics.warnings.length > 0) caveats.push(report.depthMetrics.warnings.join(" "));
  return caveats.join(" ") || "目前沒有重大安全警告，但仍需人工核對來源是否真的支持題目。";
}

function cardTerms(card: SourceCard): string[] {
  return [
    card.title,
    card.excerpt,
    ...(card.keywords ?? []),
    ...(card.categories ?? []),
    ...(card.tags ?? []),
    card.source ?? "",
  ].filter(Boolean);
}

function knowledgeSystemsFor(cards: SourceCard[]): string[] {
  const labels = new Set<string>();
  for (const card of cards) labels.add(sourceLabel(card.source));
  return [...labels].filter(Boolean).sort();
}

function sourceLabel(source: string | undefined): string {
  if (source === "htgwyw") return "HOW TO GET WHAT YOU WANT / KOBAKANT";
  if (source === "hackteria") return "Hackteria / bioart-DIYbio";
  if (source === "sgmk") return "SGMK / maker culture";
  return source ? source : "unknown source";
}

function evidenceTrailFor(cards: SourceCard[]): Array<Pick<SourceCard, "id" | "title" | "url" | "source">> {
  return dedupeCards(cards).slice(0, 8).map(({ id, title, url, source }) => ({ id, title, url, source }));
}

function humanizeTerms(terms: string[]): string[] {
  return terms
    .map((term) => term.replace(/-/g, " ").trim())
    .filter((term) => term.length > 1 && !["diy", "community", "practice"].includes(term.toLowerCase()));
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

function dedupeTopics(topics: ResearchTopicCandidate[]): ResearchTopicCandidate[] {
  const seen = new Set<string>();
  const result: ResearchTopicCandidate[] = [];
  for (const topic of topics) {
    const key = `${topic.relationPattern}:${topic.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(topic);
  }
  return result;
}
