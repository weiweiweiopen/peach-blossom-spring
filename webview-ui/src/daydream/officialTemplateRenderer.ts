import { assertCleanPublicArtifact } from "./artifactGuard.js";
import type { DaydreamPublicArtifactContent } from "./publicArtifactContent.js";
import type { DaydreamHtmlLayoutVariant } from "./publicArtifactHtml.js";

type TemplateLanguage = "zh-TW" | "en" | "id" | "de" | "ja" | "th";

export interface OfficialTemplateSource {
  filename: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function extractStyle(templateHtml: string): string {
  const match = templateHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  return match?.[1]?.trim() ?? "";
}

function kineticTitle(title: string, language: TemplateLanguage = "zh-TW"): string {
  if (language === "th" || /[\u0E00-\u0E7F]/u.test(title)) {
    return escapeHtml(title);
  }
  return Array.from(title).map((char, index) => {
    if (/\s/u.test(char)) return " ";
    if (/[,，.。:：/／|｜-]/u.test(char)) return `<span class="kt punct">${escapeHtml(char)}</span>`;
    const dx = ((index % 5) - 2) * 2;
    const dy = (((index + 2) % 5) - 2) * 1.5;
    const delay = `-${(index * 0.024 + 0.02).toFixed(3)}s`;
    return `<span class="kt" style="--d:${delay};--dx:${dx}px;--dy:${dy}px;--amp:${Math.abs(dx) + 2}px;--rot:${(index % 3) - 1}deg;--c:var(--ink);--i:${index}">${escapeHtml(char)}</span>`;
  }).join("");
}

function templateCopy(language: TemplateLanguage) {
  const copy: Record<TemplateLanguage, { map: string; sequence: string; insufficiencyNote: string; closing: string; caveat: string }> = {
    "zh-TW": { map: "聲音圖譜", sequence: "演奏順序", insufficiencyNote: "如果材料不足，這份小誌必須承認沒有找到足夠證據，而不是把鬆散頁面寫成宏大結論。", closing: "尾聲", caveat: "讓圖像、聲音與倫理一起被聽見。" },
    en: { map: "Sound map", sequence: "Reading order", insufficiencyNote: "If the materials are insufficient, this zine should say so instead of turning loose pages into a grand conclusion.", closing: "Closing", caveat: "Let image, sound, and ethics be heard together." },
    id: { map: "Peta suara", sequence: "Urutan baca", insufficiencyNote: "Jika bahan tidak cukup, zine ini harus mengakuinya alih-alih mengubah halaman longgar menjadi kesimpulan besar.", closing: "Penutup", caveat: "Biarkan gambar, suara, dan etika terdengar bersama." },
    de: { map: "Klangkarte", sequence: "Leseordnung", insufficiencyNote: "Wenn das Material nicht reicht, muss dieses Zine das sagen, statt lose Seiten zu einer grossen These zu machen.", closing: "Schluss", caveat: "Bild, Klang und Ethik sollen gemeinsam hörbar werden." },
    ja: { map: "音の地図", sequence: "読む順序", insufficiencyNote: "材料が足りない場合、この小誌は十分な証拠がないと認め、散らばったページを大きな結論にしない。", closing: "結び", caveat: "イメージ、音、倫理をともに聞こえるものにする。" },
    th: { map: "แผนที่เสียง", sequence: "ลำดับการอ่าน", insufficiencyNote: "ถ้าวัสดุไม่พอ ซีนนี้ต้องยอมรับว่าหลักฐานยังไม่พอ แทนการทำหน้ากระจัดกระจายให้เป็นข้อสรุปใหญ่", closing: "ปิดท้าย", caveat: "ให้ภาพ เสียง และจริยธรรมถูกได้ยินร่วมกัน" },
  };
  return copy[language];
}

const FRAME_PALETTES = [
  { sheet: "#fffaf0", title: "#fffdf6", body: "#fffdf6", shadow: "#bac3d9", label: "#ffd4ff" },
  { sheet: "#ffd4ff", title: "#fffaf0", body: "#fffdf6", shadow: "#69c3aa", label: "#fcf46b" },
  { sheet: "#69c3aa", title: "#fffaf0", body: "#fffaf0", shadow: "#ffd4ff", label: "#bac3d9" },
  { sheet: "#bac3d9", title: "#fffdf6", body: "#fffaf0", shadow: "#fcf46b", label: "#69c3aa" },
];

function frameStyle(index: number): string {
  const palette = FRAME_PALETTES[(index + Math.floor(Math.random() * FRAME_PALETTES.length)) % FRAME_PALETTES.length];
  return `--pbs-sheet-bg:${palette.sheet};--pbs-title-bg:${palette.title};--pbs-body-bg:${palette.body};--pbs-frame-shadow:${palette.shadow};--pbs-label-bg:${palette.label};`;
}

function zineLayoutGovernanceCss(): string {
  return `
.page { --pbs-sheet-bg:#fffaf0; --pbs-title-bg:#fffdf6; --pbs-body-bg:#fffdf6; --pbs-frame-shadow:#bac3d9; --pbs-label-bg:#ffd4ff; width:100%; max-width:100%; min-height:auto; padding:clamp(18px,3vw,38px); overflow-x:hidden; }
.page:nth-of-type(2n) { --pbs-sheet-bg:#ffd4ff; --pbs-title-bg:#fffaf0; --pbs-body-bg:#fffdf6; --pbs-frame-shadow:#69c3aa; --pbs-label-bg:#fcf46b; }
.page:nth-of-type(3n) { --pbs-sheet-bg:#69c3aa; --pbs-title-bg:#fffaf0; --pbs-body-bg:#fffaf0; --pbs-frame-shadow:#ffd4ff; --pbs-label-bg:#bac3d9; }
.page:nth-of-type(4n) { --pbs-sheet-bg:#bac3d9; --pbs-title-bg:#fffdf6; --pbs-body-bg:#fffaf0; --pbs-frame-shadow:#fcf46b; --pbs-label-bg:#69c3aa; }
.page .no, .page .label { background:var(--pbs-label-bg) !important; }
.sheet { width:100%; max-width:1180px; margin:0 auto; background:var(--pbs-sheet-bg) !important; border:4px solid var(--ink,#315b63) !important; box-shadow:7px 7px 0 var(--pbs-frame-shadow) !important; padding:clamp(14px,2.4vw,30px) !important; }
.bodyGrid, .bodyGrid--full { display:block; }
.titleBlock { max-width:none; margin:0 auto clamp(14px,2vw,22px); padding:clamp(12px,2vw,22px); border:3px solid var(--ink,#315b63); background:var(--pbs-title-bg) !important; box-shadow:4px 4px 0 var(--pbs-frame-shadow); }
.body, .refs { width:100%; max-width:none; margin:0 auto; padding:clamp(14px,2vw,22px); border:3px solid var(--ink,#315b63); background:var(--pbs-body-bg) !important; box-shadow:none; overflow-wrap:anywhere; }
.body p { max-width:none; }
.refs { margin-top:18px; }
.refs .sequence-note { display:block; margin-top:8px; font-size:0.72em; line-height:1.35; opacity:0.78; }
.page h1 { font-size:clamp(34px,4.6vw,62px) !important; line-height:1.12 !important; }
.page .lead { font-size:clamp(20px,2.2vw,28px) !important; line-height:1.55 !important; }
.page .body, .page .refs { font-size:clamp(20px,2.15vw,28px) !important; line-height:1.62 !important; }
.page .body p, .page .refs li { font-size:inherit !important; line-height:inherit !important; }
.pbs-readable-trace, .zine-feedback-page { width:100%; max-width:100%; min-height:auto !important; }
.pbs-readable-trace > .zine-system-frame, .zine-feedback-page > .zine-system-frame { width:100%; max-width:980px; margin:0 auto; padding:clamp(16px,3vw,28px); border:4px solid #111; background:#fffaf0; box-shadow:none; overflow-wrap:anywhere; }
.pbs-zine-button { inline-size:64px !important; block-size:64px !important; min-width:64px !important; min-height:64px !important; max-width:64px !important; max-height:64px !important; display:inline-flex !important; align-items:center !important; justify-content:center !important; padding:0 !important; font-size:28px !important; line-height:1 !important; flex:0 0 64px !important; font-family:Arial, Helvetica, sans-serif !important; overflow:hidden !important; }
.pbs-zine-repair-submit { inline-size:auto !important; block-size:auto !important; max-width:none !important; max-height:none !important; flex:1 1 280px !important; padding:12px 18px !important; }
.pbs-zine-button span { display:inline-flex !important; align-items:center !important; justify-content:center !important; line-height:1 !important; }
@media (max-width:700px) { .page { padding:18px; } .sheet, .body, .refs, .pbs-readable-trace > .zine-system-frame, .zine-feedback-page > .zine-system-frame { max-width:none; } .body, .refs { padding:14px; } .body p { max-width:none; } }
`;
}

function renderPbsReset(artifact: DaydreamPublicArtifactContent, template: OfficialTemplateSource, language: TemplateLanguage): string {
  const copy = templateCopy(language);
  const sections = artifact.sections.slice(0, 4);
  const firstSection = sections[0];
  const refs = artifact.protocol.slice(0, 6);
  const sectionPages = sections.slice(1).map((section, index) => `<section class="page p${Math.min(index + 2, 4)}" data-official-template="${template.filename}" style="${frameStyle(index + 1)}">
  <header class="top"><span class="no">${String(index + 2).padStart(2, "0")}</span><span class="label">${escapeHtml(section.title)}</span></header>
  <main class="sheet">
    ${section.pullQuote ? `<div class="titleBlock"><p class="lead">${escapeHtml(section.pullQuote)}</p></div>` : ""}
    <div class="bodyGrid bodyGrid--full"><article class="body"><p>${escapeHtml(section.body)}</p></article></div>
  </main>
</section>`).join("\n");
  return `<style>${extractStyle(template.html)}${zineLayoutGovernanceCss()}</style><section class="page p1" data-official-template="${template.filename}" style="${frameStyle(0)}">
  <header class="top"><span class="no">01</span><span class="label">${escapeHtml(copy.map)}</span></header>
  <main class="sheet">
    <div class="titleBlock"><h1>${kineticTitle(artifact.title, language)}</h1><p class="lead">${escapeHtml(artifact.subtitle)}</p></div>
    <div class="bodyGrid"><article class="body">${firstSection ? `<p>${escapeHtml(firstSection.body)}</p>` : ""}</article><aside class="refs"><b>${escapeHtml(copy.sequence)}</b><small class="sequence-note">${escapeHtml(copy.insufficiencyNote)}</small><ol>${refs.map((item) => `<li>${escapeHtml(item.title)}</li>`).join("")}</ol></aside></div>
  </main>
</section>${sectionPages}<section class="page p4" data-official-template="${template.filename}" style="${frameStyle(sections.length + 1)}">
  <header class="top"><span class="no">06</span><span class="label">${escapeHtml(copy.closing)}</span></header>
  <main class="sheet"><div class="bodyGrid bodyGrid--full"><article class="body">${artifact.protocol.map((item) => `<p><b>${escapeHtml(item.title)}</b> ${escapeHtml(item.body)}</p>`).join("")}${artifact.quietCaveat ? `<p>${escapeHtml(artifact.quietCaveat)}</p>` : ""}</article></div></main>
</section>`;
}

function renderSoftCommons(artifact: DaydreamPublicArtifactContent, template: OfficialTemplateSource): string {
  const sections = artifact.sections.slice(0, 4);
  const protocol = artifact.protocol.slice(0, 4);
  return `<style>${extractStyle(template.html)}</style><div class="grain" data-official-template="${template.filename}"></div><nav><a href="#question">開場</a><a href="#body">篇章</a><a href="#score">尾聲</a></nav><header class="cover"><div class="top"><span>聲音圖譜</span><span>現場讀本</span></div><div class="hero"><h1>${escapeHtml(artifact.title)}</h1><p>${escapeHtml(artifact.subtitle)}</p></div><div class="bottom"><span>影像／聲音／身體／倫理</span><span>可被演奏的關係</span></div></header>
<main>
<section class="page" id="question" data-folio="01"><div class="cols"><div><div class="k">開場</div><h2>${escapeHtml(sections[0]?.title ?? artifact.title)}</h2><p class="lead">${escapeHtml(artifact.proposition)}</p></div><div><p>${escapeHtml(artifact.opening)}</p></div></div></section>
${sections.map((section, index) => `<section class="page ${index % 2 ? "spread" : ""}" id="section-${index + 1}" data-folio="${String(index + 2).padStart(2, "0")}"><div><div class="k">篇章 ${String(index + 1).padStart(2, "0")}</div><h2>${escapeHtml(section.title)}</h2>${section.pullQuote ? `<div class="quote">${escapeHtml(section.pullQuote)}</div>` : ""}<p>${escapeHtml(section.body)}</p></div></section>`).join("\n")}
<section class="page spread" id="score" data-folio="${String(sections.length + 2).padStart(2, "0")}"><div><div class="k">尾聲</div><h2>讓圖像開始發聲。</h2><div class="scoreline">${protocol.map((item) => `<div>${escapeHtml(item.title)}<br>${escapeHtml(item.body)}</div>`).join("")}</div>${artifact.quietCaveat ? `<p class="quote">${escapeHtml(artifact.quietCaveat)}</p>` : ""}</div></section>
</main>`;
}

function renderAinoMotion(artifact: DaydreamPublicArtifactContent, template: OfficialTemplateSource, language: TemplateLanguage): string {
  const copy = templateCopy(language);
  const sections = artifact.sections.slice(0, 4);
  return `<style>${extractStyle(template.html)}</style>${sections.map((section, pageIndex) => `<section class="page p${Math.min(pageIndex + 1, 4)}" data-official-template="${template.filename}">
  <header class="mast"><div class="mark">${escapeHtml(copy.map)}</div><div class="pageNo">${String(pageIndex + 1).padStart(2, "0")}</div><div class="label">${String(pageIndex + 1).padStart(2, "0")}</div></header>
  <main class="grid"><div class="titleCol"><h1>${kineticTitle(pageIndex === 0 ? artifact.title : section.title, language)}</h1><p class="dek">${escapeHtml(pageIndex === 0 ? artifact.subtitle : section.title)}</p><div class="motionRail" aria-hidden="true"><i></i></div></div>
  <article class="textCol"><p>${escapeHtml(pageIndex === 0 ? artifact.opening : section.body)}</p><p>${escapeHtml(pageIndex === 0 ? artifact.proposition : (section.pullQuote ?? artifact.proposition))}</p></article>
  <aside class="indexCol">${pageIndex === 0 ? `<ol>${artifact.protocol.slice(0, 6).map((item) => `<li>${escapeHtml(item.title)}</li>`).join("")}</ol>` : ""}</aside></main><div class="sheetMark" aria-hidden="true"></div>${pageIndex === sections.length - 1 ? `<footer>${escapeHtml(artifact.quietCaveat ?? copy.caveat)}</footer>` : ""}
</section>`).join("\n")}`;
}

export function renderOfficialTemplateArtifactHtml(
  artifact: DaydreamPublicArtifactContent,
  variant: DaydreamHtmlLayoutVariant,
  template: OfficialTemplateSource,
  language: TemplateLanguage = "zh-TW",
): string {
  let html: string;
  if (variant === "pbs-reset-title") html = renderPbsReset(artifact, template, language);
  else if (variant === "soft-commons-zine") html = renderSoftCommons(artifact, template);
  else html = renderAinoMotion(artifact, template, language);
  assertCleanPublicArtifact(html);
  return html;
}
