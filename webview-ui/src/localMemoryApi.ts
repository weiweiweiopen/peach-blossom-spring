import type { LanguageCode } from './i18n.js';
import type { ChatEvidence } from './localChatbot.js';
import type { WikiSearchResult } from './wikiSearch.js';
import { answerFromPacket, getEvidencePacket, loadPublicCorpus, packetLinks } from './evidence/pagesEvidence.js';
import { retrievePassages, type EvidencePacket } from './evidence/sourceCorpus.js';
import { answerNpcQuestion, type NpcPersonaContext } from './evidence/npcConversation.js';

export interface DialogueHistoryTurn {
  speaker: string;
  text: string;
}

export interface MemoryChatResponse {
  answer: string;
  evidence: ChatEvidence[];
  links: WikiSearchResult[];
  draft?: { path?: string; markdown?: string; stored?: boolean };
  status?: 'no_evidence' | 'verified' | 'unverified' | 'character';
  evidencePacket?: EvidencePacket;
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
  return true; // The versioned Pages corpus works on both the public site and local preview.
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
  const corpus = await loadPublicCorpus();
  return packetLinks({ id: 'search', query, corpusVersion: corpus.version, passages: retrievePassages(corpus, query, limit) });
}

export async function askCampfire(question: string, preferredLanguage: LanguageCode, dialogueHistory: DialogueHistoryTurn[] = []): Promise<MemoryChatResponse> {
  return answerFromPacket(await getEvidencePacket(question, { history: dialogueHistory }), preferredLanguage);
}

export async function askNpc(args: {
  question: string;
  npcName: string;
  persona?: NpcPersonaContext;
  transcript?: string;
  transcriptUrl?: string;
  preferredLanguage: LanguageCode;
  dialogueHistory?: DialogueHistoryTurn[];
}): Promise<MemoryChatResponse> {
  return answerNpcQuestion(args);
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
