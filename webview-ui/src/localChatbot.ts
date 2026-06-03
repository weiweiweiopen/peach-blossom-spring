interface LocalWikiLink {
  title: string;
  url: string;
  description: string;
}

export interface WebsiteCorpusRecord {
  intervieweeId: string;
  name?: string;
  links: LocalWikiLink[];
  excerpts?: Record<string, string>;
}

export interface LocalChatKnowledgeBase {
  id: string;
  name: string;
  role: string;
  intro: string;
  transcript_en: string;
  transcript_zh: string;
  wikiLinks: LocalWikiLink[];
  responses: Record<string, string>;
}

export interface ChatEvidence {
  id: string;
  label: string;
  text: string;
  source: 'persona' | 'transcript' | 'wiki' | 'corpus' | 'a2a';
  sourceLabel?: string;
  sourceType?: string;
  personaAffinity?: string[];
  tags?: string[];
  url?: string;
  score: number;
}


export interface LocalChatReply {
  reply: string;
  evidence: ChatEvidence[];
}

function tokens(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/https?:\/\/\S+/g, ' ')
        .split(/[^\p{L}\p{N}]+/u)
        .filter((word) => word.length >= 2),
    ),
  );
}

function characterBigrams(text: string): string[] {
  const compacted = text.toLowerCase().replace(/https?:\/\/\S+/g, '').replace(/\s+/g, '');
  const bigrams: string[] = [];
  for (let index = 0; index < compacted.length - 1; index++) {
    const pair = compacted.slice(index, index + 2);
    if (/^[\p{L}\p{N}]{2}$/u.test(pair)) bigrams.push(pair);
  }
  return Array.from(new Set(bigrams));
}

function cjkCharacters(text: string): string[] {
  return Array.from(new Set(Array.from(text).filter((char) => /[\p{Script=Han}]/u.test(char))));
}

