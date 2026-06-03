import type { AssociationReport, SourceCard } from "./engine.js";
import type { ResearchTopicCandidate } from "./researchTopics.js";

export interface AssociationPublicArtifactSection {
  id: string;
  title: string;
  body: string;
  pullQuote?: string;
}

export interface AssociationPublicArtifactProtocolItem {
  title: string;
  body: string;
}

export interface AssociationPublicArtifactContent {
  schemaVersion: "association-public-document-v1";
  title: string;
  subtitle: string;
  opening: string;
  proposition: string;
  sections: AssociationPublicArtifactSection[];
  protocol: AssociationPublicArtifactProtocolItem[];
  quietCaveat?: string;
  approvedForPublicLayout: boolean;
}

const PROCESS_LANGUAGE = /\b(workflow|debug|sourceCards|categoryGraph|corpusManifest|selectedTopic|researchTopics|outputPlan|depthScore|POTENTIAL TOPIC|Source:|Excerpt|search|prototype|protocol|artifact|wiki note|score|source\s*trail|relation\s*paths?|maturity\s*score|privateTrace|Association|Association)\b|工作流|偵錯|來源卡|來源|原始摘錄|搜尋|檢索|命中|問題如何形成|閱讀路線|第二層深讀|關係場|輸出形式|閱讀依據|深度門檻|校正頁|後台|流程|生成|系統|草稿/i;

export function buildPublicArtifactContent(params: {
  seed: string;
  report: AssociationReport;
  selectedTopic?: ResearchTopicCandidate;
  evidenceCards: SourceCard[];
}): AssociationPublicArtifactContent {
  const { seed, report, selectedTopic } = params;
  const evidenceCards = dedupeBySourceFamily(params.evidenceCards, 12);
  const signals = extractPublicSignals(seed, report, selectedTopic, evidenceCards);
  const concept = nameConcept(signals);
  const artifact: AssociationPublicArtifactContent = {
    schemaVersion: "association-public-document-v1",
    title: concept.title,
    subtitle: concept.subtitle,
    opening: buildOpening(signals),
    proposition: buildProposition(signals),
    sections: buildSections(signals),
    protocol: buildProtocol(signals),
    quietCaveat: buildQuietCaveat(signals, selectedTopic, report),
    approvedForPublicLayout: false,
  };

  validatePublicArtifactContent(artifact);
  artifact.approvedForPublicLayout = isPublicationDepthReady(report);
  return artifact;
}

function isPublicationDepthReady(report: AssociationReport): boolean {
  // Public Association output is allowed to be speculative and emergent. The gate
  // blocks empty/thin retrieval, not every absence of academic-grade traversal.
  // A separate warning/caveat can carry uncertainty into the artifact voice.
  const thinRatio = report.depthMetrics.directMatches + report.depthMetrics.deepReadExpansions > 0
    ? report.depthMetrics.cardsWithThinExtracts / (report.depthMetrics.directMatches + report.depthMetrics.deepReadExpansions)
    : 1;

  return report.depthMetrics.depthScore >= 40 &&
    report.depthMetrics.directMatches >= 4 &&
    report.depthMetrics.deepReadExpansions >= 3 &&
    thinRatio <= 0.9 &&
    !report.depthMetrics.warnings.some((warning) => /No second-layer|below publication/i.test(warning));
}

export function validatePublicArtifactContent(artifact: AssociationPublicArtifactContent): void {
  const visible = [
    artifact.title,
    artifact.subtitle,
    artifact.opening,
    artifact.proposition,
    artifact.quietCaveat ?? "",
    ...artifact.sections.flatMap((section) => [section.title, section.body, section.pullQuote ?? ""]),
    ...artifact.protocol.flatMap((item) => [item.title, item.body]),
  ].join("\n");

  if (PROCESS_LANGUAGE.test(visible)) {
    throw new Error("Association public document still contains workflow/process/source/debug language.");
  }
  if (artifact.sections.length < 4) {
    throw new Error("Association public document needs at least four public-facing sections.");
  }
  if (artifact.protocol.length < 3) {
    throw new Error("Association public document needs at least three public-facing protocol items.");
  }
  const shortSection = artifact.sections.find((section) => section.body.trim().length < 90);
  if (shortSection) {
    throw new Error(`Association public section is too thin: ${shortSection.id}`);
  }
}

