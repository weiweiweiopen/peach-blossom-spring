import type { DaydreamReport, SourceCard } from "./engine.js";
import type { ResearchTopicCandidate } from "./researchTopics.js";
import type { DaydreamOutputPlan } from "./daydreamWorkflow.js";

export interface DaydreamEditorialBriefSection {
  id: string;
  title: string;
  body: string;
  evidence: Array<Pick<SourceCard, "id" | "title" | "url" | "source">>;
}

export interface DaydreamEditorialBrief {
  schemaVersion: "daydream-editorial-brief-v1";
  seed: string;
  title: string;
  deck: string;
  selectedTopic?: Pick<
    ResearchTopicCandidate,
    "title" | "researchQuestion" | "relationPattern" | "knowledgeSystems" | "maturityScore"
  >;
  sections: DaydreamEditorialBriefSection[];
  sourceTrail: Array<Pick<SourceCard, "id" | "title" | "url" | "source">>;
  caveats: string[];
  approvedForLayout: boolean;
}

const RAW_ARTIFACT_LANGUAGE = /\b(Source|Excerpt|Content|Workflow|Debug|Depth Gate|sourceCards|categoryGraph|corpusManifest|POTENTIAL TOPIC)\b|來源卡|原始摘錄|工作流|偵錯/i;

export function buildEditorialBrief(params: {
  seed: string;
  report: DaydreamReport;
  selectedTopic?: ResearchTopicCandidate;
  outputPlan: DaydreamOutputPlan;
  evidenceCards: SourceCard[];
}): DaydreamEditorialBrief {
  const { seed, report, selectedTopic, outputPlan, evidenceCards } = params;
  const primaryEvidence = dedupeCitations([
    ...selectedTopic?.evidenceTrail ?? [],
    ...outputPlan.sections.flatMap((section) => section.evidence),
    ...evidenceCards.map(citationFor),
  ]).slice(0, 10);

  const title = selectedTopic?.title ?? outputPlan.title;
  const deck = selectedTopic?.researchQuestion ?? outputPlan.thesis;
  const sections = buildReadableSections(report, selectedTopic, outputPlan, evidenceCards);
  const caveats = [...outputPlan.caveats, ...report.depthMetrics.warnings]
    .map(cleanArtifactText)
    .filter(Boolean);

  const brief: DaydreamEditorialBrief = {
    schemaVersion: "daydream-editorial-brief-v1",
    seed,
    title: cleanArtifactText(title),
    deck: cleanArtifactText(deck),
    selectedTopic: selectedTopic ? {
      title: cleanArtifactText(selectedTopic.title),
      researchQuestion: cleanArtifactText(selectedTopic.researchQuestion),
      relationPattern: selectedTopic.relationPattern,
      knowledgeSystems: selectedTopic.knowledgeSystems,
      maturityScore: selectedTopic.maturityScore,
    } : undefined,
    sections,
    sourceTrail: primaryEvidence,
    caveats: dedupeStrings(caveats),
    approvedForLayout: false,
  };

  validateEditorialBrief(brief);
  brief.approvedForLayout = true;
  return brief;
}

export function validateEditorialBrief(brief: DaydreamEditorialBrief): void {
  const visible = [
    brief.title,
    brief.deck,
    ...brief.sections.flatMap((section) => [section.title, section.body]),
  ].join("\n");

  if (RAW_ARTIFACT_LANGUAGE.test(visible)) {
    throw new Error("Daydream editorial brief contains raw workflow/source/debug language.");
  }
  if (brief.sections.length < 4) {
    throw new Error("Daydream editorial brief requires at least four readable sections.");
  }
  const tooShort = brief.sections.find((section) => section.body.trim().length < 80);
  if (tooShort) {
    throw new Error(`Daydream editorial brief section too short: ${tooShort.id}`);
  }
  const repeated = /(\b[A-Za-z][A-Za-z0-9_-]{3,}\b)(?:\s+\1){2,}/i.exec(visible);
  if (repeated) {
    throw new Error(`Daydream editorial brief appears to contain repeated filler token: ${repeated[1]}`);
  }
}

