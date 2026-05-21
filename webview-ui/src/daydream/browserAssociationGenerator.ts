import { assertCleanPublicArtifact, extractPublicArtifactText } from "./artifactGuard.js";
import { renderAssociationFeedbackSection } from "./associationFeedback.js";
import { daydreamCorpus } from "./corpus.js";
import { runDaydreamWorkflow } from "./daydreamWorkflow.js";
import { renderOfficialTemplateArtifactHtml } from "./officialTemplateRenderer.js";
import type { DaydreamCorpus, SourceCard } from "./engine.js";
import type { DaydreamPublicArtifactContent } from "./publicArtifactContent.js";
import type { DaydreamHtmlLayoutVariant } from "./publicArtifactHtml.js";
// @ts-ignore Vite raw prompt import from project-level editable prompt file.
import editorialSystemPrompt from "../../prompts/association-editorial-system.md?raw";
// @ts-ignore Vite raw official HTML template import.
import pbsResetTitleTemplate from "./templates/official-html/01-pbs-reset-title-kinetic.html?raw";

const DEFAULT_DEEPSEEK_PROXY_URL = "https://solar-oracle-deepseek-proxy.dontmarryme.workers.dev/chat";
const DEEPSEEK_REQUEST_TIMEOUT_MS = 60000;
const EDITORIAL_WRITER_TIMEOUT_MS = 150000;
const PUBLIC_FORBIDDEN = /\b(Daydream|Association|privateTrace|sourceTrail|relationPaths|maturityScore|workflow|debug|sourceCards|categoryGraph|corpusManifest|selectedTopic|researchTopics|outputPlan|depthScore|POTENTIAL TOPIC|source\s*trail|source\s*graph|relation\s*paths?|generated|backend|traversal|internal process|prompt|system language|generated question|PUBLIC ZINE|READING SCORE|local proof|reading export|guiding question|public note|template status)\b|來源卡|來源圖|來源圖譜|檢索|遍歷|後台|內部流程|提示詞|提示|系統語言|工作流|偵錯|深度門檻|閱讀路線|關係場|生成流程|研究草圖|プロンプト|システム言語|バックエンド|トラバーサル|graf sumber|bahasa sistem|proses internal|quellgraph|systemsprache|interner prozess|แบ็กเอนด์|พรอมป์ต์|ภาษาระบบ/i;
const RAW_ENGLISH_EXCERPT = /[A-Za-z][A-Za-z,;:'’()"\-\s]{140,}[.!?]/;

export interface BrowserAssociationResult {
  title: string;
  html: string;
  visibleText: string;
  variant: DaydreamHtmlLayoutVariant;
  requestId?: string;
  traceKey?: string;
}

export type AssociationProgressCallback = (message: string) => void;

export type AssociationZineLanguage = "zh-TW" | "en" | "id" | "de" | "ja" | "th";

type Workflow = ReturnType<typeof runDaydreamWorkflow>;
type Card = ReturnType<typeof sourceCards>[number];
type AllowedSourceFamily = "SGMK" | "Fabricademy" | "HOW TO GET WHAT YOU WANT / KOBAKANT";

const UI_ZINE_TRACE_KEY = "pbs:zine-click-traces";
const ENABLED_SOURCE_FAMILIES: AllowedSourceFamily[] = ["SGMK", "Fabricademy", "HOW TO GET WHAT YOU WANT / KOBAKANT"];
let activeDeepSeekTraceCalls: Array<{ status: string; httpStatus: number | null; durationMs: number; errorClass: string | null }> = [];
const FUTURE_MODES = ["art-making method", "theory", "scientific research method", "community theory"] as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function chooseModes(seed: string, variationIndex: number | string): string[] {
  const base = `${seed}:${variationIndex}`;
  let hash = 0;
  for (let index = 0; index < base.length; index += 1) hash = (hash * 31 + base.charCodeAt(index)) >>> 0;
  const modes = [...FUTURE_MODES];
  for (let index = modes.length - 1; index > 0; index -= 1) {
    const swap = hash % (index + 1);
    [modes[index], modes[swap]] = [modes[swap], modes[index]];
    hash = (hash / 7) >>> 0;
  }
  return modes.slice(0, 3);
}

function sourceFamily(card: Partial<SourceCard>): AllowedSourceFamily | "Hackteria" | "Other" {
  const source = String(card.source ?? "").toLowerCase();
  const text = `${card.title ?? ""} ${card.path ?? ""} ${card.url ?? ""}`.toLowerCase();
  if (source === "hackteria" || text.includes("hackteria")) return "Hackteria";
  if (source === "sgmk" || text.includes("sgmk")) return "SGMK";
  if (text.includes("fabricademy")) return "Fabricademy";
  if (source === "htgwyw" || text.includes("kobakant") || text.includes("how to get what you want")) return "HOW TO GET WHAT YOU WANT / KOBAKANT";
  return "Other";
}

function isAllowedZineCard(card: SourceCard): boolean {
  const family = sourceFamily(card);
  return family !== "Hackteria" && ENABLED_SOURCE_FAMILIES.includes(family as AllowedSourceFamily);
}

function allowedUiCorpus(): DaydreamCorpus {
  const cards = daydreamCorpus.cards.filter(isAllowedZineCard);
  const ids = new Set(cards.map((card) => card.id));
  return {
    cards,
    edges: daydreamCorpus.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)),
    manifest: daydreamCorpus.manifest,
  };
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
  if (/workshop|education|school|class|工作坊|教育/.test(text)) return "workshop";
  if (/theory|essay|concept|commons|community|理論|社群|共同/.test(text)) return "theory";
  if (/tool|method|kit|manual|documentation|方法|工具|文件/.test(text)) return "method";
  if (/performance|perform|stage|表演|展演|演出/.test(text)) return "event";
  return "practice";
}

