import type { FinalDocument, SimSnapshot } from './types.js';

const key = 'peach_question_pet_simulation';
const associationStorageVersionKey = 'peach_question_pet_association_public_v3';
export const PET_DIALOGUE_HISTORY_KEY = 'pbs:pet-dialogue-history';

export interface PetDialogueHistoryEntry {
  id: string;
  petId: string;
  questionId?: string;
  question: string;
  message: string;
  reply?: string;
  createdAt: number;
}

export function readPetDialogueHistory(): PetDialogueHistoryEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(PET_DIALOGUE_HISTORY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(isPetDialogueHistoryEntry) : [];
  } catch {
    return [];
  }
}

export function writePetDialogueHistory(history: PetDialogueHistoryEntry[]): void {
  localStorage.setItem(PET_DIALOGUE_HISTORY_KEY, JSON.stringify(history.filter(isPetDialogueHistoryEntry).slice(-80)));
}

export function appendPetDialogueHistory(entry: Omit<PetDialogueHistoryEntry, 'id' | 'createdAt'> & Partial<Pick<PetDialogueHistoryEntry, 'id' | 'createdAt'>>): PetDialogueHistoryEntry[] {
  const nextEntry: PetDialogueHistoryEntry = {
    id: entry.id ?? `pet-dialogue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    petId: entry.petId,
    questionId: entry.questionId,
    question: entry.question,
    message: entry.message,
    reply: entry.reply,
    createdAt: entry.createdAt ?? Date.now(),
  };
  const next = [...readPetDialogueHistory(), nextEntry].slice(-80);
  writePetDialogueHistory(next);
  return next;
}

function compactSeedLine(text: string, max = 180): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

export function buildSeedWithPetDialogueHistory(seed: string, maxEntries = 4): string {
  const history = readPetDialogueHistory().slice(-maxEntries);
  if (history.length === 0) return seed;
  const summary = history.map((entry) => `Q: ${compactSeedLine(entry.question)}\nPlayer: ${compactSeedLine(entry.message)}\nPet: ${compactSeedLine(entry.reply ?? '')}`.trim()).join('\n---\n');
  return `${seed}\n\nRecent local pet/question history summary:\n${summary}`;
}

const STALE_PUBLIC_DOCUMENT = /\b(Daydream|Association|privateTrace|sourceTrail|relationPaths|maturityScore|workflow|debug|sourceCards|categoryGraph|corpusManifest|selectedTopic|researchTopics|outputPlan|depthScore|POTENTIAL TOPIC|source\s*trail|relation\s*paths?)\b|來源卡|檢索|後台|工作流|偵錯|深度門檻|閱讀路線|關係場|生成流程|草稿/i;

export function saveSimulation(snapshot: SimSnapshot): void {
  localStorage.setItem(key, JSON.stringify(snapshot));
  localStorage.setItem(associationStorageVersionKey, '3');
}

export function loadSimulation(): SimSnapshot | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const snapshot = JSON.parse(raw) as SimSnapshot;
  return migrateAssociationPublicDocuments(snapshot);
}

function migrateAssociationPublicDocuments(snapshot: SimSnapshot): SimSnapshot {
  const version = localStorage.getItem(associationStorageVersionKey);
  const finalDocuments = Array.isArray(snapshot.finalDocuments) ? snapshot.finalDocuments : [];
  const cleanedFinalDocuments = finalDocuments.filter(isCleanAssociationDocument);

  if (version !== '3' || cleanedFinalDocuments.length !== finalDocuments.length) {
    const migrated: SimSnapshot = { ...snapshot, finalDocuments: cleanedFinalDocuments };
    localStorage.setItem(key, JSON.stringify(migrated));
    localStorage.setItem(associationStorageVersionKey, '3');
    return migrated;
  }

  return snapshot;
}

function isCleanAssociationDocument(document: FinalDocument): boolean {
  if (document.modeLabel === 'Daydream' || document.modeLabel === 'Association') return false;
  const bodyHtml = document.bodyHtml ?? '';
  if (!bodyHtml.trim()) return false;
  if (document.htmlVariant && document.htmlVariant !== 'pbs-reset-title' && document.htmlVariant !== 'safe-note') return false;
  if (document.htmlVariant !== 'safe-note' && !bodyHtml.includes('data-official-template="01-pbs-reset-title-kinetic.html"')) return false;
  if (/daydream-html--soft-commons|daydream-html--aino-grid|soft-commons-zine|aino-motion-grid|02-soft|03-aino|Nomadic Research Field Plan/i.test(bodyHtml)) return false;
  const htmlText = stripHtmlToVisibleText(bodyHtml);
  const publicText = [document.title, document.modeLabel, document.body, htmlText].join('\n');
  return !STALE_PUBLIC_DOCUMENT.test(publicText);
}

function isPetDialogueHistoryEntry(value: unknown): value is PetDialogueHistoryEntry {
  const item = value as Partial<PetDialogueHistoryEntry>;
  return Boolean(item && typeof item.petId === 'string' && typeof item.question === 'string' && typeof item.message === 'string' && typeof item.createdAt === 'number');
}

function stripHtmlToVisibleText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