function buildReadableSections(
  report: DaydreamReport,
  selectedTopic: ResearchTopicCandidate | undefined,
  outputPlan: DaydreamOutputPlan,
  evidenceCards: SourceCard[],
): DaydreamEditorialBriefSection[] {
  const route = selectedTopic?.firstReadingRoute?.length
    ? selectedTopic.firstReadingRoute.join("、")
    : evidenceCards.slice(0, 4).map((card) => card.title).join("、");
  const systems = selectedTopic?.knowledgeSystems?.length
    ? selectedTopic.knowledgeSystems.join(" × ")
    : "本地來源卡與關係圖譜";
  const deepCards = report.deepReadCards.length ? report.deepReadCards : evidenceCards;
  const deepTitles = deepCards.slice(0, 5).map((card) => card.title).join("、");
  const topicQuestion = selectedTopic?.researchQuestion ?? outputPlan.thesis;
  const why = selectedTopic?.whyInteresting ?? outputPlan.sections.at(-2)?.purpose ?? outputPlan.thesis;
  const novelty = selectedTopic?.noveltyGap ?? "這個題目需要把來源頁中的材料、方法與場域條件重新組織成可討論的研究問題，而不是停在作品靈感。";
  const risk = selectedTopic?.riskCaveat ?? outputPlan.caveats[0] ?? "輸出應保留來源限制與待查問題，不把薄弱證據包裝成完成結論。";

  return [
    {
      id: "question",
      title: "問題如何形成",
      body: cleanArtifactText(`這個 Daydream 不是從單一作品摘要直接跳到成品，而是從「${systems}」之間反覆出現的方法詞開始。核心問題是：${topicQuestion} 這個問題把材料、身體、工具與地方放在同一個平面上，要求我們先看見知識如何被轉譯，再決定它能不能成為小誌、工作坊或 wiki 頁。`),
      evidence: evidenceCards.slice(0, 4).map(citationFor),
    },
    {
      id: "reading-route",
      title: "第一條閱讀路線",
      body: cleanArtifactText(`可讀的路線先從 ${route || "主要證據頁"} 展開。這些來源的價值不在於提供漂亮關鍵字，而在於讓題目落到具體情境：誰在什麼地方使用工具，哪些材料可以被教學、修補或帶走，哪些行動最後能回到共同文件。`),
      evidence: (selectedTopic?.evidenceTrail ?? evidenceCards.slice(0, 4).map(citationFor)).slice(0, 5),
    },
    {
      id: "deep-reading",
      title: "第二層深讀",
      body: cleanArtifactText(`深讀層補上的不是更多名詞，而是更厚的判斷。${deepTitles || "第二層來源"} 讓題目從抽象關聯變成具體方法：感測器如何成為身體與布料之間的翻譯，工具如何形成進入地方研究的門檻，工作坊如何把學習過程公開成可被重演的格式。`),
      evidence: deepCards.slice(0, 5).map(citationFor),
    },
    {
      id: "relation",
      title: "關係場與張力",
      body: cleanArtifactText(`${why} ${novelty} 因此，版面上的大標題不應只是裝飾，應該像研究問題本身一樣成為阻力：正文必須沿著它的邊界重新排布，讓讀者感覺到來源、概念與形式彼此推擠。`),
      evidence: outputPlan.sections.flatMap((section) => section.evidence).slice(0, 5),
    },
    {
      id: "output",
      title: "輸出應該成為什麼",
      body: cleanArtifactText(`這份 Daydream 最適合成為可回寫的公共格式：一頁可以閱讀的研究小誌、一份工作坊 score、一個展覽 protocol，或一個回到 vault 的 wiki 頁。它的任務不是宣稱研究完成，而是把可測試的問題、來源路線、風險邊界與下一步行動放在同一個可分享的 artifact 裡。${risk}`),
      evidence: evidenceCards.slice(0, 6).map(citationFor),
    },
  ];
}

function cleanArtifactText(input: string): string {
  return input
    .replace(/\bSource:\s*/gi, "")
    .replace(/\bExcerpt\b:?/gi, "")
    .replace(/\bContent\b:?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function citationFor(card: SourceCard): Pick<SourceCard, "id" | "title" | "url" | "source"> {
  return { id: card.id, title: card.title, url: card.url, source: card.source };
}

function dedupeCitations<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

function dedupeStrings(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}
