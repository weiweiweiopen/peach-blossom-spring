import type { FinalDocument, Thronglet } from './types.js';

interface EvidenceLike {
  [key: string]: unknown;
  id?: string;
  title: string;
  text?: string;
  description?: string;
  url?: string;
  tags?: string[];
  sourceLabel?: string;
}

interface KnowledgeLike {
  [key: string]: unknown;
  wikiLinks?: Array<{ title: string; url: string; description?: string }>;
}

interface WebsiteRecordLike {
  [key: string]: unknown;
  links?: Array<{ title: string; url: string; description?: string }>;
}

interface WikiDaydreamReportArgs {
  question: string;
  pet?: Pick<Thronglet, 'id'>;
  readingHistory?: EvidenceLike[];
  websiteRecords?: WebsiteRecordLike[];
  knowledgeBases?: KnowledgeLike[];
  tick?: number;
}

function modeFor(question: string): FinalDocument['mode'] {
  if (/穿戴|wearable|電子小作品|prototype|how|怎麼開始/i.test(question)) return 'manufacturing_technical_file';
  if (/藝術|科學|社群|生活|livelihood/i.test(question)) return 'philosophical_debate';
  return 'poem';
}

export function generateWikiDaydreamReport(args: WikiDaydreamReportArgs): FinalDocument {
  const references = [
    ...(args.readingHistory ?? []).map((item) => ({ label: item.title || item.sourceLabel || 'Local reading history', url: item.url ?? `local://${item.id ?? item.title}`, anchorText: item.title || 'Local reading history' })),
    ...(args.knowledgeBases ?? []).flatMap((kb) => kb.wikiLinks ?? []).map((link) => ({ label: link.title, url: link.url, anchorText: link.title })),
    ...(args.websiteRecords ?? []).flatMap((record) => record.links ?? []).map((link) => ({ label: link.title, url: link.url, anchorText: link.title })),
  ].slice(0, 6);
  const evidenceText = [
    ...(args.readingHistory ?? []).map((item) => `${item.title}: ${item.text ?? item.description ?? ''}`),
    ...references.map((reference) => reference.label),
  ].join('\n');
  const mode = modeFor(args.question);
  return {
    id: `${args.pet?.id ?? 'wiki-daydream'}-${args.tick ?? 0}`,
    petId: args.pet?.id ?? 'wiki-daydream',
    tick: args.tick ?? 0,
    title: mode === 'manufacturing_technical_file' ? '最小原型筆記' : '桃花源共享記憶筆記',
    mode,
    modeLabel: mode,
    body: [`原始問題：「${args.question}」`, evidenceText, '最小原型、documentation、社群來源與下一步需要分開檢查。'].join('\n\n'),
    references,
    reviewLog: [],
    sourceExchangeIds: [],
  };
}
