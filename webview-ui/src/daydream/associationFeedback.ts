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
  const copy: Record<AssociationFeedbackLanguage, { title: string; useful: string; useless: string; instruction: string; submit: string; submitted: string; pdf: string; pdfLabel: string }> = {
    "zh-TW": { title: "向 LLM 提交故障排修資訊和人工檢驗輔助", useful: "哪些段落、頁名或論點有用？", useless: "哪些部分無用、誤導、重複或缺少證據？", instruction: "希望下一版如何修？", submit: "提交排修並重生小誌", submitted: "已送出，正在重生小誌...", pdf: "列印 / 存 PDF", pdfLabel: "列印或存成 PDF" },
    en: { title: "Send repair notes and human review aid to the LLM", useful: "Which parts, page names, or claims were useful?", useless: "Which parts were useless, misleading, repetitive, or under-evidenced?", instruction: "How should the next version be repaired?", submit: "Submit repair and regenerate", submitted: "Submitted. Regenerating zine...", pdf: "Print / Save PDF", pdfLabel: "Print or save PDF" },
    id: { title: "Kirim catatan perbaikan dan bantuan tinjauan manusia ke LLM", useful: "Bagian, nama halaman, atau klaim mana yang berguna?", useless: "Bagian mana yang tidak berguna, menyesatkan, berulang, atau kurang bukti?", instruction: "Bagaimana versi berikutnya perlu diperbaiki?", submit: "Kirim perbaikan dan buat ulang", submitted: "Terkirim. Membuat ulang zine...", pdf: "Cetak / PDF", pdfLabel: "Cetak atau simpan PDF" },
    de: { title: "Reparaturhinweise und menschliche Pruefung an das LLM senden", useful: "Welche Teile, Seitennamen oder Thesen waren nuetzlich?", useless: "Welche Teile waren unnuetz, irrefuehrend, wiederholt oder zu schwach belegt?", instruction: "Wie soll die naechste Version repariert werden?", submit: "Reparatur senden und neu erzeugen", submitted: "Gesendet. Zine wird neu erzeugt...", pdf: "Drucken / PDF", pdfLabel: "Drucken oder als PDF speichern" },
    ja: { title: "修復情報と人間による検証補助を LLM に送る", useful: "役に立った段落、ページ名、主張はどれですか？", useless: "役に立たない、誤解を招く、反復している、証拠不足の部分はどれですか？", instruction: "次の版をどう修復しますか？", submit: "修復を送信して再生成", submitted: "送信しました。小誌を再生成しています...", pdf: "印刷 / PDF", pdfLabel: "印刷またはPDF保存" },
    th: { title: "ส่งข้อมูลซ่อมและตัวช่วยตรวจมนุษย์ให้ LLM", useful: "ส่วน ชื่อหน้า หรือข้อเสนอใดมีประโยชน์?", useless: "ส่วนใดไม่มีประโยชน์ ชวนเข้าใจผิด ซ้ำ หรือหลักฐานไม่พอ?", instruction: "ฉบับถัดไปควรซ่อมอย่างไร?", submit: "ส่งการซ่อมและสร้างใหม่", submitted: "ส่งแล้ว กำลังสร้างซีนใหม่...", pdf: "พิมพ์ / PDF", pdfLabel: "พิมพ์หรือบันทึก PDF" },
  };
  const selected = copy[language];
  const fieldStyle = "width:100%;min-height:86px;resize:vertical;border:3px solid #000;border-radius:0;padding:14px 16px;background:#fff;color:#243b3d;box-shadow:4px 4px 0 #000;font:inherit;font-size:clamp(15px,1.8vw,20px);line-height:1.45;outline:0;box-sizing:border-box;";
  return `<section class="page zine-feedback-page" data-folio="feedback" style="break-before:auto;page-break-before:auto;min-height:auto;display:block;padding:clamp(14px,3vw,28px);background:#fffaf0;color:#243b3d;"><div class="zine-system-frame">
    <form data-pbs-zine-repair-form style="display:grid;grid-template-columns:minmax(0,1fr);gap:14px;align-items:stretch;margin:0;">
      <h2 style="margin:0;font-size:clamp(24px,3vw,38px);line-height:1.08;color:#111;">${escapeHtml(selected.title)}</h2>
      <textarea data-pbs-zine-repair-useful aria-label="${escapeHtml(selected.useful)}" placeholder="${escapeHtml(selected.useful)}" rows="3" style="${fieldStyle}"></textarea>
      <textarea data-pbs-zine-repair-useless aria-label="${escapeHtml(selected.useless)}" placeholder="${escapeHtml(selected.useless)}" rows="3" style="${fieldStyle}"></textarea>
      <textarea data-pbs-zine-repair-instruction aria-label="${escapeHtml(selected.instruction)}" placeholder="${escapeHtml(selected.instruction)}" rows="3" style="${fieldStyle}"></textarea>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
        <button type="submit" data-pbs-zine-repair-submit class="pbs-zine-button pbs-zine-repair-submit" aria-label="${escapeHtml(selected.submit)}" title="${escapeHtml(selected.submit)}" style="width:auto;max-width:none;min-width:min(100%,280px);height:auto;min-height:64px;padding:12px 18px;color:#000;background:#FCF46B;border:3px solid #000;border-radius:0;box-shadow:4px 4px 0 #000;font-family:Arial,Helvetica,sans-serif;font-size:clamp(16px,1.8vw,22px);font-weight:800;line-height:1.1;display:inline-flex;align-items:center;justify-content:center;touch-action:manipulation;overflow:hidden;">${escapeHtml(selected.submit)}</button>
        <button type="button" data-pbs-zine-pdf class="pbs-zine-button" aria-label="${escapeHtml(selected.pdfLabel)}" title="${escapeHtml(selected.pdf)}" style="width:64px;height:64px;min-width:64px;min-height:64px;padding:0;color:#000;background:#fff;border:3px solid #000;border-radius:0;box-shadow:4px 4px 0 #000;font-family:Arial,Helvetica,sans-serif;font-size:30px;line-height:1;display:inline-flex;align-items:center;justify-content:center;touch-action:manipulation;overflow:hidden;">PDF</button>
      </div>
    </form></div>
  </section><script>
(() => {
  const key = "pbs:zine-repair-feedback";
  const language = ${JSON.stringify(language)};
  const template = ${JSON.stringify(templateFilename)};
  const submitted = ${JSON.stringify(selected.submitted)};
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
  document.querySelectorAll("[data-pbs-zine-repair-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const button = form.querySelector("[data-pbs-zine-repair-submit]");
      const entry = {
        usefulParts: form.querySelector("[data-pbs-zine-repair-useful]")?.value || "",
        uselessParts: form.querySelector("[data-pbs-zine-repair-useless]")?.value || "",
        repairInstruction: form.querySelector("[data-pbs-zine-repair-instruction]")?.value || "",
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
      if (button) {
        button.setAttribute("aria-busy", "true");
        button.textContent = submitted;
        pressButton(button, true);
      }
      window.parent?.postMessage({ type: "pbs:zine-repair-request", payload: entry }, "*");
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
