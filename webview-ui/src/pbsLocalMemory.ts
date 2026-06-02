import type { SourceCard } from './daydream/engine.js';
import pbsLocalMemoryIndex from './generated/pbsLocalMemoryIndex.json';
import type { ChatEvidence } from './localChatbot.js';
import type { WikiSearchResult } from './wikiSearch.js';

interface PbsLocalMemoryItem {
  title: string;
  url: string;
  sourceFamily: string;
  path: string;
  description: string;
}

const curatedLocalMemoryItems: PbsLocalMemoryItem[] = [
  {
    title: 'Giulia Tomasello / ALMA Futura — Xenopia reproductive justice residency',
    url: 'https://almafutura.org/',
    sourceFamily: 'sgmk/hackteria curated',
    path: 'Sources/Raw/sgmk/hacker-in-residence-programme.md',
    description: 'Giulia Tomasello / ALMA Futura collaborated with GaudiLabs and Hackteria ZET on participatory community research around reproductive justice, DIY pregnancy tests, Beta Hcg testing, female healthcare, Xenopia, Future Flora, biotechnology, interactive wearables, feminist technology workshops, access to abortion, and body autonomy. Related public links: https://hackteria.org/wiki/Xenopia https://gitomasello.com/ https://almafutura.org/',
  },
];

const localMemoryItems = [
  ...curatedLocalMemoryItems,
  ...((pbsLocalMemoryIndex as { items?: PbsLocalMemoryItem[] }).items ?? []),
];

