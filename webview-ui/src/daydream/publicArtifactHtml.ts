import { assertCleanPublicArtifact } from "./artifactGuard.js";
import type { DaydreamPublicArtifactContent } from "./publicArtifactContent.js";

export type DaydreamHtmlLayoutVariant = "pbs-reset-title" | "soft-commons-zine" | "aino-motion-grid";

export const daydreamHtmlLayoutVariants: DaydreamHtmlLayoutVariant[] = [
  "pbs-reset-title",
  "soft-commons-zine",
  "aino-motion-grid",
];

export function pickDaydreamHtmlLayoutVariant(): DaydreamHtmlLayoutVariant {
  return daydreamHtmlLayoutVariants[Math.floor(Math.random() * daydreamHtmlLayoutVariants.length)] ?? "aino-motion-grid";
}

export function renderDaydreamPublicArtifactHtml(
  artifact: DaydreamPublicArtifactContent,
  variant: DaydreamHtmlLayoutVariant,
): string {
  const sections = artifact.sections.slice(0, 4);
  const protocol = artifact.protocol.slice(0, 4);
  const terms = sections.map((section) => section.title).slice(0, 4);
  let html: string;

  if (variant === "pbs-reset-title") {
    html = `
<article class="daydream-html daydream-html--pbs-reset" aria-label="${escapeAttr(artifact.title)}">
  <header class="dd-reset-hero">
    <h1>${escapeHtml(artifact.title)}</h1>
    <p class="dd-subtitle">${escapeHtml(artifact.subtitle)}</p>
  </header>
  <section class="dd-reset-opening">
    <p>${escapeHtml(artifact.opening)}</p>
    <p>${escapeHtml(artifact.proposition)}</p>
  </section>
  <div class="dd-reset-sections">
    ${sections.map((section, index) => `
      <section class="dd-reset-card" style="--dd-i:${index + 1}">
        <p class="dd-number">${String(index + 1).padStart(2, "0")}</p>
        <h2>${escapeHtml(section.title)}</h2>
        ${section.pullQuote ? `<blockquote>${escapeHtml(section.pullQuote)}</blockquote>` : ""}
        <p>${escapeHtml(section.body)}</p>
      </section>`).join("")}
  </div>
  <footer class="dd-reset-protocol">
    ${protocol.map((item) => `<p><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.body)}</span></p>`).join("")}
    ${artifact.quietCaveat ? `<small>${escapeHtml(artifact.quietCaveat)}</small>` : ""}
  </footer>
</article>`;
  } else if (variant === "soft-commons-zine") {
    html = `
<article class="daydream-html daydream-html--soft-commons" aria-label="${escapeAttr(artifact.title)}">
  <header class="dd-soft-head">
    <div>
      <h1>${escapeHtml(artifact.title)}</h1>
    </div>
    <p>${escapeHtml(artifact.subtitle)}</p>
  </header>
  <main class="dd-soft-body">
    <section class="dd-soft-manifesto">
      <p>${escapeHtml(artifact.opening)}</p>
      <p>${escapeHtml(artifact.proposition)}</p>
    </section>
    ${sections.map((section) => `
      <section class="dd-soft-note">
        <h2>${escapeHtml(section.title)}</h2>
        <p>${escapeHtml(section.body)}</p>
      </section>`).join("")}
  </main>
  <aside class="dd-soft-score">
    ${protocol.map((item, index) => `
      <div>
        <span>${String(index + 1).padStart(2, "0")}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.body)}</p>
      </div>`).join("")}
  </aside>
  ${artifact.quietCaveat ? `<p class="dd-soft-caveat">${escapeHtml(artifact.quietCaveat)}</p>` : ""}
</article>`;
  } else {
    html = `
<article class="daydream-html daydream-html--aino-grid" aria-label="${escapeAttr(artifact.title)}">
  <header class="dd-aino-title">
    <h1>${escapeHtml(artifact.title)}</h1>
    <p>${escapeHtml(artifact.subtitle)}</p>
  </header>
  <section class="dd-aino-claim">
    <p>${escapeHtml(artifact.opening)}</p>
    <p>${escapeHtml(artifact.proposition)}</p>
  </section>
  <div class="dd-aino-grid">
    ${sections.map((section, index) => `
      <section>
        <span>${String(index + 1).padStart(2, "0")}</span>
        <h2>${escapeHtml(section.title)}</h2>
        <p>${escapeHtml(section.body)}</p>
      </section>`).join("")}
  </div>
  <footer class="dd-aino-footer">
    <div class="dd-aino-terms">${terms.map((term) => `<span>${escapeHtml(term)}</span>`).join("")}</div>
    <div class="dd-aino-protocol">${protocol.map((item) => `<p><b>${escapeHtml(item.title)}</b> ${escapeHtml(item.body)}</p>`).join("")}</div>
    ${artifact.quietCaveat ? `<small>${escapeHtml(artifact.quietCaveat)}</small>` : ""}
  </footer>
</article>`;
  }

  assertCleanPublicArtifact(html);
  return html;
}

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
