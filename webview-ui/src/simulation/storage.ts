import type { SimSnapshot } from './types.js';

const key = 'peach_question_pet_simulation';
const associationStorageVersionKey = 'peach_question_pet_final_documents_disabled_v1';
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

export function saveSimulation(snapshot: SimSnapshot): void {
  localStorage.setItem(key, JSON.stringify({ ...snapshot, finalDocuments: [] }));
  localStorage.setItem(associationStorageVersionKey, '1');
}

export function loadSimulation(): SimSnapshot | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const snapshot = JSON.parse(raw) as SimSnapshot;
  return clearFinalDocuments(snapshot);
}

function clearFinalDocuments(snapshot: SimSnapshot): SimSnapshot {
  const version = localStorage.getItem(associationStorageVersionKey);
  if (version !== '1' || (snapshot.finalDocuments ?? []).length > 0) {
    const migrated: SimSnapshot = { ...snapshot, finalDocuments: [] };
    localStorage.setItem(key, JSON.stringify(migrated));
    localStorage.setItem(associationStorageVersionKey, '1');
    return migrated;
  }

  return snapshot;
}

function isPetDialogueHistoryEntry(value: unknown): value is PetDialogueHistoryEntry {
  const item = value as Partial<PetDialogueHistoryEntry>;
  return Boolean(item && typeof item.petId === 'string' && typeof item.question === 'string' && typeof item.message === 'string' && typeof item.createdAt === 'number');
}
