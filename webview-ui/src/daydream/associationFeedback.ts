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
  const copy: Record<AssociationFeedbackLanguage, { title: string; placeholder: string; good: string; bad: string; pdf: string; pdfLabel: string }> = {
    "zh-TW": { title: "這份小誌有幫助嗎？", placeholder: "寫下留言...", good: "喜歡", bad: "不適合", pdf: "列印 / 存 PDF", pdfLabel: "列印或存成 PDF" },
    en: { title: "Was this zine useful?", placeholder: "Leave a note...", good: "Loved it", bad: "Not useful", pdf: "Print / Save PDF", pdfLabel: "Print or save PDF" },
    id: { title: "Apakah zine ini berguna?", placeholder: "Tulis komentar...", good: "Suka", bad: "Kurang cocok", pdf: "Cetak / PDF", pdfLabel: "Cetak atau simpan PDF" },
    de: { title: "War dieses Zine hilfreich?", placeholder: "Kommentar schreiben...", good: "Gern gelesen", bad: "Nicht passend", pdf: "Drucken / PDF", pdfLabel: "Drucken oder als PDF speichern" },
    ja: { title: "この小誌は役に立ちましたか？", placeholder: "コメントを書く...", good: "よかった", bad: "合わなかった", pdf: "印刷 / PDF", pdfLabel: "印刷またはPDF保存" },
    th: { title: "ซีนนี้มีประโยชน์ไหม", placeholder: "เขียนความเห็น...", good: "ชอบ", bad: "ยังไม่ใช่", pdf: "พิมพ์ / PDF", pdfLabel: "พิมพ์หรือบันทึก PDF" },
  };
  const selected = copy[language];
  return `<section class="page zine-feedback-page" data-folio="feedback" style="break-before:auto;page-break-before:auto;min-height:auto;display:block;padding:clamp(14px,3vw,28px);background:#fffaf0;color:#243b3d;"><div class="zine-system-frame">
    <div class="zine-feedback-row" style="display:grid;grid-template-columns:minmax(0,1fr) 64px 64px 64px;gap:12px;align-items:stretch;margin:0;">
      <label style="margin:0;min-height:64px;display:flex;align-items:stretch;border:3px solid #000;background:#fff;color:#243b3d;box-shadow:4px 4px 0 #000;">
        <span style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">${escapeHtml(selected.title)}</span>
        <textarea data-pbs-zine-comment aria-label="${escapeHtml(selected.title)}" placeholder="${escapeHtml(selected.placeholder)}" rows="1" style="width:100%;min-height:58px;resize:vertical;border:0;border-radius:0;padding:14px 18px;background:#fff;color:#243b3d;font:inherit;font-size:clamp(16px,2.2vw,22px);line-height:1.35;outline:0;box-shadow:none;"></textarea>
      </label>
      <button type="button" data-pbs-zine-feedback="love" class="pbs-zine-button" aria-label="${escapeHtml(selected.good)}" title="${escapeHtml(selected.good)}" style="width:64px;height:64px;min-width:64px;min-height:64px;padding:0;color:#000;background:#fff;border:3px solid #000;border-radius:0;box-shadow:4px 4px 0 #000;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:1;display:inline-flex;align-items:center;justify-content:center;touch-action:manipulation;overflow:hidden;">❤️</button>
      <button type="button" data-pbs-zine-feedback="broken" data-pbs-feedback-icon="black-broken-heart" class="pbs-zine-button" aria-label="${escapeHtml(selected.bad)}" title="${escapeHtml(selected.bad)}" style="width:64px;height:64px;min-width:64px;min-height:64px;padding:0;color:#000;background:#fff;border:3px solid #000;border-radius:0;box-shadow:4px 4px 0 #000;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:1;display:inline-flex;align-items:center;justify-content:center;touch-action:manipulation;overflow:hidden;"><span class="pbs-feedback-broken-heart" aria-hidden="true" style="color:#000;font-family:Arial,Helvetica,sans-serif;filter:grayscale(1);line-height:1;">💔︎</span></button>
      <button type="button" data-pbs-zine-pdf class="pbs-zine-button" aria-label="${escapeHtml(selected.pdfLabel)}" title="${escapeHtml(selected.pdf)}" style="width:64px;height:64px;min-width:64px;min-height:64px;padding:0;color:#000;background:#FCF46B;border:3px solid #000;border-radius:0;box-shadow:4px 4px 0 #000;font-family:Arial,Helvetica,sans-serif;font-size:30px;line-height:1;display:inline-flex;align-items:center;justify-content:center;touch-action:manipulation;overflow:hidden;">📖</button>
    </div></div>
  </section><script>
(() => {
  const key = "pbs:zine-page-feedback";
  const language = ${JSON.stringify(language)};
  const template = ${JSON.stringify(templateFilename)};
  const pressButton = (button, pressed) => {
    button.style.transform = pressed ? "translate(3px, 3px)" : "";
    button.style.boxShadow = pressed ? "1px 1px 0 #000" : "4px 4px 0 #000";
  };
  document.querySelectorAll(".pbs-zine-button").forEach((button) => {
    button.addEventListener("pointerdown", () => pressButton(button, true));
    button.addEventListener("pointerup", () => pressButton(button, false));
    button.addEventListener("pointerleave", () => pressButton(button, false));
    button.addEventListener("keydown", (event) => {
      if (event.key === " " || event.key === "Enter") pressButton(button, true);
    });
    button.addEventListener("keyup", () => pressButton(button, false));
  });
  document.querySelectorAll("[data-pbs-zine-feedback]").forEach((button) => {
    button.addEventListener("click", () => {
      const comment = document.querySelector("[data-pbs-zine-comment]")?.value || "";
      const entry = {
        value: button.getAttribute("data-pbs-zine-feedback"),
        comment,
        zineTitle: document.title,
        page: "feedback",
        language,
        template,
        timestamp: Date.now()
      };
      try {
        let history = [];
        try { history = JSON.parse(localStorage.getItem(key) || "[]"); } catch {}
        history.push(entry);
        localStorage.setItem(key, JSON.stringify(history.slice(-100)));
      } catch (error) {
        console.warn("PBS zine feedback storage unavailable", error);
      }
      button.setAttribute("aria-pressed", "true");
      pressButton(button, true);
    });
  });
  document.querySelectorAll("[data-pbs-zine-pdf]").forEach((button) => {
    button.addEventListener("click", () => {
      button.setAttribute("aria-busy", "true");
      const originalTitle = button.getAttribute("title") || "Print / Save PDF";
      button.setAttribute("title", language === "zh-TW" ? "開啟列印視窗" : "Opening print dialog");
      window.focus();
      window.print();
      setTimeout(() => {
        button.removeAttribute("aria-busy");
        button.setAttribute("title", originalTitle);
      }, 1200);
    });
  });
})();
</script>`;
}