function publicSourcePhrase(card: Partial<Card> | undefined): string {
  if (!card) return "一份社群製作與公開學習材料";
  const kind = classifyCard(card as Card);
  if (kind === "workshop") return "一份工作坊與學習材料";
  if (kind === "theory") return "一份概念與社群材料";
  if (kind === "method") return "一份工具、方法或文件材料";
  if (kind === "event") return "一段把技術放回現場的展演材料";
  return "一份社群製作與公開學習材料";
}

function isOffTopicTextileCard(card: Card): boolean {
  void card;
  return false;
}

function materialHint(text: unknown, max = 160): string {
  return compactText(text, max)
    .replace(/\bAndreas\s+Siagian\b/gi, "Lifepatch")
    .replace(/\bHackteria\b/gi, "excluded unavailable wiki");
}

function sourceObservation(card: Card) {
  const kind = classifyCard(card);
  return {
    title: card.title,
    url: card.url ?? "",
    sourceFamily: sourceFamily(card),
    kind,
    publicRole: publicSourcePhrase(card),
    concreteHint: materialHint(card.excerpt, 140),
    topics: [...(card.keywords ?? []), ...(card.tags ?? []), ...(card.categories ?? [])].slice(0, 8).join(", "),
    caution: "Use as a concrete observation only; do not paste raw excerpt or describe retrieval/source mechanics.",
  };
}

function professionSearchHints(petRole: string | undefined): string {
  const role = String(petRole ?? "").toLowerCase();
  if (/drink|酒|bar|trinker|飲み|drunk|pemabuk/.test(role)) return "party, joy, carnival, celebration, alcohol sensor, fermentation, drinking ritual, playful detector, late-night gathering";
  if (/cook|chef|廚|kitchen|料理|koki/.test(role)) return "kitchen, recipe, fermentation, hosting, food workshop, shared meal, cooking tool";
  if (/engineer|工程|fabrication|tool/.test(role)) return "prototype, circuit, sensor, calibration, hardware, fabrication, repair";
  if (/scientist|科學|research|lab/.test(role)) return "experiment, observation, lab method, field test, measurement, protocol";
  if (/philosopher|哲學|theory/.test(role)) return "theory, commons, ethics, relation, method, concept";
  if (/tailor|裁縫|sew|textile/.test(role)) return "sewing, textile, pattern, repair, wearable, fabric";
  if (/travel|旅行|route/.test(role)) return "route, field visit, map, encounter, local site";
  return "art, method, workshop, commons, tool, repair";
}

