import {
  buildKnowledgeBaseEvidenceCandidates,
  buildRetrievalQuery,
  buildSeedCorpusCandidates,
  buildTranscriptEvidenceChunks,
  buildWebsiteCorpus,
  rankEvidence,
  type ChatEvidence,
  type LocalChatKnowledgeBase,
  type WebsiteCorpusRecord,
} from '../localChatbot.js';
import type { FinalDocument, FinalDocumentLogEntry, FinalDocumentMode, Thronglet } from './types.js';

export interface WikiDaydreamSource {
  id: string;
  title: string;
  text: string;
  sourceLabel?: string;
  sourceType?: string;
  url?: string;
  tags?: string[];
  personaAffinity?: string[];
}

export interface WikiDaydreamReportArgs {
  question: string;
  pet?: Pick<Thronglet, 'id' | 'displayName' | 'question' | 'memory' | 'knowledgeJson' | 'problemMaturation'>;
  readingHistory?: WikiDaydreamSource[];
  knowledgeBases?: LocalChatKnowledgeBase[];
  websiteRecords?: WebsiteCorpusRecord[];
  transcriptRecords?: Array<{ id: string; personaName: string; transcript: string }>;
  tick?: number;
  limit?: number;
}

function compact(text: string, max = 360): string {
  const normalized = text.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max).trim()}...` : normalized;
}

function unique<T>(items: T[], key: (item: T) => string): T[] {
  return Array.from(new Map(items.map((item) => [key(item), item])).values());
}

function daydreamMode(question: string): FinalDocumentMode {
  if (/nomadic|hackerspace|fablab|art lab|university lab|meetup|umap|field note|拜訪|田野|國家/i.test(question)) return 'nomadic_research';
  if (/穿在身上|電子小作品|穿戴|wearable|e-?textile|soft circuit/i.test(question)) return 'manufacturing_technical_file';
  if (/找人|連結|旅行|visit|network|people/i.test(question)) return 'travel_plan';
  if (/為什麼|意義|fame|有名|有錢|money|rich/i.test(question)) return 'philosophical_debate';
  return 'story';
}

const modeLabels: Record<FinalDocumentMode, string> = {
  story: 'Wiki Daydream Report',
  poem: 'Wiki Daydream Poem',
  nomadic_research: 'Wiki Nomadic Research',
  manufacturing_technical_file: 'Wiki Daydream Technical File',
  travel_plan: 'Wiki Daydream Travel Plan',
  philosophical_debate: 'Wiki Daydream Debate',
};

function readingHistoryCandidates(readingHistory: WikiDaydreamSource[] = []): Array<Omit<ChatEvidence, 'score'>> {
  return readingHistory.map((item) => ({
    id: `reading-${item.id}`,
    label: item.title,
    text: compact(item.text),
    source: 'wiki' as const,
    sourceLabel: item.sourceLabel ?? item.title,
    sourceType: item.sourceType ?? 'reading-history',
    url: item.url,
    tags: item.tags,
    personaAffinity: item.personaAffinity,
  }));
}

function referencesFromEvidence(evidence: ChatEvidence[]): FinalDocument['references'] {
  return unique(
    evidence
      .filter((item) => item.url)
      .map((item, index) => ({
        label: item.sourceLabel ?? item.label,
        url: item.url!,
        anchorText: ['夢境', '訪談', 'wiki', '手作', '社群', '工具'][index % 6],
      })),
    (item) => item.url,
  ).slice(0, 6);
}

function logFromEvidence(evidence: ChatEvidence[], tick: number): FinalDocumentLogEntry[] {
  return evidence.slice(0, 6).map((item) => ({
    tick,
    speaker: item.sourceLabel ?? item.label,
    text: compact(item.text, 220),
    source: 'a2a' as const,
  }));
}

function bodyFromEvidence(question: string, evidence: ChatEvidence[], mode: FinalDocumentMode): string {
  const top = evidence.slice(0, 5);
  const concepts = unique(top.flatMap((item) => item.tags ?? []), (item) => item.toLowerCase()).slice(0, 8);
  const sourceFrame = top.length
    ? top.map((item, index) => `材料 ${index + 1}：${compact(item.text, 210)}`).join('\n')
    : '材料不足：目前只有原始問題，尚未找到可用 wiki / 訪談 / 閱讀史片段。';
  const conceptLine = concepts.length ? concepts.join('、') : '尚未命名的材料、社群、工具與可測試行動';
  const modeAction: Record<FinalDocumentMode, string> = {
    story: '把資料整理成一個可行的小故事：先做一個最小公開實驗，再觀察誰真的回應。',
    poem: '保留矛盾，但把每個意象綁到一個可驗證材料或人物。',
    nomadic_research: '先做一張可拜訪的本地技術文化地圖：列出活躍證據、intro 需求、設備、開放日、語言、費用與 uMap 節點。',
    manufacturing_technical_file: '先做一個最小原型：一個材料、一個感測或連接方式、一份失敗記錄、一個可分享步驟。',
    travel_plan: '先列出三個可拜訪或可聯繫節點，每個節點都要有一個具體邀請或交換。',
    philosophical_debate: '先區分收入、名聲、社群信任與創作自由；不要把可見度誤認成可持續生活。',
  };
  return [
    `【Wiki Daydream Mode】原始問題：「${compact(question, 120)}」。這份報告只使用閱讀史、訪談、wiki、網站資料與 seed corpus 進行夢境式整理，不呼叫外部 API。`,
    `核心線索：${conceptLine}。`,
    sourceFrame,
    `暫定報告：${modeAction[mode]}`,
    '下一步：選一個 7 天內能完成的小實驗，記錄材料、失敗、遇到的人與下一個可交換問題；資料不足的地方標記為未知，不用來源名稱假裝答案已完成。',
  ].join('\n\n');
}

export function generateWikiDaydreamReport(args: WikiDaydreamReportArgs): FinalDocument {
  const tick = args.tick ?? 0;
  const question = args.question || args.pet?.question.text || 'Untitled daydream';
  const candidates: Array<Omit<ChatEvidence, 'score'>> = [
    ...readingHistoryCandidates(args.readingHistory),
    ...(args.knowledgeBases ?? []).flatMap((knowledge) => buildKnowledgeBaseEvidenceCandidates(knowledge)),
    ...buildWebsiteCorpus(args.websiteRecords ?? []),
    ...(args.transcriptRecords ?? []).flatMap((record) => buildTranscriptEvidenceChunks(record.transcript, record.id, record.personaName)),
    ...buildSeedCorpusCandidates(),
    ...(args.pet?.memory ?? []).map((event) => ({
      id: `memory-${event.id}`,
      label: `${args.pet?.displayName ?? 'pet'} / memory`,
      text: event.text,
      source: 'pet-memory' as const,
    })),
  ];
  const query = buildRetrievalQuery(question, [
    args.pet?.knowledgeJson?.sourceText,
    args.pet?.knowledgeJson?.skillText,
    args.pet?.problemMaturation?.sourceQueries.join(' '),
  ].filter(Boolean).join('\n'));
  const evidence = rankEvidence(query, candidates, args.limit ?? 8);
  const mode = daydreamMode(question);
  const modeLabel = modeLabels[mode];
  const references = referencesFromEvidence(evidence);
  const idBase = args.pet?.id ?? `wiki-daydream-${Math.abs(question.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0))}`;
  return {
    id: `${idBase}-wiki-daydream-${tick}`,
    petId: args.pet?.id ?? 'wiki-daydream',
    tick,
    title: `${modeLabel}: ${compact(question, 42)}`,
    mode,
    modeLabel,
    body: bodyFromEvidence(question, evidence, mode),
    references,
    reviewLog: logFromEvidence(evidence, tick),
    sourceExchangeIds: evidence.map((item) => item.id),
  };
}
