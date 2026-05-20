import { extractPublicArtifactText } from "./artifactGuard.js";
import { daydreamCorpus } from "./corpus.js";
import { runDaydreamWorkflow } from "./daydreamWorkflow.js";
import { renderOfficialTemplateArtifactHtml } from "./officialTemplateRenderer.js";
import type { DaydreamPublicArtifactContent } from "./publicArtifactContent.js";
import type { DaydreamHtmlLayoutVariant } from "./publicArtifactHtml.js";
// @ts-ignore Vite raw prompt import from project-level editable prompt file.
import editorialSystemPrompt from "../../prompts/association-editorial-system.md?raw";
// @ts-ignore Vite raw official HTML template import.
import pbsResetTitleTemplate from "./templates/official-html/01-pbs-reset-title-kinetic.html?raw";

const DEFAULT_DEEPSEEK_PROXY_URL = "https://solar-oracle-deepseek-proxy.dontmarryme.workers.dev/chat";
const PUBLIC_FORBIDDEN = /\b(Daydream|Association|privateTrace|sourceTrail|relationPaths|maturityScore|workflow|debug|sourceCards|categoryGraph|corpusManifest|selectedTopic|researchTopics|outputPlan|depthScore|POTENTIAL TOPIC|source\s*trail|relation\s*paths?|generated|backend|generated question|PUBLIC ZINE|READING SCORE|local proof|reading export|guiding question|public note|template status)\b|來源卡|檢索|後台|工作流|偵錯|深度門檻|閱讀路線|關係場|生成流程|研究草圖/i;
const RAW_ENGLISH_EXCERPT = /[A-Za-z][A-Za-z,;:'’()"\-\s]{140,}[.!?]/;

export interface BrowserAssociationResult {
  title: string;
  html: string;
  visibleText: string;
  variant: DaydreamHtmlLayoutVariant;
}

type LlmArtifact = Omit<DaydreamPublicArtifactContent, "schemaVersion" | "approvedForPublicLayout">;
type Workflow = ReturnType<typeof runDaydreamWorkflow>;
type Card = ReturnType<typeof sourceCards>[number];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/\n/g, " ");
}