function buildEditorialMessages(seed: string, workflow: Workflow, variationIndex: number | string, petRole: string | undefined, language: AssociationZineLanguage) {
  const candidateCards = sourceCards(workflow).filter((card) => isAllowedZineCard(card) && !isOffTopicTextileCard(card));
  const cards = candidateCards.slice(0, 7).map(sourceObservation);
  const deepRead = workflow.step1.report.deepReadCards.filter((card) => !isOffTopicTextileCard(card)).slice(0, 6).map(sourceObservation);
  const linkedTrails = workflow.step1.report.linkedCards.filter((trail) => isAllowedZineCard(trail.card)).slice(0, 7).map((trail) => ({
    from: trail.via?.map((card) => card.title).join(" → ") || "",
    to: trail.card.title,
    relation: trail.relation,
    observation: materialHint(trail.card.excerpt, 160),
  }));
  const selectedModes = chooseModes(seed, variationIndex);
  const topics = workflow.step3.researchTopics.slice(0, 3).map((topic) => ({
    title: topic.title,
    researchQuestion: topic.researchQuestion,
    relationPattern: topic.relationPattern,
    knowledgeSystems: topic.knowledgeSystems,
    riskCaveat: topic.riskCaveat,
  }));
  const semantic = workflow.step2.semanticContext;
  const roleInstruction = petRole === "philosopher"
    ? "偏向：提出理論或哲學推測，並把材料轉成可討論的未來方向。"
    : petRole === "engineer"
      ? "偏向：提出可測試的方法、工具或系統方向，但只使用材料包出現的詞彙。"
      : petRole === "scientist"
        ? "偏向：提出研究方法、觀察設計或未來研究問題，但不引入材料包沒有的領域詞。"
        : petRole === "organizer"
          ? "偏向：整理人物、地點、時間表、照護條款與可執行的本地社群協作小誌。"
          : "偏向：提出一個由材料支持的未來作品、方法、工作坊或概念工具。";
  const user = JSON.stringify({
    seed,
    variationIndex,
    enabledSourceFamilies: ENABLED_SOURCE_FAMILIES,
    hackteriaExcluded: true,
    petRole,
    playerProfession: petRole ?? "artist",
    roleInstruction,
    selectedModes,
    professionSearchHints: professionSearchHints(petRole),
    seedKeywords: workflow.step1.report.keywords.slice(0, 12),
    deepReadKeywords: workflow.step1.report.deepReadKeywords.slice(0, 12),
    desiredAngles: [
      "從玩家提供的問題出發，不要套用固定題材、預設領域或上一份小誌的成功形式。",
      "先做積極簡潔的材料判讀：支持什麼、挑戰什麼、需要修正什麼。",
      "只使用 sourceObservations、deepReadObservations 與 linkedEvidenceTrails 裡真的出現的頁名、詞彙、材料與方法。",
      "如果頁面最有價值的是作品/方法清單，就直接整理成閱讀路線；不要硬寫成宏大宣言。",
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
    instruction: `Treat the player's selected profession (${petRole ?? "artist"}) as a light editorial lens, not a mandate. Use professionSearchHints only when they connect to gathered pages. Prefer precise page-based usefulness over speculative future rhetoric. Do not introduce domain vocabulary not present in the seed, profession hints, or gathered pages.`,
    reminder: "請真的依照 seedKeywords、sourceObservations、deepReadObservations 與 linkedEvidenceTrails 重寫文章；先說材料支持什麼、不支持什麼；不要套固定文案，不要重複上一份小誌的題目或段落，不要把之前設定當真律。只能使用 SGMK、Fabricademy、HOW TO GET WHAT YOU WANT / KOBAKANT 材料；Hackteria 已排除，不要引用。標題與正文必須回應玩家問題中的具體詞彙。至少兩段要提到實際頁名/作品名以及它為玩家問題提供的用途。除非 seed 明確詢問某個人，否則不要寫出人名，請改寫成組織、場域、方法或材料層級。不要引入 seed 或材料包沒有的領域詞；不要用固定框架命名；不要解釋系統如何運作；不要使用後台、檢索、工作流等技術說明語。",
  }, null, 2);
  const system = `${editorialSystemPrompt}\n\n${languageInstruction(language)}\nIf any earlier instruction mentions a different output language, this OUTPUT LANGUAGE instruction wins. Keep the same JSON schema. Do not introduce domain vocabulary unless it appears in the seed or gathered page text.`;
  return { system, user };
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "string") return extractJsonObject(parsed);
    return parsed;
  } catch {}
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const parsed = JSON.parse(trimmed.slice(start, end + 1));
    if (typeof parsed === "string") return extractJsonObject(parsed);
    return parsed;
  }
  throw new Error(`LLM did not return parseable JSON: ${trimmed.slice(0, 500)}`);
}

function cleanLLMText(value: unknown): string {
  return String(value ?? "")
    .replace(/source\s*graph/gi, "reading constellation")
    .replace(/source\s*trail/gi, "reading path")
    .replace(/sources?/gi, "materials")
    .replace(/backend/gi, "studio")
    .replace(/traversal/gi, "walk")
    .replace(/internal\s+process/gi, "shared practice")
    .replace(/system\s+language/gi, "house style")
    .replace(/prompts?/gi, "questions")
    .replace(/workflows?/gi, "rhythms")
    .replace(/Association/g, "zine")
    .replace(/HTML|CSS|JavaScript|script/gi, "page")
    .replace(/原始資料/g, "資料欄位")
    .replace(/來源圖譜/g, "閱讀星座")
    .replace(/來源圖/g, "閱讀星座")
    .replace(/來源軌跡/g, "閱讀路徑")
    .replace(/來源列表/g, "閱讀清單")
    .replace(/來源/g, "材料")
    .replace(/後台/g, "工作室")
    .replace(/內部流程/g, "共同練習")
    .replace(/提示詞/g, "問題")
    .replace(/提示/g, "問題")
    .replace(/系統語言/g, "語氣")
    .replace(/工作流/g, "節奏")
    .replace(/流程語言/g, "節奏")
    .replace(/關係場域/g, "關係")
    .replace(/關係場/g, "關係")
    .replace(/e-?textile/gi, "聲音介面")
    .replace(/\bAndreas\s+Siagian\b/gi, "Lifepatch 的在地協作脈絡")
    .replace(/固定框架詞/g, "材料詞")
    .trim();
}

function comparableText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "")
    .trim();
}

function textSimilarity(a: unknown, b: unknown): number {
  const left = comparableText(a);
  const right = comparableText(b);
  if (!left || !right) return 0;
  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  if (longer.includes(shorter.slice(0, Math.min(shorter.length, 80)))) return shorter.length / longer.length;
  const grams = new Set<string>();
  for (let index = 0; index <= shorter.length - 12; index += 6) grams.add(shorter.slice(index, index + 12));
  if (!grams.size) return left === right ? 1 : 0;
  let hits = 0;
  for (const gram of grams) {
    if (longer.includes(gram)) hits += 1;
  }
  return hits / grams.size;
}

function isTooSimilarToExisting(body: string, existingBodies: string[]): boolean {
  return existingBodies.some((existing) => textSimilarity(body, existing) >= 0.58);
}

