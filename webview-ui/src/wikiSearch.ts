import { daydreamCorpus } from './daydream/corpus.js';
import type { SourceCard } from './daydream/engine.js';
import { evidenceHygienePenalty, evidenceTextForHygiene, isSpamEvidence, isThinOrEmptyEvidence } from './daydream/evidenceHygiene.js';
import { searchPbsLocalMemory } from './pbsLocalMemory.js';
import { getWikiLinksForInterviewee, type WikiLink } from './wikiLinks.js';

export interface WikiSearchResult {
  title: string;
  url: string;
  description: string;
  sourceFamily: string;
  score: number;
}

function compact(text: string, max = 220): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max).trim()}...` : normalized;
}

const LINK_STOPWORDS = new Set([
  'what', 'want', 'with', 'from', 'about', 'this', 'that', 'there', 'their', 'have', 'will', 'would', 'could', 'should', 'how', 'why', 'the', 'and',
  '什麼', '這個', '那個', '知道', '請問', '如何', '為什麼', '可以', '不是', '是否', '有關', '相關', '連結', '來源', '問題', '東西', '類似', '玩類',
]);

const KEYWORD_HINT_PATTERNS = [
  /[「『\"]([^」』\"]{2,60})[」』\"]/g,
  /\b([A-Z][A-Za-z0-9]*(?:[ -][A-Za-z0-9]+){1,5})\b/g,
];

function strictTokens(text: string): string[] {
  const normalized = text.toLowerCase();
  const latinTokens = normalized
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length >= 3 && !/[\u3400-\u9fff]/u.test(token) && !LINK_STOPWORDS.has(token));
  const cjkRuns = normalized.match(/[\u3400-\u9fff]{2,}/gu) ?? [];
  const cjkTokens = cjkRuns.flatMap((run) => {
    const out: string[] = [];
    for (const size of [2, 3, 4]) {
      for (let index = 0; index <= run.length - size; index += 1) {
        const token = run.slice(index, index + size);
        if (!LINK_STOPWORDS.has(token)) out.push(token);
      }
    }
    return out;
  });
  return Array.from(new Set([...latinTokens, ...cjkTokens]));
}

function strictLinkScore(queryTokens: string[], result: WikiSearchResult): { score: number; matches: number } {
  if (queryTokens.length === 0) return { score: 0, matches: 0 };
  const title = result.title.toLowerCase();
  const haystack = `${result.title} ${result.description} ${result.sourceFamily} ${result.url}`.toLowerCase();
  return queryTokens.reduce((acc, token) => {
    if (!haystack.includes(token)) return acc;
    return { score: acc.score + (title.includes(token) ? 3 : 1), matches: acc.matches + 1 };
  }, { score: 0, matches: 0 });
}

function keywordHintQueries(text: string): string[] {
  const hints: string[] = [];
  for (const pattern of KEYWORD_HINT_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const value = String(match[1] ?? '').trim();
      if (value.length >= 2 && !/^Source fragment/i.test(value)) hints.push(value);
    }
  }
  return Array.from(new Set(hints)).slice(0, 4);
}

function filterRelevantLinks(query: string, results: WikiSearchResult[], limit: number): WikiSearchResult[] {
  const originalTokens = strictTokens(query);
  if (originalTokens.length === 0) return [];
  const minimumMatches = originalTokens.length >= 4 ? 2 : 1;
  const strictMatches = results
    .map((result) => ({ result, strict: strictLinkScore(originalTokens, result) }))
    .filter(({ strict }) => strict.matches >= minimumMatches)
    .sort((a, b) => (b.strict.matches - a.strict.matches) || (b.strict.score - a.strict.score) || (b.result.score - a.result.score))
    .slice(0, limit)
    .map(({ result, strict }) => ({ ...result, score: result.score + strict.score * 1000 }));
  if (strictMatches.length > 0) return strictMatches;

  // The answer generator can correctly use expanded/retrieved context even when the literal
  // user sentence is broad or translated. Do not hide all source links in that case: show the
  // strongest bundled-memory hits as a transparent reading trail instead of an empty UI.
  return results
    .filter((result) => result.score > 0 && result.url)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function sourceFamily(card: Partial<SourceCard>): string {
  const source = String(card.source ?? '').toLowerCase();
  const text = `${card.title ?? ''} ${card.path ?? ''} ${card.url ?? ''}`.toLowerCase();
  if (source === 'sgmk' || text.includes('sgmk')) return 'SGMK';
  if (source === 'hackteria' || text.includes('hackteria')) return 'Hackteria';
  if (text.includes('fabricademy')) return 'Fabricademy';
  if (text.includes('textiltronics') || text.includes('attempts-failures-trials-and-errors')) return 'Textiltronics';
  if (text.includes('modernbodyfestival') || text.includes('modern body')) return 'Modern Body Festival';
  if (text.includes('valldaura')) return 'Valldaura / Green Fab Lab';
  if (text.includes('okiwonderlab') || text.includes('oki wonder lab') || text.includes('ryuoyama')) return 'Oki Wonder Lab';
  if (source === 'htgwyw' || text.includes('kobakant') || text.includes('how to get what you want')) return 'HOW TO GET WHAT YOU WANT / KOBAKANT';
  return card.source || 'Wiki';
}


function personaSourceHint(personaId?: string): string {
  switch (personaId) {
    case 'ted-hung':
      return 'KUBU Kulturhus Björkboda membership ledger Discord transparency trust community governance open accounting Fablab';
    case 'jonathan-minchin':
      return 'Jonathan Minchin Valldaura Green Fab Lab GreenFabLab forest agriculture open source beehives drones community conservation';
    case 'stelio-manousakis':
    case 'stephanie-pan':
      return 'Modern Body Festival modernbodyfestival performance body technology sound lab workshop festival';
    case 'ryu-oyama':
      return 'Oki Wonder Lab Okiwonderlab Ryu Oyama Okinawa fieldwork island';
    case 'tincuta-heinzel':
      return 'Textiltronics Attempts Failures Trials Errors e-textile failure curatorial textile electronics';
    default:
      return '';
  }
}

function personaAllowedSource(result: WikiSearchResult, personaId?: string): boolean {
  if (!personaId) return true;
  const haystack = `${result.title} ${result.description} ${result.sourceFamily} ${result.url}`.toLowerCase();
  switch (personaId) {
    case 'ted-hung':
      return /kubu|björkboda|bjoerkboda|discord|membership|member|ledger|account|透明|帳本|fablab/.test(haystack);
    case 'jonathan-minchin':
      return /green fab lab|greenfablab|valldaura|beehive|drone|forest|conservation/.test(haystack);
    case 'stelio-manousakis':
    case 'stephanie-pan':
      return /modern body|modernbodyfestival|performance|festival|body|sound/.test(haystack);
    case 'ryu-oyama':
      return /oki wonder|okiwonderlab|ryuoyama|okinawa|island/.test(haystack);
    case 'tincuta-heinzel':
      return /textiltronics|attempts|failures|trials|errors|e-textile|textile/.test(haystack);
    default:
      return true;
  }
}

function familyPenalty(result: WikiSearchResult, personaId?: string): number {
  if (!personaId) return 0;
  const family = result.sourceFamily.toLowerCase();
  if (personaId === 'ted-hung' && /fabricademy/.test(family)) return -1200;
  if (personaId === 'ted-hung' && /kubu|npc wiki/.test(family)) return 700;
  if (personaId === 'jonathan-minchin' && /green fab|valldaura|npc wiki/.test(family)) return 900;
  if ((personaId === 'stelio-manousakis' || personaId === 'stephanie-pan') && /modern body|npc wiki/.test(family)) return 900;
  return 0;
}

function expandQuery(query: string): string {
  const expansions: string[] = [];
  if (/觸控|觸摸|touch|介面|界面|interface|互動|interaction/i.test(query)) {
    expansions.push('touch', 'touchpad', 'interface', 'interfaces', 'interaction', 'physical interface', 'sensor', 'capacitive', 'qtouch', 'HID');
  }
  if (/作品|產品|product|教具|kit|project|work|案例|example/i.test(query)) {
    expansions.push('project', 'workshop', 'prototype', 'experiment', 'toy', 'instrument', 'product', 'kit', 'teaching kit');
  }
  if (/NGM|Non-?Governmental Matters|國際網絡|国际网络|international network|社群背景|community background|Hackteria|SGMK|KOBAKANT/i.test(query)) {
    expansions.push('Non-Governmental Matters', 'Hackteria', 'SGMK', 'HOW TO GET WHAT YOU WANT', 'KOBAKANT', 'community network', 'international network', 'workshop', 'camp', 'documentation');
  }
  if (/倫理|伦理|bioethic|bio-?ethic|生命倫理|艺术.*生物|藝術.*生物|art.*bio|bio.*art/i.test(query)) {
    expansions.push('bioart', 'DIY biology', 'wetlab', 'biotechnology', 'Hackteria', 'Open Source Body', 'MedTech-DIY', 'tissue culture', 'biohacking', 'ethics', 'art science');
  }
  if (/camp|營|营|キャンプ|แคมป์|替代教育|alternative education|獨立藝術營|独立艺术营|independent art camp|temporary school|summer school/i.test(query)) {
    expansions.push('camp', 'HackteriaLab', 'temporary commons', 'temporary lab', 'workshop', 'alternative education', 'summer school', 'unconference', 'field school', 'community learning', 'documentation', 'public sharing');
  }
  if (/聲音|音樂|sound|music|樂器|instrument/i.test(query)) {
    expansions.push('sound', 'music', 'musical', 'instrument', 'speaker', 'HID');
  }
  if (/diy|自製|自造|合成器|synth|synthesizer|synthesiser|oscillator|聲音|sound/i.test(query)) {
    expansions.push('diy electronics', 'synth', 'synthesizer', 'oscillator', 'sound circuit', 'speaker', 'ATtiny sound', 'Nandsynth', 'SolarpunkSynth', 'starvation synth', 'HOW TO GET WHAT YOU WANT', 'Kobakant', 'Hackteria');
  }
  if (/穿戴|織品|電子織品|布|身體|體感|失敗|紀錄|文件|可重讀|wearable|e-?textile|textile|fabric|soft|body|embod|somatic|failure|documentation|document/i.test(query)) {
    expansions.push('wearable', 'e-textile', 'textile', 'fabric', 'soft circuit', 'stretch sensor', 'body', 'embodied knowledge', 'body interface', 'skin', 'touch', 'gesture', 'sensing', 'failure notes', 'trials and errors', 'documentation', 're-readable documentation', 'Kobakant', 'HOW TO GET WHAT YOU WANT', 'Fabricademy', 'BadLab', 'Open Source Body', 'MedTech-DIY');
  }
  if (/紅茶菌|康普茶|kombucha|ferment|fermentation|發酵|菌膜|茶菌/i.test(query)) {
    expansions.push('紅茶菌', '康普茶', 'kombucha', 'fermentation', 'ferment', 'SCOBY', 'biofilm', 'cellulose', 'bacterial cellulose', '菌膜', '細菌纖維素');
  }
  if (/kitchen|廚房|厨房|料理|food|meal|hosting|host|餐|cook|cooking|ครัว|キッチン/i.test(query)) {
    expansions.push('Hackteria', 'community kitchen', 'MobileKitchenLab', 'kitchenlab', 'gasigaso kitchen', 'food lab', 'collective meals', 'hosting', 'fermentation', 'kombucha', 'Nata de Coco', 'tofu', 'cuisine', 'SCOBY', 'biofilm', 'bacterial cellulose', 'wetlab', 'biohack');
  }
  if (/care|照護|照料|maintenance|repair|維護|維修|保養|ดูแล|ケア|修理/i.test(query)) {
    expansions.push('care', 'maintenance', 'repair', 'failure notes', 'documentation', 'reuse', 'stewardship', 'protocol');
  }
  if (/public|infrastructure|commons|公共|基礎設施|基盤|โครงสร้างพื้นฐาน/i.test(query)) {
    expansions.push('commons', 'public knowledge', 'shared resource', 'open source', 'documentation', 'community practice', 'maintenance', 'reuse', 'infrastructure');
  }
  return [query, ...expansions].join(' ');
}

function tokens(text: string): string[] {
  const normalized = expandQuery(text).toLowerCase();
  const latinTokens = normalized.split(/[^\p{L}\p{N}]+/u).filter((token) => token.length >= 2 && !/[\u3400-\u9fff]/u.test(token));
  const cjkRuns = normalized.match(/[\u3400-\u9fff]{2,}/gu) ?? [];
  const cjkTokens = cjkRuns.flatMap((run) => {
    const out = [run];
    for (const size of [2, 3, 4]) {
      for (let index = 0; index <= run.length - size; index += 1) out.push(run.slice(index, index + size));
    }
    return out;
  });
  return Array.from(new Set([...latinTokens, ...cjkTokens]));
}

function scoreText(queryTokens: string[], title: string, body: string): number {
  const haystack = `${title} ${body}`.toLowerCase();
  return queryTokens.reduce((sum, token) => {
    if (!haystack.includes(token)) return sum;
    return sum + (title.toLowerCase().includes(token) ? 6 : 2);
  }, 0);
}

function hasThinOrEmptyExtract(text: string): boolean {
  return isThinOrEmptyEvidence(text);
}

function evidenceQuality(card: Partial<SourceCard>): number {
  const text = evidenceTextForHygiene(card);
  if (isSpamEvidence(text)) return -80;
  if (hasThinOrEmptyExtract(text)) return -18;
  const length = String(card.excerpt ?? '').replace(/\s+/g, ' ').trim().length;
  return Math.min(18, Math.floor(length / 80));
}

function cardToResult(card: SourceCard, score: number): WikiSearchResult | null {
  const family = sourceFamily(card);
  if (!card.url) return null;
  if (isSpamEvidence(evidenceTextForHygiene(card))) return null;
  return {
    title: card.title,
    url: card.url,
    description: compact(card.excerpt || [...(card.keywords ?? []), ...(card.tags ?? [])].join(', '), 240),
    sourceFamily: family,
    score,
  };
}

function linkToResult(link: WikiLink, score: number): WikiSearchResult | null {
  if (!link.url) return null;
  if (isSpamEvidence(`${link.title} ${link.description} ${link.url}`)) return null;
  return {
    title: link.title,
    url: link.url,
    description: compact(link.description, 180),
    sourceFamily: 'NPC wiki link',
    score,
  };
}

function collectWikiSearchResults(query: string, personaId?: string, limit = 8): WikiSearchResult[] {
  const queryTokens = tokens(`${query} ${personaSourceHint(personaId)}`);
  if (queryTokens.length === 0) return [];
  const wantsSgmk = /\bsgmk\b|ssam|wiki\.sgmk-ssam\.ch|mechartlab|home made|8bit|gnusbuino/i.test(query);
  const wantsSoundDiy = /diy|自製|自造|合成器|synth|synthesizer|synthesiser|oscillator|sound|speaker|聲音|音樂|樂器/i.test(query);
  const wantsHackteriaKitchen = /kitchen|廚房|厨房|料理|food|meal|hosting|餐|cook|ferment|kombucha|nata|tofu|biohack|bioart|生物藝術|濕實驗室|實驗室/i.test(query);
  const wantsBodyTextile = /穿戴|織品|電子織品|布|身體|體感|皮膚|觸摸|手勢|失敗|紀錄|文件|可重讀|wearable|e-?textile|textile|fabric|body|embod|somatic|skin|gesture|failure|documentation|document/i.test(query);
  const wantsJonathanCommunity = /jonathan|minchin|green fab lab|valldaura/i.test(query);
  const wantsModernBodyCommunity = /stelio|manousakis|stephanie|pan|modern body|modernbodyfestival/i.test(query);
  const wantsTedCommunity = /ted|hung|透明帳本|帳本|ledger|membership|member|discord|kubu|björkboda|bjoerkboda/i.test(query);
  const corpusResults = daydreamCorpus.cards
    .map((card) => {
      const family = sourceFamily(card);
      const baseScore = scoreText(queryTokens, card.title, `${card.excerpt} ${(card.keywords ?? []).join(' ')} ${(card.tags ?? []).join(' ')} ${(card.categories ?? []).join(' ')}`);
      const sgmkBoost = wantsSgmk && family === 'SGMK' ? 60 : 0;
      const soundDiyBoost = wantsSoundDiy && (family === 'Hackteria' || family === 'HOW TO GET WHAT YOU WANT / KOBAKANT') ? 18 : 0;
      const hackteriaKitchenBoost = wantsHackteriaKitchen && family === 'Hackteria' ? 34 : 0;
      const bodyTextileText = `${card.title} ${card.excerpt} ${(card.keywords ?? []).join(' ')} ${(card.tags ?? []).join(' ')}`.toLowerCase();
      const bodyTextileBoost = wantsBodyTextile && /e-?textile|textile|wearable|fabric|soft circuit|stretch sensor|body|embod|somatic|skin|gesture|touch|badlab|open source body|medtech|failure|documentation|trials|errors|kobakant|how to get what you want|fabricademy/i.test(bodyTextileText) ? 42 : 0;
      const communityBoost = (wantsJonathanCommunity && /valldaura|green fab lab/i.test(bodyTextileText)) || (wantsModernBodyCommunity && /modernbodyfestival|modern body festival|modern body/i.test(bodyTextileText)) ? 72 : 0;
      const tedBoost = wantsTedCommunity && /kubu|björkboda|discord|membership|member|ledger|account|community/i.test(bodyTextileText) ? 96 : 0;
      return { card, score: baseScore + sgmkBoost + soundDiyBoost + hackteriaKitchenBoost + bodyTextileBoost + communityBoost + tedBoost + evidenceQuality(card) + evidenceHygienePenalty(evidenceTextForHygiene(card)) };
    })
    .filter((item) => item.score > 0)
    .map((item) => cardToResult(item.card, item.score))
    .filter((item): item is WikiSearchResult => Boolean(item));
  const personaResults = personaId
    ? getWikiLinksForInterviewee(personaId).links
        .map((link) => ({ link, score: scoreText(queryTokens, link.title, link.description) + 80 }))
        .filter((item) => item.score > 1)
        .map((item) => linkToResult(item.link, item.score))
        .filter((item): item is WikiSearchResult => Boolean(item))
    : [];
  const localMemoryResults = searchPbsLocalMemory(query, limit);
  const byUrl = new Map<string, WikiSearchResult>();
  for (const result of [...localMemoryResults, ...personaResults, ...corpusResults]
    .filter((result) => personaAllowedSource(result, personaId))
    .sort((a, b) => (b.score + familyPenalty(b, personaId)) - (a.score + familyPenalty(a, personaId)))) {
    if (!byUrl.has(result.url)) byUrl.set(result.url, result);
  }
  return Array.from(byUrl.values());
}

function dedupeResults(results: WikiSearchResult[]): WikiSearchResult[] {
  const byUrl = new Map<string, WikiSearchResult>();
  for (const result of results.sort((a, b) => b.score - a.score)) {
    if (!byUrl.has(result.url)) byUrl.set(result.url, result);
  }
  return Array.from(byUrl.values());
}

export function searchWikiPages(query: string, personaId?: string, limit = 6): WikiSearchResult[] {
  return filterRelevantLinks(query, collectWikiSearchResults(query, personaId, limit), limit);
}

export function searchWikiPagesWithHints(query: string, hintText = '', personaId?: string, limit = 6): WikiSearchResult[] {
  const primary = searchWikiPages(query, personaId, limit);
  const hintQueries = keywordHintQueries(hintText);
  const hintedResults = hintQueries.flatMap((hint) =>
    filterRelevantLinks(hint, collectWikiSearchResults(hint, personaId, limit), limit)
      .map((result) => ({ ...result, score: result.score + 500 })),
  );
  const merged = dedupeResults([...primary, ...hintedResults]).slice(0, limit);
  if (merged.length > 0) return merged;
  return collectWikiSearchResults(`${query} ${hintText}`, personaId, limit).slice(0, limit);
}
