import type { LanguageCode } from './i18n.js';
import type { ChatEvidence } from './localChatbot.js';
import type { WikiSearchResult } from './wikiSearch.js';

export interface MemoryChatResponse {
  answer: string;
  evidence: ChatEvidence[];
  links: WikiSearchResult[];
  draft?: { path?: string; markdown?: string; stored?: boolean };
}

function isLocalHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function configuredMemoryApiBaseUrl(): string {
  if (typeof document === 'undefined') return '';
  return document.querySelector('meta[name="pbs-memory-api"]')?.getAttribute('content')?.trim().replace(/\/$/, '') ?? '';
}

export function canUseLocalMemoryServer(): boolean {
  return isLocalHost() || configuredMemoryApiBaseUrl().length > 0;
}

function endpoint(path: string): string {
  const base = configuredMemoryApiBaseUrl();
  return base ? `${base}${path}` : path;
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  if (!isLocalHost() && !configuredMemoryApiBaseUrl()) {
    throw new Error('PBS memory API is not configured. Add a pbs-memory-api meta tag for cloud mode, or start scripts/pbs_game_server.py for local full-memory mode.');
  }
  let response: Response;
  try {
    response = await fetch(endpoint(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('PBS memory API is unavailable. Check the cloud Worker URL or start scripts/pbs_game_server.py locally.');
  }
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`PBS local memory server failed (${response.status.toString()}): ${details}`);
  }
  return (await response.json()) as T;
}

export async function searchMemory(query: string, limit = 8): Promise<WikiSearchResult[]> {
  const data = await postJson<{ results: WikiSearchResult[] }>('/api/memory/search', { query, limit });
  return data.results;
}

export async function askCampfire(question: string, preferredLanguage: LanguageCode): Promise<MemoryChatResponse> {
  return postJson<MemoryChatResponse>('/api/chat/campfire', { question, preferredLanguage });
}

export async function askNpc(args: {
  question: string;
  npcName: string;
  persona?: unknown;
  transcript?: string;
  preferredLanguage: LanguageCode;
}): Promise<MemoryChatResponse> {
  return postJson<MemoryChatResponse>('/api/chat/npc', args);
}

export async function createMemoryDraft(payload: {
  question: string;
  answer?: string;
  evidence?: ChatEvidence[];
  links?: WikiSearchResult[];
  route?: string;
}): Promise<{ path: string }> {
  return postJson<{ path: string }>('/api/memory/draft', payload);
}