function repeatedSectionReport(sections: Array<{ title?: string; body?: string }>): string | null {
  for (let index = 0; index < sections.length; index += 1) {
    for (let other = index + 1; other < sections.length; other += 1) {
      if (textSimilarity(sections[index]?.body ?? "", sections[other]?.body ?? "") >= 0.58) {
        return `${sections[index]?.title ?? `section ${index + 1}`} / ${sections[other]?.title ?? `section ${other + 1}`}`;
      }
    }
  }
  return null;
}

function sectionMaterialFocus(parsedUser: any, index: number): Record<string, unknown> {
  const observations = [
    ...(Array.isArray(parsedUser.sourceObservations) ? parsedUser.sourceObservations : []),
    ...(Array.isArray(parsedUser.deepReadObservations) ? parsedUser.deepReadObservations : []),
  ];
  const linked = Array.isArray(parsedUser.linkedEvidenceTrails) ? parsedUser.linkedEvidenceTrails : [];
  const observationCount = Math.max(1, observations.length);
  const linkedCount = Math.max(1, linked.length);
  return {
    primaryPages: [observations[index % observationCount], observations[(index + 2) % observationCount]].filter(Boolean),
    relationTrail: linked[index % linkedCount] ?? null,
    sectionJob: [
      "先判斷玩家問題與材料真正相合、相衝突的地方",
      "整理可點開的頁面/作品/方法清單，說明各自用途",
      "把材料轉成一個可測試的小方法或現場練習",
      "收束成下一步閱讀、比較或實作路線，保留不確定性",
    ][index],
  };
}

function normalizeLLMArtifact(data: any): DaydreamPublicArtifactContent {
  const sections = Array.isArray(data.sections) ? data.sections.slice(0, 4) : [];
  const protocol = Array.isArray(data.protocol) ? data.protocol.slice(0, 4) : [];
  if (!data.title || !data.subtitle || !data.opening || !data.proposition || sections.length < 4 || protocol.length < 4) {
    throw new Error("LLM JSON missing required title/subtitle/opening/proposition/sections/protocol fields.");
  }
  const artifact: DaydreamPublicArtifactContent = {
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
  const repeatedSections = repeatedSectionReport(artifact.sections);
  if (repeatedSections) throw new Error(`LLM JSON repeated section body: ${repeatedSections}`);
  return artifact;
}

function configuredProxyUrl(): string {
  const documentRef = (globalThis as { document?: { querySelector?: (selector: string) => { getAttribute?: (name: string) => string | null } | null } }).document;
  if (!documentRef?.querySelector) return DEFAULT_DEEPSEEK_PROXY_URL;
  return documentRef
    .querySelector('meta[name="pbs-chat-api"], meta[name="sow-chat-api"]')
    ?.getAttribute?.("content")
    ?.trim() || DEFAULT_DEEPSEEK_PROXY_URL;
}

function requestOrigin(): string {
  const windowRef = (globalThis as { window?: { location?: { origin?: string } } }).window;
  return windowRef?.location?.origin || "http://localhost:5173";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? "unknown_error");
}

function errorClass(error: unknown, fallback = "unknown_error"): string {
  const message = errorMessage(error);
  if (/DeepSeek proxy failed\s+(\d+)/i.test(message)) return `http_error_${message.match(/DeepSeek proxy failed\s+(\d+)/i)?.[1] ?? "unknown"}`;
  if (/http_error\s+(\d+)/i.test(message)) return `http_error_${message.match(/http_error\s+(\d+)/i)?.[1] ?? "unknown"}`;
  if (/JSON parse failed|parseable JSON|JSON\.parse/i.test(message)) return "json_parse_failed";
  if (/public safety gate|public artifact|forbidden|unsupported|validation/i.test(message)) return "public_validation_error";
  if (error instanceof Error && error.name) return error.name;
  return fallback;
}

async function requestDeepSeekJson(system: string, user: string, maxTokens = 900, temperature = 0.9): Promise<any> {
  const startedAt = Date.now();
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
    activeDeepSeekTraceCalls.push({ status: "failed", httpStatus: null, durationMs: Date.now() - startedAt, errorClass: error instanceof Error ? error.name : "unknown_error" });
    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError = new Error("AbortError: DeepSeek proxy timed out; please try again.");
      timeoutError.name = "AbortError";
      throw timeoutError;
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
  const responseText = await response.text();
  activeDeepSeekTraceCalls.push({ status: response.ok ? "pass" : "failed", httpStatus: response.status, durationMs: Date.now() - startedAt, errorClass: response.ok ? null : "http_error" });
  if (!response.ok) throw new Error(`http_error ${response.status}: DeepSeek proxy failed: ${responseText.slice(0, 800)}`);
  let content = responseText;
  try {
    const data = JSON.parse(responseText || "{}");
    content = data.content ?? data.choices?.[0]?.message?.content ?? responseText;
  } catch {}
  if (!content || typeof content !== "string") throw new Error(`DeepSeek response missing content: ${responseText.slice(0, 800)}`);
  try {
    return extractJsonObject(content);
  } catch (error) {
    throw new Error(`JSON parse failed: ${errorMessage(error)}`);
  }
}

