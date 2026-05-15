import type { SimSnapshot } from './types.js';
const key = 'peach_question_pet_simulation';
export function saveSimulation(snapshot: SimSnapshot): void { localStorage.setItem(key, JSON.stringify(snapshot)); }
export function loadSimulation(): SimSnapshot | null { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as SimSnapshot : null; }
