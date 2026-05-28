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
type AllowedSourceFamily = "Hackteria" | "SGMK" | "Fabricademy" | "HOW TO GET WHAT YOU WANT / KOBAKANT";
type WikiEntryNote = { title: string; path: string; text: string; role: string };

const UI_ZINE_TRACE_KEY = "pbs:zine-click-traces";
const ZINE_PRINT_PAGE_MULTIPLE = 8;
const ZINE_TARGET_PRINT_PAGES = 16;
const ENABLED_SOURCE_FAMILIES: AllowedSourceFamily[] = ["Hackteria", "SGMK", "Fabricademy", "HOW TO GET WHAT YOU WANT / KOBAKANT"];
const WIKI_ENTRY_NOTES: WikiEntryNote[] = [
  { title: "PBS Semantic Layers / README", path: "Sources/PBS Semantic Layers/README.md", text: semanticReadme, role: "semantic layer overview" },
  { title: "PBS Semantic Layers / Concepts", path: "Sources/PBS Semantic Layers/Concepts.md", text: semanticConcepts, role: "concept index" },
  { title: "PBS Semantic Layers / Tools", path: "Sources/PBS Semantic Layers/Tools.md", text: semanticTools, role: "tool and method index" },
  { title: "PBS Semantic Layers / Events", path: "Sources/PBS Semantic Layers/Events.md", text: semanticEvents, role: "event and workshop index" },
  { title: "PBS Entity Layers / README", path: "Sources/PBS Entity Layers/README.md", text: entityReadme, role: "entity bridge overview" },
  { title: "LLM Wiki / index", path: "Wiki/index.md", text: "PBS public wiki index: Home, Start Here, Association Map, Concepts, Questions, Characters and NPCs, Zines, Long Notes. Use public reading pages as orientation and semantic/entity/source layers as evidence bridges.", role: "public wiki index" },
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

function printBindingLengthInstruction(): string {
  return `PRINT BINDING TARGET: In every output language, the finished zine is for digital printing and small-book binding. Printable page count should land on an ${ZINE_PRINT_PAGE_MULTIPLE}-page multiple; for this article, target approximately ${ZINE_TARGET_PRINT_PAGES} printable pages by making the original four-section article substantial, not by adding filler pages. Do not add empty padding pages. Keep exactly four main sections. Generate the main article so it naturally fills about 14-15 A4 pages before the Reading materials appendix; the Reading materials appendix is the only final page-count tuning tool. Only change quantity and length, not the semantic jobs: opening and proposition should each be 200-280 visible characters for CJK/Thai/Japanese or 120-170 words for Latin-script languages; each section body should be 780-980 visible characters for CJK/Thai/Japanese or 450-580 words for Latin-script languages; each protocol body should be 160-240 visible characters for CJK/Thai/Japanese or 90-140 words for Latin-script languages.`;
}

function zinePrintCalibrationScript(): string {
  return `<script>
(() => {
  const targetPages = ${ZINE_TARGET_PRINT_PAGES};
  const pageHeightPx = 1047;
  const modes = ["trim", "compact", "standard", "expanded", "max"];
  const estimatePages = () => Math.ceil(Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) / pageHeightPx);
  const setMode = (mode) => {
    const materials = document.querySelector(".pbs-reading-materials");
    if (materials) materials.setAttribute("data-pbs-materials-mode", mode);
    document.documentElement.setAttribute("data-pbs-zine-estimated-pages", String(estimatePages()));
  };
  const calibrate = () => {
    const materials = document.querySelector(".pbs-reading-materials");
    if (!materials) return;
    let best = { mode: "standard", delta: Number.POSITIVE_INFINITY, pages: 0 };
    for (const mode of modes) {
      setMode(mode);
      const pages = estimatePages();
      const delta = Math.abs(targetPages - pages);
      if (delta < best.delta || (delta === best.delta && pages === targetPages)) best = { mode, delta, pages };
      if (pages === targetPages) break;
    }
    setMode(best.mode);
    materials.setAttribute("data-pbs-materials-calibrated-pages", String(best.pages));
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", calibrate, { once: true });
  else requestAnimationFrame(calibrate);
  window.addEventListener("beforeprint", calibrate);
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

function htmlPage(fragment: string, title: string, language: AssociationZineLanguage): string {
  return `<!doctype html><html lang="${htmlLanguage(language)}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escapeHtml(title)}</title><style>
@page { size: A4 portrait; margin: 10mm; }
@media print {
  html, body { width: auto !important; height: auto !important; overflow: visible !important; background: #f9e9c2 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0 !important; }
  .zine-feedback-page, script, button { display: none !important; }
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
  .pbs-reading-materials { --pbs-materials-font: 9.2pt; --pbs-materials-line: 1.42; --pbs-materials-row-padding: 2.2mm; }
  .pbs-reading-materials[data-pbs-materials-mode="trim"] { --pbs-materials-font: 7.4pt; --pbs-materials-line: 1.16; --pbs-materials-row-padding: 0.8mm; }
  .pbs-reading-materials[data-pbs-materials-mode="compact"] { --pbs-materials-font: 8.2pt; --pbs-materials-line: 1.24; --pbs-materials-row-padding: 1.3mm; }
  .pbs-reading-materials[data-pbs-materials-mode="expanded"] { --pbs-materials-font: 10.4pt; --pbs-materials-line: 1.58; --pbs-materials-row-padding: 3.2mm; }
  .pbs-reading-materials[data-pbs-materials-mode="max"] { --pbs-materials-font: 11.2pt; --pbs-materials-line: 1.75; --pbs-materials-row-padding: 4mm; }
  .pbs-reading-materials ol, .pbs-reading-materials li, .pbs-reading-materials p, .pbs-reading-materials span { font-size: var(--pbs-materials-font) !important; line-height: var(--pbs-materials-line) !important; }
  .pbs-reading-materials li { padding-top: var(--pbs-materials-row-padding) !important; padding-bottom: var(--pbs-materials-row-padding) !important; }
  .pbs-reading-materials[data-pbs-materials-mode="trim"] p { display: none !important; }
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
    concreteHint: materialHint(card.excerpt, 140),
    topics: [...(card.keywords ?? []), ...(card.tags ?? []), ...(card.categories ?? [])].slice(0, 8).join(", "),
    caution: "Use as a concrete observation only; do not paste raw excerpt or describe retrieval/source mechanics.",
  };
}

function wantsMakingTutorial(query: string): boolean {
  return /\b(how\s+to\s+make|how\s+to\s+build|make|build|fabricate|prototype|tutorial|toolkit|bom|materials?\s+list|step-by-step)\b|做一個|製作|如何做|怎麼做|打造|原型|教學|工具包|材料清單|步驟/i.test(query);
}

function buildEditorialMessages(query: string, workflow: Workflow, language: AssociationZineLanguage) {
  const candidateCards = sourceCards(workflow).filter((card) => isAllowedZineCard(card) && !isOffTopicTextileCard(card));
  const cards = candidateCards.slice(0, 7).map(sourceObservation);
  const deepRead = workflow.step1.report.deepReadCards.filter((card) => !isOffTopicTextileCard(card)).slice(0, 6).map(sourceObservation);
  const linkedTrails = workflow.step1.report.linkedCards.filter((trail) => isAllowedZineCard(trail.card)).slice(0, 7).map((trail) => ({
    from: trail.via?.map((card) => card.title).join(" → ") || "",
    to: trail.card.title,
    relation: trail.relation,
    observation: materialHint(trail.card.excerpt, 160),
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
    searchTerms: workflow.step1.report.keywords.slice(0, 12),
    deepReadKeywords: workflow.step1.report.deepReadKeywords.slice(0, 12),
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
    semanticContextSummary: {
      anchorCards: semantic.anchorCards.length,
      relatedCards: semantic.relatedCards.length,
      bridgeCards: semantic.bridgeCards.length,
      futureDirections: semantic.futureDirections.slice(0, 4).map((item: any) => item.topic ?? item.title ?? String(item)),
    },
    researchTopicCandidates: topics,
    instruction: "The query is the only editorial parameter. Evidence may support, contest, complicate, or limit the answer, but it must not redirect the article to a different topic. Write one coherent research-seminar zine around one useful, source-grounded insight and one future research direction.",
    reminder: "請真的依照 query、searchTerms、sourceObservations、deepReadObservations 與 linkedEvidenceTrails 重寫文章；先說材料支持什麼、不支持什麼，並指出一個不容易被注意到、但對玩家問題有用的新關係、矛盾或事實。不要套固定文案，不要重複上一份小誌的題目或段落，不要把之前設定當真律。材料可以來自 PBS semantic/entity entry notes 與 Hackteria、SGMK、Fabricademy、HOW TO GET WHAT YOU WANT / KOBAKANT 材料；Hackteria 可以作為一般證據來源使用，但仍必須由 query 與 retrieval evidence 支持，不要憑空引用。標題、開頭、每章與 protocol 都必須回應玩家問題中的具體詞彙，並共同推進同一個中心論點。至少兩段要提到實際頁名/作品名以及它為玩家問題提供的用途。除非 query 明確詢問某位人物，否則不要寫出人名，請改寫成組織、場域、方法或材料層級。不要引入 query 或材料包沒有的領域詞；不要用固定框架命名；不要解釋系統如何運作；不要使用後台、檢索、工作流等技術說明語。",
  }, null, 2);
  const system = `${editorialSystemPrompt}\n\n${languageInstruction(language)}\nIf any earlier instruction mentions a different output language, this OUTPUT LANGUAGE instruction wins. Keep the same JSON schema. Do not introduce domain vocabulary unless it appears in the player query or gathered page text.`;
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

async function callDeepSeekEditorialWriter(query: string, workflow: Workflow, language: AssociationZineLanguage, onProgress?: AssociationProgressCallback): Promise<DaydreamPublicArtifactContent> {
  const { system, user } = buildEditorialMessages(query, workflow, language);
  const printLength = printBindingLengthInstruction();
  const progress = progressCopy(language);
  onProgress?.(progress.materialClues);
  const outline = await requestDeepSeekJson(
    system,
      `${user}\n\n${printLength}\n\n第一批只產生封面 JSON，不要陣列：{"title":"","subtitle":"","opening":"","proposition":"","quietCaveat":""}。opening/proposition 必須符合 PRINT BINDING TARGET 的長度。必須直接回應玩家 query，並說明這批頁面實際能幫上什麼；不要寫任何人名。`,
    1000,
  ) as any;
  const title = String(outline.title ?? "材料生成的未來方向");
  const subtitle = String(outline.subtitle ?? "從本次問題與本次閱讀材料重新推導。");
  const opening = String(outline.opening ?? "");
  const proposition = String(outline.proposition ?? "");
  const parsedUser = JSON.parse(user);
  const sections: DaydreamPublicArtifactContent["sections"] = [];
  for (let index = 0; index < 4; index += 1) {
    onProgress?.(progress.sections[index] ?? progress.materialClues);
    const previousSections: Array<{ title: string; body: string }> = sections.map(({ title, body }) => ({ title, body: body.slice(0, 180) }));
    const requestSection = (rewrite = false): Promise<any> => requestDeepSeekJson(
      `${languageInstruction(language)}\n${printLength}\n只生成第 ${index + 1} 章 JSON：{"id":"","title":"","body":"","pullQuote":""}。body 必須符合 PRINT BINDING TARGET 的 section body 長度。這一章必須完成 sectionFocus.sectionJob，優先使用 sectionFocus.primaryPages 與 sectionFocus.relationTrail，不要平均重複其他章。必須至少使用一個實際頁名、作品名、事件、概念、社群實踐或方法，並讓這章接續 opening/proposition 的論證；若材料不足就寫成清楚的閱讀判讀與查證問題，不要幻想新事實。除非 wantsMakingTutorial=true，不要寫成工具製作、教學步驟、BOM 或工作坊流程。後半段必須延續論證，處理反證、限制、比較或未來研究方向，不要突然轉成材料清單或造句式結尾。不要寫系統/流程語，不要寫任何人名。不要輸出 Daydream、corpus、Semantic Layers、Entity Layers、workflow、debug、prompt、source trail；面向讀者時改稱共享記憶、主題筆記、實體筆記、閱讀路徑。${rewrite ? "上一版和前文太像，請換用不同頁名、不同用途、不同句型重寫；不要保留相同開頭或相同結論。" : ""}`,
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
      }, null, 2),
      1000,
    );
    let section = await requestSection(false);
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
    const item = await requestDeepSeekJson(
      `${languageInstruction(language)}\n${printLength}\n只生成第 ${index + 1} 個 protocol JSON，不要陣列：{"title":"","body":""}。body 必須符合 PRINT BINDING TARGET 的 protocol body 長度。預設寫成研討會下一步：證據檢查、反例搜尋、比較問題、未來研究問題或點開頁面後能確認的事；只有 wantsMakingTutorial=true 才能寫製作/實作步驟。不要寫系統/流程語，不要寫任何人名。不要輸出 Daydream、corpus、Semantic Layers、Entity Layers、workflow、debug、prompt、source trail；面向讀者時改稱共享記憶、主題筆記、實體筆記、閱讀路徑。`,
      JSON.stringify({ query, title, proposition, wantsMakingTutorial: parsedUser.wantsMakingTutorial, protocolIndex: index + 1, sections: sections.map(({ title, body }) => ({ title, body: body.slice(0, 160) })) }, null, 2),
      900,
    ) as any;
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

function validateVisibleText(text: string, workflow: Workflow, language: AssociationZineLanguage): void {
  const hits = workflowAnchorTerms(workflow).filter((anchor) => text.toLowerCase().includes(anchor.toLowerCase()));
  const repeated = repeatedSentenceReport(text);
  const forbiddenMatches = publicForbiddenMatches(text);
  const hardFailures: string[] = [];
  const warnings: string[] = [];
  if (forbiddenMatches.length > 0) hardFailures.push(`forbidden/process language detected: ${forbiddenMatches.join("; ")}`);
  if (language === "zh-TW" && RAW_ENGLISH_EXCERPT.test(text)) hardFailures.push("long raw English excerpt detected");
  if (/\b(?:NCBI|16S|rRNA|lacZ|Phred)\b|大腸桿菌|E\.?\s*coli/i.test(text)) hardFailures.push("invented unsupported bio dataset/procedure details");
  if (workflowAnchorTerms(workflow).length > 0 && hits.length < Math.min(2, workflowAnchorTerms(workflow).length)) warnings.push(`query anchor hits low: ${hits.join(", ")}`);
  if (!queryRelevancePass(text, workflow)) warnings.push("query relevance is shallow");
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

function publicReadingCards(workflow: Workflow): Card[] {
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
  return Array.from(byUrl.values()).slice(0, 12);
}

function renderReadingMaterialsSection(workflow: Workflow, language: AssociationZineLanguage, templateFilename = "01-pbs-reset-title-kinetic.html"): string {
  const cards = publicReadingCards(workflow);
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
  return `<section class="page pbs-reading-materials" data-pbs-materials-mode="standard" data-official-template="${escapeHtml(templateFilename)}" data-folio="materials" style="break-before:auto;page-break-before:auto;min-height:auto;display:block;padding:clamp(14px,3vw,28px);background:#fffaf0;color:#243b3d;">
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
      intro: "這頁把小誌如何找到材料、如何形成論點、哪裡仍需查證，壓縮成可讀的路徑卡。它保留來源卡、種子、查詢詞、wiki 連結、深讀頁面、LLM 呼叫與驗證狀態，但不以工程 JSON 呈現。",
      cards: ["問題 / 種子", "搜尋詞", "來源家族", "入口筆記", "命中頁面", "連結路徑", "深讀", "寫作者使用", "驗證"],
      query: "Query", seed: "Seed", intent: "Intent", noSearch: "沒有記錄搜尋詞。", noFamilies: "沒有記錄來源家族篩選。", writerFallback: "寫作者比較問題、命中頁面、連結路徑與深讀筆記後，寫成一個有證據邊界的論點。", publicPassed: "公開文章通過", depthScore: "深度分數", warnings: "警告", llm: "LLM", yes: "是", needsReview: "需要複查", none: "未記錄", notRecorded: "未記錄", unknown: "未知",
    },
    en: {
      title: "Retrieval Path",
      intro: "This page compresses how the zine found material, formed an argument, and marked what still needs checking into readable path cards. It keeps source cards, seeds, search terms, wiki links, deep-read pages, LLM calls, and validation status without showing raw engineering JSON.",
      cards: ["Question / seed", "Search words", "Source families", "Entry notes", "Matched pages", "Linked paths", "Deep reading", "Writer used", "Validation"],
      query: "Query", seed: "Seed", intent: "Intent", noSearch: "No search terms recorded.", noFamilies: "No source-family filter recorded.", writerFallback: "The writer compared the query with matched pages, linked paths, and deep-read notes, then wrote one evidence-bound argument.", publicPassed: "Public article passed", depthScore: "Depth score", warnings: "Warnings", llm: "LLM", yes: "yes", needsReview: "needs review", none: "none recorded", notRecorded: "not recorded", unknown: "unknown",
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
    printBinding: {
      pageMultiple: ZINE_PRINT_PAGE_MULTIPLE,
      targetPrintPages: ZINE_TARGET_PRINT_PAGES,
      strategy: "expand section prose rather than add blank pages",
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

function createBrowserWorkflow(query: string): Workflow {
  const corpus = allowedUiCorpus();
  const textileHints = /textile|fabric|wearable|sewing|tailor|織品|紡織|布|穿戴|裁縫/i.test(query)
    ? ", textile, fabric, wearable, soft circuit"
    : "";
  const sensorHints = /sensor|sensing|detector|感測|感應|偵測/i.test(query) ? ", sensor" : "";
  const expandedQuery = `${query}\n\nPBS LLM wiki entry hints: semantic layers, entity layers, concepts, events, public wiki index. Use these hints only to find evidence that answers the exact query; do not change the topic. Source-family hints: Hackteria, SGMK, Fabricademy, HOW TO GET WHAT YOU WANT / KOBAKANT${textileHints}${sensorHints}.`;
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

export async function generateBrowserAssociationZine(query: string, language: AssociationZineLanguage = "zh-TW", onProgress?: AssociationProgressCallback): Promise<BrowserAssociationResult> {
  const requestId = `pbs-zine-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  activeDeepSeekTraceCalls = [];
  const workflow = createBrowserWorkflow(query);
  const progress = progressCopy(language);
  const separator = language === "zh-TW" || language === "ja" || language === "th" ? "、" : ", ";
  onProgress?.(progress.parseQuery(workflow.step1.report.keywords.slice(0, 6).join(separator) || progress.fallbackQuery));
  onProgress?.(progress.entryNotes(WIKI_ENTRY_NOTES.length));
  onProgress?.(progress.matchedNotes(workflow.step1.report.matchedCards.filter(isAllowedZineCard).length));
  onProgress?.(progress.linkedNotes(workflow.step1.report.linkedCards.filter((trail) => isAllowedZineCard(trail.card)).length));
  onProgress?.(progress.deepRead(workflow.step1.report.deepReadCards.filter(isAllowedZineCard).length));
  const variant: DaydreamHtmlLayoutVariant = "pbs-reset-title";
  let artifact: DaydreamPublicArtifactContent;
  try {
    artifact = await withBrowserTimeout(
      callDeepSeekEditorialWriter(query, workflow, language, onProgress),
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
  const readingMaterials = renderReadingMaterialsSection(workflow, language, officialTemplate.filename);
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