async function callDeepSeekEditorialWriter(seed: string, workflow: Workflow, variationIndex: number, petRole: string | undefined, language: AssociationZineLanguage, onProgress?: AssociationProgressCallback): Promise<DaydreamPublicArtifactContent> {
  const { system, user } = buildEditorialMessages(seed, workflow, variationIndex, petRole, language);
  onProgress?.("生成 seed 與職業線索");
  const outline = await requestDeepSeekJson(
    system,
      `${user}\n\n第一批只產生封面 JSON，不要陣列：{"title":"","subtitle":"","opening":"","proposition":"","quietCaveat":""}。opening/proposition 各 90-150 字。必須直接回應 seed，並說明這批頁面實際能幫上什麼；不要寫任何人名。`,
    800,
  ) as any;
  const title = String(outline.title ?? "材料生成的未來方向");
  const subtitle = String(outline.subtitle ?? "從本次問題與本次閱讀材料重新推導。");
  const opening = String(outline.opening ?? "");
  const proposition = String(outline.proposition ?? "");
  const parsedUser = JSON.parse(user);
  const sections: DaydreamPublicArtifactContent["sections"] = [];
  for (let index = 0; index < 4; index += 1) {
    onProgress?.(["第一次搜尋頁面完成，開始料理第一章", "第二次搜尋頁面完成，開始翻炒第二章", "發現附件與材料線索，開始深讀第三章", "開始思考，收束第四章"][index]);
    const previousSections: Array<{ title: string; body: string }> = sections.map(({ title, body }) => ({ title, body: body.slice(0, 180) }));
    const requestSection = (rewrite = false): Promise<any> => requestDeepSeekJson(
      `${languageInstruction(language)}\n只生成第 ${index + 1} 章 JSON：{"id":"","title":"","body":"","pullQuote":""}。body 180-260 字。這一章必須完成 sectionFocus.sectionJob，優先使用 sectionFocus.primaryPages 與 sectionFocus.relationTrail，不要平均重複其他章。必須至少使用一個實際頁名、作品名、物件或方法；若材料不足就寫成清楚的閱讀/測試建議，不要幻想新事實。不要寫系統/流程語，不要寫任何人名。${rewrite ? "上一版和前文太像，請換用不同頁名、不同用途、不同句型重寫；不要保留相同開頭或相同結論。" : ""}`,
      JSON.stringify({
        seed,
        title,
        subtitle,
        proposition,
        sectionIndex: index + 1,
        sectionFocus: sectionMaterialFocus(parsedUser, index),
        previousSections,
        avoidRepeating: previousSections.map((previousSection) => previousSection.title),
        sourceObservations: parsedUser.sourceObservations,
        deepReadObservations: parsedUser.deepReadObservations,
        linkedEvidenceTrails: parsedUser.linkedEvidenceTrails,
      }, null, 2),
      800,
    );
    let section = await requestSection(false);
    if (isTooSimilarToExisting(String(section.body ?? ""), sections.map(({ body }) => body))) {
      section = await requestSection(true);
    }
    const nextSection = {
      id: String(section.id ?? `llm-section-${index + 1}`),
      title: String(section.title ?? `篇章 ${index + 1}`),
      body: String(section.body ?? ""),
      ...(section.pullQuote ? { pullQuote: String(section.pullQuote) } : {}),
    };
    if (isTooSimilarToExisting(nextSection.body, sections.map(({ body }) => body))) {
      throw new Error(`LLM repeated section body after rewrite: ${nextSection.title}`);
    }
    sections.push(nextSection);
  }
  const protocol = [];
  for (let index = 0; index < 4; index += 1) {
    onProgress?.(["開始生成你的小誌行動譜", "校準下一步", "加入可測試方法", "裝訂最後一頁"][index]);
    const item = await requestDeepSeekJson(
      `${languageInstruction(language)}\n只生成第 ${index + 1} 個行動步驟 JSON，不要陣列：{"title":"","body":""}。body 60-90 字。步驟要指向可做的閱讀、比較、測試或點開頁面後能確認的事；不要寫系統/流程語，不要寫任何人名。`,
      JSON.stringify({ seed, title, proposition, protocolIndex: index + 1, sections: sections.map(({ title, body }) => ({ title, body: body.slice(0, 160) })) }, null, 2),
      800,
    ) as any;
    protocol.push({ title: String(item.title ?? `步驟 ${index + 1}`), body: String(item.body ?? "") });
  }
  return normalizeLLMArtifact({
    title,
    subtitle,
    opening,
    proposition,
    sections,
    protocol,
    quietCaveat: outline.quietCaveat ?? "這份方向仍需要更多材料、實地回饋與共同校正。",
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
  if (workflowAnchorTerms(workflow).length > 0 && hits.length < Math.min(2, workflowAnchorTerms(workflow).length)) warnings.push(`seed anchor hits low: ${hits.join(", ")}`);
  if (!seedRelevancePass(text, workflow)) warnings.push("seed relevance is shallow");
  if (repeated.length > 0) warnings.push(`repeated sentence: ${repeated[0]}`);
  if (!workflow.step1.report.linkedCards.length) warnings.push("no linked traversal material");
  if (text.length < 1400) warnings.push(`visible text thin: ${text.length}`);
  if (warnings.length > 0) console.warn("Association zine quality warnings:", warnings.join("; "));
  if (hardFailures.length > 0) throw new Error(`Generated zine failed public safety gate: ${hardFailures.join("; ")}`);
}

function cardForTrace(card: Card, keywords: string[], index = 0) {
  const text = `${card.title ?? ""} ${card.excerpt ?? ""} ${(card.keywords ?? []).join(" ")}`.toLowerCase();
  const matchedKeywords = keywords.filter((keyword) => text.includes(keyword.toLowerCase()));
  return {
    title: card.title,
    sourceFamily: sourceFamily(card),
    path: card.path ?? null,
    url: card.url ?? null,
    score: Math.max(1, keywords.length - index),
    matchedKeywords,
  };
}

function articleCharacterCount(artifact: DaydreamPublicArtifactContent): number {
  return [artifact.title, artifact.subtitle, artifact.opening, artifact.proposition, ...artifact.sections.map((section) => section.body), ...artifact.protocol.map((item) => item.body), artifact.quietCaveat ?? ""].join("\n").length;
}

function persistClickTrace(trace: Record<string, unknown>): string {
  const storage = (globalThis as { localStorage?: Storage }).localStorage;
  if (!storage) return UI_ZINE_TRACE_KEY;
  let history: unknown[] = [];
  try { history = JSON.parse(storage.getItem(UI_ZINE_TRACE_KEY) || "[]"); } catch {}
  const next = Array.isArray(history) ? [...history, trace].slice(-25) : [trace];
  storage.setItem(UI_ZINE_TRACE_KEY, JSON.stringify(next));
  storage.setItem("pbs:last-zine-click-trace", JSON.stringify(trace));
  return UI_ZINE_TRACE_KEY;
}

function renderTraceList(items: any[], renderItem: (item: any) => string): string {
  if (!items.length) return "<p>None recorded.</p>";
  return `<ul>${items.map(renderItem).join("")}</ul>`;
}

function renderPageTitleLink(page: any): string {
  const title = escapeHtml(page.title ?? page.to ?? "Untitled");
  const url = String(page.url ?? "").trim();
  if (!url) return `<strong>${title}</strong>`;
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer" style="color:#111;text-decoration:underline;text-decoration-thickness:2px;"><strong>${title}</strong></a>`;
}

function renderVisibleTraceSection(trace: Record<string, any>, language: AssociationZineLanguage): string {
  const title = language === "zh-TW" ? "閱讀路徑 / 生成路徑" : "Reading Path / Generation Trace";
  const pipeline = ["seed", "seed words", "first pages", "linked pages", "second words", "deep-read pages", "material packet", "future direction", "DeepSeek article" ];
  const pageItem = (page: any) => `<li>${renderPageTitleLink(page)} <span>(${escapeHtml(page.sourceFamily ?? page.relation ?? "related")})</span><br/><small>${escapeHtml(page.url ?? page.path ?? page.reason ?? "")}</small>${page.matchedKeywords?.length ? `<br/><small>matched: ${escapeHtml(page.matchedKeywords.join(", "))}</small>` : ""}${page.whyUsed ? `<br/><small>why: ${escapeHtml(page.whyUsed)}</small>` : ""}</li>`;
  const mermaid = `graph TD\n${pipeline.map((step, index) => index < pipeline.length - 1 ? `  p${index}["${step}"] --> p${index + 1}["${pipeline[index + 1]}"]` : "").filter(Boolean).join("\n")}`;
  return `<section class="page pbs-readable-trace" data-folio="trace" style="break-before:page;page-break-before:always;padding:clamp(24px,5vw,72px);background:#f8e8c0;color:#243b3d;">
    <h2>${escapeHtml(title)}</h2>
    <p><strong>Original seed:</strong> ${escapeHtml(trace.seed ?? "")}</p>
    <p><strong>Player profession:</strong> ${escapeHtml(trace.playerProfession ?? "")}</p>
    <p><strong>Selected mode:</strong> ${escapeHtml(trace.selectedMode ?? "")}</p>
    <p><strong>DeepSeek:</strong> ${escapeHtml(trace.articleSource ?? "blocked")} / HTTP ${escapeHtml(String(trace.deepSeek?.httpStatus ?? "n/a"))}</p>
    <details open><summary>Seed-derived words</summary><p>${escapeHtml((trace.seedKeywords ?? []).join(", "))}</p></details>
    <details open><summary>First matched pages</summary>${renderTraceList(trace.matchedPages ?? [], pageItem)}</details>
    <details><summary>Words after first reading</summary><p>${escapeHtml((trace.wordsAfterFirstReading ?? trace.newKeywords ?? []).join(", "))}</p></details>
    <details><summary>Second matched pages</summary>${renderTraceList(trace.linkedPages ?? [], pageItem)}</details>
    <details><summary>Words after second reading</summary><p>${escapeHtml((trace.wordsAfterSecondReading ?? trace.newKeywords ?? []).join(", "))}</p></details>
    <details open><summary>Deep-read pages</summary>${renderTraceList(trace.deepReadPages ?? [], pageItem)}</details>
    <details><summary>All visited pages</summary>${renderTraceList([...(trace.matchedPages ?? []), ...(trace.linkedPages ?? []), ...(trace.deepReadPages ?? [])], pageItem)}</details>
    <h3>Traversal pipeline diagram</h3><pre class="mermaid">${escapeHtml(mermaid)}</pre>
    <h3>Corpus diagram</h3><pre>${escapeHtml(JSON.stringify(trace.corpusDiagramSummary ?? {}, null, 2))}</pre>
  </section>`;
}

function buildClickTrace(params: {
  requestId: string;
  seed: string;
  language: AssociationZineLanguage;
  workflow: Workflow;
  petRole?: string;
  artifact?: DaydreamPublicArtifactContent;
  visibleText?: string;
  html?: string;
  errorClass?: string;
  errorMessage?: string;
  publicValidation?: { officialTemplate1: boolean; publicSafetyPassed: boolean; forbiddenTermsFound: string[] };
}) {
  const { requestId, seed, language, workflow, petRole, artifact, visibleText, html, errorClass, errorMessage, publicValidation } = params;
  const keywords = workflow.step1.report.keywords.slice(0, 32);
  const matchedCards = workflow.step1.report.matchedCards.filter(isAllowedZineCard).slice(0, 8);
  const deepReadCards = workflow.step1.report.deepReadCards.filter(isAllowedZineCard).slice(0, 5);
  const linkedCards = workflow.step1.report.linkedCards.filter((trail) => isAllowedZineCard(trail.card)).slice(0, 7);
  const diagramNodes = 1 + keywords.slice(0, 12).length + matchedCards.slice(0, 8).length;
  const diagramEdges = keywords.slice(0, 12).length + matchedCards.slice(0, 8).reduce((sum, card) => sum + Math.min(3, cardForTrace(card, keywords).matchedKeywords.length), 0) + linkedCards.length;
  const forbiddenTermsFound = ["backend", "traversal", "source graph", "prompt", "system language", "Hackteria"]
    .filter((term) => (visibleText ?? "").toLowerCase().includes(term.toLowerCase()));
  return {
    requestId,
    seed,
    language,
    allowedSourceFamilies: ENABLED_SOURCE_FAMILIES,
    hackteriaExcluded: true,
    playerProfession: petRole ?? "artist",
    selectedModes: chooseModes(seed, requestId),
    selectedMode: chooseModes(seed, requestId)[0],
    seedKeywords: keywords,
    matchedPages: matchedCards.map((card, index) => cardForTrace(card, keywords, index)),
    linkedPages: linkedCards.map((trail) => ({ ...cardForTrace(trail.card, keywords), from: trail.via?.map((card) => card.title).join(" -> ") || seed, to: trail.card.title, relation: trail.relation, reason: `local allowed-corpus relation at depth ${trail.depth}` })),
    newKeywords: workflow.step1.report.deepReadKeywords.filter((keyword) => !keywords.includes(keyword)).slice(0, 24),
    wordsAfterFirstReading: workflow.step1.report.deepReadKeywords.slice(0, 12),
    wordsAfterSecondReading: workflow.step1.report.deepReadKeywords.filter((keyword) => !keywords.includes(keyword)).slice(0, 18),
    deepReadPages: deepReadCards.map((card) => ({ ...cardForTrace(card, keywords), extractedObservations: [compactText(card.excerpt, 260), ...(card.keywords ?? []).slice(0, 5)].filter(Boolean), whyUsed: cardForTrace(card, keywords).matchedKeywords.length ? `matched ${cardForTrace(card, keywords).matchedKeywords.join(", ")}` : `related ${sourceFamily(card)} page` })),
    corpusDiagramSummary: { nodes: diagramNodes, edges: diagramEdges },
    editorialPromptCreated: true,
    deepSeek: {
      provider: "DeepSeek via Cloudflare Worker",
      proxyUrl: configuredProxyUrl(),
      httpStatus: activeDeepSeekTraceCalls.every((call) => call.httpStatus === 200) ? 200 : activeDeepSeekTraceCalls.at(-1)?.httpStatus ?? null,
      durationMs: activeDeepSeekTraceCalls.reduce((sum, call) => sum + call.durationMs, 0),
      calls: activeDeepSeekTraceCalls,
    },
    articleSource: artifact ? "deepseek" : "blocked",
    generatedArticle: artifact ? { title: artifact.title, sectionTitles: artifact.sections.map((section) => section.title), approximateCharacterCount: articleCharacterCount(artifact), notLocalFallback: true } : null,
    publicValidation: publicValidation ?? { officialTemplate1: Boolean(html?.includes('data-official-template="01-pbs-reset-title-kinetic.html"')), publicSafetyPassed: forbiddenTermsFound.length === 0 && !errorClass, forbiddenTermsFound },
    errorClass: errorClass ?? null,
    errorMessage: errorMessage ?? null,
    artifactPath: "localStorage:pbs:last-zine-click-trace",
    createdAt: new Date().toISOString(),
  };
}

function createBrowserWorkflow(seed: string, petRole?: string): Workflow {
  const corpus = allowedUiCorpus();
  const expandedSeed = `${seed}\n\nAllowed local wiki search hints: ${professionSearchHints(petRole)}, soft circuit, textile sensor, fabric speaker, wearable sound, DIY repair, workshop, open hardware, commons, community tool, SGMK, Fabricademy, KOBAKANT.`;
  try {
    const workflow = runDaydreamWorkflow(seed, corpus);
    if (sourceCards(workflow).filter(isAllowedZineCard).length > 0) return workflow;
    return runDaydreamWorkflow(expandedSeed, corpus);
  } catch (error) {
    console.warn("Association workflow needed a public-safe seed fallback.", error);
    try {
      return runDaydreamWorkflow(expandedSeed, corpus);
    } catch (fallbackError) {
      console.warn("Association workflow fallback needed neutral seed.", fallbackError);
      return runDaydreamWorkflow("共同生活、藝術科技社群、維修與互助的可列印小誌", corpus);
    }
  }
}

async function withBrowserTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = globalThis.setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId);
  }
}

