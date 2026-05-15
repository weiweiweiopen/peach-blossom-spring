import type { A2AExchange, Thronglet, ThrongletMemoryEvent } from './simulation/types.js';

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
  source: 'persona' | 'transcript' | 'wiki' | 'corpus' | 'pet-memory' | 'pet-source' | 'a2a';
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
  memoryEvent?: ThrongletMemoryEvent;
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

const corpusSeeds: Array<Omit<ChatEvidence, 'score'>> = [
  {
    id: 'corpus-how-to-get-what-you-want',
    label: 'How To Get What You Want / wearable electronics practice',
    sourceLabel: 'How To Get What You Want seed note',
    sourceType: 'seed-corpus',
    source: 'corpus',
    personaAffinity: ['mika-satomi', 'hannah-perner-wilson', 'giulia-tomasello', 'christian-dils'],
    tags: ['Kobakant', 'Mika Satomi', 'Hannah Perner-Wilson', 'wearable technology', 'e-textiles', 'soft circuits', 'DIY electronics', 'documentation'],
    url: 'https://www.kobakant.at/DIY/',
    text: 'How To Get What You Want is a compact DIY wearable electronics and e-textiles knowledge source associated with Kobakant, Mika Satomi, and Hannah Perner-Wilson. It treats soft circuits, textile sensors, small wearable prototypes, and documentation as practice: start with one touchable circuit, make the wiring visible, write down what failed, and share enough for another person to remake it.',
  },
  {
    id: 'corpus-hackteria',
    label: 'Hackteria / open hardware workshop practice',
    sourceLabel: 'Hackteria seed note',
    sourceType: 'seed-corpus',
    source: 'corpus',
    personaAffinity: ['marc-dusseiller', 'andreas-siagian', 'ryu-oyama', 'jonathan-minchin'],
    tags: ['Hackteria', 'Marc Dusseiller', 'DIY biology', 'open hardware', 'nomadic science', 'workshops', 'community lab', 'art/science collaboration', 'low-cost tools'],
    url: 'https://hackteria.org',
    text: 'Hackteria is a community and wiki-shaped practice around DIY biology, open hardware, nomadic science, low-cost tools, and art/science workshops. It values small labs in backpacks, community labs, documentation, shared protocols, playful failure, and sustainable creative work that grows through workshop invitations and community exchange rather than a single centralized funding machine.',
  },
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

function seedCorpusCandidates(knowledge: LocalChatKnowledgeBase): Array<Omit<ChatEvidence, 'score'>> {
  return corpusSeeds.filter((item) => !item.personaAffinity?.length || item.personaAffinity.includes(knowledge.id));
}

export function buildSeedCorpusCandidates(personaId?: string): Array<Omit<ChatEvidence, 'score'>> {
  return corpusSeeds.filter((item) => !personaId || !item.personaAffinity?.length || item.personaAffinity.includes(personaId));
}

export function buildKnowledgeBaseEvidenceCandidates(knowledge: LocalChatKnowledgeBase): Array<Omit<ChatEvidence, 'score'>> {
  return [
    ...Object.entries(knowledge.responses).map(([key, value]) => ({
      id: `${knowledge.id}-response-${key}`,
      label: `${knowledge.name} / ${key}`,
      text: value,
      source: 'persona' as const,
    })),
    ...buildTranscriptEvidenceChunks(`${knowledge.transcript_zh}\n${knowledge.transcript_en}`, knowledge.id, knowledge.name),
    ...wikiCandidates(knowledge),
    ...seedCorpusCandidates(knowledge),
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
    {
      id: `${knowledge.id}-persona`,
      label: `${knowledge.name} persona`,
      text: compact(`${knowledge.role}. ${knowledge.intro}`),
      source: 'persona' as const,
    },
    ...Object.entries(knowledge.responses).map(([key, value]) => ({
      id: `${knowledge.id}-response-${key}`,
      label: key,
      text: compact(value),
      source: 'persona' as const,
    })),
    ...seedCorpusCandidates(knowledge),
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

export function localPetChat(args: {
  message: string;
  pet: Thronglet;
  exchanges?: A2AExchange[];
  tick?: number;
}): LocalChatReply {
  const { message, pet, exchanges = [], tick = 0 } = args;
  const petExchanges = exchanges.filter((exchange) => exchange.petId === pet.id).slice(0, 5);
  const candidates: Array<Omit<ChatEvidence, 'score'>> = [
    {
      id: `${pet.id}-question`,
      label: 'Original question',
      text: compact(pet.question.text),
      source: 'pet-source' as const,
    },
    {
      id: `${pet.id}-source`,
      label: 'Fed material',
      text: compact(`${pet.knowledgeJson?.sourceText ?? ''} ${pet.knowledgeJson?.skillText ?? ''}`),
      source: 'pet-source' as const,
    },
    ...(pet.memory ?? []).map((memory) => ({
      id: memory.id,
      label: `Memory tick ${memory.tick}`,
      text: compact(memory.text),
      source: 'pet-memory' as const,
    })),
    ...petExchanges.flatMap((exchange) => [
      {
        id: `${exchange.id}-summary`,
        label: `${exchange.targetLabel} exchange`,
        text: compact(exchange.summary),
        source: 'a2a' as const,
      },
      ...(exchange.nutrientSources ?? []).slice(0, 2).map((source, index) => ({
        id: `${exchange.id}-source-${index}`,
        label: source.title,
        text: compact(source.extractedText),
        source: 'a2a' as const,
        url: source.url,
      })),
    ]),
  ].filter((item) => item.text.length > 0);
  const evidence = rankEvidence(message, candidates, 3);
  const memoryEvent: ThrongletMemoryEvent = {
    id: `${pet.id}-local-chat-${tick}-${Date.now().toString(36)}`,
    tick,
    text: `Player asked: ${compact(message, 120)}${evidence[0] ? ` | Retrieved: ${evidence[0].label}` : ''}`,
    significance: evidence.length ? 62 : 35,
  };
  if (evidence.length === 0) {
    return {
      reply: `${pet.displayName}: 啾。我的肚子裡還沒有足夠材料。下一步：請餵我一個具體場景、一個可用工具、或一個你已經失敗過的版本；我再把它帶去問 NPC。`,
      evidence,
      memoryEvent,
    };
  }
  return {
    reply: `${pet.displayName}: 啾，我把材料叼回來了，但先不把來源名稱當答案。下一步行動：把「${pet.question.text}」縮成一個 24 小時內能做的小交換；測試方式是找一個人回應它，如果對方只說「很酷」卻沒有行動，我就把問題拆得更小。`,
    evidence,
    memoryEvent,
  };
}