interface PublicSignals {
  seed: string;
  terms: string[];
  systems: string[];
  sourceTitles: string[];
  sourceSnippets: string[];
  hasSensor: boolean;
  hasWorkshop: boolean;
  hasLocalPlace: boolean;
  relationPattern?: ResearchTopicCandidate["relationPattern"];
}

function extractPublicSignals(
  seed: string,
  report: AssociationReport,
  selectedTopic: ResearchTopicCandidate | undefined,
  evidenceCards: SourceCard[],
): PublicSignals {
  const text = [
    seed,
    ...report.keywords,
    ...(selectedTopic?.knowledgeSystems ?? []),
    selectedTopic?.researchQuestion ?? "",
    selectedTopic?.whyInteresting ?? "",
    ...evidenceCards.flatMap((card) => [card.title, card.excerpt, ...(card.keywords ?? []), ...(card.tags ?? []), ...(card.categories ?? [])]),
  ].join(" ").toLowerCase();
  const terms = dedupeStrings([
    ...report.keywords,
    ...(selectedTopic?.firstReadingRoute ?? []),
    ...evidenceCards.flatMap((card) => [...(card.keywords ?? []), ...(card.tags ?? [])]),
  ]).filter((term) => isPublicTerm(term)).slice(0, 14);
  return {
    seed,
    terms,
    systems: selectedTopic?.knowledgeSystems?.length ? selectedTopic.knowledgeSystems : inferSystems(evidenceCards),
    sourceTitles: dedupeStrings(evidenceCards.map((card) => card.title)).slice(0, 8),
    sourceSnippets: evidenceCards.map((card) => cleanSnippet(card.excerpt, card.title)).filter(Boolean).slice(0, 8),
    hasSensor: /sensor|sensors|感測|傳感/.test(text),
    hasWorkshop: /workshop|workshops|工作坊|教學/.test(text),
    hasLocalPlace: /local|place|city|mapping|field|地方|田野|城市/.test(text),
    relationPattern: selectedTopic?.relationPattern,
  };
}

function nameConcept(signals: PublicSignals): { title: string; subtitle: string } {
  const terms = meaningfulTerms(signals).slice(0, 4);
  const primary = titleCaseTerm(terms[0] ?? "共同問題");
  const secondary = titleCaseTerm(terms[1] ?? terms[0] ?? "方法");
  const title = terms.length >= 2
    ? `${primary} / ${secondary}`
    : `${primary} 的未來方向`;
  const sourceHint = sourceFamilySummary(signals);
  return {
    title,
    subtitle: `從${sourceHint}出發，把這個問題轉成一條可閱讀、可查證、也可被修正的公共短文。`,
  };
}

function buildOpening(signals: PublicSignals): string {
  const observations = concreteSourceSentences(signals).slice(0, 3);
  const sourceWorld = sourceWorldSentence(signals);
  if (observations.length === 0) {
    return `${sourceWorld} 這些材料沒有提供單一答案；它們比較像一組尚未對齊的手勢，讓問題可以先被拆開、重新排列，再變成下一步可查證的形式。`;
  }
  return `${sourceWorld} ${observations.join(" ")} 這些具體線索讓問題不再只是願望，而變成一個可以被材料、場所與社群方法共同查證的方向。`;
}

function buildProposition(signals: PublicSignals): string {
  const terms = meaningfulTerms(signals).slice(0, 3);
  const axis = terms.length > 0 ? terms.join("、") : "材料、場域與關係";
  const systems = signals.systems.slice(0, 2).join("、") || "社群筆記";
  return `這篇短文的中心不是把 ${axis} 做成清單，而是從 ${systems} 的片段中讀出一個可被查證的關係：先看每個材料實際處理了什麼，再讓推測從那些具體觀察旁邊長出來。`;
}

