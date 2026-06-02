import type { LanguageCode } from './i18n.js';
import type { ChatEvidence } from './localChatbot.js';
import type { WikiSearchResult } from './wikiSearch.js';

export interface MemoryChatResponse {
  answer: string;
  evidence: ChatEvidence[];
  links: WikiSearchResult[];
}

const PBS_ENGINE_URL = (import.meta.env.VITE_PBS_ENGINE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export function canUseLocalMemoryServer(): boolean {
  if (PBS_ENGINE_URL) return true;
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  if (!canUseLocalMemoryServer()) {
    throw new Error('PBS memory server is unavailable. Configure VITE_PBS_ENGINE_URL for Cloudflare or use localhost.');
  }
  const endpoint = PBS_ENGINE_URL ? `${PBS_ENGINE_URL}${path}` : path;
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('PBS local memory server is unavailable. Start scripts/pbs_game_server.py and open the local URL.');
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

export interface DialogueHistoryTurn {
  speaker: string;
  text: string;
}

export async function askCampfire(question: string, preferredLanguage: LanguageCode, dialogueHistory: DialogueHistoryTurn[] = []): Promise<MemoryChatResponse> {
  return postJson<MemoryChatResponse>('/api/chat/campfire', { question, preferredLanguage, dialogueHistory });
}

export async function askNpc(args: {
  question: string;
  npcName: string;
  persona?: unknown;
  transcript?: string;
  preferredLanguage: LanguageCode;
  dialogueHistory?: DialogueHistoryTurn[];
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
