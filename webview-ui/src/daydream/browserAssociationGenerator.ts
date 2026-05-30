import { assertCleanPublicArtifact, extractPublicArtifactText } from "./artifactGuard.js";
import { renderAssociationFeedbackSection } from "./associationFeedback.js";
import { daydreamCorpus } from "./corpus.js";
import { runDaydreamWorkflow } from "./daydreamWorkflow.js";
import { renderOfficialTemplateArtifactHtml } from "./officialTemplateRenderer.js";
import { findUnsupportedBioDetailTerms } from "./publicValidation.js";
import type { DaydreamCorpus, SourceCard } from "./engine.js";
import type { DaydreamPublicArtifactContent } from "./publicArtifactContent.js";
import type { DaydreamHtmlLayoutVariant } from "./publicArtifactHtml.js";
// @ts-ignore Vite raw prompt import from project-level editable prompt file.
import editorialSystemPrompt from "../../prompts/association-editorial-system.md?raw";
// @ts-ignore Vite raw wiki entry-note imports from the PBS Obsidian vault.
import semanticReadme from "../../../obsidian-vault/Sources/PBS Semantic Layers/README.md?raw";
// @ts-ignore Vite raw wiki entry-note imports from the PBS Obsidian vault.
import semanticConcepts from "../../../obsidian-vault/Sources/PBS Semantic Layers/Concepts.md?raw";
// @ts-ignore Vite raw wiki entry-note imports from the PBS Obsidian vault.
import semanticTools from "../../../obsidian-vault/Sources/PBS Semantic Layers/Tools.md?raw";
// @ts-ignore Vite raw wiki entry-note imports from the PBS Obsidian vault.
import semanticEvents from "../../../obsidian-vault/Sources/PBS Semantic Layers/Events.md?raw";
// @ts-ignore Vite raw wiki entry-note imports from the PBS Obsidian vault.
import entityReadme from "../../../obsidian-vault/Sources/PBS Entity Layers/README.md?raw";
// @ts-ignore Vite raw official HTML template import.
import pbsResetTitleTemplate from "./templates/official-html/01-pbs-reset-title-kinetic.html?raw";

