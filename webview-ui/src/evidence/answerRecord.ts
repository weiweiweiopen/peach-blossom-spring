import type { LanguageCode } from '../i18n.js';
import type { EvidencePacket, Passage, SupportedStatement } from './sourceCorpus.js';

export type ItemRole = 'fact' | 'inference' | 'proposal' | 'gap';
export interface ResearchItem { id: string; text: string; role: ItemRole; supports: Array<{ passageId: string; quote: string }> }
export interface ResearchSection { title: string; kind: 'answer' | 'materials' | 'method' | 'connections' | 'comparison' | 'limits' | 'next'; items: ResearchItem[] }
export interface ResearchResult { sections: ResearchSection[]; verified: boolean }
export interface ModelTrace { stage: string; durationMs: number; system: string; input: string; options?: { maxTokens?: number }; output?: unknown; error?: string }
export interface CitationSource {
  index: number; sourceId: string; title: string; url: string; path: string; hash: string;
  capturedAt?: string | null; readAt?: string; kind: Passage['kind'];
  passages: Passage[]; quotations: Array<{ passageId: string; quote: string; supportsItemId: string }>;
}
export interface AnswerRecord {
  schema: 'pbs-answer-record/v1'; id: string; createdAt: string; language: LanguageCode;
  question: string; answer: string; displayAnswer?: string;
  status: 'no_evidence' | 'verified' | 'unverified' | 'character';
  context: { speaker?: string; characterId?: string; characterRole?: string; turns: Array<{ speaker: string; text: string }> };
  evidencePacket?: EvidencePacket; statements: SupportedStatement[]; research?: ResearchResult;
  sources: CitationSource[]; related: CitationSource[]; modelTrace: ModelTrace[];
}

