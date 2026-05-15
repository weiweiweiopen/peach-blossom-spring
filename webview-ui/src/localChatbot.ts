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

export function expandRetrievalQuery(message: string, retrievalContext = ''): string {
  const expandedTerms = intentExpansions.flatMap((entry) => entry.match.test(message) ? entry.terms : []);
  return [message, retrievalContext, ...Array.from(new Set(expandedTerms))].filter(Boolean).join('\n');
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

function naturalFocusTerms(message: string): string {
  const clean = naturalUserMessage(message);
  if (hasCjk(clean)) {
    const chars = cjkCharacters(clean).filter((char) => !'的是你我他她它了嗎呢啊和與或在有'.includes(char));
    return chars.slice(0, 5).join('、') || clean;
  }
  return tokens(clean)
    .filter((word) => !['artist', 'station', 'experimental', 'instrument', 'practice', 'topic', 'hint'].includes(word))
    .slice(0, 5)
    .join('、') || clean;
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
  const { draft, message, knowledge, evidence = [] } = args;
  const cleaned = sanitizeNpcReply(draft, evidence);
  const naturalMessage = naturalUserMessage(message);
  const hasDirectQuestionResponse = cleaned.includes(naturalMessage) || /你問|我會|先|start|try|begin|開始/.test(cleaned);
  const prefix = hasDirectQuestionResponse ? '' : `你問的是「${naturalMessage}」。`;
  const role = knowledge.role.toLowerCase();
  const gesture = role.includes('textile') || role.includes('wearable')
    ? '我會先把材料攤在桌上，摸一下哪裡可以縫、哪裡需要先測。'
    : role.includes('hackteria') || role.includes('hardware') || role.includes('lab')
      ? '我會先把它丟到工作桌上，用便宜工具試一個會失敗的小版本。'
      : '';
  return compact([prefix, gesture, cleaned].filter(Boolean).join(' '), 620);
}

function personaOpening(knowledge: LocalChatKnowledgeBase, message: string): string {
  const role = knowledge.role.toLowerCase();
  const cleanMessage = naturalUserMessage(message);
  const focus = naturalFocusTerms(message);
  if (isLikelyJokeQuestion(message)) {
    return `哈哈，我先把「${cleanMessage}」當成一句半開玩笑的願望，不把它當成功學考題。`;
  }
  if (role.includes('sound') || role.includes('music')) {
    return `你問的是「${cleanMessage}」。我會先把它當成一段聲音來聽：${focus} 哪裡有節奏，哪裡只是噪音。`;
  }
  if (role.includes('textile') || role.includes('fabric') || role.includes('wearable')) {
    return `你問的是「${cleanMessage}」。我會先摸它的材料邊緣：${focus} 哪些能縫、哪些會裂。`;
  }
  if (role.includes('lab') || role.includes('fabrication') || role.includes('research')) {
    return `你問的是「${cleanMessage}」。我會把它放進工作台：先看材料、限制、誰會一起維護。`;
  }
  if (message.length < 12) {
    return `你問的是「${cleanMessage}」。這句話還很短，我會先把它拉開成：${focus} 跟誰、用什麼、在哪裡發生。`;
  }
  return `你問的是「${cleanMessage}」。我先把它拆成 ${focus}，再用我的場域判斷哪一部分可以被測試。`;
}

function isLikelyJokeQuestion(message: string): boolean {
  const normalized = naturalUserMessage(message).toLowerCase();
  const hasBigShortcut = /怎麼變.*(有錢|有名|富|紅)|如何.*(變有錢|出名)|how.*(rich|famous)/.test(normalized);
  const hasAbsurdMoneyAgent = /(兔子|貓|狗|雞|鴨|鳥|魚|老鼠|怪物|外星人|鬼|機器人|電子雞).*(幫我|替我|讓我).*(賺錢|有錢|出名|有名|發財)|(做|造|生|養).*?(兔子|貓|狗|雞|鴨|鳥|魚|怪物|外星人|鬼|機器人|電子雞).*?(賺錢|有錢|出名|有名|發財)/.test(normalized);
  const hasMagicShortcut = /(一夜|突然|躺著|不用工作|自動|魔法|許願).*(賺錢|有錢|出名|有名|發財)/.test(normalized);
  const hasNoConcreteMaterial = !/(預算|收入|作品|專案|材料|技能|客戶|觀眾|deadline|budget|project|skill|client|audience)/i.test(normalized);
  return (hasBigShortcut || hasAbsurdMoneyAgent || hasMagicShortcut) && hasNoConcreteMaterial;
}

function personaGuidance(knowledge: LocalChatKnowledgeBase, message: string): string {
  const lower = message.toLowerCase();
  const asksAboutMoneyOrFame = /有錢|錢|富|收入|資源|有名|名聲|出名|fame|famous|money|rich|income|resource/.test(lower);
  if (isLikelyJokeQuestion(message)) {
    if (/(兔子|貓|狗|雞|鴨|鳥|魚|怪物|外星人|鬼|機器人|電子雞)/.test(naturalUserMessage(message))) {
      return '好，這題我會先笑出來：如果一隻兔子真的會幫你賺錢，我第一個問題不是商業模式，是牠有沒有簽勞動契約。把玩笑留下來吧，它其實在問：你想讓哪個荒謬角色替你承擔現實壓力？';
    }
    if (knowledge.id === 'abao') {
      return '如果你真的要答案，我會說：先發明一個會被朋友笑、但他們還是想轉述的故事。它不一定立刻變收入，但可以測試生活支撐、可見度、名聲和社群交換是不是正在長出來。';
    }
    if (knowledge.id === 'wukir-suryadi') {
      return '我會先敲一下這句話，聽它是不是空心的。也許第一步不是變有名，而是做一個怪到有人願意停下來聽的聲音。';
    }
    if (knowledge.id === 'anastassia-pistofidou') {
      return '我會笑一下，然後把它變成一個課程練習：不要問怎麼突然有錢有名，先問誰願意和你一起做一個小版本，還願意承認它很荒謬。';
    }
    return '我會先笑一下：這題太像把人生丟進販賣機。比較好的玩法是把它改成一個小實驗：先做一個別人願意回應的小東西，測試收入和生活支撐從哪裡來、可見度和名聲會不會變成負擔，以及社群交換能不能讓工作持續。';
  }
  if (asksAboutMoneyOrFame) {
    if (knowledge.id === 'marc-dusseiller') {
      return '如果是我，我不會先追「變有名」；我會先做一個便宜、開放、別人能複製的小東西，帶去工作坊讓朋友改壞、改好。錢比較像後面長出的維護費：誰真的用到、誰願意一起養，才有下一步。';
    }
    if (knowledge.id === 'abao') {
      return '我會把「有錢又有名」拆開看：有錢是能不能讓作品和生活繼續呼吸，有名是別人記得哪一個故事。先做一個很小但有辨識度的作品，讓它被一群真正會回話的人聽見，而不是只追一個很亮的招牌。';
    }
    return '我會先把「有錢」和「有名」拆成兩個可測試的問題：誰會因為你的作品得到幫助，誰願意付出資源讓它繼續發生。先找三個會誠實回應的人，做一個小版本給他們用，再看哪一種支持真的留下來。';
  }
  return '我找到的材料不是要替你下結論，而是幫你決定下一句怎麼問：先做一個小測試，把問題拿去問一個會受影響的人，並記下對方拒絕或補充的部分。';
}

export function localNpcChat(args: {
  message: string;
  retrievalContext?: string;
  knowledge: LocalChatKnowledgeBase;
}): LocalChatReply {
  const { message, retrievalContext = '', knowledge } = args;
  const evidence = retrieveNpcEvidence({ message, retrievalContext, knowledge });
  if (evidence.length === 0) {
    return {
      reply: calibratePersonaReply({ draft: `${knowledge.name}: 我先誠實停一下。以我的角色來說，這題還缺材料；如果你給我一個場景、工具、失敗經驗或想找的人，我才能從訪談稿和網站資料裡把它接起來。`, message, knowledge, evidence }),
      evidence,
    };
  }
  const draft = `${knowledge.name}: ${personaOpening(knowledge, message)} ${personaGuidance(knowledge, message)}`;
  return {
    reply: calibratePersonaReply({ draft, message, knowledge, evidence }),
    evidence,
  };
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
      reply: `${pet.displayName}: 啾。我的肚子裡還沒有足夠材料。下一步小實驗：請餵我一個具體場景、一個可用工具、或一個你已經失敗過的版本；我再把它帶去問 NPC。`,
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