function compact(text: string, max = 260): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max).trim()}...` : normalized;
}

function expandQuery(query: string): string {
  const expansions: string[] = [];
  if (/廚房|厨房|kitchen|food|料理|cook|cooking|餐|meal/i.test(query)) {
    expansions.push('kitchen', 'kitchenlab', 'food', 'fermentation', 'microbe', 'bioplastic', 'radical food science', 'gastronomy');
  }
  if (/生物藝術|bioart|biology|生物|wetlab|濕實驗|倫理|bio-?ethic|生命倫理|art.*bio|藝術.*生物/i.test(query)) {
    expansions.push('bioart', 'wetlab', 'DIY biology', 'tissue culture', 'biotechnology', 'Hackteria', 'Open Source Body', 'MedTech-DIY', 'biohacking', 'ethics', 'art science');
  }
  if (/NGM|Non-?Governmental Matters|國際網絡|international network|社群背景|community background|Hackteria|SGMK|KOBAKANT/i.test(query)) {
    expansions.push('Non-Governmental Matters', 'Hackteria', 'SGMK', 'HOW TO GET WHAT YOU WANT', 'KOBAKANT', 'community network', 'international network', 'workshop', 'camp', 'documentation');
  }
  if (/camp|營|替代教育|alternative education|獨立藝術營|independent art camp|temporary school|summer school/i.test(query)) {
    expansions.push('camp', 'HackteriaLab', 'temporary commons', 'temporary lab', 'workshop', 'alternative education', 'summer school', 'unconference', 'field school', 'community learning', 'documentation');
  }
  if (/發酵|ferment|fermentation|microbe|微生物/i.test(query)) {
    expansions.push('fermentation', 'microbe', 'yeast', 'fungus', 'Sato', 'culture');
  }
  if (/織品|電子織品|textile|e-?textile|wearable|sensor|感測|穿戴|身體|體感|皮膚|觸摸|手勢|失敗|紀錄|文件|可重讀|body|embod|somatic|skin|touch|gesture|failure|documentation|document/i.test(query)) {
    expansions.push('textile', 'e-textile', 'sensor', 'soft circuit', 'wearable', 'Kobakant', 'HOW TO GET WHAT YOU WANT', 'body', 'embodied knowledge', 'skin', 'touch', 'gesture', 'stretch sensor', 'failure notes', 'trials and errors', 'documentation', 'BadLab', 'Open Source Body', 'MedTech-DIY');
  }
  if (/女性主義|女性|女權|生殖|月經|懷孕|照護|身體自主|femini|cyberfem|reproductive|menstrual|pregnancy|abortion|healthcare|care|alma|giulia|xenopia|flora/i.test(query)) {
    expansions.push('feminist technology', 'feminist technoscience', 'reproductive justice', 'female healthcare', 'menstrual care', 'pregnancy test', 'DIY pregnancy tests', 'body autonomy', 'care protocols', 'Giulia Tomasello', 'ALMA Futura', 'Xenopia', 'Future Flora', 'Kobakant', 'wearables', 'biotechnology');
  }
  if (/open|開源|開放|開放科學|hardware|硬體|lab|實驗室|temporary|臨時|公共|基礎設施|commons/i.test(query)) {
    expansions.push('open science', 'open hardware', 'open knowledge', 'temporary lab', 'community lab', 'workshop', 'commons', 'documentation');
  }
  if (/印尼|印度尼西亞|indonesia|indonesian|jakarta|yogyakarta|jogja|bandung|surabaya/i.test(query)) {
    expansions.push('Indonesia', 'Indonesian', 'Yogyakarta', 'Jogja', 'Jakarta', 'Bandung', 'Surabaya', 'Lifepatch', 'ISI Yogyakarta');
  }
  if (/城市|都市|urban|city|cities/i.test(query)) {
    expansions.push('urban', 'city', 'cities', 'local', 'neighborhood', 'civic');
  }
  return [query, ...expansions].join(' ');
}

function tokens(text: string): string[] {
  const normalized = expandQuery(text).toLowerCase();
  const latin = normalized.split(/[^\p{L}\p{N}]+/u).filter((token) => token.length >= 2 && !/[\u3400-\u9fff]/u.test(token));
  const cjkRuns = normalized.match(/[\u3400-\u9fff]{2,}/gu) ?? [];
  const cjk = cjkRuns.flatMap((run) => {
    const out = [run];
    for (const size of [2, 3, 4]) {
      for (let index = 0; index <= run.length - size; index += 1) out.push(run.slice(index, index + size));
    }
    return out;
  });
  return Array.from(new Set([...latin, ...cjk]));
}

function scoreItem(queryTokens: string[], item: PbsLocalMemoryItem): number {
  const title = item.title.toLowerCase();
  const primaryText = `${item.title} ${item.description}`.toLowerCase();
  const metadataText = `${item.sourceFamily} ${item.url} ${item.path}`.toLowerCase();
  const directScore = queryTokens.reduce((sum, token) => {
    if (!primaryText.includes(token)) return sum;
    return sum + (title.includes(token) ? 8 : 2);
  }, 0);
  const metadataTieBreak = directScore > 0 ? queryTokens.reduce((sum, token) => sum + (metadataText.includes(token) ? 0.25 : 0), 0) : 0;
  const haystack = primaryText;
  const familyBoost = 0;
  const joinedQuery = queryTokens.join(' ');
  const wantsIndonesia = /印尼|印度尼西亞|indonesia|indonesian|yogyakarta|jogja|jakarta|bandung|surabaya|lifepatch|isi/.test(joinedQuery);
  const indonesiaBoost = wantsIndonesia ? (/indonesia|indonesian|yogyakarta|jogja|jakarta|bandung|surabaya|lifepatch|isi\s*,?\s*yogyakarta/i.test(haystack) ? 56 : -18) : 0;
  const bodyTextileBoost = /織品|電子織品|穿戴|身體|體感|皮膚|觸摸|手勢|失敗|紀錄|文件|可重讀|textile|e-?textile|wearable|body|embod|somatic|skin|touch|gesture|failure|documentation|document/i.test(joinedQuery) && /textile|e-?textile|wearable|fabric|soft circuit|stretch sensor|body|embod|somatic|skin|touch|gesture|failure|trials|errors|documentation|kobakant|how to get what you want|badlab|open source body|medtech/i.test(haystack) ? 24 : 0;
  const soundDiyBoost = /diy|自製|自造|合成器|synth|sound|聲音|音樂|樂器/i.test(joinedQuery) && /sgmk|synth|sound|music|instrument|speaker|8bit|nandsynth|gnusbuino|mechartlab|home made|diy electronics|handmade electronics/i.test(haystack) ? 28 : 0;
  const campEducationBoost = /camp|營|alternative|education|替代教育|獨立藝術營|independent art/i.test(joinedQuery) && /camp|hackterialab|workshop|summer school|field|community|education|unconference|commons|colabs/i.test(haystack) ? 22 : 0;
  const networkBoost = /ngm|hackteria|sgmk|kobakant|fabricademy|textile academy|network|國際|社群/i.test(joinedQuery) && /hackteria|sgmk|kobakant|fabricademy|textile academy|how to get what you want|network|community|colabs|flick the world/i.test(haystack) ? 18 : 0;
  const feministTechBoost = /女性主義|女性|女權|生殖|月經|懷孕|照護|身體自主|femini|cyberfem|reproductive|menstrual|pregnancy|abortion|healthcare|care|alma|giulia|xenopia|flora/i.test(joinedQuery) && /giulia tomasello|alma futura|xenopia|future flora|reproductive justice|female.?s healthcare|pregnancy test|beta hcg|abortion|menstrual|feminist|cyberfem|feminist technoscience|biomenstrual|wearable|body|care/i.test(haystack) ? 72 : 0;
  const fabricademyBoost = /fabricademy|textile academy|skin electronics|soft robotics|textile scaffold|bio.?dyes|circular fashion/i.test(joinedQuery) && /fabricademy|textile academy|wearables|soft circuit|skin electronics|soft robotics|textile scaffold|bio.?dyes|circular fashion/i.test(haystack) ? 34 : 0;
  const genericFabricademyPenalty = item.sourceFamily.toLowerCase() === 'fabricademy' && !/fabricademy|textile academy|skin electronics|soft robotics|bio.?dyes|circular fashion|computational couture|digital bodies/i.test(joinedQuery) ? -120 : 0;
  const commonIrrelevantPenalty = !/gaudilabs|micro.?residency|ai|qwen|install party|abao|shih|惟捷|hackteria|sgmk/i.test(joinedQuery) && /abao in gaudilabs micro-residency|ai@sgmk/i.test(haystack) ? -200 : 0;
  const newSourceBoost = /attempts|failures|trials|errors|textiltronics|modern body|vortex|valldaura|green fab lab|oki wonder lab|okiwonderlab|okinawa|isolation|jonathan|minchin|stelio|manousakis|stephanie|pan/i.test(joinedQuery) && /textiltronics|attempts|failures|trials|errors|tttlabs|ttt-labs|bioferal|terrabytes|modernbody|modern body|vortex|valldaura|green fab lab|okiwonderlab|oki wonder lab|okinawa|isolation/i.test(haystack) ? 36 : 0;
  const personaCommunityBoost = ((/jonathan|minchin/i.test(joinedQuery) && /valldaura|green fab lab/i.test(haystack)) || (/stelio|manousakis|stephanie|pan/i.test(joinedQuery) && /modernbody|modern body festival|modern body/i.test(haystack))) ? 64 : 0;
  const topicalBoost = bodyTextileBoost + soundDiyBoost + campEducationBoost + networkBoost + feministTechBoost + fabricademyBoost + newSourceBoost + personaCommunityBoost;
  if (directScore <= 0 && topicalBoost <= 0) return 0;
  return directScore + metadataTieBreak + familyBoost + topicalBoost + indonesiaBoost + genericFabricademyPenalty + commonIrrelevantPenalty;
}

export function searchPbsLocalMemory(query: string, limit = 6): WikiSearchResult[] {
  const queryTokens = tokens(query);
  if (queryTokens.length === 0) return [];
  return localMemoryItems
    .map((item) => ({ item, score: scoreItem(queryTokens, item) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item, score }) => ({
      title: item.title,
      url: item.url || `${import.meta.env.BASE_URL}${item.path}`,
      description: compact(item.description, 240),
      sourceFamily: `PBS community memory / ${item.sourceFamily}`,
      score,
    }));
}

export function retrievePbsLocalMemoryEvidence(query: string, limit = 3): ChatEvidence[] {
  return searchPbsLocalMemory(query, limit).map((item, index) => ({
    id: `pbs-local-memory-${index}-${item.title}`,
    label: item.title,
    text: compact(item.description, 360),
    source: 'corpus',
    sourceLabel: item.title,
    sourceType: item.sourceFamily,
    url: item.url,
    tags: ['pbs-local-memory'],
    score: item.score,
  }));
}

export function pbsLocalMemorySourceCards(limit = 80): SourceCard[] {
  return localMemoryItems.slice(0, limit).map((item, index) => ({
    id: `pbs-local-memory:${item.path || index.toString()}`,
    title: item.title,
    excerpt: compact(item.description, 1200),
    keywords: [item.sourceFamily, 'PBS community memory', 'public wiki memory'],
    tags: ['pbs-local-memory', item.sourceFamily],
    source: `PBS community memory / ${item.sourceFamily}`,
    url: item.url,
    path: item.path,
    semanticLayer: 'community memory',
  }));
}

export function buildStaticLocalMemoryAnswer(query: string, results: WikiSearchResult[], language = 'zh-TW'): string {
  const empty: Record<string, string> = {
    'zh-TW': '我目前在本地記憶包裡沒有找到足夠線索；請換成更具體的材料、方法、社群或場域關鍵字。',
    en: 'I could not find enough local-memory evidence yet. Try a more concrete material, method, community, or place keyword.',
    id: 'Saya belum menemukan cukup bukti di paket memori lokal. Coba kata kunci material, metode, komunitas, atau tempat yang lebih konkret.',
    de: 'Ich finde im lokalen Erinnerungspaket noch nicht genug Hinweise. Versuche ein konkreteres Material, eine Methode, Community oder einen Ort.',
    ja: 'ローカル記憶パックには、まだ十分な手がかりが見つかりません。素材、方法、コミュニティ、場所をもう少し具体的にしてください。',
    th: 'ฉันยังไม่พบหลักฐานพอในชุดความทรงจำ local ลองใช้คำสำคัญที่เฉพาะขึ้น เช่น วัสดุ วิธี ชุมชน หรือสถานที่',
  };
  if (results.length === 0) return empty[language] ?? empty.en;
  const top = results.slice(0, 3);
  const list = (separator: string) => top.map((item, i) => `[${i + 1}] ${item.title}`).join(separator);
  const copy: Record<string, string> = {
    'zh-TW': `火先從已打包的 PBS community index 撿出三塊木柴。關於「${compact(query, 28)}」，可先讀 ${list('、')}，再把這些頁面當成可檢查的證據來延伸。`,
    en: `The campfire found community memory. For “${compact(query, 42)}”, start with ${list(', ')} and use these pages as checkable evidence.`,
    id: `Api unggun menemukan memori komunitas PBS. Untuk “${compact(query, 42)}”, mulai dari ${list(', ')} dan pakai halaman ini sebagai bukti yang bisa diperiksa.`,
    de: `Das Lagerfeuer fand PBS-Community-Erinnerung. Zu „${compact(query, 42)}“ beginne mit ${list(', ')} und nutze diese Seiten als prüfbare Evidenz.`,
    ja: `火は PBS のコミュニティ記憶を見つけました。「${compact(query, 42)}」については、まず ${list('、')} を読み、確認できる証拠として使ってください。`,
    th: `กองไฟพบความทรงจำชุมชนของ PBS สำหรับ “${compact(query, 42)}” เริ่มจาก ${list(', ')} และใช้หน้าเหล่านี้เป็นหลักฐานที่ตรวจสอบได้`,
  };
  return copy[language] ?? copy.en;
}