export const ANSWER_COPY: Record<LanguageCode, { export: string; markdown: string; json: string; copy: string; copied: string; copyFailed: string; sources: string; related: string; quotes: string; snapshot: string; fact: string; inference: string; proposal: string; gap: string; question: string; answer: string; context: string; evidence: string; trace: string; scope: string }> = {
  'zh-TW': { export: '輸出本次回答', markdown: '下載研究包 Markdown', json: '下載完整 JSON', copy: '複製給其他 AI', copied: '已複製', copyFailed: '複製未完成，請下載 Markdown', sources: '引用來源', related: '延伸閱讀（未作為支持引用）', quotes: '查看引用原文', snapshot: '資料庫版本', fact: '來源事實', inference: '推論', proposal: '設計提案', gap: '資料缺口', question: '本次問題', answer: '本次回答', context: '必要對話脈絡（不是事實來源）', evidence: '原文證據與支持關係', trace: '生成與核對紀錄', scope: '包含本次答案、必要對話、路徑、網址、原文與 AI 接手指示。' },
  en: { export: 'Export this answer', markdown: 'Download research Markdown', json: 'Download full JSON', copy: 'Copy for another AI', copied: 'Copied', copyFailed: 'Could not copy; download Markdown', sources: 'Cited sources', related: 'Further reading (not supporting citations)', quotes: 'View supporting quotations', snapshot: 'Database snapshot', fact: 'Source fact', inference: 'Inference', proposal: 'Design proposal', gap: 'Evidence gap', question: 'Question', answer: 'Answer', context: 'Conversation context (not factual evidence)', evidence: 'Original evidence and support map', trace: 'Generation and review record', scope: 'Includes the answer, relevant dialogue, paths, URLs, quotations and AI handoff instructions.' },
  id: { export: 'Ekspor jawaban ini', markdown: 'Unduh Markdown penelitian', json: 'Unduh JSON lengkap', copy: 'Salin untuk AI lain', copied: 'Tersalin', copyFailed: 'Gagal menyalin; unduh Markdown', sources: 'Sumber kutipan', related: 'Bacaan lanjutan (bukan bukti pendukung)', quotes: 'Lihat kutipan pendukung', snapshot: 'Versi basis data', fact: 'Fakta sumber', inference: 'Inferensi', proposal: 'Usulan desain', gap: 'Kekurangan bukti', question: 'Pertanyaan', answer: 'Jawaban', context: 'Konteks percakapan (bukan bukti faktual)', evidence: 'Bukti asli dan peta dukungan', trace: 'Catatan pembuatan dan pemeriksaan', scope: 'Memuat jawaban, dialog terkait, jalur, URL, kutipan dan petunjuk untuk AI berikutnya.' },
  de: { export: 'Diese Antwort exportieren', markdown: 'Recherche-Markdown laden', json: 'Vollständiges JSON laden', copy: 'Für eine andere KI kopieren', copied: 'Kopiert', copyFailed: 'Kopieren fehlgeschlagen; Markdown laden', sources: 'Zitierte Quellen', related: 'Weiterlesen (keine Belegzitate)', quotes: 'Belegstellen anzeigen', snapshot: 'Datenbankversion', fact: 'Quellenfakt', inference: 'Schlussfolgerung', proposal: 'Entwurfsvorschlag', gap: 'Beleglücke', question: 'Frage', answer: 'Antwort', context: 'Gesprächskontext (keine Faktenquelle)', evidence: 'Originalbelege und Zuordnung', trace: 'Erstellungs- und Prüfprotokoll', scope: 'Enthält Antwort, relevanten Dialog, Pfade, URLs, Zitate und Übergabehinweise für andere KI.' },
  ja: { export: 'この回答を出力', markdown: '調査用 Markdown を保存', json: '完全な JSON を保存', copy: 'ほかの AI 用にコピー', copied: 'コピーしました', copyFailed: 'コピーできません。Markdown を保存してください', sources: '引用資料', related: '参考資料（記述の直接の根拠ではありません）', quotes: '根拠となる原文を見る', snapshot: 'データベース版', fact: '資料の事実', inference: '推論', proposal: '設計提案', gap: '資料の不足', question: '今回の質問', answer: '今回の回答', context: '会話の文脈（事実の根拠ではありません）', evidence: '原文と記述の対応', trace: '生成・確認の記録', scope: '回答、必要な会話、パス、URL、原文、次の AI への引継ぎ指示を含みます。' },
  th: { export: 'ส่งออกคำตอบนี้', markdown: 'ดาวน์โหลด Markdown การค้นคว้า', json: 'ดาวน์โหลด JSON ฉบับเต็ม', copy: 'คัดลอกให้ AI อื่น', copied: 'คัดลอกแล้ว', copyFailed: 'คัดลอกไม่ได้ โปรดดาวน์โหลด Markdown', sources: 'แหล่งข้อมูลที่อ้างอิง', related: 'อ่านเพิ่มเติม (ไม่ใช่หลักฐานสนับสนุนโดยตรง)', quotes: 'ดูข้อความต้นฉบับที่สนับสนุน', snapshot: 'รุ่นฐานข้อมูล', fact: 'ข้อเท็จจริงจากแหล่งข้อมูล', inference: 'ข้ออนุมาน', proposal: 'ข้อเสนอการออกแบบ', gap: 'ช่องว่างของข้อมูล', question: 'คำถามครั้งนี้', answer: 'คำตอบครั้งนี้', context: 'บริบทการสนทนา (ไม่ใช่หลักฐานข้อเท็จจริง)', evidence: 'หลักฐานต้นฉบับและความสัมพันธ์', trace: 'บันทึกการสร้างและตรวจสอบ', scope: 'รวมคำตอบ บทสนทนาที่เกี่ยวข้อง พาธ URL ข้อความอ้างอิง และคำแนะนำให้ AI ถัดไป' },
};