function htmlPage(fragment: string, title: string): string {
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escapeHtml(title)}</title></head><body>${fragment}</body></html>`;
}

function compactText(text: unknown, max = 260): string {
  return String(text ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function sourceCards(workflow: Workflow) {
  const report = workflow.step1.report;
  const seen = new Set<string>();
  return [...report.matchedCards, ...report.linkedCards.map((item) => item.card)].filter((card) => {
    const key = card.id ?? card.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function classifyCard(card: Card): string {
  const text = `${card.title} ${card.excerpt ?? ""} ${(card.keywords ?? []).join(" ")} ${(card.tags ?? []).join(" ")}`.toLowerCase();
  if (/gene|genetic|synthetic biology|bio|biology|基因|遺傳|合成生物/.test(text)) return "bio";
  if (/sound|audio|music|timbre|synth|聲音|合成器|音樂/.test(text)) return "sound";
  if (/visual|map|image|graph|diagram|data|視覺|圖像|圖譜|資料/.test(text)) return "visual";
  if (/performance|perform|stage|表演|展演|演出/.test(text)) return "performance";
  return "practice";
}

function publicSourcePhrase(card: Partial<Card> | undefined): string {
  if (!card) return "一份社群製作與公開學習材料";
  const kind = classifyCard(card as Card);
  if (kind === "bio") return "一組合成生物學與 DIY 生物社群材料";
  if (kind === "sound") return "一份關於音色、介面與聆聽的材料";
  if (kind === "visual") return "一組把資料轉成圖像的材料";
  if (kind === "performance") return "一段把技術放回現場的展演材料";
  return "一份社群製作與公開學習材料";
}

function isOffTopicTextileCard(card: Card): boolean {
  return /e-?textile|textile|fabric|wearable|布料|紡織|穿戴/i.test(`${card?.title ?? ""} ${card?.excerpt ?? ""}`) && !/gene|genetic|synthetic biology|sound|audio|timbre|synth|基因|遺傳|合成器|聲音/i.test(`${card?.title ?? ""} ${card?.excerpt ?? ""}`);
}

function sourceObservation(card: Card) {
  const kind = classifyCard(card);
  return {
    title: card.title,
    kind,
    publicRole: publicSourcePhrase(card),
    concreteHint: compactText(card.excerpt, 120),
    topics: [...(card.keywords ?? []), ...(card.tags ?? []), ...(card.categories ?? [])].slice(0, 8).join(", "),
    caution: "Use as a concrete observation only; do not paste raw excerpt or describe retrieval/source mechanics.",
  };
}

function buildEditorialMessages(seed: string, workflow: Workflow, variationIndex: number | string, petRole: string | undefined) {
  const candidateCards = sourceCards(workflow).filter((card) => !isOffTopicTextileCard(card));
  const cards = candidateCards.slice(0, 9).map(sourceObservation);
  const deepRead = workflow.step1.report.deepReadCards.filter((card) => !isOffTopicTextileCard(card)).slice(0, 8).map(sourceObservation);
  const linkedTrails = workflow.step1.report.linkedCards.slice(0, 10).map((trail) => ({
    from: trail.via?.map((card) => card.title).join(" → ") || "",
    to: trail.card.title,
    relation: trail.relation,
    observation: compactText(trail.card.excerpt, 160),
  }));
  const topics = workflow.step3.researchTopics.slice(0, 3).map((topic) => ({
    title: topic.title,
    researchQuestion: topic.researchQuestion,
    relationPattern: topic.relationPattern,
    knowledgeSystems: topic.knowledgeSystems,
    riskCaveat: topic.riskCaveat,
  }));
  const semantic = workflow.step2.semanticContext;
  const roleInstruction = petRole === "philosopher"
    ? "偏向：探索理論頁面，製造混合理論，並把理論轉用到實務。"
    : petRole === "engineer"
      ? "偏向：輸出創新功能 prototype tutorial、BOM、材料表、發想背景與製作步驟。"
      : petRole === "scientist"
        ? "偏向：以材料研究、物質研究或生物研究論文格式，發表一篇關於不存在事物的論文。"
        : petRole === "organizer"
          ? "偏向：整理人物、地點、時間表、照護條款與可執行的本地社群協作小誌。"
          : "偏向：規劃一個融合理論、表現方式與創新形式的科技藝術計劃。";
  const user = JSON.stringify({
    seed,
    variationIndex,
    petRole,
    roleInstruction,
    seedKeywords: workflow.step1.report.keywords.slice(0, 12),
    deepReadKeywords: workflow.step1.report.deepReadKeywords.slice(0, 12),
    desiredAngles: [
      "從玩家提供的問題出發，不要套用固定的基因、聲音或科技藝術範例。",
      "優先使用 sourceObservations、deepReadObservations 與 linkedEvidenceTrails 裡真的出現的材料。",
      "把不同頁面之間的關係寫成一個具體、可製作、可印刷的小誌主題。",
    ],
    sourceObservations: cards,
    deepReadObservations: deepRead,
    linkedEvidenceTrails: linkedTrails,
    semanticContextSummary: {
      anchorCards: semantic.anchorCards.length,
      relatedCards: semantic.relatedCards.length,
      bridgeCards: semantic.bridgeCards.length,
      futureDirections: semantic.futureDirections.slice(0, 4).map((item: any) => item.topic ?? item.title ?? String(item)),
    },
    researchTopicCandidates: topics,
    reminder: "請真的依照 seedKeywords、sourceObservations、deepReadObservations 與 linkedEvidenceTrails 重寫文章，不要套固定文案，不要重複上一份小誌的題目或段落。標題與正文必須回應玩家問題中的具體詞彙；如果材料不足，就把不確定性寫成小誌中的開放問題。不要發明未提供的專有細節；不要使用後台、檢索、工作流等技術說明語。",
  }, null, 2);
  return { system: editorialSystemPrompt, user };
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(trimmed); } catch {}
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
  throw new Error(`LLM did not return parseable JSON: ${trimmed.slice(0, 500)}`);
}

function cleanLLMText(value: unknown): string {
  return String(value ?? "")
    .replace(/原始資料/g, "資料欄位")
    .replace(/關係場域/g, "關係")
    .replace(/關係場/g, "關係")
    .replace(/e-?textile/gi, "聲音介面")
    .replace(/紡織合成器/g, "聲音合成器")
    .trim();
}

function normalizeLLMArtifact(data: any): DaydreamPublicArtifactContent {
  const sections = Array.isArray(data.sections) ? data.sections.slice(0, 4) : [];
  const protocol = Array.isArray(data.protocol) ? data.protocol.slice(0, 4) : [];
  if (!data.title || !data.subtitle || !data.opening || !data.proposition || sections.length < 4 || protocol.length < 4) {
    throw new Error("LLM JSON missing required title/subtitle/opening/proposition/sections/protocol fields.");
  }
  return {
    schemaVersion: "association-public-document-v1",
    title: cleanLLMText(data.title),
    subtitle: cleanLLMText(data.subtitle),
    opening: cleanLLMText(data.opening),
    proposition: cleanLLMText(data.proposition),
    sections: sections.map((section: any, index: number) => ({
      id: String(section.id ?? `llm-section-${index + 1}`),
      title: cleanLLMText(section.title ?? `段落 ${index + 1}`),
      body: cleanLLMText(section.body ?? ""),
      ...(section.pullQuote ? { pullQuote: cleanLLMText(section.pullQuote) } : {}),
    })),
    protocol: protocol.map((item: any, index: number) => ({
      title: cleanLLMText(item.title ?? `步驟 ${index + 1}`),
      body: cleanLLMText(item.body ?? ""),
    })),
    quietCaveat: cleanLLMText(data.quietCaveat ?? ""),
    approvedForPublicLayout: true,
  };
}

function configuredProxyUrl(): string {
  return document
    .querySelector('meta[name="pbs-chat-api"], meta[name="sow-chat-api"]')
    ?.getAttribute("content")
    ?.trim() || DEFAULT_DEEPSEEK_PROXY_URL;
}

async function requestDeepSeekJson(system: string, user: string, maxTokens = 900, temperature = 0.9): Promise<any> {
  const response = await fetch(configuredProxyUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: window.location.origin || "http://localhost:5173" },
    body: JSON.stringify({
      mode: "chat",
      messages: [
        { role: "system", content: `${system}\n只輸出可被 JSON.parse 解析的 minified JSON。不要 code fence，不要註解。` },
        { role: "user", content: user },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });
  const responseText = await response.text();
  if (!response.ok) throw new Error(`DeepSeek proxy failed ${response.status}: ${responseText.slice(0, 800)}`);
  const data = JSON.parse(responseText || "{}");
  const content = data.content ?? data.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error(`DeepSeek response missing content: ${responseText.slice(0, 800)}`);
  try {
    return extractJsonObject(content);
  } catch (error) {
    if (maxTokens < 400) throw error;
    return requestDeepSeekJson(
      "你是 JSON 修復器。只把使用者提供的破損 JSON 改成可 JSON.parse 的 minified JSON；不要新增說明。",
      content.slice(0, 6000),
      500,
      0.1,
    );
  }
}

async function callDeepSeekEditorialWriter(seed: string, workflow: Workflow, variationIndex: number, petRole?: string): Promise<DaydreamPublicArtifactContent> {
  const { system, user } = buildEditorialMessages(seed, workflow, variationIndex, petRole);
  const outline = await requestDeepSeekJson(system, `${user}\n\n先只產生完整文章骨架 JSON。sections 的 body 只寫 30 字內摘要，protocol body 只寫 20 字內摘要。`, 900) as Partial<LlmArtifact>;
  const title = outline.title ?? "可演奏的基因資料";
  const subtitle = outline.subtitle ?? "讓資料視覺化、合成器表演與基因倫理在同一個原型裡相遇。";
  const opening = outline.opening ?? "";
  const proposition = outline.proposition ?? "";
  const sectionPlans: any[] = (Array.isArray(outline.sections) ? outline.sections : []).slice(0, 4);
  while (sectionPlans.length < 4) sectionPlans.push({ title: `段落 ${sectionPlans.length + 1}`, body: "" });
  const parsedUser = JSON.parse(user);
  const sections = [];
  for (let index = 0; index < 4; index += 1) {
    const plan = sectionPlans[index];
    const section = await requestDeepSeekJson(
      "你是繁體中文藝術原型寫作者。根據題目與 deep reading 材料，擴寫單一小誌段落。不要使用後台語言，不要發明 NCBI/16S/rRNA/lacZ/Phred/大腸桿菌/粒線體 DNA/p-distance；不要漂移到 e-textile/布料/穿戴/紡織；不要寫原始資料。輸出 {\"title\":\"\",\"body\":\"\",\"pullQuote\":\"\"}。",
      JSON.stringify({ seed, title, subtitle, proposition, sectionIndex: index + 1, sectionPlan: plan, sourceMaterial: parsedUser.sourceObservations, deepRead: parsedUser.deepReadObservations, linkedEvidenceTrails: parsedUser.linkedEvidenceTrails }, null, 2),
      650,
    );
    sections.push({
      id: String(section.id ?? plan.id ?? `llm-section-${index + 1}`),
      title: String(section.title ?? plan.title ?? `段落 ${index + 1}`),
      body: String(section.body ?? plan.body ?? ""),
      ...(section.pullQuote ? { pullQuote: String(section.pullQuote) } : {}),
    });
  }
  const protocolData = await requestDeepSeekJson(
    "你是藝術製作方法編輯。輸出 {\"protocol\":[{\"title\":\"\",\"body\":\"\"}],\"quietCaveat\":\"\"}，protocol 必須 4 條，每條是可操作步驟，不要後台語言。",
    JSON.stringify({ seed, title, proposition, sections: sections.map(({ title, body }) => ({ title, body: body.slice(0, 180) })) }, null, 2),
    600,
  );
  const protocol = (Array.isArray(protocolData.protocol) ? protocolData.protocol : []).slice(0, 4).map((item: any, index: number) => ({
    title: String(item.title ?? `步驟 ${index + 1}`),
    body: String(item.body ?? ""),
  }));
  while (protocol.length < 4) protocol.push({ title: `步驟 ${protocol.length + 1}`, body: "把資料、聲音與觀眾回饋重新校正。" });
  return normalizeLLMArtifact({
    title,
    subtitle,
    opening,
    proposition,
    sections,
    protocol,
    quietCaveat: protocolData.quietCaveat ?? outline.quietCaveat ?? "這份原型只處理公開資料與藝術轉譯；任何活體或基因改造操作都需要正式安全規範。",
  });
}

function repeatedSentenceReport(text: string): string[] {
  const sentences = text.split(/[。！？!?]/).map((item) => item.trim()).filter((item) => item.length >= 18);
  const seen = new Set<string>();
  const repeated: string[] = [];
  for (const sentence of sentences) {
    if (seen.has(sentence)) repeated.push(sentence);
    seen.add(sentence);
  }
  return repeated;
}

function workflowAnchorTerms(workflow: Workflow): string[] {
  const terms = [
    ...workflow.step1.report.keywords,
    ...workflow.step1.report.deepReadKeywords,
    ...sourceCards(workflow).flatMap((card) => [...(card.keywords ?? []), ...(card.tags ?? []), ...(card.categories ?? [])]),
  ].map((term) => term.trim()).filter((term) => term.length >= 2 && term.length <= 24);
  return Array.from(new Set(terms)).slice(0, 16);
}

function seedRelevancePass(text: string, workflow: Workflow): boolean {
  const compacted = text.replace(/\s+/g, "").toLowerCase();
  const anchors = workflowAnchorTerms(workflow);
  const hits = anchors.filter((anchor) => compacted.includes(anchor.replace(/\s+/g, "").toLowerCase()));
  const sourceTitles = sourceCards(workflow).map((card) => card.title).filter(Boolean).slice(0, 8);
  const titleHits = sourceTitles.filter((title) => compacted.includes(title.replace(/\s+/g, "").toLowerCase().slice(0, 12)));
  return hits.length >= Math.min(3, anchors.length) || titleHits.length >= 1;
}

function validateVisibleText(text: string, workflow: Workflow): void {
  const hits = workflowAnchorTerms(workflow).filter((anchor) => text.toLowerCase().includes(anchor.toLowerCase()));
  const repeated = repeatedSentenceReport(text);
  const failures: string[] = [];
  if (PUBLIC_FORBIDDEN.test(text)) failures.push("forbidden/process language detected");
  if (RAW_ENGLISH_EXCERPT.test(text)) failures.push("long raw English excerpt detected");
  if (/e-?textile|soft electronics|conductive thread|wearable circuits|fabric sensors/i.test(text)) failures.push("drifted to generic e-textile / soft-electronics workshop");
  if (/\b(?:NCBI|16S|rRNA|lacZ|Phred)\b|大腸桿菌|E\.?\s*coli/i.test(text)) failures.push("invented unsupported bio dataset/procedure details");
  if (workflowAnchorTerms(workflow).length > 0 && hits.length < Math.min(3, workflowAnchorTerms(workflow).length)) failures.push(`seed anchor hits too low: ${hits.join(", ")}`);
  if (!seedRelevancePass(text, workflow)) failures.push("seed relevance is too shallow");
  if (repeated.length > 0) failures.push(`repeated sentence: ${repeated[0]}`);
  if (!workflow.step1.report.linkedCards.length) failures.push("no linked traversal material");
  if (text.length < 1050) failures.push(`visible text too thin: ${text.length}`);
  if (failures.length > 0) throw new Error(`Public zine validation failed:\n- ${failures.join("\n- ")}\n\nVisible excerpt:\n${text.slice(0, 1000)}`);
}

function isHttpUrl(value: unknown): boolean {
  return /^https?:\/\//i.test(String(value ?? ""));
}

function realSourceCards(workflow: Workflow, max = 10): Card[] {
  const seen = new Set<string>();
  const result: Card[] = [];
  for (const card of sourceCards(workflow).filter((item) => isHttpUrl(item.url))) {
    const key = card.url || card.id || card.title;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(card);
    if (result.length >= max) break;
  }
  return result;
}

function renderSourceLinkSection(workflow: Workflow): string {
  const cards = realSourceCards(workflow, 10);
  if (cards.length === 0) return "";
  return `<section class="page source-link-page" data-folio="links" style="break-before:page;page-break-before:always;padding:clamp(24px,5vw,72px);background:#f8e8c0;color:#243b3d;">
    <h2>延伸查詢</h2>
    <p>下面是真實可開啟的頁面連結，可直接點開查詢。這些連結是本次文章使用到的材料，可以直接打開繼續閱讀。</p>
    <ul style="display:grid;gap:12px;padding-left:1.2em;">
      ${cards.map((card) => `<li><a href="${escapeAttr(card.url ?? "")}" target="_blank" rel="noopener noreferrer">${escapeHtml(card.title)}</a></li>`).join("")}
    </ul>
  </section>`;
}

export async function generateBrowserAssociationZine(seed: string, petRole?: string): Promise<BrowserAssociationResult> {
  const workflow = runDaydreamWorkflow(seed, daydreamCorpus);
  const variant: DaydreamHtmlLayoutVariant = "pbs-reset-title";
  const variationIndex = Date.now();
  const artifact = await callDeepSeekEditorialWriter(seed, workflow, variationIndex, petRole);
  const officialTemplate = { filename: "01-pbs-reset-title-kinetic.html", html: pbsResetTitleTemplate };
  let fragment = renderOfficialTemplateArtifactHtml(artifact, variant, officialTemplate);
  if (!fragment.includes('data-official-template="01-pbs-reset-title-kinetic.html"') || /02-soft|03-aino|soft-commons|aino-motion/i.test(fragment)) {
    throw new Error("Only the first PBS HTML zine template is allowed.");
  }
  const visibleText = extractPublicArtifactText(fragment);
  validateVisibleText(visibleText, workflow);
  fragment += renderSourceLinkSection(workflow);
  return {
    title: artifact.title,
    html: htmlPage(fragment, artifact.title),
    visibleText,
    variant,
  };
}
