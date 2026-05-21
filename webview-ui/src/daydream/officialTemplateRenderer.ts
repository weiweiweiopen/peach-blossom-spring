import { assertCleanPublicArtifact } from "./artifactGuard.js";
import type { DaydreamPublicArtifactContent } from "./publicArtifactContent.js";
import type { DaydreamHtmlLayoutVariant } from "./publicArtifactHtml.js";

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

function kineticTitle(title: string): string {
  return Array.from(title).map((char, index) => {
    if (/\s/u.test(char)) return " ";
    if (/[,，.。:：/／|｜-]/u.test(char)) return `<span class="kt punct">${escapeHtml(char)}</span>`;
    const dx = ((index % 5) - 2) * 2;
    const dy = (((index + 2) % 5) - 2) * 1.5;
    const delay = `-${(index * 0.024 + 0.02).toFixed(3)}s`;
    return `<span class="kt" style="--d:${delay};--dx:${dx}px;--dy:${dy}px;--amp:${Math.abs(dx) + 2}px;--rot:${(index % 3) - 1}deg;--c:var(--ink);--i:${index}">${escapeHtml(char)}</span>`;
  }).join("");
}

function renderPbsReset(artifact: DaydreamPublicArtifactContent, template: OfficialTemplateSource): string {
  const sections = artifact.sections.slice(0, 4);
  const refs = artifact.protocol.slice(0, 6);
  const sectionPages = sections.map((section, index) => `<section class="page p${Math.min(index + 2, 4)}" data-official-template="${template.filename}">
  <header class="top"><span class="no">${String(index + 2).padStart(2, "0")}</span><span class="label">篇章</span></header>
  <main class="sheet">
    <div class="titleBlock"><h1>${kineticTitle(section.title)}</h1>${section.pullQuote ? `<p class="lead">${escapeHtml(section.pullQuote)}</p>` : ""}</div>
    <div class="bodyGrid bodyGrid--full"><article class="body"><p>${escapeHtml(section.body)}</p></article></div>
  </main>
</section>`).join("\n");
  return `<style>${extractStyle(template.html)}</style><section class="page p1" data-official-template="${template.filename}">
  <header class="top"><span class="no">01</span><span class="label">聲音圖譜</span></header>
  <main class="sheet">
    <div class="titleBlock"><h1>${kineticTitle(artifact.title)}</h1><p class="lead">${escapeHtml(artifact.subtitle)}</p></div>
    <div class="bodyGrid"><article class="body"><p>${escapeHtml(artifact.opening)}</p><p>${escapeHtml(artifact.proposition)}</p></article><aside class="refs"><b>演奏順序</b><ol>${refs.map((item) => `<li>${escapeHtml(item.title)}</li>`).join("")}</ol></aside></div>
  </main>
</section>${sectionPages}<section class="page p4" data-official-template="${template.filename}">
  <header class="top"><span class="no">06</span><span class="label">尾聲</span></header>
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

function renderAinoMotion(artifact: DaydreamPublicArtifactContent, template: OfficialTemplateSource): string {
  const sections = artifact.sections.slice(0, 4);
  return `<style>${extractStyle(template.html)}</style>${sections.map((section, pageIndex) => `<section class="page p${Math.min(pageIndex + 1, 4)}" data-official-template="${template.filename}">
  <header class="mast"><div class="mark">聲音圖譜</div><div class="pageNo">${String(pageIndex + 1).padStart(2, "0")}</div><div class="label">${String(pageIndex + 1).padStart(2, "0")}</div></header>
  <main class="grid"><div class="titleCol"><h1>${kineticTitle(pageIndex === 0 ? artifact.title : section.title)}</h1><p class="dek">${escapeHtml(pageIndex === 0 ? artifact.subtitle : section.title)}</p><div class="motionRail" aria-hidden="true"><i></i></div></div>
  <article class="textCol"><p>${escapeHtml(pageIndex === 0 ? artifact.opening : section.body)}</p><p>${escapeHtml(pageIndex === 0 ? artifact.proposition : (section.pullQuote ?? artifact.proposition))}</p></article>
  <aside class="indexCol">${pageIndex === 0 ? `<ol>${artifact.protocol.slice(0, 6).map((item) => `<li>${escapeHtml(item.title)}</li>`).join("")}</ol>` : ""}</aside></main><div class="sheetMark" aria-hidden="true"></div>${pageIndex === sections.length - 1 ? `<footer>${escapeHtml(artifact.quietCaveat ?? "讓圖像、聲音與倫理一起被聽見。")}</footer>` : ""}
</section>`).join("\n")}`;
}

export function renderOfficialTemplateArtifactHtml(
  artifact: DaydreamPublicArtifactContent,
  variant: DaydreamHtmlLayoutVariant,
  template: OfficialTemplateSource,
): string {
  let html: string;
  if (variant === "pbs-reset-title") html = renderPbsReset(artifact, template);
  else if (variant === "soft-commons-zine") html = renderSoftCommons(artifact, template);
  else html = renderAinoMotion(artifact, template);
  assertCleanPublicArtifact(html);
  return html;
}
