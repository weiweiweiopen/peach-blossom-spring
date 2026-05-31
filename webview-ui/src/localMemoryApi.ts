import type { LanguageCode } from './i18n.js';
import type { ChatEvidence } from './localChatbot.js';
import type { WikiSearchResult } from './wikiSearch.js';

export interface MemoryChatResponse {
  answer: string;
  evidence: ChatEvidence[];
  links: WikiSearchResult[];
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Local PBS memory server is unavailable. Start scripts/pbs_game_server.py and open the local URL.');
  }
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Local PBS memory server failed (${response.status.toString()}): ${details}`);
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