function compact(text: string, max = 220): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max).trim()}...` : normalized;
}

const forbiddenReplyPatterns = [
  /domain\s*:/i,
  /\bWikipedia\b/i,
  /\bTranscript\s*\d+\b/i,
  /https?:\/\/\S+/i,
  /\bPlayer asked\s*:/i,
  /\bRetrieved\s*:/i,
  /\bEvidence\s*\d+\s*:/i,
  /\bSource type\s*:/i,
];

const intentExpansions: Array<{ match: RegExp; terms: string[] }> = [
  {
    match: /有錢|有名|變得.*(錢|名)|出名|famous|rich|money/i,
    terms: ['income', 'livelihood', 'visibility', 'reputation', 'community exchange', 'sustainable creative work', 'cost of fame', 'small experiment'],
  },
  {
    match: /藝術.*科學.*社群|科學.*藝術.*社群|維持生活|art.*science.*community/i,
    terms: ['art/science collaboration', 'community lab', 'open hardware', 'workshop', 'low-cost tools', 'livelihood', 'sustainable work'],
  },
  {
    match: /穿在身上|電子小作品|穿戴|wearable|e-?textile|soft circuit/i,
    terms: ['wearable technology', 'e-textiles', 'soft circuits', 'DIY electronics', 'small prototype', 'documentation'],
  },
];

export function expandIntent(message: string): string[] {
  return Array.from(new Set(intentExpansions.flatMap((entry) => entry.match.test(message) ? entry.terms : [])));
}

export function buildRetrievalQuery(message: string, retrievalContext = ''): string {
  return [message, retrievalContext, ...expandIntent(message)].filter(Boolean).join('\n');
}

export function expandRetrievalQuery(message: string, retrievalContext = ''): string {
  return buildRetrievalQuery(message, retrievalContext);
}

function hasCjk(text: string): boolean {
  return /[\p{Script=Han}]/u.test(text);
}

function naturalUserMessage(text: string): string {
  const withoutInternalLines = text
    .split('\n')
    .filter((line) => !/^\s*(topic hint|retrieval context)\s*:/i.test(line))
    .join(' ');
  if (!hasCjk(withoutInternalLines)) return compact(withoutInternalLines, 72);
  return compact(
    withoutInternalLines
      .replace(/[A-Za-z][A-Za-z0-9/_-]*(?:\s+[A-Za-z][A-Za-z0-9/_-]*){1,}/g, '')
      .replace(/[A-Za-z][A-Za-z0-9/_-]{3,}/g, '')
      .replace(/[「」『』]\s*[?？]?/g, '')
      .replace(/\s+/g, ' '),
    72,
  );
}

function scoreEvidence(query: string, queryTokens: string[], queryBigrams: string[], item: Omit<ChatEvidence, 'score'>): ChatEvidence {
  const haystack = `${item.label} ${item.text}`.toLowerCase();
  const tokenOverlap = queryTokens.reduce((sum, token) => sum + (haystack.includes(token) ? 2 : 0), 0);
  const phrase = compact(query.toLowerCase(), 80);
  const phraseOverlap = phrase.length >= 4 && haystack.includes(phrase) ? 3 : 0;
  const bigramOverlap = queryBigrams.reduce((sum, pair) => sum + (haystack.includes(pair) ? 0.35 : 0), 0);
  const cjkOverlap = cjkCharacters(query).reduce((sum, char) => sum + (haystack.includes(char) ? 0.3 : 0), 0);
  const sourceBoost = item.source === 'transcript' || item.source === 'a2a' ? 0.05 : 0;
  return { ...item, score: tokenOverlap + phraseOverlap + bigramOverlap + cjkOverlap + sourceBoost };
}

export function rankEvidence(query: string, candidates: Array<Omit<ChatEvidence, 'score'>>, limit = 3): ChatEvidence[] {
  const queryTokens = tokens(query);
  const queryBigrams = characterBigrams(query);
  return candidates
    .map((item) => scoreEvidence(query, queryTokens, queryBigrams, item))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function buildTranscriptEvidenceChunks(transcript: string, prefix: string, personaName: string): Array<Omit<ChatEvidence, 'score'>> {
  const chunks = transcript
    .split(/\n(?=#{1,3}\s*Q\d+|Q\d+[：:]|##\s+)/)
    .flatMap((block) => {
      const normalized = block.replace(/^#+\s*/gm, '').trim();
      if (normalized.length <= 520) return [normalized];
      const pieces: string[] = [];
      for (let index = 0; index < normalized.length; index += 420) pieces.push(normalized.slice(index, index + 520));
      return pieces;
    })
    .map((line) => line.trim())
    .filter((line) => line.length >= 18);
  return chunks.slice(0, 240).map((line, index) => {
    const topic = line.match(/Q\d+[：:]?\s*([^。.!?\n]{0,28})/)?.[1]?.trim();
    return {
      id: `${prefix}-transcript-${index}`,
      label: `${personaName} / transcript ${topic || `chunk ${index + 1}`}`,
      text: compact(line),
      source: 'transcript' as const,
    };
  });
}

export function buildWebsiteEvidenceChunks(record: WebsiteCorpusRecord): Array<Omit<ChatEvidence, 'score'>> {
  const personaName = record.name ?? record.intervieweeId;
  return record.links.map((link, index) => ({
    id: `${record.intervieweeId}-website-${index}`,
    label: `${personaName} / ${link.title}`,
    sourceLabel: link.title,
    sourceType: 'website',
    text: compact([link.description, record.excerpts?.[link.url]].filter(Boolean).join(' ')),
    source: 'wiki' as const,
    url: link.url,
  }));
}

export function buildWebsiteCorpus(records: WebsiteCorpusRecord[]): Array<Omit<ChatEvidence, 'score'>> {
  return records.flatMap((record) => buildWebsiteEvidenceChunks(record));
}

function wikiCandidates(knowledge: LocalChatKnowledgeBase): Array<Omit<ChatEvidence, 'score'>> {
  return buildWebsiteEvidenceChunks({
    intervieweeId: knowledge.id,
    name: knowledge.name,
    links: knowledge.wikiLinks,
  });
}

export function buildKnowledgeBaseEvidenceCandidates(knowledge: LocalChatKnowledgeBase): Array<Omit<ChatEvidence, 'score'>> {
  return [
    ...buildTranscriptEvidenceChunks(`${knowledge.transcript_zh}\n${knowledge.transcript_en}`, knowledge.id, knowledge.name),
    ...wikiCandidates(knowledge),
  ];
}

function stripRetrievalLabels(reply: string, evidence: ChatEvidence[] = []): string {
  let cleaned = reply
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\b(?:domain|Source type|Player asked|Retrieved)\s*:\s*[^。.!?\n]*/gi, '')
    .replace(/\bEvidence\s*\d+\s*:\s*[^。.!?\n]*/gi, '')
    .replace(/\bTranscript\s*\d+\b/gi, '')
    .replace(/\bWikipedia\b/gi, '')
    .replace(/[A-Za-z][A-Za-z0-9_-]+\s*\/\s*[A-Za-z][A-Za-z0-9_/-]+(?:\s+[A-Za-z][A-Za-z0-9_/-]+)*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  for (const item of evidence) {
    for (const label of [item.label, item.sourceLabel].filter(Boolean) as string[]) {
      cleaned = cleaned.split(label).join('').replace(/\s+/g, ' ').trim();
    }
  }
  return cleaned;
}

export function sanitizeNpcReply(reply: string, evidence: ChatEvidence[] = []): string {
  const cleaned = stripRetrievalLabels(reply, evidence);
  return forbiddenReplyPatterns.some((pattern) => pattern.test(cleaned)) ? stripRetrievalLabels(cleaned, evidence) : cleaned;
}

export function calibratePersonaReply(args: {
  draft: string;
  message: string;
  knowledge: LocalChatKnowledgeBase;
  evidence?: ChatEvidence[];
}): string {
  const { draft, evidence = [] } = args;
  const cleaned = sanitizeNpcReply(draft, evidence);
  return compact(cleaned, 620);
}

export function buildLocalGroundedAnswerDraft(args: {
  message: string;
  knowledge: LocalChatKnowledgeBase;
  evidence: ChatEvidence[];
}): string {
  const { message, knowledge, evidence } = args;
  if (evidence.length === 0) {
    return `${knowledge.name}: 離線模式目前沒有找到足夠的 transcript 或 source 片段來回答「${naturalUserMessage(message)}」。`;
  }
  const transcriptEvidence = evidence.find((item) => item.source === 'transcript') ?? evidence[0];
  return `${knowledge.name}: 離線模式只能先整理檢索到的材料，完整自然回答會交給 DeepSeek。${transcriptEvidence.text}`;
}

export function rewriteLocalPersonaVoice(args: {
  draft: string;
  message: string;
  knowledge: LocalChatKnowledgeBase;
  evidence?: ChatEvidence[];
}): string {
  const { draft, message, knowledge, evidence = [] } = args;
  return calibratePersonaReply({ draft: `${knowledge.name}: ${draft}`, message, knowledge, evidence });
}

export function buildNpcReplyWithEvidence(args: {
  message: string;
  retrievalContext?: string;
  knowledge: LocalChatKnowledgeBase;
}): LocalChatReply {
  const { message, retrievalContext = '', knowledge } = args;
  const evidence = retrieveNpcEvidence({ message, retrievalContext, knowledge });
  const draft = buildLocalGroundedAnswerDraft({ message, knowledge, evidence });
  return {
    reply: rewriteLocalPersonaVoice({ draft, message, knowledge, evidence }),
    evidence,
  };
}

export function localNpcChat(args: {
  message: string;
  retrievalContext?: string;
  knowledge: LocalChatKnowledgeBase;
}): LocalChatReply {
  return buildNpcReplyWithEvidence(args);
}

export function retrieveNpcEvidence(args: {
  message: string;
  retrievalContext?: string;
  knowledge: LocalChatKnowledgeBase;
}): ChatEvidence[] {
  const { message, retrievalContext = '', knowledge } = args;
  const retrievalQuery = expandRetrievalQuery(message, retrievalContext);
  const candidates: Array<Omit<ChatEvidence, 'score'>> = [
    ...buildTranscriptEvidenceChunks(`${knowledge.transcript_zh}\n${knowledge.transcript_en}`, knowledge.id, knowledge.name),
    ...wikiCandidates(knowledge),
  ];
  const evidence = rankEvidence(retrievalQuery, candidates, 3);
  const websiteCandidates = candidates.filter((item) => item.source === 'wiki');
  const websiteEvidence = rankEvidence(retrievalQuery, websiteCandidates, 1)[0] ?? (websiteCandidates[0] ? { ...websiteCandidates[0], score: 0 } : undefined);
  if (evidence.length > 0 && websiteEvidence && !evidence.some((item) => item.id === websiteEvidence.id)) {
    evidence.splice(Math.max(0, evidence.length - 1), evidence.length >= 3 ? 1 : 0, websiteEvidence);
  }
  return evidence;
}
