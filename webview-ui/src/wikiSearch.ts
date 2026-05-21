import { daydreamCorpus } from './daydream/corpus.js';
import type { SourceCard } from './daydream/engine.js';
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

function sourceFamily(card: Partial<SourceCard>): string {
  const source = String(card.source ?? '').toLowerCase();
  const text = `${card.title ?? ''} ${card.path ?? ''} ${card.url ?? ''}`.toLowerCase();
  if (source === 'hackteria' || text.includes('hackteria')) return 'Hackteria';
  if (source === 'sgmk' || text.includes('sgmk')) return 'SGMK';
  if (text.includes('fabricademy')) return 'Fabricademy';
  if (source === 'htgwyw' || text.includes('kobakant') || text.includes('how to get what you want')) return 'HOW TO GET WHAT YOU WANT / KOBAKANT';
  return card.source || 'Wiki';
}

function expandQuery(query: string): string {
  const expansions: string[] = [];
  if (/觸控|觸摸|touch|介面|界面|interface|互動|interaction/i.test(query)) {
    expansions.push('touch', 'touchpad', 'interface', 'interfaces', 'interaction', 'physical interface', 'sensor', 'capacitive', 'qtouch', 'HID');
  }
  if (/作品|project|work|案例|example/i.test(query)) {
    expansions.push('project', 'workshop', 'prototype', 'experiment', 'toy', 'instrument');
  }
  if (/聲音|音樂|sound|music|樂器|instrument/i.test(query)) {
    expansions.push('sound', 'music', 'musical', 'instrument', 'speaker', 'HID');
  }
  if (/穿戴|織品|布|wearable|textile|fabric|soft/i.test(query)) {
    expansions.push('wearable', 'textile', 'fabric', 'soft circuit', 'stretch sensor');
  }
  return [query, ...expansions].join(' ');
}

function tokens(text: string): string[] {
  return Array.from(new Set(expandQuery(text).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length >= 2)));
}

function scoreText(queryTokens: string[], title: string, body: string): number {
  const haystack = `${title} ${body}`.toLowerCase();
  return queryTokens.reduce((sum, token) => {
    if (!haystack.includes(token)) return sum;
    return sum + (title.toLowerCase().includes(token) ? 6 : 2);
  }, 0);
}

function cardToResult(card: SourceCard, score: number): WikiSearchResult | null {
  const family = sourceFamily(card);
  if (family === 'Hackteria') return null;
  if (!card.url) return null;
  return {
    title: card.title,
    url: card.url,
    description: compact(card.excerpt || [...(card.keywords ?? []), ...(card.tags ?? [])].join(', '), 240),
    sourceFamily: family,
    score,
  };
}

function linkToResult(link: WikiLink, score: number): WikiSearchResult | null {
  if (!link.url || /hackteria/i.test(`${link.title} ${link.url}`)) return null;
  return {
    title: link.title,
    url: link.url,
    description: compact(link.description, 180),
    sourceFamily: 'NPC wiki link',
    score,
  };
}

export function searchWikiPages(query: string, personaId?: string, limit = 6): WikiSearchResult[] {
  const queryTokens = tokens(query);
  if (queryTokens.length === 0) return [];
  const corpusResults = daydreamCorpus.cards
    .map((card) => ({ card, score: scoreText(queryTokens, card.title, `${card.excerpt} ${(card.keywords ?? []).join(' ')} ${(card.tags ?? []).join(' ')} ${(card.categories ?? []).join(' ')}`) }))
    .filter((item) => item.score > 0)
    .map((item) => cardToResult(item.card, item.score))
    .filter((item): item is WikiSearchResult => Boolean(item));
  const personaResults = personaId
    ? getWikiLinksForInterviewee(personaId).links
        .map((link) => ({ link, score: scoreText(queryTokens, link.title, link.description) + 1 }))
        .filter((item) => item.score > 1)
        .map((item) => linkToResult(item.link, item.score))
        .filter((item): item is WikiSearchResult => Boolean(item))
    : [];
  const byUrl = new Map<string, WikiSearchResult>();
  for (const result of [...personaResults, ...corpusResults].sort((a, b) => b.score - a.score)) {
    if (!byUrl.has(result.url)) byUrl.set(result.url, result);
  }
  return Array.from(byUrl.values()).slice(0, limit);
}
