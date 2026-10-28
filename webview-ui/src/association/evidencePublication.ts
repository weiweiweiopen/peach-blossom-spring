import type { LanguageCode } from '../i18n.js';
import { EVIDENCE_COPY } from '../evidence/pagesEvidence.js';
import type { EvidencePacket, SupportedStatement } from '../evidence/sourceCorpus.js';
import { ANSWER_COPY, type AnswerRecord } from '../evidence/answerRecord.js';

export interface EvidencePublication {
  id: string;
  query: string;
  language: LanguageCode;
  createdAt: string;
  packet: EvidencePacket;
  sections: Array<{ title: string; statements: SupportedStatement[] }>;
  answerRecord?: AnswerRecord;
}
export const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Export only font faces; legacy game layout must never enter publication HTML. */
export function publicationFontCss(): string {
  if (typeof document === 'undefined') return '';
  const faces: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule.type !== CSSRule.FONT_FACE_RULE) continue;
        faces.push(rule.cssText.replace(/url\(["']?([^"')]+)["']?\)/g, (_match, url: string) => `url("${new URL(url, sheet.href ?? document.baseURI).href}")`));
      }
    } catch { /* Third-party stylesheets are not part of the publication template. */ }
  }
  return faces.join('\n');
}

export function renderEvidencePublication(publication: EvidencePublication, fontCss = ''): string {
  const { packet, language } = publication;
  const copy = EVIDENCE_COPY[language];
  const research = publication.answerRecord?.research;
  if (!research && (!publication.sections.length || publication.sections.some((section) => !section.statements.length))) throw new Error('empty_publication');
  const used = research ? publication.answerRecord!.sources.map((source) => source.sourceId) : [...new Set(publication.sections.flatMap((section) => section.statements.map((claim) => claim.passageId)))];
  const citation = (id: string) => {
    if (!packet.passages.some((passage) => passage.id === id)) throw new Error('missing_publication_passage');
    return used.indexOf(research ? packet.passages.find((passage) => passage.id === id)!.sourceId : id) + 1;
  };
  const sections = (research ? research.sections.map((section) => ({ title: section.title, content: section.items.map((item) => `<p>${item.role !== 'fact' ? `<small>${escapeHtml(ANSWER_COPY[language][item.role])} · </small>` : ''}${escapeHtml(item.text)} ${[...new Set(item.supports.map((support) => citation(support.passageId)))].map((number) => `<a class="citation" href="#reading-${number}">[${number}]</a>`).join(' ')}</p>`).join('') })) : publication.sections.map((section) => ({ title: section.title, content: section.statements.map((claim) => `<p>${claim.kind === 'testimony' ? `<small>${escapeHtml(copy.testimony)} · </small>` : ''}${escapeHtml(claim.text)} <a class="citation" href="#reading-${citation(claim.passageId)}">[${citation(claim.passageId)}]</a></p>`).join('') }))).map((section, index) => `<section class="page" data-official-template="01-pbs-reset-title-kinetic.html"><header class="top"><span class="no">${String(index + 1).padStart(2, '0')}</span><h2 class="label">${escapeHtml(section.title)}</h2></header><article class="sheet">${index === 0 ? `<div class="titleBlock"><h1>${escapeHtml(publication.query)}</h1></div>` : ''}<div class="body">${section.content}</div></article></section>`).join('');
  const references = used.map((id) => {
    const source = research ? publication.answerRecord!.sources.find((entry) => entry.sourceId === id) : undefined;
    const passage = source?.passages[0] ?? packet.passages.find((entry) => entry.id === id)!;
    const safeUrl = /^https?:\/\//i.test(passage.url) ? passage.url : '';
    const quotes = source ? [...new Set(source.quotations.map((quote) => quote.quote))] : [...new Set(publication.sections.flatMap((section) => section.statements.filter((claim) => claim.passageId === id).map((claim) => claim.quote)))];
    return `<li id="reading-${citation(passage.id)}" data-passage-id="${escapeHtml(passage.id)}" data-source-hash="${escapeHtml(passage.hash)}">${safeUrl ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(passage.title)}</a>` : escapeHtml(copy.testimony)}${quotes.map((quote) => `<blockquote>${escapeHtml(quote)}</blockquote>`).join('')}</li>`;
  }).join('');
  const font = language === 'ja' ? '"Noto Sans JP", sans-serif' : language === 'th' ? '"Noto Sans Thai", sans-serif' : language === 'zh-TW' ? '"Noto Sans TC", sans-serif' : '"FS Pixel Sans", system-ui, sans-serif';
  return `<!doctype html><html lang="${language}" data-publication-id="${escapeHtml(publication.id)}" data-evidence-id="${escapeHtml(packet.id)}" data-corpus-version="${escapeHtml(packet.corpusVersion)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(publication.query)}</title><style>${fontCss}
*{box-sizing:border-box}html{font-family:${font};font-size:18px;line-height:1.65;font-size-adjust:none;color:#315b63;background:#f9e9c2}body{margin:0}.page{max-width:1080px;margin:0 auto;padding:28px;overflow-wrap:anywhere}.top{display:flex;gap:12px;align-items:start;margin-bottom:18px}.no,.label{border:3px solid #315b63;background:#ffd4ff;padding:8px 14px;box-shadow:4px 4px #69c3aa}.no{font-size:30px;line-height:1.2}.label{font-size:20px;line-height:1.5;margin:0;min-width:0}.sheet{background:#fffaf0;border:4px solid #315b63;box-shadow:7px 7px #bac3d9;padding:24px}.titleBlock{border-bottom:3px solid #69c3aa;margin-bottom:24px;padding-bottom:18px}h1{font-size:clamp(28px,4vw,46px);font-weight:400;line-height:1.3;margin:0}p{margin:0 0 1.1em}p:last-child{margin-bottom:0}a{color:inherit;text-underline-offset:.15em}.citation{white-space:nowrap;font-size:.8em}small{font-size:.8em}li{margin-bottom:1.3em}blockquote{font:inherit;font-size:.9em;border-left:3px solid #69c3aa;margin:12px 0;padding:0 14px;white-space:pre-wrap}nav{display:flex;gap:12px;flex-wrap:wrap;max-width:1080px;margin:auto;padding:20px 28px}button,nav a{font:inherit;min-height:44px;padding:8px 14px;border:3px solid #315b63;background:#fcf46b;cursor:pointer;text-decoration:none}.page:nth-of-type(even) .label{background:#69c3aa}
@media(max-width:600px){.page{padding:16px}.sheet{padding:18px}.label{font-size:18px}.no{font-size:24px}nav{padding:16px}html{font-size:17px}}
@page{size:A4 portrait;margin:14mm}@media print{html{font-size:11pt;line-height:1.65;background:white;print-color-adjust:exact;-webkit-print-color-adjust:exact}body{width:auto;height:auto;overflow:visible}nav{display:none!important}.page{max-width:none;padding:0;margin:0 0 7mm;break-inside:auto}.sheet{box-shadow:none;border-width:1pt;padding:5mm;overflow:visible}.top{margin-bottom:4mm;break-after:avoid}.no{font-size:18pt;padding:2mm 3mm}.label{font-size:12pt;padding:2mm 3mm;box-shadow:none}h1{font-size:22pt}.titleBlock{break-inside:avoid;break-after:avoid}p,li{orphans:3;widows:3}h2{break-after:avoid}blockquote{font-size:9pt}a{overflow-wrap:anywhere}}
</style></head><body><nav><button type="button" data-pbs-zine-pdf>${escapeHtml(copy.print)}</button><a download="pbs-zine.html" id="download-html">${escapeHtml(copy.save)}</a></nav>${sections}<section class="page reading"><header class="top"><h2 class="label">${escapeHtml(copy.sources)}</h2></header><div class="sheet"><ol>${references}</ol></div></section><script>
document.querySelector('[data-pbs-zine-pdf]').addEventListener('click',async()=>{await document.fonts.ready;await Promise.all(Array.from(document.images).map(image=>image.decode().catch(()=>{})));window.focus();window.print()});
const link=document.getElementById('download-html');link.href=URL.createObjectURL(new Blob(['<!doctype html>'+document.documentElement.outerHTML],{type:'text/html;charset=utf-8'}));
</script></body></html>`;
}

const SHELF_KEY = 'pbs:verified-publications:v1';
export interface SavedPublication { id: string; title: string; language: LanguageCode; createdAt: string; html: string; evidenceId: string }
export function savedPublications(): SavedPublication[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]'); return Array.isArray(value) ? value.filter((item) => item && typeof item.html === 'string' && typeof item.id === 'string') : []; } catch { return []; }
}
export function savePublication(publication: EvidencePublication, html: string): boolean {
  try {
    const saved: SavedPublication = { id: publication.id, title: publication.query, language: publication.language, createdAt: publication.createdAt, html, evidenceId: publication.packet.id };
    const entries = [saved, ...savedPublications()].slice(0, 8);
    while (entries.length) {
      try {
        localStorage.setItem(SHELF_KEY, JSON.stringify(entries));
        window.dispatchEvent(new Event('pbs:publications-updated'));
        return true;
      } catch { entries.pop(); } // Keep the newest publication when the browser quota is smaller.
    }
    return false;
  } catch { return false; }
}