function buildSections(signals: PublicSignals): AssociationPublicArtifactSection[] {
  const snippets = concreteSourceSentences(signals);
  const terms = meaningfulTerms(signals);
  const sectionInputs = [0, 1, 2, 3].map((index) => ({
    observation: snippets[index % Math.max(1, snippets.length)] ?? "材料提供的片段仍然偏薄，因此這裡只能保留為謹慎的工作假設。",
    term: terms[index % Math.max(1, terms.length)] ?? "方法",
  }));

  return sectionInputs.map((item, index) => {
    const title = sectionTitleFor(index, item.term);
    const body = sectionBodyFor(index, item, signals);
    return {
      id: `public-section-${index + 1}`,
      title,
      body,
      pullQuote: index === 0 ? `先讓 ${item.term} 從具體動作裡出現，而不是從風格想像裡出現。` : undefined,
    };
  });
}

function buildProtocol(signals: PublicSignals): AssociationPublicArtifactProtocolItem[] {
  const terms = meaningfulTerms(signals);
  const primary = terms[0] ?? "問題";
  const secondary = terms[1] ?? "材料";
  const tertiary = terms[2] ?? "社群";
  return [
    {
      title: "先取一個可觀察動作",
      body: `不要先替 ${primary} 下結論；先取出一個人、材料、工具或場域真正做過的動作，讓文章從那個可查證細節開始。`,
    },
    {
      title: "找出真正改變問題的關係",
      body: `如果 ${secondary} 只是題材，文章會變成清單；把它放回 query 時，需要說清楚它如何改變觀看、判讀、組織或記錄的方式。`,
    },
    {
      title: "保留弱訊號",
      body: `材料偏薄或互相矛盾時，不要補成完整作品。把不確定寫成限制，讓 ${tertiary} 的下一次查證可以知道哪裡還需要補讀。`,
    },
    {
      title: "回到同一個問題",
      body: "最後的形式應該是一份可被他人接手的判讀、查證問題或短文，而不是把整理痕跡公開給讀者。",
    },
  ];
}

function buildQuietCaveat(
  _signals: PublicSignals,
  selectedTopic: ResearchTopicCandidate | undefined,
  report: AssociationReport,
): string | undefined {
  if ((selectedTopic?.maturityScore ?? 100) < 45 || report.depthMetrics.warnings.length > 0) {
    return "這是一個還在形成中的題目；它適合先作為小誌或查證路線被保留，而不是被宣稱為完成研究。";
  }
  return undefined;
}

function meaningfulTerms(signals: PublicSignals): string[] {
  return dedupeStrings([
    ...signals.terms,
  ])
    .map((term) => term.replace(/[_-]+/g, " ").trim())
    .filter((term) => isPublicTerm(term) && term.length >= 2 && !/^\d+$/.test(term))
    .slice(0, 10);
}

function concreteSourceSentences(signals: PublicSignals): string[] {
  return signals.sourceSnippets
    .map((snippet) => cleanSnippet(snippet))
    .flatMap((snippet) => snippet.split(/(?<=[.!?。！？])\s+/u))
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 36 && !PROCESS_LANGUAGE.test(sentence))
    .map((sentence) => sentence.length > 180 ? `${sentence.slice(0, 180)}…` : sentence)
    .slice(0, 8);
}

function titleCaseTerm(term: string): string {
  const cleaned = term.replace(/\s+/g, " ").trim();
  if (/^[A-Za-z][A-Za-z\s-]+$/.test(cleaned)) {
    return cleaned.split(/\s+/).slice(0, 3).map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(" ");
  }
  return cleaned.slice(0, 18);
}

function sectionTitleFor(index: number, term: string): string {
  const shortTerm = titleCaseTerm(term);
  if (index === 0) return `${shortTerm} 先以具體材料出現`;
  if (index === 1) return "讓材料自己改變問題";
  if (index === 2) return `${shortTerm} 從題材變成證據`;
  return "把下一步寫成可被接手的形式";
}