export async function generateBrowserAssociationZine(seed: string, petRole?: string, language: AssociationZineLanguage = "zh-TW", onProgress?: AssociationProgressCallback): Promise<BrowserAssociationResult> {
  const requestId = `pbs-zine-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  activeDeepSeekTraceCalls = [];
  const workflow = createBrowserWorkflow(seed, petRole);
  onProgress?.(`生成 keywords：${workflow.step1.report.keywords.slice(0, 6).join("、") || "補充職業線索"}`);
  onProgress?.(`第一次搜尋頁面：已收集 ${workflow.step1.report.matchedCards.filter(isAllowedZineCard).length} 頁`);
  onProgress?.(`第二次搜尋頁面：已收集 ${workflow.step1.report.linkedCards.filter((trail) => isAllowedZineCard(trail.card)).length} 頁`);
  onProgress?.(`深度閱讀：已收集 ${workflow.step1.report.deepReadCards.filter(isAllowedZineCard).length} 頁`);
  const variant: DaydreamHtmlLayoutVariant = "pbs-reset-title";
  const variationIndex = Date.now();
  let artifact: DaydreamPublicArtifactContent;
  try {
    artifact = await withBrowserTimeout(
      callDeepSeekEditorialWriter(seed, workflow, variationIndex, petRole, language, onProgress),
      EDITORIAL_WRITER_TIMEOUT_MS,
      "Association writer timed out; please try again.",
    );
  } catch (error) {
    console.error("Association editorial writer unavailable; not rendering stale local fallback.", error);
    persistClickTrace(buildClickTrace({ requestId, seed, language, workflow, petRole, errorClass: errorClass(error), errorMessage: errorMessage(error) }));
    throw error;
  }
  const officialTemplate = { filename: "01-pbs-reset-title-kinetic.html", html: pbsResetTitleTemplate };
  let fragment: string;
  try {
    fragment = renderOfficialTemplateArtifactHtml(artifact, variant, officialTemplate);
  } catch (error) {
    console.error("Association artifact was rejected; not rendering stale local fallback.", error);
    persistClickTrace(buildClickTrace({ requestId, seed, language, workflow, petRole, artifact, errorClass: errorClass(error, "artifact_guard_rejected"), errorMessage: errorMessage(error) }));
    throw error;
  }
  if (!fragment.includes('data-official-template="01-pbs-reset-title-kinetic.html"') || /02-soft|03-aino|soft-commons|aino-motion/i.test(fragment)) {
    throw new Error("Only the first PBS HTML zine template is allowed.");
  }
  let articleFragment = fragment;
  let articleHtml = htmlPage(articleFragment, artifact.title, language);
  let visibleText = "";
  try {
    assertCleanPublicArtifact(articleHtml);
    visibleText = extractPublicArtifactText(articleHtml);
    validateVisibleText(visibleText, workflow, language);
  } catch (error) {
    persistClickTrace(buildClickTrace({ requestId, seed, language, workflow, petRole, artifact, html: articleHtml, errorClass: "public_validation_error", errorMessage: errorMessage(error) }));
    throw error;
  }
  const forbiddenTermsFound = ["backend", "traversal", "source graph", "prompt", "system language", "Hackteria"]
    .filter((term) => visibleText.toLowerCase().includes(term.toLowerCase()));
  const trace = buildClickTrace({
    requestId,
    seed,
    language,
    workflow,
    petRole,
    artifact,
    html: articleHtml,
    visibleText,
    publicValidation: {
      officialTemplate1: articleHtml.includes('data-official-template="01-pbs-reset-title-kinetic.html"'),
      publicSafetyPassed: forbiddenTermsFound.length === 0,
      forbiddenTermsFound,
    },
  });
  const html = htmlPage(`${articleFragment}${renderVisibleTraceSection(trace, language)}${renderAssociationFeedbackSection(language, officialTemplate.filename)}`, artifact.title, language);
  persistClickTrace(trace);
  return {
    title: artifact.title,
    html,
    visibleText,
    variant,
    requestId,
    traceKey: UI_ZINE_TRACE_KEY,
  };
}
