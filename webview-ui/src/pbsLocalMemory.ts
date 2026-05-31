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
  if (/織品|textile|wearable|sensor|感測|穿戴/i.test(query)) {
    expansions.push('textile', 'e-textile', 'sensor', 'soft circuit', 'wearable', 'Kobakant');
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
  return score + familyBoost;
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
  if (results.length === 0) {
    return language === 'zh-TW'
      ? '我目前在本地記憶包裡沒有找到足夠線索；請換成更具體的材料、方法、社群或場域關鍵字。'
      : 'I could not find enough local-memory evidence yet. Try a more concrete material, method, community, or place keyword.';
  }
  const top = results.slice(0, 3);
  if (language === 'zh-TW') {
    return `火先從本地記憶包撿出三塊木柴。關於「${compact(query, 28)}」，可先讀 ${top.map((item, i) => `[${i + 1}] ${item.title}`).join('、')}；它們提供可查證的 source-first 線索，下一步應把答案整理成 Review 草稿再提升到 Wiki。`;
  }
  return `The campfire found source-first local memory. For “${compact(query, 42)}”, start with ${top.map((item, i) => `[${i + 1}] ${item.title}`).join(', ')}; use these pages as evidence, then turn the synthesis into a reviewed Wiki note.`;
}