export function citationSources(packet: EvidencePacket, items: ResearchItem[]): CitationSource[] {
  const used = new Set(items.flatMap((item) => item.supports.map((support) => support.passageId)));
  const sources = new Map<string, CitationSource>();
  for (const passage of packet.passages) {
    if (!used.has(passage.id)) continue;
    let source = sources.get(passage.sourceId);
    if (!source) {
      source = { index: sources.size + 1, sourceId: passage.sourceId, title: passage.title, url: passage.url,
        path: passage.path, hash: passage.hash, capturedAt: passage.capturedAt, readAt: passage.readAt, kind: passage.kind, passages: [], quotations: [] };
      sources.set(passage.sourceId, source);
    }
    source.passages.push(passage);
    for (const item of items) for (const support of item.supports) if (support.passageId === passage.id) {
      if (!source.quotations.some((quote) => quote.quote === support.quote && quote.supportsItemId === item.id)) source.quotations.push({ ...support, supportsItemId: item.id });
    }
  }
  return [...sources.values()];
}

export function researchText(research: ResearchResult, sources: CitationSource[], language: LanguageCode): string {
  const labels = ANSWER_COPY[language];
  return research.sections.map((section) => `${section.title}\n${section.items.map((item) => {
    const citations = sources.filter((source) => source.quotations.some((quote) => quote.supportsItemId === item.id)).map((source) => `[${source.index}]`).join('');
    return `${item.role === 'fact' ? '' : `${labels[item.role]}：`}${item.text}${citations ? ` ${citations}` : ''}`;
  }).join('\n\n')}`).join('\n\n');
}

const records = new Map<string, AnswerRecord>();
export function rememberAnswer(record: AnswerRecord): AnswerRecord {
  records.set(JSON.stringify([record.language, record.question]), record);
  if (records.size > 24) records.delete(records.keys().next().value!);
  return record;
}
export function cachedAnswer(question: string, language: LanguageCode): AnswerRecord | undefined { return records.get(JSON.stringify([language, question])); }

export function makeAnswerRecord(input: Omit<AnswerRecord, 'schema' | 'id' | 'createdAt' | 'sources' | 'related'>): AnswerRecord {
  const items = input.research?.sections.flatMap((section) => section.items) ?? input.statements.map((claim, index) => ({ id: `claim-${index + 1}`, text: claim.text, role: 'fact' as const, supports: [{ passageId: claim.passageId, quote: claim.quote }] }));
  const sources = input.evidencePacket ? citationSources(input.evidencePacket, items) : [];
  const related = new Map<string, CitationSource>();
  for (const passage of input.evidencePacket?.passages ?? []) {
    if (sources.some((source) => source.sourceId === passage.sourceId)) continue;
    if (!related.has(passage.sourceId)) related.set(passage.sourceId, { index: 0, sourceId: passage.sourceId, title: passage.title, url: passage.url, path: passage.path,
      hash: passage.hash, capturedAt: passage.capturedAt, readAt: passage.readAt, kind: passage.kind, passages: [], quotations: [] });
    related.get(passage.sourceId)!.passages.push(passage);
  }
  return rememberAnswer({ ...input, schema: 'pbs-answer-record/v1', id: `answer-${crypto.randomUUID()}`, createdAt: new Date().toISOString(), sources, related: [...related.values()].slice(0, 3) });
}