const DEFAULT_DEEPSEEK_PROXY_URL = "https://solar-oracle-deepseek-proxy.dontmarryme.workers.dev/chat";
const DEEPSEEK_REQUEST_TIMEOUT_MS = 120000;
const EDITORIAL_WRITER_TIMEOUT_MS = 300000;
const PUBLIC_FORBIDDEN = /\b(Daydream|privateTrace|sourceTrail|relationPaths|maturityScore|workflow|debug|sourceCards|categoryGraph|corpusManifest|selectedTopic|researchTopics|outputPlan|depthScore|POTENTIAL TOPIC|source\s*trail|source\s*graph|relation\s*paths?|backend|traversal|internal process|prompt|system language|generated question|PUBLIC ZINE|READING SCORE|local proof|reading export|guiding question|public note|template status)\b|來源卡|來源圖|來源圖譜|檢索|遍歷|後台|內部流程|提示詞|提示|系統語言|工作流|偵錯|深度門檻|關係場|生成流程|研究草圖|プロンプト|システム言語|バックエンド|トラバーサル|graf sumber|bahasa sistem|proses internal|quellgraph|systemsprache|interner prozess|แบ็กเอนด์|พรอมป์ต์|ภาษาระบบ/i;
const RAW_ENGLISH_EXCERPT = /[A-Za-z][A-Za-z,;:'’()"\-\s]{140,}[.!?]/;
const EDITORIAL_PROMPT_STORAGE_KEY = "pbs:association-editorial-system-prompt:v1";

export interface BrowserAssociationResult {
  title: string;
  html: string;
  visibleText: string;
  variant: DaydreamHtmlLayoutVariant;
  requestId?: string;
  traceKey?: string;
}

export interface BrowserAssociationOptions {
  writingStyle?: string;
  repairInstruction?: string;
  repairUsefulParts?: string;
  repairUselessParts?: string;
}

export type AssociationProgressCallback = (message: string) => void;

export type AssociationZineLanguage = "zh-TW" | "en" | "id" | "de" | "ja" | "th";

type Workflow = ReturnType<typeof runDaydreamWorkflow>;
type Card = ReturnType<typeof sourceCards>[number];
type AllowedSourceFamily = "Hackteria" | "SGMK" | "Fabricademy" | "HOW TO GET WHAT YOU WANT / KOBAKANT";
type WikiEntryNote = { title: string; path: string; text: string; role: string };
type EvidenceCoverage = { label: string; covered: boolean };
type CompiledWikiNote = {
  id: string;
  title: string;
  type: string;
  status: string;
  summary: string;
  path: string;
  sourceRefs: string[];
  related: string[];
  relatedConcepts?: string[];
  relatedMethods?: string[];
  relatedMaterials?: string[];
  relatedSocialForms?: string[];
  relatedProjects?: string[];
  openQuestions: string[];
  evidence: string;
  citations: Array<{ index: string; sourceRef: string }>;
  lint: { status: "pass" | "warning" | "error"; warnings?: string[]; errors?: string[] };
  searchText: string;
};

const UI_ZINE_TRACE_KEY = "pbs:zine-click-traces";
const ENABLED_SOURCE_FAMILIES: AllowedSourceFamily[] = ["Hackteria", "SGMK", "Fabricademy", "HOW TO GET WHAT YOU WANT / KOBAKANT"];
const WIKI_ENTRY_NOTES: WikiEntryNote[] = [
  { title: "PBS Semantic Layers / README", path: "Sources/PBS Semantic Layers/README.md", text: semanticReadme, role: "semantic layer overview" },
  { title: "PBS Semantic Layers / Concepts", path: "Sources/PBS Semantic Layers/Concepts.md", text: semanticConcepts, role: "concept index" },
  { title: "PBS Semantic Layers / Tools", path: "Sources/PBS Semantic Layers/Tools.md", text: semanticTools, role: "tool and method index" },
  { title: "PBS Semantic Layers / Events", path: "Sources/PBS Semantic Layers/Events.md", text: semanticEvents, role: "event and workshop index" },
  { title: "PBS Entity Layers / README", path: "Sources/PBS Entity Layers/README.md", text: entityReadme, role: "entity bridge overview" },
  { title: "LLM Wiki / index", path: "Wiki/index.md", text: "PBS public wiki index: Home, Start Here, Association Map, Concepts, Questions, Characters and NPCs, Zines, Long Notes. Use public reading pages as orientation and semantic/entity/source layers as evidence bridges.", role: "public wiki index" },
];
let compiledWikiIndexPromise: Promise<CompiledWikiNote[]> | null = null;
const ABSTRACT_RELATION_GROUPS: Array<{ label: string; query: RegExp; evidence: RegExp }> = [
  { label: "nonprofit/organization", query: /非營利|非營利組織|組織|ngo|non-?profit|organization/i, evidence: /非營利|ngo|non-?profit|organization|organis(?:ation|e|ing)|組織/i },
  { label: "maintenance/labor", query: /維護|維修|清理|垃圾|廢棄|勞動|日常|maintenance|repair|clean(?:ing|up)|garbage|trash|waste|labor|labour/i, evidence: /維護|維修|清理|垃圾|廢棄|勞動|日常|maintenance|repair|clean(?:ing|up)|garbage|trash|waste|labor|labour/i },
  { label: "public infrastructure", query: /公共|基礎設施|common|commons|public|infrastructure/i, evidence: /公共|基礎設施|common|commons|public|infrastructure/i },
  { label: "regeneration/sustainability", query: /再生|重新啟動|持續|永續|可持續|sustainab|regenerat|reboot|restart|renew/i, evidence: /再生|重新啟動|持續|永續|可持續|sustainab|regenerat|reboot|restart|renew/i },
  { label: "cross-community comparison", query: /跨社群|比較|對照|Hackteria.*SGMK|SGMK.*Hackteria|KOBAKANT.*SGMK|SGMK.*KOBAKANT|across|compare|comparison/i, evidence: /Hackteria|SGMK|SSAM|KOBAKANT|How To Get What You Want|cross|compare|comparison|跨社群|比較|對照/i },
];
let activeDeepSeekTraceCalls: Array<{ status: string; httpStatus: number | null; durationMs: number; errorClass: string | null }> = [];

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

function articleLengthInstruction(): string {
  return "ARTICLE LENGTH: Write a compact, evidence-bound zine. There is no required page multiple and no target page count. Do not pad text for printing. Keep exactly four main sections. Opening and proposition should each be 1-2 direct sentences. Each section body should be concise: 90-170 words for Latin-script languages or 180-340 visible characters for CJK/Thai/Japanese. Each protocol body should be 35-70 words or 70-140 visible characters. If evidence is thin, shorten the article and state the gap instead of expanding with abstractions.";
}

function zinePrintCalibrationScript(): string {
  return `<script>
(() => {
  const setPrintMode = (printing) => {
    document.documentElement.toggleAttribute("data-pbs-printing", printing);
    document.querySelectorAll(".zine-feedback-page").forEach((node) => {
      if (printing) node.setAttribute("hidden", "");
      else node.removeAttribute("hidden");
    });
  };
  window.addEventListener("beforeprint", () => setPrintMode(true));
  window.addEventListener("afterprint", () => setPrintMode(false));
})();
</script>`;
}

function progressCopy(language: AssociationZineLanguage) {
  const copy: Record<AssociationZineLanguage, {
    materialClues: string;
    fallbackQuery: string;
    parseQuery: (terms: string) => string;
    entryNotes: (count: number) => string;
    matchedNotes: (count: number) => string;
    linkedNotes: (count: number) => string;
    deepRead: (count: number) => string;
    sections: string[];
    protocol: string[];
  }> = {
    "zh-TW": {
      materialClues: "解析問題與材料線索",
      fallbackQuery: "保留原始問題",
      parseQuery: (terms) => `解析查詢：${terms}`,
      entryNotes: (count) => `讀取 wiki 入口：${count} 頁`,
      matchedNotes: (count) => `觸發相關 notes：已收集 ${count} 頁`,
      linkedNotes: (count) => `追蹤 wikilinks：已收集 ${count} 頁`,
      deepRead: (count) => `證據深讀：已收集 ${count} 頁`,
      sections: ["第一次搜尋頁面完成，開始料理第一章", "第二次搜尋頁面完成，開始翻炒第二章", "發現附件與材料線索，開始深讀第三章", "開始思考，收束第四章"],
      protocol: ["開始生成你的小誌閱讀譜", "校準下一步", "加入查證問題", "裝訂最後一頁"],
    },
    en: {
      materialClues: "Reading the question and material clues",
      fallbackQuery: "keeping the original question",
      parseQuery: (terms) => `Parsing query: ${terms}`,
      entryNotes: (count) => `Reading wiki entry notes: ${count} pages`,
      matchedNotes: (count) => `Collecting related notes: ${count} pages`,
      linkedNotes: (count) => `Following wiki links: ${count} pages`,
      deepRead: (count) => `Deep-reading evidence: ${count} pages`,
      sections: ["First page search done; cooking chapter one", "Second page search done; stirring chapter two", "Attachment clues found; deep-reading chapter three", "Thinking through the argument; closing chapter four"],
      protocol: ["Writing the zine reading score", "Calibrating the next step", "Adding verification questions", "Binding the last page"],
    },
    id: {
      materialClues: "Membaca pertanyaan dan petunjuk material",
      fallbackQuery: "mempertahankan pertanyaan asli",
      parseQuery: (terms) => `Mengurai kueri: ${terms}`,
      entryNotes: (count) => `Membaca catatan masuk wiki: ${count} halaman`,
      matchedNotes: (count) => `Mengumpulkan catatan terkait: ${count} halaman`,
      linkedNotes: (count) => `Mengikuti tautan wiki: ${count} halaman`,
      deepRead: (count) => `Membaca bukti lebih dalam: ${count} halaman`,
      sections: ["Pencarian halaman pertama selesai; memasak bab satu", "Pencarian halaman kedua selesai; mengaduk bab dua", "Petunjuk lampiran ditemukan; membaca bab tiga", "Menyusun argumen; menutup bab empat"],
      protocol: ["Menulis skor baca zine", "Mengkalibrasi langkah berikutnya", "Menambahkan pertanyaan verifikasi", "Menjilid halaman terakhir"],
    },
    de: {
      materialClues: "Frage und Materialhinweise lesen",
      fallbackQuery: "Originalfrage beibehalten",
      parseQuery: (terms) => `Suchfrage analysieren: ${terms}`,
      entryNotes: (count) => `Wiki-Einstiegsnotizen lesen: ${count} Seiten`,
      matchedNotes: (count) => `Verwandte Notizen sammeln: ${count} Seiten`,
      linkedNotes: (count) => `Wiki-Links verfolgen: ${count} Seiten`,
      deepRead: (count) => `Belege vertieft lesen: ${count} Seiten`,
      sections: ["Erste Seitensuche fertig; Kapitel eins kochen", "Zweite Seitensuche fertig; Kapitel zwei ruehren", "Anhangshinweise gefunden; Kapitel drei tief lesen", "Argument ordnen; Kapitel vier abschliessen"],
      protocol: ["Zine-Lesepartitur schreiben", "Naechsten Schritt kalibrieren", "Prueffragen hinzufuegen", "Letzte Seite binden"],
    },
    ja: {
      materialClues: "問いと素材の手がかりを読んでいます",
      fallbackQuery: "元の問いを保つ",
      parseQuery: (terms) => `クエリを解析中：${terms}`,
      entryNotes: (count) => `Wiki入口ノートを読む：${count}ページ`,
      matchedNotes: (count) => `関連ノートを収集中：${count}ページ`,
      linkedNotes: (count) => `Wikiリンクをたどる：${count}ページ`,
      deepRead: (count) => `証拠を深読み：${count}ページ`,
      sections: ["最初のページ探索が完了、第1章を調理中", "2回目の探索が完了、第2章を混ぜています", "添付と素材の手がかりを発見、第3章を深読み", "考えをまとめ、第4章を閉じています"],
      protocol: ["小誌の読書譜を書いています", "次の一手を調整中", "検証の問いを追加中", "最後のページを綴じています"],
    },
    th: {
      materialClues: "อ่านคำถามและเบาะแสของวัสดุ",
      fallbackQuery: "คงคำถามเดิมไว้",
      parseQuery: (terms) => `กำลังอ่านคำค้น: ${terms}`,
      entryNotes: (count) => `อ่านหน้าเริ่มต้นของ wiki: ${count} หน้า`,
      matchedNotes: (count) => `รวบรวมโน้ตที่เกี่ยวข้อง: ${count} หน้า`,
      linkedNotes: (count) => `ตามลิงก์ wiki: ${count} หน้า`,
      deepRead: (count) => `อ่านหลักฐานเชิงลึก: ${count} หน้า`,
      sections: ["ค้นหาหน้าชุดแรกเสร็จแล้ว กำลังปรุงบทที่หนึ่ง", "ค้นหาหน้าชุดที่สองเสร็จแล้ว กำลังคนบทที่สอง", "พบเบาะแสจากไฟล์แนบและวัสดุ กำลังอ่านบทที่สาม", "กำลังคิดและสรุปบทที่สี่"],
      protocol: ["กำลังเขียนสกอร์การอ่านของซีน", "ปรับขั้นตอนถัดไป", "เพิ่มคำถามตรวจสอบ", "เย็บเล่มหน้าสุดท้าย"],
    },
  };
  return copy[language];
}

function currentEditorialSystemPrompt(): string {
  try {
    return window.localStorage.getItem(EDITORIAL_PROMPT_STORAGE_KEY) || editorialSystemPrompt;
  } catch {
    return editorialSystemPrompt;
  }
}

function htmlPage(fragment: string, title: string, language: AssociationZineLanguage): string {
  return `<!doctype html><html lang="${htmlLanguage(language)}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escapeHtml(title)}</title><style>
@page { size: A4 portrait; margin: 10mm; }
@media print {
  html, body { width: auto !important; height: auto !important; overflow: visible !important; background: #f9e9c2 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0 !important; }
  .zine-feedback-page, script, button { display: none !important; }
  html[data-pbs-printing] .zine-feedback-page, .zine-feedback-page[hidden] { display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; }
  .page { break-after: auto !important; page-break-after: auto !important; break-before: auto !important; page-break-before: auto !important; break-inside: auto !important; page-break-inside: auto !important; min-height: auto !important; height: auto !important; margin: 0 0 5mm !important; padding: 4mm !important; box-shadow: none !important; overflow: visible !important; background: #f9e9c2 !important; display: block !important; }
  .sheet { min-height: auto !important; max-width: none !important; width: 100% !important; margin: 0 !important; padding: 4.5mm !important; border: 2px solid #315b63 !important; box-shadow: 2px 2px 0 #bac3d9 !important; background: #fffaf0 !important; display: block !important; break-inside: auto !important; page-break-inside: auto !important; }
  .top { margin-bottom: 3mm !important; display: flex !important; align-items: flex-start !important; gap: 3mm !important; break-inside: avoid !important; page-break-inside: avoid !important; }
  .no, .label, .titleBlock, .body, .refs { border-color: #315b63 !important; box-shadow: none !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .no, .label { padding: 2mm 3mm !important; border-width: 1.5px !important; }
  .no { font-size: 18pt !important; line-height: 1 !important; }
  .label { flex: 1 1 auto !important; font-size: 9pt !important; line-height: 1.2 !important; letter-spacing: 0.02em !important; }
  .titleBlock, .body, .refs { background: #fffaf0 !important; break-inside: auto !important; page-break-inside: auto !important; }
  .titleBlock { break-inside: avoid !important; page-break-inside: avoid !important; }
  .titleBlock { padding: 3.5mm !important; margin-bottom: 3mm !important; }
  .body, .refs { padding: 3.5mm !important; }
  h1 { font-size: 18pt !important; line-height: 1.12 !important; overflow-wrap: anywhere !important; }
  .lead, .body, .refs { font-size: 9.2pt !important; line-height: 1.36 !important; }
  .pbs-reading-materials { --pbs-materials-font: 8.8pt; --pbs-materials-line: 1.34; --pbs-materials-row-padding: 1.6mm; }
  .pbs-reading-materials ol, .pbs-reading-materials li, .pbs-reading-materials p, .pbs-reading-materials span { font-size: var(--pbs-materials-font) !important; line-height: var(--pbs-materials-line) !important; }
  .pbs-reading-materials li { padding-top: var(--pbs-materials-row-padding) !important; padding-bottom: var(--pbs-materials-row-padding) !important; }
  html[lang="zh-Hant"] h1 { font-size: 22pt !important; line-height: 1.18 !important; }
  html[lang="zh-Hant"] .lead, html[lang="zh-Hant"] .body, html[lang="zh-Hant"] .refs { font-size: 11pt !important; line-height: 1.58 !important; }
  html[lang="zh-Hant"] .label { font-size: 10.5pt !important; line-height: 1.32 !important; }
  html[lang="th"] body, html[lang="th"] h1, html[lang="th"] h2, html[lang="th"] h3, html[lang="th"] .top, html[lang="th"] .no, html[lang="th"] .label, html[lang="th"] .lead, html[lang="th"] .body, html[lang="th"] .refs { font-family:"Thonburi","Noto Sans Thai","Tahoma",system-ui,sans-serif !important; letter-spacing:0 !important; text-transform:none !important; text-rendering:auto !important; }
  html[lang="th"] h1 { font-size: 20pt !important; line-height: 1.32 !important; }
  html[lang="th"] .lead, html[lang="th"] .body, html[lang="th"] .refs { font-size: 10.5pt !important; line-height: 1.72 !important; }
  .body p, .refs p, .refs li { orphans: 2; widows: 2; }
  a { color: inherit !important; text-decoration: none !important; }
}
</style></head><body>${fragment}${zinePrintCalibrationScript()}</body></html>`;
}

function compactText(text: unknown, max = 260): string {
  return String(text ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanReadingMaterialDescription(text: unknown): string {
  const cleaned = compactText(text, 240)
    .replace(/\b(?:Source|Excerpt|Content)\s*:\s*/gi, "")
    .replace(/\bSource:\s*https?:\/\/\S+/gi, "")
    .replace(/\(No plaintext extract returned[\s\S]*$/i, "")
    .replace(/Hackteria relationship layer Imported[\s\S]*$/i, "")
    .replace(/No internal links\/categories found[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return /\b(?:Source|Excerpt|Content|No plaintext extract returned|Imported|internal links\/categories)\b/i.test(cleaned)
    ? ""
    : cleaned;
}

function sourceFamily(card: Partial<SourceCard>): AllowedSourceFamily | "Other" {
  const source = String(card.source ?? "").toLowerCase();
  const text = `${card.title ?? ""} ${card.path ?? ""} ${card.url ?? ""}`.toLowerCase();
  if (source === "sgmk" || text.includes("sgmk")) return "SGMK";
  if (source.includes("pbs llm wiki") || text.includes("pbs semantic layers") || text.includes("pbs entity layers") || text.includes("wiki/index")) return "Other";
  if (source === "hackteria" || text.includes("hackteria")) return "Hackteria";
  if (text.includes("fabricademy")) return "Fabricademy";
  if (source === "htgwyw" || text.includes("kobakant") || text.includes("how to get what you want")) return "HOW TO GET WHAT YOU WANT / KOBAKANT";
  return "Other";
}

function isAllowedZineCard(card: SourceCard): boolean {
  if (isWikiEntryCard(card)) return true;
  const family = sourceFamily(card);
  return ENABLED_SOURCE_FAMILIES.includes(family as AllowedSourceFamily);
}

function githubVaultUrl(path: string): string {
  return `https://github.com/weiweiweiopen/peach-blossom-spring/blob/main/obsidian-vault/${encodeURI(path)}`;
}

function linkForCard(card: Partial<SourceCard>): string {
  if (card.url) return card.url;
  if (card.path) return githubVaultUrl(card.path);
  return "";
}

function regexEscape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function linkKnownPageNames(html: string, workflow: Workflow): string {
  const candidates = [
    ...entryNoteCards(),
    ...workflow.step1.evidenceCards,
    ...workflow.step1.report.matchedCards,
    ...workflow.step1.report.expandedCards,
    ...workflow.step1.report.deepReadCards,
    ...workflow.step1.report.linkedCards.map((trail) => trail.card),
  ];
  const targets = new Map<string, string>();
  for (const card of candidates) {
    const title = String(card.title ?? "").trim();
    const url = linkForCard(card);
    if (title.length < 4 || !url) continue;
    targets.set(title, url);
  }
  const sortedTargets = Array.from(targets.entries()).sort((a, b) => b[0].length - a[0].length).slice(0, 80);
  const replaceInText = (text: string) => sortedTargets.reduce((current, [title, url]) => {
    const escapedTitle = escapeHtml(title);
    const pattern = new RegExp(`(?<![\\w/])${regexEscape(escapedTitle)}(?![\\w/])`, "gu");
    return current.replace(pattern, `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer" style="color:inherit;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px;">${escapedTitle}</a>`);
  }, text);
  return html.split(/(<[^>]+>)/g).map((part) => part.startsWith("<") ? part : replaceInText(part)).join("");
}

function isWikiEntryCard(card: Partial<SourceCard>): boolean {
  return String(card.source ?? "").includes("PBS LLM Wiki") || WIKI_ENTRY_NOTES.some((note) => card.path === note.path);
}

function entryNoteCards(): SourceCard[] {
  return WIKI_ENTRY_NOTES.map((note) => ({
    id: `pbs-entry:${note.path}`,
    title: note.title,
    excerpt: compactText(note.text, 1200),
    keywords: Array.from(new Set([note.role, ...extractEntryTerms(note.text)])),
    tags: ["pbs-llm-wiki", "entry-note", note.role],
    outgoingLinks: extractWikiLinks(note.text),
    source: "PBS LLM Wiki Entry",
    path: note.path,
    semanticLayer: note.role,
  }));
}

function extractWikiLinks(text: string): string[] {
  return Array.from(text.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g))
    .map((match) => match[1]?.trim())
    .filter((value): value is string => Boolean(value));
}

function extractEntryTerms(text: string): string[] {
  return Array.from(new Set((text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}-]{2,}/gu) ?? [])
    .filter((term) => !/^(and|the|for|with|from|that|this|into|layer|layers|source|sources|wiki|readme)$/.test(term))))
    .slice(0, 80);
}

function allowedUiCorpus(): DaydreamCorpus {
  const cards = [...entryNoteCards(), ...daydreamCorpus.cards.filter(isAllowedZineCard)];
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

async function loadCompiledWikiIndex(): Promise<CompiledWikiNote[]> {
  if (!compiledWikiIndexPromise) {
    const base = import.meta.env.BASE_URL || "/";
    const url = `${base.replace(/\/$/, "")}/assets/pbs-wiki-index.json`;
    compiledWikiIndexPromise = fetch(url, { cache: "no-cache" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`compiled wiki index unavailable: ${response.status.toString()}`);
        const payload = await response.json() as { notes?: CompiledWikiNote[] };
        return (payload.notes ?? []).filter((note) => note.lint?.status !== "error" && (note.sourceRefs?.length ?? 0) > 0);
      })
      .catch((error) => {
        console.warn("Compiled Wiki index unavailable for zine RAG; continuing with sourceCards only.", error);
        return [];
      });
  }
  return compiledWikiIndexPromise;
}

function rankCompiledWikiNotes(query: string, workflow: Workflow, notes: CompiledWikiNote[]): CompiledWikiNote[] {
  const terms = Array.from(new Set([
    ...query.toLowerCase().split(/[^\p{L}\p{N}]+/u),
    ...workflow.step1.report.keywords,
    ...workflow.step1.report.deepReadKeywords,
  ].map((term) => term.trim().toLowerCase()).filter((term) => term.length >= 2)));
  const cardText = sourceCards(workflow).map((card) => evidenceText(card).toLowerCase()).join("\n");
  return notes
    .map((note) => {
      const search = `${note.title} ${note.type} ${note.summary} ${note.searchText} ${note.related.join(" ")}`.toLowerCase();
      const termHits = terms.filter((term) => search.includes(term)).length;
      const sourceRefHits = note.sourceRefs.filter((ref) => cardText.includes(ref.replace(/^obsidian-vault\//, "").toLowerCase()) || cardText.includes(ref.toLowerCase())).length;
      const lintBonus = note.lint.status === "pass" ? 2 : 0;
      return { note, score: termHits + sourceRefHits * 3 + lintBonus };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.note.title.localeCompare(b.note.title))
    .slice(0, 4)
    .map((row) => row.note);
}

function evidenceText(card: Partial<SourceCard>): string {
  return [
    card.title,
    card.excerpt,
    card.source,
    card.path,
    card.url,
    ...(card.keywords ?? []),
    ...(card.tags ?? []),
    ...(card.categories ?? []),
  ].join(" ");
}

function meaningfulEvidenceCards(workflow: Workflow): SourceCard[] {
  const report = workflow.step1.report;
  const seen = new Set<string>();
  const cards = [
    ...report.matchedCards,
    ...report.deepReadCards,
    ...report.linkedCards.map((trail) => trail.card),
  ].filter((card) => isAllowedZineCard(card) && !isWikiEntryCard(card));
  return cards.filter((card) => {
    const key = card.id || card.url || card.path || card.title;
    if (seen.has(key)) return false;
    seen.add(key);
    const text = evidenceText(card);
    return text.length >= 180 && !/No plaintext extract returned|mostly media\/table markup/i.test(text);
  });
}

function sourceEvidenceStrength(card: Partial<SourceCard>): number {
  const text = evidenceText(card);
  if (/No plaintext extract returned|mostly media\/table markup|There is currently no text in this page/i.test(text)) return -24;
  return Math.min(24, Math.floor(String(card.excerpt ?? "").replace(/\s+/g, " ").trim().length / 60));
}

function evidenceCoverageForQuery(query: string, workflow: Workflow): EvidenceCoverage[] {
  const cards = meaningfulEvidenceCards(workflow);
  return ABSTRACT_RELATION_GROUPS
    .filter((group) => group.query.test(query))
    .map((group) => ({
      label: group.label,
      covered: cards.some((card) => group.evidence.test(evidenceText(card))),
    }));
}

function asksForSynthesis(query: string): boolean {
  return /說明|論述|分析|如何|為何|透過|從.+尋找|支持.*論點|explain|argue|analy[sz]e|through|how|why|support.*claim/i.test(query);
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
    .replace(/\bAndreas\s+Siagian\b/gi, "Lifepatch");
}

function sourceObservation(card: Card) {
  const kind = classifyCard(card);
  return {
    title: card.title,
    url: card.url ?? "",
    sourceFamily: sourceFamily(card),
    kind,
    publicRole: publicSourcePhrase(card),
    concreteHint: materialHint(card.excerpt, 100),
    topics: [...(card.keywords ?? []), ...(card.tags ?? []), ...(card.categories ?? [])].slice(0, 5).join(", "),
    caution: "Use as a concrete observation only; do not paste raw excerpt or describe retrieval/source mechanics.",
  };
}

function wantsMakingTutorial(query: string): boolean {
  return /\b(how\s+to\s+make|how\s+to\s+build|make|build|fabricate|prototype|tutorial|toolkit|bom|materials?\s+list|step-by-step)\b|做一個|製作|如何做|怎麼做|打造|原型|教學|工具包|材料清單|步驟/i.test(query);
}

function compiledWikiPromptNotes(notes: CompiledWikiNote[]) {
  return notes.map((note) => ({
    title: note.title,
    type: note.type,
    status: note.status,
    path: note.path,
    summary: compactText(note.summary, 280),
    related: note.related.slice(0, 6),
    relatedConcepts: note.relatedConcepts?.slice(0, 6) ?? [],
    relatedMethods: note.relatedMethods?.slice(0, 6) ?? [],
    relatedMaterials: note.relatedMaterials?.slice(0, 6) ?? [],
    relatedSocialForms: note.relatedSocialForms?.slice(0, 6) ?? [],
    relatedProjects: note.relatedProjects?.slice(0, 6) ?? [],
    sourceRefs: note.sourceRefs.slice(0, 6),
    citations: note.citations.slice(0, 6),
    evidence: compactText(note.evidence, 500),
    lintStatus: note.lint.status,
    lintWarnings: note.lint.warnings?.slice(0, 3) ?? [],
  }));
}

function buildEditorialMessages(query: string, workflow: Workflow, language: AssociationZineLanguage, compiledNotes: CompiledWikiNote[] = []) {
  const wantsSgmk = wantsSgmkQuery(query);
  const wantsSoundDiy = wantsSoundDiyQuery(query);
  const sourcePriority = (card: Partial<SourceCard>) => {
    const family = sourceFamily(card);
    if (wantsSgmk && family === "SGMK") return 40;
    if (wantsSoundDiy && family === "HOW TO GET WHAT YOU WANT / KOBAKANT") return 32;
    if (wantsSoundDiy && family === "Hackteria") return 28;
    return 0;
  };
  const rankForPrompt = <T extends Card>(items: T[]) => [...items]
    .sort((a, b) => sourcePriority(b) + sourceEvidenceStrength(b) - (sourcePriority(a) + sourceEvidenceStrength(a)) || a.title.localeCompare(b.title));
  const candidateCards = rankForPrompt(sourceCards(workflow).filter((card) => isAllowedZineCard(card) && !isOffTopicTextileCard(card)));
  const cards = candidateCards.slice(0, 5).map(sourceObservation);
  const deepRead = rankForPrompt(workflow.step1.report.deepReadCards.filter((card) => !isOffTopicTextileCard(card))).slice(0, 4).map(sourceObservation);
  const linkedTrails = [...workflow.step1.report.linkedCards]
    .filter((trail) => isAllowedZineCard(trail.card))
    .sort((a, b) => sourcePriority(b.card) + sourceEvidenceStrength(b.card) - (sourcePriority(a.card) + sourceEvidenceStrength(a.card)))
    .slice(0, 4)
    .map((trail) => ({
    from: trail.via?.map((card) => card.title).join(" → ") || "",
    to: trail.card.title,
    relation: trail.relation,
    observation: materialHint(trail.card.excerpt, 100),
  }));
  const topics = workflow.step3.researchTopics.slice(0, 3).map((topic) => ({
    title: topic.title,
    researchQuestion: topic.researchQuestion,
    relationPattern: topic.relationPattern,
    knowledgeSystems: topic.knowledgeSystems,
    riskCaveat: topic.riskCaveat,
  }));
  const semantic = workflow.step2.semanticContext;
  const user = JSON.stringify({
    query,
    legacySeed: query,
    enabledSourceFamilies: ENABLED_SOURCE_FAMILIES,
    hackteriaExcluded: false,
    wantsMakingTutorial: wantsMakingTutorial(query),
    searchTerms: workflow.step1.report.keywords.slice(0, 8),
    deepReadKeywords: workflow.step1.report.deepReadKeywords.slice(0, 8),
    desiredAngles: [
      "從玩家提供的問題出發，不要套用固定題材、預設領域或上一份小誌的成功形式。",
      "全文只服務同一個中心問題：先判斷材料揭露了什麼未被注意的事實、關係或矛盾，再用它組成一條連貫論點。",
      "把小誌寫成研討會短文：支持、反對、限制與未來研究方向都要清楚，不要填充漂亮句子。",
      "只使用 sourceObservations、deepReadObservations 與 linkedEvidenceTrails 裡真的出現的頁名、詞彙、材料與方法。",
      "如果頁面最有價值的是作品/方法清單，就直接整理成閱讀判讀；不要硬寫成宏大宣言。",
      "除非 wantsMakingTutorial=true，不要把文章寫成工具製作、教學步驟、BOM 或工作坊流程。",
    ],
    sourceObservations: cards,
    deepReadObservations: deepRead,
    linkedEvidenceTrails: linkedTrails,
    compiledWikiNotes: compiledWikiPromptNotes(compiledNotes),
    semanticContextSummary: {
      anchorCards: semantic.anchorCards.length,
      relatedCards: semantic.relatedCards.length,
      bridgeCards: semantic.bridgeCards.length,
      futureDirections: semantic.futureDirections.slice(0, 4).map((item: any) => item.topic ?? item.title ?? String(item)),
    },
    evidenceCoverage: evidenceCoverageForQuery(query, workflow),
    researchTopicCandidates: topics,
    instruction: "The query is the only editorial parameter. Evidence may support, contest, complicate, or limit the answer, but it must not redirect the article to a different topic. If the materials do not directly support the requested relation, say that the evidence is insufficient and turn the piece into verification questions instead of a thesis. Prefer compiledWikiNotes when they are relevant because they already summarize sourceRefs and citations, but do not use notes with weak lint warnings as final proof without caveats. Write one coherent research-seminar zine around source-grounded insight and one future research direction only when the evidence supports that direction.",
    reminder: "請真的依照 query、searchTerms、sourceObservations、deepReadObservations、linkedEvidenceTrails、compiledWikiNotes 與 evidenceCoverage 重寫文章；先說材料支持什麼、不支持什麼。compiledWikiNotes 是已整理的 Wiki 筆記，使用其中的具體 claim 時必須保留它的 sourceRefs/citations 作為判讀依據；lintStatus=warning 的 note 只能作為待查證方向，不可寫成定論。只有 evidenceCoverage.covered=true 的關係可以寫成論點；covered=false 的關係必須明確承認「沒有找到足夠的證據」，不得把單一頁面硬擴張成非營利、公共基礎設施、再生、長期運作等宏大結論。不要套固定文案，不要重複上一份小誌的題目或段落，不要把之前設定當真律。材料可以來自 compiled Wiki notes、PBS semantic/entity entry notes 與 Hackteria、SGMK、Fabricademy、HOW TO GET WHAT YOU WANT / KOBAKANT 材料；仍必須由 query 與 retrieval evidence 支持，不要憑空引用。標題、開頭、每章與 protocol 都必須回應玩家問題中的具體詞彙，並共同推進同一個中心論點。至少兩段要提到實際頁名/作品名以及它為玩家問題提供的用途。除非 query 明確詢問某位人物，否則不要寫出人名，請改寫成組織、場域、方法或材料層級。不要引入 query 或材料包沒有的領域詞；不要用固定框架命名；不要解釋系統如何運作；不要使用後台、檢索、工作流等技術說明語。",
  }, null, 2);
  const system = `${currentEditorialSystemPrompt()}\n\n${languageInstruction(language)}\nIf any earlier instruction mentions a different output language, this OUTPUT LANGUAGE instruction wins. Keep the same JSON schema. Do not introduce domain vocabulary unless it appears in the player query or gathered page text.`;
  return { system, user };
}

function withWritingStyle(user: string, options: BrowserAssociationOptions = {}): string {
  const writingStyle = options.writingStyle;
  const style = compactText(writingStyle, 700);
  const parsed = JSON.parse(user) as Record<string, unknown>;
  if (style) {
    parsed.npcWritingStyle = style;
    parsed.instruction = `${String(parsed.instruction ?? "")} If npcWritingStyle is present, adapt cadence, emphasis, examples, and metaphors to that NPC transcript voice while still using public wiki evidence and the same four section jobs.`;
  }
  const useful = compactText(options.repairUsefulParts, 900);
  const useless = compactText(options.repairUselessParts, 900);
  const repair = compactText(options.repairInstruction, 1200);
  if (useful || useless || repair) {
    parsed.humanRepairReview = {
      usefulParts: useful,
      uselessOrMisleadingParts: useless,
      requestedRepair: repair,
      rule: "Regenerate a better public zine using this human review only as editorial guidance. Preserve the same evidence gate, four-section structure, citations/source grounding, and insufficient-evidence caveats. Do not add any claim just because the reviewer requested it; use the review to remove weak parts, sharpen useful parts, and ask clearer verification questions.",
    };
    parsed.instruction = `${String(parsed.instruction ?? "")} This is a repair pass. Prioritize humanRepairReview: keep the useful parts if evidence supports them; remove or rewrite useless, misleading, repetitive, or under-evidenced parts; answer requestedRepair only within retrieved evidence. If the requested repair lacks evidence, explicitly say there is not enough evidence instead of inventing support.`;
  }
  return JSON.stringify(parsed, null, 2);
}

function assertEnoughRelevantMaterial(workflow: Workflow): void {
  const report = workflow.step1.report;
  const allowedMatched = report.matchedCards.filter(isAllowedZineCard).length;
  const allowedLinked = report.linkedCards.filter((trail) => isAllowedZineCard(trail.card)).length;
  const allowedDeep = report.deepReadCards.filter(isAllowedZineCard).length;
  const depthScore = report.depthMetrics.depthScore;
  const enough = allowedMatched >= 2 && (allowedDeep >= 1 || allowedLinked >= 2) && depthScore >= 35;
  if (enough) return;
  const error = new Error(`low_relevance_zine: matched ${allowedMatched}, linked ${allowedLinked}, deep-read ${allowedDeep}, depth ${depthScore}`);
  error.name = "LowRelevanceZineError";
  throw error;
}

function assertEnoughEvidenceForClaim(query: string, workflow: Workflow): void {
  const coverage = evidenceCoverageForQuery(query, workflow);
  if (!asksForSynthesis(query) || coverage.length < 2) return;
  const unsupported = coverage.filter((item) => !item.covered);
  const meaningfulCards = meaningfulEvidenceCards(workflow);
  const distinctFamilies = new Set(meaningfulCards.map(sourceFamily)).size;
  const allowedUnsupported = coverage.length >= 4 ? 1 : 0;
  const failsCoverage = unsupported.length > allowedUnsupported;
  const failsBreadth = coverage.length >= 3 && (meaningfulCards.length < 3 || distinctFamilies < 2);
  if (!failsCoverage && !failsBreadth) return;
  const message = `insufficient_evidence_zine: 沒有找到足夠的證據支持這個綜合論點。unsupported=${unsupported.map((item) => item.label).join(", ") || "none"}; meaningfulPages=${meaningfulCards.length}; sourceFamilies=${distinctFamilies}`;
  const error = new Error(message);
  error.name = "LowRelevanceZineError";
  throw error;
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
    .replace(/PBS\s+Daydream\s+corpus/gi, "Peach Blossom Spring shared memory")
    .replace(/Daydream\s+corpus/gi, "shared memory collection")
    .replace(/\bDaydream\b/gi, "shared memory")
    .replace(/PBS\s+Semantic\s+Layers\s*\/\s*Tools/gi, "community notes on tools")
    .replace(/Semantic\s+Layers\s*\/\s*Tools/gi, "tool notes")
    .replace(/PBS\s+Semantic\s+Layers/gi, "community theme notes")
    .replace(/Semantic\s+Layers/gi, "theme notes")
    .replace(/PBS\s+Entity\s+Layers/gi, "community entity notes")
    .replace(/Entity\s+Layers/gi, "entity notes")
    .replace(/\bcorpus\b/gi, "collection")
    .replace(/Association/g, "zine")
    .replace(/HTML|CSS|JavaScript|script/gi, "page")
    .replace(/原始資料/g, "資料欄位")
    .replace(/來源圖譜/g, "閱讀星座")
    .replace(/來源圖/g, "閱讀星座")
    .replace(/來源軌跡/g, "閱讀路徑")
    .replace(/來源列表/g, "閱讀清單")
    .replace(/來源/g, "材料")
    .replace(/檢索/g, "查找")
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
      "界定玩家問題：材料能回答什麼，哪裡仍模糊",
      "提出最強支持證據：頁面/作品/方法如何推進論點",
      "提出限制、反例或不相合之處：避免把材料硬湊成結論",
      "提出未來研究方向：可比較、可查證、可延伸的下一個問題",
    ][index],
  };
}

function normalizeLLMArtifact(data: any): DaydreamPublicArtifactContent {
  const sections = Array.isArray(data.sections) ? data.sections.slice(0, 4) : [];
  const protocol = Array.isArray(data.protocol) ? data.protocol.slice(0, 4) : [];
  if (!data.title || !data.subtitle || !data.opening || !data.proposition || sections.length < 4 || protocol.length < 4) {
    throw new Error("LLM JSON missing required title/subtitle/opening/proposition/sections/protocol fields.");
  }
  const missingSection = sections.find((section: any) => !String(section?.id ?? "").trim() || !String(section?.title ?? "").trim() || !String(section?.body ?? "").trim());
  if (missingSection) throw new Error("LLM JSON missing required section id/title/body fields.");
  const artifact: DaydreamPublicArtifactContent = {
    schemaVersion: "association-public-document-v1",
    title: cleanLLMText(data.title),
    subtitle: cleanLLMText(data.subtitle),
    opening: cleanLLMText(data.opening),
    proposition: cleanLLMText(data.proposition),
    sections: sections.map((section: any) => ({
      id: String(section.id),
      title: cleanLLMText(section.title),
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
  if (repeatedSections) console.warn(`Association zine repeated section warning: ${repeatedSections}`);
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
  if (error instanceof Error && error.name === "LowRelevanceZineError") return "low_relevance_zine";
  if (/low_relevance_zine|insufficient_evidence_zine|not enough relevant|沒有找到足夠的證據/i.test(message)) return "low_relevance_zine";
  if (/DeepSeek proxy failed\s+(\d+)/i.test(message)) return `http_error_${message.match(/DeepSeek proxy failed\s+(\d+)/i)?.[1] ?? "unknown"}`;
  if (/http_error\s+(\d+)/i.test(message)) return `http_error_${message.match(/http_error\s+(\d+)/i)?.[1] ?? "unknown"}`;
  if (/JSON parse failed|parseable JSON|JSON\.parse/i.test(message)) return "json_parse_failed";
  if (/public safety gate|public artifact|forbidden|unsupported|validation/i.test(message)) return "public_validation_error";
  if (error instanceof Error && error.name) return error.name;
  return fallback;
}

function isMessageTooLongError(error: unknown): boolean {
  return /http_error\s*400|http_error_400|Message content is too long/i.test(errorMessage(error));
}

function compactRequestUser(user: string): string {
  try {
    const parsed = JSON.parse(user) as any;
    parsed.sourceObservations = Array.isArray(parsed.sourceObservations) ? parsed.sourceObservations.slice(0, 4) : [];
    parsed.deepReadObservations = Array.isArray(parsed.deepReadObservations) ? parsed.deepReadObservations.slice(0, 3) : [];
    parsed.linkedEvidenceTrails = Array.isArray(parsed.linkedEvidenceTrails) ? parsed.linkedEvidenceTrails.slice(0, 3) : [];
    parsed.compiledWikiNotes = Array.isArray(parsed.compiledWikiNotes)
      ? parsed.compiledWikiNotes.slice(0, 3).map((note: any) => ({
        title: compactText(note.title, 100),
        type: note.type,
        summary: compactText(note.summary, 180),
        relatedConcepts: Array.isArray(note.relatedConcepts) ? note.relatedConcepts.slice(0, 3) : [],
        relatedMethods: Array.isArray(note.relatedMethods) ? note.relatedMethods.slice(0, 3) : [],
        relatedSocialForms: Array.isArray(note.relatedSocialForms) ? note.relatedSocialForms.slice(0, 3) : [],
        relatedProjects: Array.isArray(note.relatedProjects) ? note.relatedProjects.slice(0, 3) : [],
        sourceRefs: Array.isArray(note.sourceRefs) ? note.sourceRefs.slice(0, 3) : [],
        evidence: compactText(note.evidence, 220),
        lintStatus: note.lintStatus,
      }))
      : [];
    parsed.researchTopicCandidates = Array.isArray(parsed.researchTopicCandidates) ? parsed.researchTopicCandidates.slice(0, 2) : [];
    parsed.npcWritingStyle = compactText(parsed.npcWritingStyle, 360);
    parsed.reminder = compactText(parsed.reminder, 520);
    return JSON.stringify(parsed);
  } catch {
    return compactText(user, 5000);
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || /AbortError|timed out/i.test(error.message));
}

function isJsonParseError(error: unknown): boolean {
  return errorClass(error) === "json_parse_failed";
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
    content = data.answer
      ?? data.content
      ?? data.choices?.[0]?.message?.content
      ?? data.raw?.choices?.[0]?.message?.content
      ?? responseText;
  } catch {}
  if (!content || typeof content !== "string") throw new Error(`DeepSeek response missing content: ${responseText.slice(0, 800)}`);
  try {
    return extractJsonObject(content);
  } catch (error) {
    throw new Error(`JSON parse failed: ${errorMessage(error)}`);
  }
}

async function requestDeepSeekJsonWithRetry(system: string, user: string, maxTokens = 900, temperature = 0.9): Promise<any> {
  try {
    return await requestDeepSeekJson(system, user, maxTokens, temperature);
  } catch (error) {
    if (isAbortError(error)) {
      console.warn("DeepSeek JSON request timed out; retrying once.");
      return requestDeepSeekJson(system, user, maxTokens, Math.max(0.55, temperature - 0.15));
    }
    if (isJsonParseError(error)) {
      console.warn("DeepSeek JSON response was malformed; retrying once with stricter JSON instructions.");
      return requestDeepSeekJson(
        `${system}\nYour previous answer was malformed or truncated. Return one complete JSON object only, with every string closed and escaped.`,
        `${user}\n\nJSON RETRY: complete the object within the token budget. Do not stop mid-string.`,
        maxTokens,
        Math.max(0.45, temperature - 0.25),
      );
    }
    if (isMessageTooLongError(error)) {
      console.warn("DeepSeek request was too long; retrying once with compact evidence packet.");
      const compactUser = compactRequestUser(user);
      try {
        return await requestDeepSeekJson(system, compactUser, maxTokens, Math.max(0.45, temperature - 0.2));
      } catch (compactError) {
        if (!isJsonParseError(compactError)) throw compactError;
        console.warn("Compact DeepSeek JSON response was malformed; retrying once with strict compact JSON instructions.");
        return requestDeepSeekJson(
          `${system}\nYour previous compact answer was malformed or truncated. Return exactly one complete JSON object, no prose, no code fence.`,
          `${compactUser}\n\nSTRICT COMPACT JSON RETRY: close every string and array. Prefer shorter values over truncation.`,
          maxTokens,
          Math.max(0.35, temperature - 0.35),
        );
      }
    }
    throw error;
  }
}

function sourceTitle(value: any): string {
  return compactText(value?.title ?? value?.card?.title ?? value?.id ?? value?.card?.id ?? "reading material", 80);
}

function sourceExcerpt(value: any): string {
  return compactText(value?.excerpt ?? value?.card?.excerpt ?? value?.description ?? "", 220);
}

function fallbackSection(query: string, parsedUser: any, index: number, language: AssociationZineLanguage) {
  const focus = sectionMaterialFocus(parsedUser, index) as any;
  const primary = Array.isArray(focus.primaryPages) ? focus.primaryPages : [];
  const firstTitle = sourceTitle(primary[0]);
  const secondTitle = sourceTitle(primary[1]);
  const firstExcerpt = sourceExcerpt(primary[0]);
  const secondExcerpt = sourceExcerpt(primary[1]);
  const job = String(focus.sectionJob ?? "read the materials");
  const compactQuery = compactText(query, 120);
  const copy: Record<AssociationZineLanguage, { title: string; body: string; pullQuote: string }> = {
    "zh-TW": {
      title: `${firstTitle} 與問題的可查證線索`,
      body: `這一章先把「${compactQuery}」放回可查證材料，而不是把材料硬湊成結論。${firstTitle} 提供的線索是：${firstExcerpt || "它給出一組可重新閱讀的作品、方法或場域名稱。"} ${secondTitle} 則補上另一個角度：${secondExcerpt || "它讓問題可以被比較，而不是只停在單一案例。"} 因此本章的任務是「${job}」。可以確定的是，材料至少指出一條可追蹤的關係；仍模糊的是，這條關係是否在不同工作坊、社群廚房、材料實驗或組織條件中都成立。下一步應回到頁面細節，檢查哪些物件、空間條件與共同照護實踐真的反覆出現。`,
      pullQuote: "材料最有用的地方，是指出哪些關係還需要被查證。",
    },
    en: {
      title: `Verifiable Clues Around ${firstTitle}`,
      body: `This section keeps "${compactQuery}" tied to verifiable materials rather than forcing a conclusion. ${firstTitle} offers this clue: ${firstExcerpt || "it names a work, method, or setting that can be reread."} ${secondTitle} adds another angle: ${secondExcerpt || "it makes the question comparable rather than isolated."} The section task is: ${job}. What can be said is that the materials point to a traceable relation; what remains unclear is whether that relation holds across different workshops, kitchens, material experiments, or organizational conditions. The next check is to return to page details and compare the objects, spatial conditions, and practices of care that actually recur.`,
      pullQuote: "The useful material marks what still needs checking.",
    },
    id: {
      title: `Petunjuk teruji dari ${firstTitle}`,
      body: `Bagian ini menahan pertanyaan "${compactQuery}" pada bahan yang dapat diperiksa. ${firstTitle} memberi petunjuk: ${firstExcerpt || "ia menyebut karya, metode, atau tempat yang dapat dibaca ulang."} ${secondTitle} menambah sudut lain: ${secondExcerpt || "ia membuat pertanyaan bisa dibandingkan."} Tugas bagian ini adalah: ${job}. Bahan menunjukkan relasi yang bisa dilacak, tetapi belum membuktikan bahwa relasi itu berlaku di semua lokakarya, dapur komunitas, eksperimen material, atau kondisi organisasi. Langkah berikutnya adalah membandingkan benda, ruang, dan praktik perawatan yang benar-benar berulang.`,
      pullQuote: "Bahan yang baik menunjukkan apa yang masih harus diperiksa.",
    },
    de: {
      title: `Pruefbare Spuren um ${firstTitle}`,
      body: `Dieser Abschnitt haelt "${compactQuery}" an pruefbaren Materialien fest. ${firstTitle} gibt den Hinweis: ${firstExcerpt || "es nennt eine Arbeit, Methode oder Situation, die erneut gelesen werden kann."} ${secondTitle} ergaenzt: ${secondExcerpt || "es macht die Frage vergleichbar statt isoliert."} Die Aufgabe lautet: ${job}. Sichtbar wird eine verfolgbare Beziehung; offen bleibt, ob sie in verschiedenen Workshops, Kuechen, Materialexperimenten oder Organisationsbedingungen traegt. Der naechste Schritt ist der Vergleich konkreter Objekte, Raeume und Sorgepraktiken.`,
      pullQuote: "Nuetzliches Material zeigt, was noch geprueft werden muss.",
    },
    ja: {
      title: `${firstTitle} から見る検証可能な手がかり`,
      body: `この章は「${compactQuery}」を、結論に押し込まず検証可能な材料に結びつける。${firstTitle} は次の手がかりを出す：${firstExcerpt || "読み直せる作品、方法、場を示している。"} ${secondTitle} は別の角度を加える：${secondExcerpt || "問いを単独の事例ではなく比較可能にする。"} 章の仕事は「${job}」。言えるのは、材料が追跡できる関係を示すこと。まだ曖昧なのは、その関係が異なるワークショップ、台所、素材実験、組織条件でも成立するかである。次は、実際に反復する物、空間条件、ケア実践をページ細部で比べる必要がある。`,
      pullQuote: "有用な材料は、まだ検証すべき関係を示す。",
    },
    th: {
      title: `เบาะแสที่ตรวจสอบได้จาก ${firstTitle}`,
      body: `ส่วนนี้ผูกคำถาม "${compactQuery}" ไว้กับวัสดุที่ตรวจสอบได้ ไม่บังคับให้เป็นข้อสรุปเดียว ${firstTitle} ให้เบาะแสว่า ${firstExcerpt || "มันระบุผลงาน วิธี หรือสถานที่ที่อ่านซ้ำได้"} ${secondTitle} เพิ่มอีกมุมว่า ${secondExcerpt || "มันทำให้คำถามเปรียบเทียบได้"} หน้าที่ของส่วนนี้คือ ${job} วัสดุชี้ความสัมพันธ์ที่ตามรอยได้ แต่ยังไม่ชัดว่าความสัมพันธ์นี้เกิดซ้ำในเวิร์กช็อป ครัวชุมชน การทดลองวัสดุ หรือเงื่อนไของค์กรแบบอื่นหรือไม่ ขั้นต่อไปคือกลับไปเทียบวัตถุ พื้นที่ และการดูแลที่ปรากฏซ้ำจริง`,
      pullQuote: "วัสดุที่ดีชี้ว่าสิ่งใดยังต้องตรวจสอบ",
    },
  };
  return { id: String(index + 1), ...copy[language] };
}

function fallbackOutline(query: string, language: AssociationZineLanguage) {
  const compactQuery = compactText(query, 120) || "the current question";
  const copy: Record<AssociationZineLanguage, { title: string; subtitle: string; opening: string; proposition: string; quietCaveat: string }> = {
    "zh-TW": {
      title: `從「${compactQuery}」重新讀桃花源材料`,
      subtitle: "一份以證據、限制與下一步問題組成的小誌。",
      opening: `先從「${compactQuery}」在材料裡真正碰到的頁面、作品、方法或社群實踐開始。`,
      proposition: "讀法必須跟著證據走；能支持的關係才推進，不能支持的關係留作下一步查證。",
      quietCaveat: "沒有足夠頁面關係時，請先查證，不要裝訂成定論。",
    },
    en: {
      title: `Reading Peach Blossom Spring Through "${compactQuery}"`,
      subtitle: "A compact answer from the pages that can actually be checked.",
      opening: `The question is: ${compactQuery}. Start from the pages that directly name the relevant practices, then mark what they do not prove.`,
      proposition: "The useful claim must stay smaller than the evidence: name the concrete pages, compare what they show, and leave thin links as verification tasks.",
      quietCaveat: "This direction still needs more materials, situated feedback, and shared correction.",
    },
    id: {
      title: `Membaca Peach Blossom Spring lewat "${compactQuery}"`,
      subtitle: "Zine tentang bukti, batas, dan pertanyaan riset berikutnya.",
      opening: `Zine ini mempertahankan pertanyaan pemain, "${compactQuery}", sebagai pertanyaan yang perlu diuji dengan bahan publik. Fokusnya adalah halaman, karya, metode, atau praktik komunitas yang benar-benar dapat membantu pembacaan.`,
      proposition: "Argumen utamanya: bahan-bahan ini berguna ketika menunjukkan bagaimana commons sementara terbentuk lewat sumber daya, perawatan, alat, dan cerita, bukan ketika dipaksa menjadi satu jawaban.",
      quietCaveat: "Arah ini masih membutuhkan bahan tambahan, umpan balik situasional, dan koreksi bersama.",
    },
    de: {
      title: `Peach Blossom Spring durch "${compactQuery}" lesen`,
      subtitle: "Ein Zine ueber Evidenz, Grenzen und naechste Forschungsfragen.",
      opening: `Dieses Zine haelt die Spielerfrage "${compactQuery}" offen genug, um sie an oeffentlichen Materialien zu pruefen. Es fragt, welche Seiten, Arbeiten, Methoden oder Community-Praktiken eine Lesart wirklich stuetzen.`,
      proposition: "Die zentrale These lautet: Das Material ist dort am nuetzlichsten, wo es zeigt, wie temporaere Commons zwischen Ressourcen, Sorge, Werkzeugen und Erzaehlungen entstehen.",
      quietCaveat: "Diese Richtung braucht weiterhin mehr Material, situiertes Feedback und gemeinsame Korrektur.",
    },
    ja: {
      title: `「${compactQuery}」から桃花源を読む`,
      subtitle: "証拠、限界、次の研究質問で組み立てる小誌。",
      opening: `この小誌は、プレイヤーの問い「${compactQuery}」を、公開材料で検証できる問いとして扱う。どのページ、作品、方法、コミュニティ実践が読みを支え、どこに曖昧さが残るかを見る。`,
      proposition: "中心となる主張は、材料の有用性が単一の答えではなく、資源、ケア、道具、語りのあいだで一時的な commons がどう形成されるかを示す点にある、ということだ。",
      quietCaveat: "この方向には、さらに多くの材料、現場からの応答、共同での修正が必要である。",
    },
    th: {
      title: `อ่าน Peach Blossom Spring ผ่าน "${compactQuery}"`,
      subtitle: "ซีนที่จัดด้วยหลักฐาน ข้อจำกัด และคำถามวิจัยถัดไป",
      opening: `ซีนนี้เก็บคำถามของผู้เล่น "${compactQuery}" ไว้เป็นคำถามที่ต้องตรวจสอบกับวัสดุสาธารณะ และดูว่าหน้า ผลงาน วิธี หรือการปฏิบัติของชุมชนใดช่วยรองรับการอ่านได้จริง`,
      proposition: "ข้อเสนอหลักคือ วัสดุเหล่านี้มีประโยชน์เมื่อช่วยให้เห็นว่า commons ชั่วคราวก่อตัวผ่านทรัพยากร การดูแล เครื่องมือ และเรื่องเล่าอย่างไร มากกว่าการบังคับให้มีคำตอบเดียว",
      quietCaveat: "ทิศทางนี้ยังต้องการวัสดุเพิ่ม คำตอบจากบริบทจริง และการปรับแก้ร่วมกัน",
    },
  };
  return copy[language];
}

function zineTitleTerms(query: string, language: AssociationZineLanguage): string[] {
  const text = query.toLowerCase();
  const termDefs: Array<{ test: RegExp; label: Record<AssociationZineLanguage, string> }> = [
    { test: /觸控|touch|sensor|感測|สัมผัส|センサ|タッチ/i, label: { "zh-TW": "觸控", en: "Touch", id: "Sentuhan", de: "Beruehrung", ja: "触覚", th: "การสัมผัส" } },
    { test: /電子織|織品|textile|wearable|fabric|ผ้า|สิ่งทอ|テキスタイル/i, label: { "zh-TW": "織品", en: "Textiles", id: "Tekstil", de: "Textilien", ja: "織物", th: "สิ่งทอ" } },
    { test: /kitchen|cooking|food|ferment|廚房|料理|食物|發酵/i, label: { "zh-TW": "社群廚房", en: "Community Kitchens", id: "Dapur Komunitas", de: "Community-Kuechen", ja: "共同キッチン", th: "ครัวชุมชน" } },
    { test: /technical|technology|tech|技術/i, label: { "zh-TW": "技術實驗", en: "Technical Experiments", id: "Eksperimen Teknis", de: "Technische Experimente", ja: "技術実験", th: "การทดลองเทคนิค" } },
    { test: /synth|synthesizer|synthesiser|合成器|oscillator/i, label: { "zh-TW": "合成器", en: "DIY Synths", id: "Synth DIY", de: "DIY-Synths", ja: "DIYシンセ", th: "ซินธ์ DIY" } },
    { test: /音樂|聲音|sound|music|audio|เสียง|ดนตรี|音/i, label: { "zh-TW": "聲音", en: "Sound", id: "Suara", de: "Klang", ja: "音", th: "เสียง" } },
    { test: /合作|協作|collab|cooperat|together|ชุมชน|ร่วม|共同|協働/i, label: { "zh-TW": "協作", en: "Collaboration", id: "Kolaborasi", de: "Zusammenarbeit", ja: "協働", th: "ความร่วมมือ" } },
    { test: /workshop|工作坊|lab|實驗|เวิร์กช็อป|ワークショップ/i, label: { "zh-TW": "工作坊", en: "Workshops", id: "Lokakarya", de: "Workshops", ja: "ワークショップ", th: "เวิร์กช็อป" } },
    { test: /community|社群|commons|ชุมชน|共同体/i, label: { "zh-TW": "社群", en: "Commons", id: "Komunitas", de: "Commons", ja: "共同体", th: "ชุมชน" } },
  ];
  const terms = termDefs.filter((term) => term.test.test(text)).map((term) => term.label[language]);
  return terms.length > 0 ? terms.slice(0, 3) : [{ "zh-TW": "材料", en: "Materials", id: "Material", de: "Material", ja: "素材", th: "วัสดุ" }[language]];
}

function evidenceTitleFromQuery(query: string, language: AssociationZineLanguage): string {
  const terms = zineTitleTerms(query, language);
  const [a, b, c] = terms;
  const joined = terms.join(language === "zh-TW" || language === "ja" ? "、" : ", ");
  const copy: Record<AssociationZineLanguage, string> = {
    "zh-TW": c ? `${a}、${b}與${c}如何相連` : `${joined}的可查證線索`,
    en: c ? `How ${a}, ${b}, and ${c} Connect` : `What the Pages Show About ${joined}`,
    id: c ? `Rute Bukti melalui ${a}, ${b}, dan ${c}` : `Pembacaan Material tentang ${joined}`,
    de: c ? `Evidenzwege durch ${a}, ${b} und ${c}` : `Eine Materiallekture zu ${joined}`,
    ja: c ? `${a}、${b}、${c}をめぐる証拠の道筋` : `${joined}を読む素材の道筋`,
    th: c ? `เส้นทางหลักฐานผ่าน${a} ${b} และ${c}` : `การอ่านวัสดุเรื่อง${joined}`,
  };
  return copy[language];
}

function sanitizeZineTitle(title: string, query: string, language: AssociationZineLanguage): string {
  const cleaned = cleanLLMText(title).trim();
  const compactQuery = compactText(query, 80).trim();
  if (!cleaned || !compactQuery) return cleaned || evidenceTitleFromQuery(query, language);
  const quotedQuery = cleaned.includes(`「${compactQuery}`) || cleaned.includes(`"${compactQuery}`) || cleaned.includes(compactQuery);
  const genericTitle = /A Material Reading of Commons|Evidence Routes|Sound map|organized by evidence|next research questions/i.test(cleaned);
  if (quotedQuery || genericTitle || textSimilarity(cleaned, compactQuery) > 0.46) return evidenceTitleFromQuery(query, language);
  return cleaned;
}

async function callDeepSeekEditorialWriter(query: string, workflow: Workflow, language: AssociationZineLanguage, compiledNotes: CompiledWikiNote[], onProgress?: AssociationProgressCallback, options: BrowserAssociationOptions = {}): Promise<DaydreamPublicArtifactContent> {
  const messages = buildEditorialMessages(query, workflow, language, compiledNotes);
  const system = messages.system;
  const user = withWritingStyle(messages.user, options);
  const articleLength = articleLengthInstruction();
  const progress = progressCopy(language);
  onProgress?.(progress.materialClues);
  let outline: any;
  try {
    outline = await requestDeepSeekJsonWithRetry(
      system,
        `${user}\n\n${articleLength}\n\n第一批只產生封面 JSON，不要陣列：{"title":"","subtitle":"","opening":"","proposition":"","quietCaveat":""}。title 必須像一篇原創文章/評論的標題：重新命名玩家問題的研究角度，不得直接引用、複製或套用玩家原句，不得用「從『玩家問題』...」這種格式。opening/proposition 必須直接回答 query 的主題，不要寫「這份小誌」「organized by evidence」「research questions」「方法」「材料讀法」這類生成流程或通用模板說明。必須說明這批頁面實際能幫上什麼；不要寫任何人名。`,
      1000,
    ) as any;
  } catch (error) {
    if (!isAbortError(error) && !isJsonParseError(error)) throw error;
    console.warn("Association outline was unavailable or malformed; using evidence fallback outline and continuing section generation.");
    outline = fallbackOutline(query, language);
  }
  const title = sanitizeZineTitle(String(outline.title ?? "材料生成的未來方向"), query, language);
  const subtitle = String(outline.subtitle ?? "從本次問題與本次閱讀材料重新推導。");
  const opening = String(outline.opening ?? "");
  const proposition = String(outline.proposition ?? "");
  const parsedUser = JSON.parse(user);
  const sections: DaydreamPublicArtifactContent["sections"] = [];
  for (let index = 0; index < 4; index += 1) {
    onProgress?.(progress.sections[index] ?? progress.materialClues);
    const previousSections: Array<{ title: string; body: string }> = sections.map(({ title, body }) => ({ title, body: body.slice(0, 180) }));
    const requestSection = (rewrite = false): Promise<any> => requestDeepSeekJsonWithRetry(
      `${languageInstruction(language)}\n${articleLength}\n只生成第 ${index + 1} 章 JSON：{"id":"","title":"","body":"","pullQuote":""}。這一章必須完成 sectionFocus.sectionJob，優先使用 sectionFocus.primaryPages 與 sectionFocus.relationTrail，不要平均重複其他章。必須至少使用一個實際頁名、作品名、事件、概念、社群實踐或方法，並明確說它如何回答 query；若材料不足就用短段落承認缺口並提出查證問題，不要幻想新事實或堆抽象詞。除非 wantsMakingTutorial=true，不要寫成工具製作、教學步驟、BOM 或工作坊流程。後半段必須延續論證，處理反證、限制、比較或未來研究方向，不要突然轉成材料清單、造句式結尾或小誌生成方法說明。不要寫系統/流程語，不要寫任何人名。不要輸出 Daydream、corpus、Semantic Layers、Entity Layers、workflow、debug、prompt、source trail；面向讀者時改稱共享記憶、主題筆記、實體筆記、閱讀路徑。${rewrite ? "上一版和前文太像，請換用不同頁名、不同用途、不同句型重寫；不要保留相同開頭或相同結論。" : ""}`,
      JSON.stringify({
        query,
        title,
        subtitle,
        proposition,
        sectionIndex: index + 1,
        sectionFocus: sectionMaterialFocus(parsedUser, index),
        wantsMakingTutorial: parsedUser.wantsMakingTutorial,
        previousSections,
        avoidRepeating: previousSections.map((previousSection) => previousSection.title),
        sourceObservations: parsedUser.sourceObservations,
        deepReadObservations: parsedUser.deepReadObservations,
        linkedEvidenceTrails: parsedUser.linkedEvidenceTrails,
        compiledWikiNotes: parsedUser.compiledWikiNotes,
      }, null, 2),
      1000,
    );
    let section: any;
    try {
      section = await requestSection(false);
    } catch (error) {
      if (!isJsonParseError(error)) throw error;
      console.warn(`Association section ${index + 1} malformed after retry; using evidence fallback section.`);
      section = fallbackSection(query, parsedUser, index, language);
    }
    if (isTooSimilarToExisting(String(section.body ?? ""), sections.map(({ body }) => body))) {
      section = await requestSection(true);
    }
    if (isTooSimilarToExisting(String(section.body ?? ""), sections.map(({ body }) => body))) {
      section = await requestSection(true);
    }
    const nextSection = {
      id: cleanLLMText(section.id ?? `llm-section-${index + 1}`),
      title: cleanLLMText(section.title ?? ""),
      body: cleanLLMText(section.body ?? ""),
      ...(section.pullQuote ? { pullQuote: cleanLLMText(section.pullQuote) } : {}),
    };
    if (!nextSection.id.trim() || !nextSection.title || !nextSection.body.trim()) {
      throw new Error(`LLM section ${index + 1} missing id/title/body.`);
    }
    if (isTooSimilarToExisting(nextSection.body, sections.map(({ body }) => body))) {
      console.warn(`Association zine repeated section warning after rewrite: ${nextSection.title}`);
    }
    sections.push(nextSection);
  }
  const protocol = [];
  for (let index = 0; index < 4; index += 1) {
    onProgress?.(progress.protocol[index] ?? progress.materialClues);
    let item: any;
    try {
      item = await requestDeepSeekJsonWithRetry(
        `${languageInstruction(language)}\n${articleLength}\n只生成第 ${index + 1} 個 protocol JSON，不要陣列：{"title":"","body":""}。預設寫成一個具體研討會下一步：證據檢查、反例搜尋、比較問題、未來研究問題或點開頁面後能確認的事；只有 wantsMakingTutorial=true 才能寫製作/實作步驟。不要寫系統/流程語，不要寫任何人名。不要輸出 Daydream、corpus、Semantic Layers、Entity Layers、workflow、debug、prompt、source trail；面向讀者時改稱共享記憶、主題筆記、實體筆記、閱讀路徑。`,
        JSON.stringify({ query, title, proposition, wantsMakingTutorial: parsedUser.wantsMakingTutorial, protocolIndex: index + 1, sections: sections.map(({ title, body }) => ({ title, body: body.slice(0, 160) })) }, null, 2),
        900,
      ) as any;
    } catch (error) {
      if (!isJsonParseError(error) && !isAbortError(error)) throw error;
      console.warn(`Association protocol ${index + 1} unavailable; using evidence fallback protocol.`);
      item = {
        title: language === "zh-TW" ? `查證步驟 ${index + 1}` : `Verification step ${index + 1}`,
        body: language === "zh-TW"
          ? `回到本章提到的頁面與材料詞，檢查它們是否真的支持「${compactText(query, 80)}」。如果只找到相鄰線索，下一版應把它寫成問題，而不是定論。`
          : `Return to the pages and material terms named in this section. Check whether they really support "${compactText(query, 80)}"; if they only point nearby, keep the next version as a question rather than a settled claim.`,
      };
    }
    protocol.push({ title: cleanLLMText(item.title ?? `步驟 ${index + 1}`), body: cleanLLMText(item.body ?? "") });
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

function queryRelevancePass(text: string, workflow: Workflow): boolean {
  const compacted = text.replace(/\s+/g, "").toLowerCase();
  const anchors = workflowAnchorTerms(workflow);
  const hits = anchors.filter((anchor) => compacted.includes(anchor.replace(/\s+/g, "").toLowerCase()));
  const sourceTitles = sourceCards(workflow).map((card) => card.title).filter(Boolean).slice(0, 8);
  const titleHits = sourceTitles.filter((title) => compacted.includes(title.replace(/\s+/g, "").toLowerCase().slice(0, 12)));
  return hits.length >= Math.min(3, anchors.length) || titleHits.length >= 1;
}

function publicForbiddenMatches(text: string): string[] {
  const matches: string[] = [];
  const globalPattern = new RegExp(PUBLIC_FORBIDDEN.source, `${PUBLIC_FORBIDDEN.flags.replace('g', '')}g`);
  for (const match of text.matchAll(globalPattern)) {
    if (!match[0]) continue;
    const start = Math.max(0, (match.index ?? 0) - 36);
    const end = Math.min(text.length, (match.index ?? 0) + match[0].length + 36);
    matches.push(`${match[0]}: …${text.slice(start, end)}…`);
    if (matches.length >= 8) break;
  }
  return matches;
}


function publicValidationEvidenceText(workflow: Workflow): string {
  const report = workflow.step1.report;
  const cards = [
    ...report.matchedCards,
    ...report.deepReadCards,
    ...report.linkedCards.map((item) => item.card),
  ];
  return cards.map(evidenceText).join("\n");
}

function validateVisibleText(text: string, workflow: Workflow, language: AssociationZineLanguage): void {
  const hits = workflowAnchorTerms(workflow).filter((anchor) => text.toLowerCase().includes(anchor.toLowerCase()));
  const repeated = repeatedSentenceReport(text);
  const forbiddenMatches = publicForbiddenMatches(text);
  const hardFailures: string[] = [];
  const warnings: string[] = [];
  if (forbiddenMatches.length > 0) hardFailures.push(`forbidden/process language detected: ${forbiddenMatches.join("; ")}`);
  if (language === "zh-TW" && RAW_ENGLISH_EXCERPT.test(text)) hardFailures.push("long raw English excerpt detected");
  const unsupportedBioTerms = findUnsupportedBioDetailTerms(text, publicValidationEvidenceText(workflow));
  if (unsupportedBioTerms.length > 0) hardFailures.push(`unsupported bio dataset/procedure details absent from retrieved evidence: ${unsupportedBioTerms.join(", ")}`);
  const coverage = evidenceCoverageForQuery(workflow.step1.report.seed, workflow);
  const unsupportedClaims = coverage.filter((item) => !item.covered && new RegExp(regexEscape(item.label.split("/")[0]), "i").test(text));
  if (unsupportedClaims.length > 0 && !/沒有找到足夠(?:的)?證據|證據不足|insufficient evidence/i.test(text)) {
    hardFailures.push(`unsupported synthesis without evidence caveat: ${unsupportedClaims.map((item) => item.label).join(", ")}`);
  }
  if (workflowAnchorTerms(workflow).length > 0 && hits.length < Math.min(2, workflowAnchorTerms(workflow).length)) warnings.push(`query anchor hits low: ${hits.join(", ")}`);
  if (!queryRelevancePass(text, workflow)) warnings.push("query relevance is shallow");
  if (repeated.length > 0) warnings.push(`repeated sentence: ${repeated[0]}`);
  if (!workflow.step1.report.linkedCards.length) warnings.push("no linked traversal material");
  if (text.length < 900) warnings.push(`visible text thin: ${text.length}`);
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

function readingMaterialsCopy(language: AssociationZineLanguage): { title: string; intro: string } {
  const copy: Record<AssociationZineLanguage, { title: string; intro: string }> = {
    "zh-TW": {
      title: "閱讀材料",
      intro: "這份小誌參考了以下可打開的公開頁面。你可以從這裡回到材料本身，繼續查證或延伸閱讀。",
    },
    en: {
      title: "Reading materials",
      intro: "This zine was grounded in the public pages below. Open them to keep reading, verify details, or follow the next thread.",
    },
    id: {
      title: "Bahan bacaan",
      intro: "Zine ini bertumpu pada halaman publik berikut. Buka halaman-halaman ini untuk membaca lanjut dan memeriksa detailnya.",
    },
    de: {
      title: "Lesematerialien",
      intro: "Dieses Zine stützt sich auf die folgenden öffentlichen Seiten. Öffne sie, um weiterzulesen oder Details zu prüfen.",
    },
    ja: {
      title: "読むための材料",
      intro: "この小誌は、下の公開ページを手がかりにしています。ページを開いて、続きを読み、細部を確かめられます。",
    },
    th: {
      title: "วัสดุสำหรับอ่านต่อ",
      intro: "ซีนนี้อ้างอิงจากหน้าสาธารณะด้านล่าง เปิดหน้าเหล่านี้เพื่ออ่านต่อและตรวจสอบรายละเอียดได้",
    },
  };
  return copy[language];
}

function publicReadingCards(workflow: Workflow, query = ""): Card[] {
  const candidates = [
    ...workflow.step1.report.matchedCards,
    ...workflow.step1.report.deepReadCards,
    ...workflow.step1.report.linkedCards.map((trail) => trail.card),
  ].filter(isAllowedZineCard);
  const byUrl = new Map<string, Card>();
  for (const card of candidates) {
    if (!card.url || byUrl.has(card.url)) continue;
    byUrl.set(card.url, card);
  }
  const wantsSgmk = wantsSgmkQuery(query);
  return Array.from(byUrl.values())
    .sort((a, b) => wantsSgmk ? (sourceFamily(b) === "SGMK" ? 1 : 0) - (sourceFamily(a) === "SGMK" ? 1 : 0) : 0)
    .slice(0, 12);
}

function renderReadingMaterialsSection(workflow: Workflow, language: AssociationZineLanguage, templateFilename = "01-pbs-reset-title-kinetic.html", query = ""): string {
  const cards = publicReadingCards(workflow, query);
  if (cards.length === 0) return "";
  const copy = readingMaterialsCopy(language);
  const rows = cards.map((card, index) => {
    const family = sourceFamily(card);
    const description = cleanReadingMaterialDescription(card.excerpt);
    return `<li style="margin:0;padding:12px 0;border-top:2px solid #111;list-style:none;">
      <a href="${escapeHtml(card.url ?? "#")}" target="_blank" rel="noreferrer" style="display:inline-block;color:#111;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px;font-weight:900;">${String(index + 1).padStart(2, "0")}. ${escapeHtml(card.title)}</a>
      <span style="display:inline-block;margin-left:8px;color:#315b63;font-size:0.85em;">${escapeHtml(family)}</span>
      ${description ? `<p style="margin:8px 0 0;color:#243b3d;">${escapeHtml(description)}</p>` : ""}
    </li>`;
  }).join("");
  return `<section class="page pbs-reading-materials" data-official-template="${escapeHtml(templateFilename)}" data-folio="materials" style="break-before:auto;page-break-before:auto;min-height:auto;display:block;padding:clamp(14px,3vw,28px);background:#fffaf0;color:#243b3d;">
    <main class="sheet" style="width:100%;max-width:980px;margin:0 auto;padding:clamp(16px,3vw,28px);border:4px solid #111;background:#fffaf0;box-shadow:7px 7px 0 #bac3d9;overflow-wrap:anywhere;">
      <div class="titleBlock" style="border:3px solid #111;background:#fffdf6;padding:clamp(12px,2vw,22px);margin-bottom:18px;box-shadow:4px 4px 0 #bac3d9;"><h1 style="margin:0;font-size:clamp(28px,4vw,48px);line-height:1.12;">${escapeHtml(copy.title)}</h1><p class="lead" style="margin:12px 0 0;font-size:clamp(17px,2vw,24px);line-height:1.45;">${escapeHtml(copy.intro)}</p></div>
      <ol style="margin:0;padding:0;font-size:clamp(16px,1.8vw,22px);line-height:1.45;">${rows}</ol>
    </main>
  </section>`;
}

function traceList(value: unknown, max = 5): string[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, max).map((item) => {
    if (typeof item === "string") return item;
    const record = item as Record<string, unknown>;
    const title = String(record.title ?? record.to ?? record.name ?? "untitled");
    const family = record.sourceFamily ? ` (${record.sourceFamily})` : "";
    const keywords = Array.isArray(record.matchedKeywords) && record.matchedKeywords.length
      ? ` · ${record.matchedKeywords.slice(0, 4).join(", ")}`
      : "";
    const relation = record.relation ? ` · ${record.relation}` : "";
    return `${title}${family}${relation}${keywords}`;
  }).filter(Boolean);
}

function traceCard(title: string, body: string | string[]): string {
  const content = Array.isArray(body)
    ? `<ul style="margin:8px 0 0;padding-left:18px;">${body.map((item) => `<li style="margin:0 0 5px;">${escapeHtml(item)}</li>`).join("")}</ul>`
    : `<p style="margin:8px 0 0;">${escapeHtml(body)}</p>`;
  return `<article style="border:2px solid #111;background:#fffdf6;padding:10px 12px;box-shadow:3px 3px 0 #111;break-inside:avoid;page-break-inside:avoid;">
    <h2 style="margin:0;font-size:clamp(15px,1.5vw,19px);line-height:1.15;text-transform:uppercase;letter-spacing:.04em;">${escapeHtml(title)}</h2>
    <div style="font-size:clamp(13px,1.25vw,16px);line-height:1.38;color:#243b3d;">${content}</div>
  </article>`;
}

function traceCopy(language: AssociationZineLanguage) {
  const copy: Record<AssociationZineLanguage, {
    title: string;
    intro: string;
    cards: string[];
    query: string;
    seed: string;
    intent: string;
    noSearch: string;
    noFamilies: string;
    writerFallback: string;
    publicPassed: string;
    depthScore: string;
    warnings: string;
    llm: string;
    yes: string;
    needsReview: string;
    none: string;
    notRecorded: string;
    unknown: string;
  }> = {
    "zh-TW": {
      title: "閱讀路徑",
      intro: "這頁把小誌如何找到材料、如何形成論點、哪裡仍需查證，壓縮成可讀的路徑卡。它保留候選來源、問題、查詢詞、wiki 連結、深讀頁面、LLM 呼叫與驗證狀態，但不把玩家問題當成 semantic layer。",
      cards: ["問題", "搜尋詞", "來源家族", "入口筆記", "命中頁面", "連結路徑", "深讀", "寫作者使用", "驗證"],
      query: "Query", seed: "Question", intent: "Intent", noSearch: "沒有記錄搜尋詞。", noFamilies: "沒有記錄來源家族篩選。", writerFallback: "寫作者比較問題、命中頁面、連結路徑與深讀筆記後，寫成一個有證據邊界的論點。", publicPassed: "公開文章通過", depthScore: "深度分數", warnings: "警告", llm: "LLM", yes: "是", needsReview: "需要複查", none: "未記錄", notRecorded: "未記錄", unknown: "未知",
    },
    en: {
      title: "Retrieval Path",
      intro: "This page compresses how the zine found material, formed an argument, and marked what still needs checking into readable path cards. It keeps candidate sources, the question, search terms, wiki links, deep-read pages, LLM calls, and validation status without treating the player query as a semantic layer.",
      cards: ["Question", "Search words", "Source families", "Entry notes", "Matched pages", "Linked paths", "Deep reading", "Writer used", "Validation"],
      query: "Query", seed: "Question", intent: "Intent", noSearch: "No search terms recorded.", noFamilies: "No source-family filter recorded.", writerFallback: "The writer compared the query with matched pages, linked paths, and deep-read notes, then wrote one evidence-bound argument.", publicPassed: "Public article passed", depthScore: "Depth score", warnings: "Warnings", llm: "LLM", yes: "yes", needsReview: "needs review", none: "none recorded", notRecorded: "not recorded", unknown: "unknown",
    },
    id: {
      title: "Jalur Pengambilan",
      intro: "Halaman ini memadatkan cara zine menemukan bahan, membentuk argumen, dan menandai bagian yang masih perlu diperiksa ke dalam kartu jalur yang mudah dibaca. Ia menyimpan kartu sumber, benih, kata pencarian, tautan wiki, halaman bacaan mendalam, panggilan LLM, dan status validasi tanpa menampilkan JSON teknis mentah.",
      cards: ["Pertanyaan / benih", "Kata pencarian", "Keluarga sumber", "Catatan masuk", "Halaman cocok", "Jalur tautan", "Bacaan mendalam", "Dipakai penulis", "Validasi"],
      query: "Kueri", seed: "Benih", intent: "Maksud", noSearch: "Tidak ada kata pencarian yang tercatat.", noFamilies: "Tidak ada filter keluarga sumber yang tercatat.", writerFallback: "Penulis membandingkan pertanyaan dengan halaman cocok, jalur tautan, dan catatan bacaan mendalam, lalu menulis argumen berbatas bukti.", publicPassed: "Artikel publik lolos", depthScore: "Skor kedalaman", warnings: "Peringatan", llm: "LLM", yes: "ya", needsReview: "perlu ditinjau", none: "tidak tercatat", notRecorded: "tidak tercatat", unknown: "tidak diketahui",
    },
    de: {
      title: "Abrufpfad",
      intro: "Diese Seite verdichtet, wie das Zine Material gefunden, eine These gebildet und offene Prüfstellen markiert hat, zu lesbaren Pfadkarten. Sie bewahrt Quellenkarten, Seeds, Suchbegriffe, Wiki-Links, vertieft gelesene Seiten, LLM-Aufrufe und Validierungsstatus, ohne rohes technisches JSON zu zeigen.",
      cards: ["Frage / Seed", "Suchwörter", "Quellenfamilien", "Einstiegsnotizen", "Gefundene Seiten", "Linkpfade", "Vertiefte Lektüre", "Vom Schreiben genutzt", "Validierung"],
      query: "Suchfrage", seed: "Seed", intent: "Absicht", noSearch: "Keine Suchbegriffe aufgezeichnet.", noFamilies: "Kein Quellenfamilien-Filter aufgezeichnet.", writerFallback: "Das Schreiben verglich die Frage mit gefundenen Seiten, Linkpfaden und vertieften Notizen und formulierte daraus ein beleggebundenes Argument.", publicPassed: "Öffentlicher Artikel bestanden", depthScore: "Tiefenwert", warnings: "Warnungen", llm: "LLM", yes: "ja", needsReview: "prüfen", none: "keine aufgezeichnet", notRecorded: "nicht aufgezeichnet", unknown: "unbekannt",
    },
    ja: {
      title: "検索経路",
      intro: "このページは、小誌がどのように材料を見つけ、論点を組み立て、まだ確認が必要な箇所を示したかを、読める経路カードに圧縮したものです。ソースカード、種、検索語、wikiリンク、深読みページ、LLM呼び出し、検証状態を残しつつ、技術用の生JSONとしては表示しません。",
      cards: ["問い / 種", "検索語", "ソース群", "入口ノート", "一致ページ", "リンク経路", "深読み", "執筆に使ったもの", "検証"],
      query: "クエリ", seed: "種", intent: "意図", noSearch: "検索語は記録されていません。", noFamilies: "ソース群フィルターは記録されていません。", writerFallback: "執筆者は問い、一致ページ、リンク経路、深読みノートを比較し、証拠の範囲を示した論点を書きました。", publicPassed: "公開記事の確認", depthScore: "深度スコア", warnings: "警告", llm: "LLM", yes: "はい", needsReview: "要確認", none: "記録なし", notRecorded: "記録なし", unknown: "不明",
    },
    th: {
      title: "เส้นทางการค้นคืน",
      intro: "หน้านี้สรุปว่าซีนค้นหาวัสดุอย่างไร ก่อรูปข้อถกเถียงอย่างไร และส่วนใดยังต้องตรวจสอบต่อ ให้เป็นการ์ดเส้นทางที่อ่านได้ โดยเก็บการ์ดแหล่งข้อมูล เมล็ดคำถาม คำค้น ลิงก์วิกิ หน้าที่อ่านลึก การเรียก LLM และสถานะตรวจสอบไว้ โดยไม่แสดง JSON ทางเทคนิคดิบ",
      cards: ["คำถาม / เมล็ด", "คำค้น", "ตระกูลแหล่งข้อมูล", "บันทึกทางเข้า", "หน้าที่พบ", "เส้นทางลิงก์", "การอ่านลึก", "สิ่งที่ผู้เขียนใช้", "การตรวจสอบ"],
      query: "คำถาม", seed: "เมล็ด", intent: "เจตนา", noSearch: "ไม่มีคำค้นที่บันทึกไว้", noFamilies: "ไม่มีตัวกรองตระกูลแหล่งข้อมูลที่บันทึกไว้", writerFallback: "ผู้เขียนเปรียบเทียบคำถามกับหน้าที่พบ เส้นทางลิงก์ และบันทึกการอ่านลึก แล้วเขียนข้อถกเถียงที่มีขอบเขตตามหลักฐาน", publicPassed: "บทความสาธารณะผ่าน", depthScore: "คะแนนความลึก", warnings: "คำเตือน", llm: "LLM", yes: "ใช่", needsReview: "ต้องตรวจทาน", none: "ไม่มีบันทึก", notRecorded: "ไม่มีบันทึก", unknown: "ไม่ทราบ",
    },
  };
  return copy[language];
}

function renderWorkflowTraceSection(trace: Record<string, unknown>, language: AssociationZineLanguage, templateFilename = "01-pbs-reset-title-kinetic.html"): string {
  const copy = traceCopy(language);
  const deepSeek = trace.deepSeek as Record<string, unknown> | undefined;
  const validation = trace.publicValidation as Record<string, unknown> | undefined;
  const depth = trace.depthMetrics as Record<string, unknown> | undefined;
  const cards = [
    traceCard(copy.cards[0], [`${copy.query}: ${trace.query ?? ""}`, `${copy.seed}: ${trace.seed ?? trace.query ?? ""}`, `${copy.intent}: ${trace.interpretedIntent ?? ""}`]),
    traceCard(copy.cards[1], traceList(trace.searchTermsUsed, 12).join(" · ") || copy.noSearch),
    traceCard(copy.cards[2], traceList(trace.allowedSourceFamilies, 8).join(" · ") || copy.noFamilies),
    traceCard(copy.cards[3], traceList(trace.entryNotesRead, 5)),
    traceCard(copy.cards[4], traceList(trace.matchedPages ?? trace.triggeredNotes, 6)),
    traceCard(copy.cards[5], traceList(trace.followedWikilinks ?? trace.linkedPages, 5)),
    traceCard(copy.cards[6], traceList(trace.deepReadPages ?? trace.sourceNotesUsed, 5)),
    traceCard(copy.cards[7], String(trace.compactPromptSummary ?? copy.writerFallback)),
    traceCard(copy.cards[8], [
      `${copy.publicPassed}: ${validation?.publicSafetyPassed === false ? copy.needsReview : copy.yes}`,
      `${copy.depthScore}: ${depth?.depthScore ?? copy.notRecorded}`,
      `${copy.warnings}: ${trace.thinSourceWarnings && Array.isArray(trace.thinSourceWarnings) && trace.thinSourceWarnings.length ? trace.thinSourceWarnings.join("; ") : copy.none}`,
      `${copy.llm}: ${deepSeek?.provider ?? copy.notRecorded}; status ${deepSeek?.httpStatus ?? copy.unknown}; ${deepSeek?.durationMs ?? "?"} ms`,
    ]),
  ].join("");
  return `<section class="page pbs-readable-trace" data-official-template="${escapeHtml(templateFilename)}" data-folio="retrieval-trace" style="break-before:auto;page-break-before:auto;min-height:auto;display:block;padding:clamp(14px,3vw,28px);background:#bac3d9;color:#111;">
    <main class="sheet" style="width:100%;max-width:980px;margin:0 auto;padding:clamp(16px,3vw,28px);border:4px solid #111;background:#fffaf0;box-shadow:7px 7px 0 #315b63;overflow-wrap:anywhere;">
      <div class="titleBlock" style="border:3px solid #111;background:#fcf46b;padding:clamp(12px,2vw,20px);margin-bottom:14px;box-shadow:4px 4px 0 #111;">
        <h1 style="margin:0;font-size:clamp(24px,3.2vw,38px);line-height:1.08;">${escapeHtml(copy.title)}</h1>
        <p class="lead" style="margin:8px 0 0;font-size:clamp(14px,1.45vw,18px);line-height:1.38;">${escapeHtml(copy.intro)}</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">${cards}</div>
    </main>
  </section>`;
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

function buildClickTrace(params: {
  requestId: string;
  query: string;
  language: AssociationZineLanguage;
  workflow: Workflow;
  artifact?: DaydreamPublicArtifactContent;
  visibleText?: string;
  html?: string;
  errorClass?: string;
  errorMessage?: string;
  publicValidation?: { officialTemplate1: boolean; publicSafetyPassed: boolean; forbiddenTermsFound: string[] };
}) {
  const { requestId, query, language, workflow, artifact, visibleText, html, errorClass, errorMessage, publicValidation } = params;
  const keywords = workflow.step1.report.keywords.slice(0, 32);
  const matchedCards = workflow.step1.report.matchedCards.filter(isAllowedZineCard).slice(0, 10);
  const deepReadCards = workflow.step1.report.deepReadCards.filter(isAllowedZineCard).slice(0, 8);
  const linkedCards = workflow.step1.report.linkedCards.filter((trail) => isAllowedZineCard(trail.card)).slice(0, 10);
  const entryNotes = entryNoteCards().map((card, index) => ({ ...cardForTrace(card, keywords, index), role: card.semanticLayer, whyUsed: "PBS LLM wiki entry point" }));
  const usedIds = new Set([...matchedCards, ...deepReadCards, ...linkedCards.map((trail) => trail.card)].map((card) => card.id));
  const rejectedNotes = sourceCards(workflow).filter((card) => !usedIds.has(card.id)).slice(0, 5).map((card, index) => ({ ...cardForTrace(card, keywords, index), reason: "considered but weaker than selected query evidence" }));
  const tagsMatched = Array.from(new Set([...matchedCards, ...deepReadCards, ...linkedCards.map((trail) => trail.card)].flatMap((card) => [...(card.tags ?? []), ...(card.categories ?? [])]))).slice(0, 24);
  const diagramNodes = 1 + keywords.slice(0, 12).length + matchedCards.slice(0, 8).length;
  const diagramEdges = keywords.slice(0, 12).length + matchedCards.slice(0, 8).reduce((sum, card) => sum + Math.min(3, cardForTrace(card, keywords).matchedKeywords.length), 0) + linkedCards.length;
  const textForValidation = visibleText ?? (html ? extractPublicArtifactText(html) : "");
  const forbiddenTermsFound = publicForbiddenMatches(textForValidation);
  return {
    requestId,
    query,
    seed: query,
    language,
    interpretedIntent: interpretQueryIntent(query),
    allowedSourceFamilies: ENABLED_SOURCE_FAMILIES,
    entryNotesRead: entryNotes,
    searchTermsUsed: keywords,
    triggeredNotes: matchedCards.map((card, index) => cardForTrace(card, keywords, index)),
    matchedPages: matchedCards.map((card, index) => cardForTrace(card, keywords, index)),
    followedWikilinks: linkedCards.map((trail) => ({ ...cardForTrace(trail.card, keywords), from: trail.via?.map((card) => card.title).join(" -> ") || query, to: trail.card.title, relation: trail.relation, reason: `local wiki relation at depth ${trail.depth}` })),
    linkedPages: linkedCards.map((trail) => ({ ...cardForTrace(trail.card, keywords), from: trail.via?.map((card) => card.title).join(" -> ") || query, to: trail.card.title, relation: trail.relation, reason: `local wiki relation at depth ${trail.depth}` })),
    newKeywords: workflow.step1.report.deepReadKeywords.filter((keyword) => !keywords.includes(keyword)).slice(0, 24),
    wordsAfterFirstReading: workflow.step1.report.deepReadKeywords.slice(0, 12),
    wordsAfterSecondReading: workflow.step1.report.deepReadKeywords.filter((keyword) => !keywords.includes(keyword)).slice(0, 18),
    sourceNotesUsed: deepReadCards.map((card) => ({ ...cardForTrace(card, keywords), extractedObservations: [compactText(card.excerpt, 260), ...(card.keywords ?? []).slice(0, 5)].filter(Boolean), whyUsed: cardForTrace(card, keywords).matchedKeywords.length ? `matched ${cardForTrace(card, keywords).matchedKeywords.join(", ")}` : `related ${sourceFamily(card)} page` })),
    deepReadPages: deepReadCards.map((card) => ({ ...cardForTrace(card, keywords), extractedObservations: [compactText(card.excerpt, 260), ...(card.keywords ?? []).slice(0, 5)].filter(Boolean), whyUsed: cardForTrace(card, keywords).matchedKeywords.length ? `matched ${cardForTrace(card, keywords).matchedKeywords.join(", ")}` : `related ${sourceFamily(card)} page` })),
    tagsMatched,
    depthMetrics: workflow.step1.report.depthMetrics,
    thinSourceWarnings: workflow.step1.report.depthMetrics.warnings,
    compactPromptSummary: "Player query is interpreted as a PBS LLM wiki question. Semantic/entity entry notes are read first; matching notes and first-layer wikilinks shape the evidence packet; source pages are used only to ground concrete claims; thin evidence must remain caveated.",
    rejectedNotes,
    corpusDiagramSummary: { nodes: diagramNodes, edges: diagramEdges },
    editorialPromptCreated: true,
    deepSeek: {
      provider: "DeepSeek via Cloudflare Worker",
      proxyUrl: configuredProxyUrl(),
      httpStatus: activeDeepSeekTraceCalls.every((call) => call.httpStatus === 200) ? 200 : activeDeepSeekTraceCalls.at(-1)?.httpStatus ?? null,
      durationMs: activeDeepSeekTraceCalls.reduce((sum, call) => sum + call.durationMs, 0),
      calls: activeDeepSeekTraceCalls,
    },
    articleLength: {
      target: "compact evidence-bound zine",
      strategy: "answer the query directly; do not pad to a page multiple",
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

function interpretQueryIntent(query: string): string {
  const style = /策展|curatorial|exhibition|essay|短文/i.test(query) ? "curatorial essay" : /workshop|pedagogy|教學|工作坊/i.test(query) ? "workshop/pedagogy inquiry" : /how|如何|方法|tutorial/i.test(query) ? "method inquiry" : "research question";
  const topic = compactText(query.replace(/產生一篇|生成一篇|write|generate|about|關於/gi, " "), 120);
  return `${style}: ${topic}`;
}

function wantsSgmkQuery(query: string): boolean {
  return /\bsgmk\b|ssam|wiki\.sgmk-ssam\.ch|mechartlab|home made|8bit|gnusbuino/i.test(query);
}

function wantsSoundDiyQuery(query: string): boolean {
  return /diy|自製|自造|合成器|synth|synthesizer|synthesiser|oscillator|sound|speaker|聲音|音樂|樂器/i.test(query);
}

function createBrowserWorkflow(query: string): Workflow {
  const corpus = allowedUiCorpus();
  const textileHints = /textile|fabric|wearable|sewing|tailor|織品|紡織|布|穿戴|裁縫/i.test(query)
    ? ", textile, fabric, wearable, soft circuit"
    : "";
  const sensorHints = /sensor|sensing|detector|感測|感應|偵測/i.test(query) ? ", sensor" : "";
  const sgmkHints = wantsSgmkQuery(query) ? ", SGMK, SSAM, wiki.sgmk-ssam.ch, SGMK DIY Electronics and Kits, SGMK Sound and Instruments, 8bit Mix Tape, Gnusbuino, MechArtLab, HOME MADE" : "";
  const expandedQuery = `${query}\n\nPBS LLM wiki entry hints: semantic layers, entity layers, concepts, events, public wiki index. Use these hints only to find evidence that answers the exact query; do not change the topic. Source-family hints: Hackteria, SGMK, Fabricademy, HOW TO GET WHAT YOU WANT / KOBAKANT${textileHints}${sensorHints}${sgmkHints}.`;
  try {
    const workflow = runDaydreamWorkflow(query, corpus);
    if (sourceCards(workflow).filter(isAllowedZineCard).length > 0) return workflow;
    return runDaydreamWorkflow(expandedQuery, corpus);
  } catch (error) {
    console.warn("Association workflow needed a public-safe query fallback.", error);
    try {
      return runDaydreamWorkflow(expandedQuery, corpus);
    } catch (fallbackError) {
      console.warn("Association workflow fallback needed neutral query.", fallbackError);
      return runDaydreamWorkflow(query, corpus);
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

export async function generateBrowserAssociationZine(query: string, language: AssociationZineLanguage = "zh-TW", onProgress?: AssociationProgressCallback, options: BrowserAssociationOptions = {}): Promise<BrowserAssociationResult> {
  const requestId = `pbs-zine-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  activeDeepSeekTraceCalls = [];
  const workflow = createBrowserWorkflow(query);
  const compiledNotes = rankCompiledWikiNotes(query, workflow, await loadCompiledWikiIndex());
  const progress = progressCopy(language);
  const separator = language === "zh-TW" || language === "ja" || language === "th" ? "、" : ", ";
  onProgress?.(progress.parseQuery(workflow.step1.report.keywords.slice(0, 6).join(separator) || progress.fallbackQuery));
  onProgress?.(progress.entryNotes(WIKI_ENTRY_NOTES.length));
  onProgress?.(progress.matchedNotes(workflow.step1.report.matchedCards.filter(isAllowedZineCard).length));
  onProgress?.(progress.linkedNotes(workflow.step1.report.linkedCards.filter((trail) => isAllowedZineCard(trail.card)).length));
  onProgress?.(progress.deepRead(workflow.step1.report.deepReadCards.filter(isAllowedZineCard).length));
  try {
    assertEnoughRelevantMaterial(workflow);
    assertEnoughEvidenceForClaim(query, workflow);
  } catch (error) {
    persistClickTrace(buildClickTrace({ requestId, query, language, workflow, errorClass: errorClass(error, "low_relevance_zine"), errorMessage: errorMessage(error) }));
    throw error;
  }
  const variant: DaydreamHtmlLayoutVariant = "pbs-reset-title";
  let artifact: DaydreamPublicArtifactContent;
  try {
    artifact = await withBrowserTimeout(
      callDeepSeekEditorialWriter(query, workflow, language, compiledNotes, onProgress, options),
      EDITORIAL_WRITER_TIMEOUT_MS,
      "Association writer timed out; please try again.",
    );
  } catch (error) {
    console.error("Association editorial writer unavailable; not rendering stale local fallback.", error);
    persistClickTrace(buildClickTrace({ requestId, query, language, workflow, errorClass: errorClass(error), errorMessage: errorMessage(error) }));
    throw error;
  }
  const officialTemplate = { filename: "01-pbs-reset-title-kinetic.html", html: pbsResetTitleTemplate };
  let fragment: string;
  try {
    fragment = renderOfficialTemplateArtifactHtml(artifact, variant, officialTemplate, language);
  } catch (error) {
    console.error("Association artifact was rejected; not rendering stale local fallback.", error);
    persistClickTrace(buildClickTrace({ requestId, query, language, workflow, artifact, errorClass: errorClass(error, "artifact_guard_rejected"), errorMessage: errorMessage(error) }));
    throw error;
  }
  if (!fragment.includes('data-official-template="01-pbs-reset-title-kinetic.html"') || /02-soft|03-aino|soft-commons|aino-motion/i.test(fragment)) {
    throw new Error("Only the first PBS HTML zine template is allowed.");
  }
  let articleFragment = linkKnownPageNames(fragment, workflow);
  let articleHtml = htmlPage(articleFragment, artifact.title, language);
  let visibleText = "";
  try {
    assertCleanPublicArtifact(articleHtml);
    visibleText = extractPublicArtifactText(articleHtml);
    validateVisibleText(visibleText, workflow, language);
  } catch (error) {
    persistClickTrace(buildClickTrace({ requestId, query, language, workflow, artifact, html: articleHtml, errorClass: "public_validation_error", errorMessage: errorMessage(error) }));
    throw error;
  }
  const forbiddenTermsFound = publicForbiddenMatches(visibleText);
  const trace = buildClickTrace({
    requestId,
    query,
    language,
    workflow,
    artifact,
    html: articleHtml,
    visibleText,
    publicValidation: {
      officialTemplate1: articleHtml.includes('data-official-template="01-pbs-reset-title-kinetic.html"'),
      publicSafetyPassed: forbiddenTermsFound.length === 0,
      forbiddenTermsFound,
    },
  });
  const readingMaterials = renderReadingMaterialsSection(workflow, language, officialTemplate.filename, query);
  const workflowTrace = renderWorkflowTraceSection(trace, language, officialTemplate.filename);
  const html = htmlPage(`${articleFragment}${readingMaterials}${workflowTrace}${renderAssociationFeedbackSection(language, officialTemplate.filename)}`, artifact.title, language);
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
