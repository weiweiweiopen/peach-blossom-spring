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

const localMemoryItems = (pbsLocalMemoryIndex as { items?: PbsLocalMemoryItem[] }).items ?? [];

function compact(text: string, max = 260): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max).trim()}...` : normalized;
}

function expandQuery(query: string): string {
  const expansions: string[] = [];
  if (/廚房|厨房|kitchen|food|料理|cook|cooking|餐|meal/i.test(query)) {
    expansions.push('kitchen', 'kitchenlab', 'food', 'fermentation', 'microbe', 'bioplastic', 'radical food science', 'gastronomy');
  }
  if (/生物藝術|bioart|biology|生物|wetlab|濕實驗/i.test(query)) {
    expansions.push('bioart', 'wetlab', 'DIY biology', 'tissue culture', 'biotechnology', 'Hackteria');
  }
  if (/發酵|ferment|fermentation|microbe|微生物/i.test(query)) {
    expansions.push('fermentation', 'microbe', 'yeast', 'fungus', 'Sato', 'culture');
  }
  if (/織品|電子織品|textile|e-?textile|wearable|sensor|感測|穿戴|身體|體感|皮膚|觸摸|手勢|失敗|紀錄|文件|可重讀|body|embod|somatic|skin|touch|gesture|failure|documentation|document/i.test(query)) {
    expansions.push('textile', 'e-textile', 'sensor', 'soft circuit', 'wearable', 'Kobakant', 'HOW TO GET WHAT YOU WANT', 'Fabricademy', 'body', 'embodied knowledge', 'skin', 'touch', 'gesture', 'stretch sensor', 'failure notes', 'trials and errors', 'documentation', 'BadLab', 'Open Source Body', 'MedTech-DIY');
  }
  if (/open|開源|hardware|硬體|lab|實驗室|temporary|臨時|公共|基礎設施|commons/i.test(query)) {
    expansions.push('open science', 'open hardware', 'temporary lab', 'community lab', 'workshop', 'commons', 'documentation');
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
  const haystack = `${item.title} ${item.sourceFamily} ${item.description}`.toLowerCase();
  const score = queryTokens.reduce((sum, token) => {
    if (!haystack.includes(token)) return sum;
    return sum + (title.includes(token) ? 8 : 2);
  }, 0);
  const familyBoost = /htgwyw|hackteria|sgmk/i.test(item.sourceFamily) ? 1 : 0;
  const bodyTextileBoost = /織品|電子織品|穿戴|身體|體感|皮膚|觸摸|手勢|失敗|紀錄|文件|可重讀|textile|e-?textile|wearable|body|embod|somatic|skin|touch|gesture|failure|documentation|document/i.test(queryTokens.join(' ')) && /textile|e-?textile|wearable|fabric|soft circuit|stretch sensor|body|embod|somatic|skin|touch|gesture|failure|trials|errors|documentation|kobakant|how to get what you want|fabricademy|badlab|open source body|medtech/i.test(haystack) ? 24 : 0;
  return score + familyBoost + bodyTextileBoost;
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
      sourceFamily: `PBS local memory / ${item.sourceFamily}`,
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
    keywords: [item.sourceFamily, 'PBS local memory', 'source-first memory'],
    tags: ['pbs-local-memory', item.sourceFamily],
    source: `PBS local memory / ${item.sourceFamily}`,
    url: item.url,
    path: item.path,
    semanticLayer: 'source-first local memory',
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
    'zh-TW': `火先從已打包的 PBS source-first index 撿出三塊木柴。關於「${compact(query, 28)}」，可先讀 ${list('、')}，再把這些頁面當成可檢查的證據來延伸。`,
    en: `The campfire found source-first local memory. For “${compact(query, 42)}”, start with ${list(', ')} and use these pages as checkable evidence.`,
    id: `Api unggun menemukan memori lokal source-first. Untuk “${compact(query, 42)}”, mulai dari ${list(', ')} dan pakai halaman ini sebagai bukti yang bisa diperiksa.`,
    de: `Das Lagerfeuer fand source-first lokale Erinnerung. Zu „${compact(query, 42)}“ beginne mit ${list(', ')} und nutze diese Seiten als prüfbare Evidenz.`,
    ja: `火は source-first のローカル記憶を見つけました。「${compact(query, 42)}」については、まず ${list('、')} を読み、確認できる証拠として使ってください。`,
    th: `กองไฟพบความทรงจำ local แบบ source-first สำหรับ “${compact(query, 42)}” เริ่มจาก ${list(', ')} และใช้หน้าเหล่านี้เป็นหลักฐานที่ตรวจสอบได้`,
  };
  return copy[language] ?? copy.en;
}