export function sourceSnapshotUrl(source: CitationSource, packet?: EvidencePacket): string | undefined {
  if (!/^(?:Sources\/Raw|docs\/transcripts_(?:en|zh))\//.test(source.path)) return undefined;
  const revision = packet?.sourceRevision && /^[a-f0-9]{7,40}$/.test(packet.sourceRevision) ? packet.sourceRevision : 'main';
  return `https://github.com/weiweiweiopen/peach-blossom-spring/blob/${revision}/${source.path.split('/').map(encodeURIComponent).join('/')}`;
}

export function exportAnswerJson(record: AnswerRecord): string {
  return JSON.stringify({ ...record, sourceSnapshots: record.sources.map((source) => ({ sourceId: source.sourceId, repositoryUrl: sourceSnapshotUrl(source, record.evidencePacket), linkStatus: 'not_checked', hashBasis: source.kind === 'testimony' ? 'normalized_interview_text' : source.readAt ? 'normalized_live_page_text' : 'raw_markdown' })),
    handoff: { instruction: 'Respond to the ORIGINAL question using the evidence below. Read cited snapshots and relevant linked resources before extending the answer. For making/building tasks, develop an implementable deliverable: materials/BOM, supported assembly and connections, firmware/software and tests where evidence permits. For other questions, use an output structure appropriate to that question. Mark new design as proposal; do not invent pin maps, component values, code compatibility, dates or source support. State missing information and ask a focused question when necessary.',
      roles: { fact: 'Supported by exact original quotations', inference: 'Reasoned from stated evidence, not independently established', proposal: 'A new design suggestion requiring validation', gap: 'Information not found in this evidence set, not proof it does not exist' },
      contextIsNotEvidence: true, externalLinksAreNotReadUnlessRepresentedByAPassage: true, urlAvailability: 'not checked: browser CORS does not reliably expose third-party status',
      modelTrace: 'Request/response data for reproducibility; no credentials or hidden model reasoning are collected.' } }, null, 2);
}

export function exportAnswerMarkdown(record: AnswerRecord): string {
  const copy = ANSWER_COPY[record.language];
  const lines = [`# ${copy.question}`, '', record.question, '', `# ${copy.answer}`, '', record.displayAnswer ?? record.answer, '',
    `- Record: ${record.id}`, `- Status: ${record.status}`, `- Language: ${record.language}`, `- Created: ${record.createdAt}`,
    `- Evidence: ${record.evidencePacket?.id ?? 'none'}`, `- Corpus: ${record.evidencePacket?.corpusVersion ?? 'none'}`, '', `# ${copy.context}`, ''];
  if (record.context.characterRole) lines.push(`Character: ${record.context.characterRole}`, '');
  for (const turn of record.context.turns) lines.push(`**${turn.speaker}**: ${turn.text}`, '');
  lines.push(`# ${copy.evidence}`, '');
  for (const source of record.sources) {
    lines.push(`## [${source.index}] ${source.title}`, '', `- URL: ${source.url || '(supplied account)'}`, `- Path: \`${source.path}\``, `- Hash: \`${source.hash}\``,
      `- Captured: ${source.capturedAt ?? 'unknown'}`, `- Read: ${source.readAt ?? 'archived source'}`, '- Link availability: not checked');
    const snapshot = sourceSnapshotUrl(source, record.evidencePacket);
    if (snapshot) lines.push(`- Snapshot: ${snapshot}`);
    for (const quote of source.quotations) lines.push('', `Supports: ${quote.supportsItemId} / ${quote.passageId}`, '', `> ${quote.quote.replace(/\n/g, '\n> ')}`);
    for (const passage of source.passages) lines.push('', `### Passage ${passage.id} [${passage.start}, ${passage.end})`, '', passage.text);
    const links = [...new Set(source.passages.flatMap((passage) => passage.links ?? []))];
    if (links.length) lines.push('', 'Linked resources (not independently read):', ...links.map((url) => `- ${url}`));
    lines.push('');
  }
  lines.push('# AI handoff', '', 'Continue the ORIGINAL task above. Read original documents and linked code. Produce an implementable result where evidence permits; separate source facts, inferences, design proposals and missing information. Do not treat previous AI dialogue as factual evidence. Do not invent wiring, pin maps, component values or firmware compatibility.', '',
    '# Complete machine-readable research record', '', 'The JSON below includes every selected passage, paths, versions, retrieval decisions, support relationships and generation/review requests and results.', '',
    '```json', exportAnswerJson(record).replace(/```/g, '\\u0060\\u0060\\u0060'), '```', '');
  return lines.join('\n');
}
