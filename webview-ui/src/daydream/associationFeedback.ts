export type AssociationFeedbackLanguage = "zh-TW" | "en" | "id" | "de" | "ja" | "th";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderAssociationFeedbackSection(language: AssociationFeedbackLanguage, templateFilename = "01-pbs-reset-title-kinetic.html"): string {
  const copy: Record<AssociationFeedbackLanguage, { title: string; good: string; bad: string; pdf: string }> = {
    "zh-TW": { title: "這份小誌有幫助嗎？", good: "喜歡", bad: "不適合", pdf: "小誌 PDF" },
    en: { title: "Was this zine useful?", good: "Loved it", bad: "Not useful", pdf: "Zine PDF" },
    id: { title: "Apakah zine ini berguna?", good: "Suka", bad: "Kurang cocok", pdf: "PDF zine" },
    de: { title: "War dieses Zine hilfreich?", good: "Gern gelesen", bad: "Nicht passend", pdf: "Zine PDF" },
    ja: { title: "この小誌は役に立ちましたか？", good: "よかった", bad: "合わなかった", pdf: "小誌 PDF" },
    th: { title: "ซีนนี้มีประโยชน์ไหม", good: "ชอบ", bad: "ยังไม่ใช่", pdf: "PDF zine" },
  };
  const selected = copy[language];
  return `<section class="page zine-feedback-page" data-folio="feedback" style="break-before:page;page-break-before:always;min-height:auto;display:block;padding:clamp(14px,3vw,28px);background:#fffaf0;color:#243b3d;"><div class="zine-system-frame">
    <div class="zine-feedback-row" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:0;">
      <h2 style="margin:0;font-size:clamp(18px,3vw,28px);line-height:1.1;">${escapeHtml(selected.title)}</h2>
      <button type="button" data-pbs-zine-feedback="love" class="pbs-zine-button" aria-label="${escapeHtml(selected.good)}" title="${escapeHtml(selected.good)}" style="min-width:46px;min-height:46px;padding:8px 10px;color:#000;background:#fff;border:3px solid #000;border-radius:0;box-shadow:4px 4px 0 #000;font:inherit;font-size:20px;line-height:1;touch-action:manipulation;">❤️</button>
      <button type="button" data-pbs-zine-feedback="broken" data-pbs-feedback-icon="black-broken-heart" class="pbs-zine-button" aria-label="${escapeHtml(selected.bad)}" title="${escapeHtml(selected.bad)}" style="min-width:46px;min-height:46px;padding:8px 10px;color:#000;background:#fff;border:3px solid #000;border-radius:0;box-shadow:4px 4px 0 #000;font:inherit;font-size:20px;line-height:1;touch-action:manipulation;"><span class="pbs-feedback-broken-heart" aria-hidden="true" style="color:#000;font-family:Arial,Helvetica,sans-serif;filter:grayscale(1);">💔︎</span></button>
      <button type="button" data-pbs-zine-pdf class="pbs-zine-button" style="min-width:46px;min-height:46px;padding:8px 12px;color:#000;background:#FCF46B;border:3px solid #000;border-radius:0;box-shadow:4px 4px 0 #000;font:inherit;font-size:16px;font-weight:800;line-height:1;touch-action:manipulation;">${escapeHtml(selected.pdf)}</button>
    </div></div>
  </section><script>
(() => {
  const key = "pbs:zine-page-feedback";
  const language = ${JSON.stringify(language)};
  const template = ${JSON.stringify(templateFilename)};
  document.querySelectorAll("[data-pbs-zine-feedback]").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = {
        value: button.getAttribute("data-pbs-zine-feedback"),
        zineTitle: document.title,
        page: "feedback",
        language,
        template,
        timestamp: Date.now()
      };
      let history = [];
      try { history = JSON.parse(localStorage.getItem(key) || "[]"); } catch {}
      history.push(entry);
      localStorage.setItem(key, JSON.stringify(history.slice(-100)));
      button.setAttribute("aria-pressed", "true");
    });
  });
  const bytes = (text) => new TextEncoder().encode(text);
  const binaryBytes = (binary) => {
    const out = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) out[index] = binary.charCodeAt(index) & 255;
    return out;
  };
  const concat = (chunks) => {
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    chunks.forEach((chunk) => { out.set(chunk, offset); offset += chunk.length; });
    return out;
  };
  const makePdf = (pages) => {
    const chunks = [];
    const offsets = [0];
    const write = (chunk) => chunks.push(typeof chunk === "string" ? bytes(chunk) : chunk);
    const offset = () => chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    write("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    const addObject = (id, body) => { offsets[id] = offset(); write(id + " 0 obj\n"); write(body); write("\nendobj\n"); };
    const pageIds = pages.map((_, index) => 3 + index * 3);
    addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
    addObject(2, "<< /Type /Pages /Kids [" + pageIds.map((id) => id + " 0 R").join(" ") + "] /Count " + pages.length + " >>");
    pages.forEach((page, index) => {
      const pageId = 3 + index * 3;
      const contentId = pageId + 1;
      const imageId = pageId + 2;
      const imageName = "Im" + (index + 1);
      const content = "q " + page.widthPt + " 0 0 " + page.heightPt + " 0 0 cm /" + imageName + " Do Q";
      addObject(pageId, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + page.widthPt + " " + page.heightPt + "] /Resources << /XObject << /" + imageName + " " + imageId + " 0 R >> >> /Contents " + contentId + " 0 R >>");
      addObject(contentId, "<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream");
      offsets[imageId] = offset();
      write(imageId + " 0 obj\n<< /Type /XObject /Subtype /Image /Width " + page.pixelWidth + " /Height " + page.pixelHeight + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + page.jpeg.length + " >>\nstream\n");
      write(page.jpeg);
      write("\nendstream\nendobj\n");
    });
    const xref = offset();
    write("xref\n0 " + offsets.length + "\n0000000000 65535 f \n");
    for (let id = 1; id < offsets.length; id += 1) write(String(offsets[id]).padStart(10, "0") + " 00000 n \n");
    write("trailer\n<< /Size " + offsets.length + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF");
    return new Blob([concat(chunks)], { type: "application/pdf" });
  };
  const renderPageToCanvas = async () => {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll("script").forEach((node) => node.remove());
    const css = Array.from(document.styleSheets).map((sheet) => {
      try { return Array.from(sheet.cssRules || []).map((rule) => rule.cssText).join("\n"); } catch { return ""; }
    }).join("\n");
    const width = Math.min(Math.max(document.documentElement.scrollWidth, 900), 1600);
    const height = Math.min(Math.max(document.documentElement.scrollHeight, 1200), 12000);
    const svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + width + "\" height=\"" + height + "\"><foreignObject width=\"100%\" height=\"100%\"><div xmlns=\"http://www.w3.org/1999/xhtml\"><style>" + css + "\nbody{margin:0;background:#fffaf0;}</style>" + clone.innerHTML + "</div></foreignObject></svg>";
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    try {
      const image = new Image();
      image.decoding = "async";
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas unavailable");
      context.fillStyle = "#fffaf0";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      return canvas;
    } finally {
      URL.revokeObjectURL(url);
    }
  };
  const downloadPdf = async () => {
    const canvas = await renderPageToCanvas();
    const widthPt = 595;
    const heightPt = 842;
    const sliceHeight = Math.floor(canvas.width * heightPt / widthPt);
    const pages = [];
    for (let y = 0; y < canvas.height; y += sliceHeight) {
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.min(sliceHeight, canvas.height - y);
      const context = pageCanvas.getContext("2d");
      if (!context) throw new Error("canvas unavailable");
      context.fillStyle = "#fffaf0";
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      context.drawImage(canvas, 0, y, pageCanvas.width, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height);
      const jpeg = binaryBytes(atob(pageCanvas.toDataURL("image/jpeg", 0.86).split(",")[1] || ""));
      pages.push({ jpeg, pixelWidth: pageCanvas.width, pixelHeight: pageCanvas.height, widthPt, heightPt: Math.round(widthPt * pageCanvas.height / pageCanvas.width) });
    }
    const blob = makePdf(pages);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = (document.title || "pbs-zine").replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u30ff\u0e00-\u0e7f_-]+/gi, "-").replace(/^-|-$/g, "").slice(0, 80) + ".pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  document.querySelectorAll("[data-pbs-zine-pdf]").forEach((button) => {
    button.addEventListener("click", async () => {
      try { await downloadPdf(); } catch (error) { console.warn("PBS PDF download failed, falling back to print", error); window.print(); }
    });
  });
})();
</script>`;
}
