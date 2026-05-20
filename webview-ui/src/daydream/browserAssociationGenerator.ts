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
const DEEPSEEK_REQUEST_TIMEOUT_MS = 9000;
const EDITORIAL_WRITER_TIMEOUT_MS = 14000;
const PUBLIC_FORBIDDEN = /\b(Daydream|Association|privateTrace|sourceTrail|relationPaths|maturityScore|workflow|debug|sourceCards|categoryGraph|corpusManifest|selectedTopic|researchTopics|outputPlan|depthScore|POTENTIAL TOPIC|source\s*trail|relation\s*paths?|generated|backend|generated question|PUBLIC ZINE|READING SCORE|local proof|reading export|guiding question|public note|template status)\b|來源卡|檢索|後台|工作流|偵錯|深度門檻|閱讀路線|關係場|生成流程|研究草圖/i;
const RAW_ENGLISH_EXCERPT = /[A-Za-z][A-Za-z,;:'’()"\-\s]{140,}[.!?]/;

export interface BrowserAssociationResult {
  title: string;
  html: string;
  visibleText: string;
  variant: DaydreamHtmlLayoutVariant;
}

export type AssociationZineLanguage = "zh-TW" | "en" | "id" | "de" | "ja" | "th";

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

function htmlLanguage(language: AssociationZineLanguage): string {
  if (language === "zh-TW") return "zh-Hant";
  if (language === "de") return "de-CH";
  return language;
}

function languageInstruction(language: AssociationZineLanguage): string {
  const labels: Record<AssociationZineLanguage, string> = {
    "zh-TW": "繁體中文",
    en: "English",
    id: "Bahasa Indonesia",
    de: "Swiss German-flavoured German / Deutsch, readable for Swiss audiences",
    ja: "日本語",
    th: "ภาษาไทย",
  };
  return `OUTPUT LANGUAGE: ${labels[language]}. The zine title, subtitle, section titles, body, protocol, caveat, and all visible reader-facing text must be written in ${labels[language]}. Do not fall back to Chinese unless OUTPUT LANGUAGE is 繁體中文.`;
}

function htmlPage(fragment: string, title: string, language: AssociationZineLanguage): string {
  return `<!doctype html><html lang="${htmlLanguage(language)}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escapeHtml(title)}</title></head><body>${fragment}</body></html>`;
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

function buildEditorialMessages(seed: string, workflow: Workflow, variationIndex: number | string, petRole: string | undefined, language: AssociationZineLanguage) {
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
  const system = `${editorialSystemPrompt}\n\n${languageInstruction(language)}\nIf any earlier instruction mentions a different output language, this OUTPUT LANGUAGE instruction wins. Keep the same JSON schema.`;
  return { system, user };
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
  if (typeof document === "undefined") return DEFAULT_DEEPSEEK_PROXY_URL;
  return document
    .querySelector('meta[name="pbs-chat-api"], meta[name="sow-chat-api"]')
    ?.getAttribute("content")
    ?.trim() || DEFAULT_DEEPSEEK_PROXY_URL;
}

function requestOrigin(): string {
  if (typeof window === "undefined") return "http://localhost:5173";
  return window.location.origin || "http://localhost:5173";
}

async function requestDeepSeekJson(system: string, user: string, maxTokens = 900, temperature = 0.9): Promise<any> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), DEEPSEEK_REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(configuredProxyUrl(), {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Origin: requestOrigin() },
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
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("DeepSeek proxy timed out; please try again.");
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
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

async function callDeepSeekEditorialWriter(seed: string, workflow: Workflow, variationIndex: number, petRole: string | undefined, language: AssociationZineLanguage): Promise<DaydreamPublicArtifactContent> {
  const { system, user } = buildEditorialMessages(seed, workflow, variationIndex, petRole, language);
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
      `${languageInstruction(language)}\nYou are an art prototype zine writer. Expand one section from the deep-reading material. Do not use backend/process language. Do not invent NCBI/16S/rRNA/lacZ/Phred/E. coli/mitochondrial DNA/p-distance details; do not drift into e-textile/fabric/wearable unless the seed asks for it. Output {\"title\":\"\",\"body\":\"\",\"pullQuote\":\"\"}.`,
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
    `${languageInstruction(language)}\nYou are an art-making protocol editor. Output {\"protocol\":[{\"title\":\"\",\"body\":\"\"}],\"quietCaveat\":\"\"}. Protocol must contain exactly 4 actionable steps and no backend/process language.`,
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

function validateVisibleText(text: string, workflow: Workflow, language: AssociationZineLanguage): void {
  const hits = workflowAnchorTerms(workflow).filter((anchor) => text.toLowerCase().includes(anchor.toLowerCase()));
  const repeated = repeatedSentenceReport(text);
  const hardFailures: string[] = [];
  const warnings: string[] = [];
  if (PUBLIC_FORBIDDEN.test(text)) hardFailures.push("forbidden/process language detected");
  if (language === "zh-TW" && RAW_ENGLISH_EXCERPT.test(text)) hardFailures.push("long raw English excerpt detected");
  if (/\b(?:NCBI|16S|rRNA|lacZ|Phred)\b|大腸桿菌|E\.?\s*coli/i.test(text)) hardFailures.push("invented unsupported bio dataset/procedure details");
  if (/e-?textile|soft electronics|conductive thread|wearable circuits|fabric sensors/i.test(text)) warnings.push("possibly drifted to generic e-textile / soft-electronics workshop");
  if (workflowAnchorTerms(workflow).length > 0 && hits.length < Math.min(2, workflowAnchorTerms(workflow).length)) warnings.push(`seed anchor hits low: ${hits.join(", ")}`);
  if (!seedRelevancePass(text, workflow)) warnings.push("seed relevance is shallow");
  if (repeated.length > 0) warnings.push(`repeated sentence: ${repeated[0]}`);
  if (!workflow.step1.report.linkedCards.length) warnings.push("no linked traversal material");
  if (text.length < 700) warnings.push(`visible text thin: ${text.length}`);
  if (warnings.length > 0) console.warn("Association zine quality warnings:", warnings.join("; "));
  if (hardFailures.length > 0) throw new Error(`Generated zine failed public safety gate: ${hardFailures.join("; ")}`);
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

function renderSourceLinkSection(workflow: Workflow, language: AssociationZineLanguage): string {
  const cards = realSourceCards(workflow, 10);
  if (cards.length === 0) return "";
  const copy: Record<AssociationZineLanguage, { title: string; body: string }> = {
    "zh-TW": { title: "延伸查詢", body: "下面是真實可開啟的頁面連結，可直接點開查詢。這些連結是本次文章使用到的材料，可以直接打開繼續閱讀。" },
    en: { title: "Further reading", body: "These are real pages used as material for this zine. Open them directly to continue reading." },
    id: { title: "Bacaan lanjutan", body: "Berikut halaman nyata yang menjadi bahan zine ini. Buka langsung untuk membaca lebih jauh." },
    de: { title: "Weiterlesen", body: "Diese echten Seiten wurden als Material für dieses Zine verwendet. Öffne sie direkt zum Weiterlesen." },
    ja: { title: "さらに読む", body: "この小誌の材料として使われた実在のページです。直接開いて読み進められます。" },
    th: { title: "อ่านต่อ", body: "นี่คือหน้าจริงที่ใช้เป็นวัตถุดิบของซีนนี้ เปิดอ่านต่อได้โดยตรง" },
  };
  const selected = copy[language];
  return `<section class="page source-link-page" data-folio="links" style="break-before:page;page-break-before:always;padding:clamp(24px,5vw,72px);background:#f8e8c0;color:#243b3d;">
    <h2>${escapeHtml(selected.title)}</h2>
    <p>${escapeHtml(selected.body)}</p>
    <ul style="display:grid;gap:12px;padding-left:1.2em;">
      ${cards.map((card) => `<li><a href="${escapeAttr(card.url ?? "")}" target="_blank" rel="noopener noreferrer">${escapeHtml(card.title)}</a></li>`).join("")}
    </ul>
  </section>`;
}

function safeWorkflowSeed(seed: string): string {
  const cleaned = seed.replace(PUBLIC_FORBIDDEN, " ").replace(/\s+/g, " ").trim();
  return `桃花源小誌：${cleaned || "共同生活與互助"}。請從共同生活、藝術科技社群、維修、互助與現場練習來回應。`;
}

function createBrowserWorkflow(seed: string): Workflow {
  try {
    return runDaydreamWorkflow(seed, daydreamCorpus);
  } catch (error) {
    console.warn("Association workflow needed a public-safe seed fallback.", error);
    try {
      return runDaydreamWorkflow(safeWorkflowSeed(seed), daydreamCorpus);
    } catch (fallbackError) {
      console.warn("Association workflow fallback needed neutral seed.", fallbackError);
      return runDaydreamWorkflow("共同生活、藝術科技社群、維修與互助的可列印小誌", daydreamCorpus);
    }
  }
}

async function withBrowserTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = globalThis.setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId);
  }
}

export async function generateBrowserAssociationZine(seed: string, petRole?: string, language: AssociationZineLanguage = "zh-TW"): Promise<BrowserAssociationResult> {
  const workflow = createBrowserWorkflow(seed);
  const variant: DaydreamHtmlLayoutVariant = "pbs-reset-title";
  const variationIndex = Date.now();
  let artifact: DaydreamPublicArtifactContent;
  try {
    artifact = await withBrowserTimeout(
      callDeepSeekEditorialWriter(seed, workflow, variationIndex, petRole, language),
      EDITORIAL_WRITER_TIMEOUT_MS,
      "Association writer timed out; please try again.",
    );
  } catch (error) {
    console.error("Association editorial writer unavailable; not rendering stale local fallback.", error);
    throw error;
  }
  const officialTemplate = { filename: "01-pbs-reset-title-kinetic.html", html: pbsResetTitleTemplate };
  let fragment: string;
  try {
    fragment = renderOfficialTemplateArtifactHtml(artifact, variant, officialTemplate);
  } catch (error) {
    console.error("Association artifact was rejected; not rendering stale local fallback.", error);
    throw error;
  }
  if (!fragment.includes('data-official-template="01-pbs-reset-title-kinetic.html"') || /02-soft|03-aino|soft-commons|aino-motion/i.test(fragment)) {
    throw new Error("Only the first PBS HTML zine template is allowed.");
  }
  const visibleText = extractPublicArtifactText(fragment);
  validateVisibleText(visibleText, workflow, language);
  fragment += renderSourceLinkSection(workflow, language);
  return {
    title: artifact.title,
    html: htmlPage(fragment, artifact.title, language),
    visibleText,
    variant,
  };
}