function sectionBodyFor(
  index: number,
  item: { observation: string; term: string },
  signals: PublicSignals,
): string {
  const nextTerm = meaningfulTerms(signals)[index + 1] ?? item.term;
  if (index === 0) {
    return `先抓住一個具體支點：${item.observation} 這個細節比抽象關鍵字更重要，因為它讓 ${item.term} 可以被看見，也可以被別人檢查；後續文字只需要沿著這個可觀察動作慢慢展開。`;
  }
  if (index === 1) {
    return `${item.observation} 這裡的轉向不是把材料當作案例裝飾，而是看它如何改變原本的問題。當 ${item.term} 和 ${nextTerm} 被放在一起，文章開始形成一條能被查證的路。`;
  }
  if (index === 2) {
    return `這些材料讓 ${item.term} 不只是主題名稱。${item.observation} 因此，推測只能從這個觀察旁邊延伸：它可能成為一個可比較的關係、反例或公共筆記方法，而不是被直接宣稱為完成作品。`;
  }
  return `${item.observation} 最後的形式應該保留可被接手的開口：把已知的材料、可查證的關係、仍然薄弱的環節和下一個問題寫清楚。這樣它才像一份能被接手的公共文本，而不是一次性的摘要。`;
}

function sourceWorldSentence(signals: PublicSignals): string {
  const summary = sourceFamilySummary(signals);
  return `幾組${summary}被放在同一張桌上，露出一個比單一作品更大的問題。`;
}

function cleanSnippet(input: string, sourceTitle = ""): string {
  const withoutExactTitle = sourceTitle
    ? input.replace(new RegExp(escapeRegExp(sourceTitle), "gi"), "")
    : input;
  return withoutExactTitle
    .replace(/\bSource:\s*https?:\/\/\S+/gi, "")
    .replace(/\(No plaintext extract returned[^)]*\)/gi, "")
    .replace(/Imported:\s*\d{4}[^.。]*/gi, "")
    .replace(/\bArtScienceBangalore\s*(?:19|20)\d{2}\b/gi, "")
    .replace(/\bSynthetic Biology for Artists and Designers\s*(?:19|20)?\d{0,2}\b/gi, "workshop materials")
    .replace(/\bHackteria relationship layer\b/gi, "community practice diagram")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isPublicTerm(term: string): boolean {
  const normalized = term.toLowerCase().trim();
  if (normalized.length < 2) return false;
  return !/^(source|content|workflow|debug|api|mediawiki|relationship|layer|imported|pages|with|found|none|unknown)$/.test(normalized);
}

function inferSystems(cards: SourceCard[]): string[] {
  return dedupeStrings(cards.map((card) => card.source ?? "社群筆記")).slice(0, 4);
}

function sourceFamilySummary(signals: PublicSignals): string {
  const text = `${signals.seed} ${signals.terms.join(" ")} ${signals.sourceTitles.join(" ")}`.toLowerCase();
  const families: string[] = [];
  if (/sound|audio|music|聲音|音樂/.test(text)) families.push("聲音與介面材料");
  if (/sensor|感測/.test(text)) families.push("感測與介面材料");
  if (/workshop|camp|community|field|工作坊|社群|田野/.test(text)) families.push("社群與田野材料");
  if (families.length === 0) families.push("社群材料");
  return families.slice(0, 3).join("、");
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

function sourceFamilyKey(item: { title: string; url?: string; source?: string; path?: string; id?: string }): string {
  const titleKey = normalizeSourceFamilyText(item.title || item.path || item.url || item.id || "");
  const sourceKey = normalizeSourceFamilyText(item.source ?? "").split(" ").slice(0, 3).join(" ");
  return `${sourceKey}:${titleKey}`.trim();
}

function normalizeSourceFamilyText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/artists and designers/g, "workshop materials")
    .replace(/artsciencebangalore/g, "artscience bangalore")
    .replace(/hackteria relationship layer/g, "hackteria")
    .replace(/\b(part|session|day|year|edition)\s*\d+\b/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .trim();
}

function dedupeStrings(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}
