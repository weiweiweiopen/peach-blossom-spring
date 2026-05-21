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
  const copy: Record<AssociationFeedbackLanguage, { title: string; good: string; bad: string }> = {
    "zh-TW": { title: "這份小誌有幫助嗎？", good: "喜歡", bad: "不適合" },
    en: { title: "Was this zine useful?", good: "Loved it", bad: "Not useful" },
    id: { title: "Apakah zine ini berguna?", good: "Suka", bad: "Kurang cocok" },
    de: { title: "War dieses Zine hilfreich?", good: "Gern gelesen", bad: "Nicht passend" },
    ja: { title: "この小誌は役に立ちましたか？", good: "よかった", bad: "合わなかった" },
    th: { title: "ซีนนี้มีประโยชน์ไหม", good: "ชอบ", bad: "ยังไม่ใช่" },
  };
  const selected = copy[language];
  return `<section class="page zine-feedback-page" data-folio="feedback" style="break-before:page;page-break-before:always;min-height:auto;display:block;padding:clamp(14px,3vw,28px);background:#fffaf0;color:#243b3d;">
    <div class="zine-feedback-row" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:0;">
      <h2 style="margin:0;font-size:clamp(18px,3vw,28px);line-height:1.1;">${escapeHtml(selected.title)}</h2>
      <button type="button" data-pbs-zine-feedback="love" class="pbs-zine-button" style="min-width:46px;min-height:46px;padding:8px 10px;color:#000;background:#fff;border:3px solid #000;border-radius:0;box-shadow:4px 4px 0 #000;font:inherit;font-size:16px;line-height:1;touch-action:manipulation;">❤️ ${escapeHtml(selected.good)}</button>
      <button type="button" data-pbs-zine-feedback="broken" data-pbs-feedback-icon="black-broken-heart" class="pbs-zine-button" style="min-width:46px;min-height:46px;padding:8px 10px;color:#000;background:#fff;border:3px solid #000;border-radius:0;box-shadow:4px 4px 0 #000;font:inherit;font-size:16px;line-height:1;touch-action:manipulation;"><span class="pbs-feedback-broken-heart" aria-hidden="true" style="color:#000;font-family:Arial,Helvetica,sans-serif;filter:grayscale(1);">💔︎</span> ${escapeHtml(selected.bad)}</button>
    </div>
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
})();
</script>`;
}
