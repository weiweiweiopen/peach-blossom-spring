import type { SimScores, SimState } from './types.js';

export const playerDefaultState: SimState = { energy: 80, curiosity: 70, stress: 20, affinity: 40, solitude: 35, openness: 65, stubbornness: 25, resonanceWithPrompt: 100, groupBond: 10, money: 45, skills: 45 };
export const throngletDefaultState: SimState = { energy: 70, curiosity: 85, stress: 25, affinity: 30, solitude: 45, openness: 60, stubbornness: 35, resonanceWithPrompt: 100, groupBond: 15, money: 30, skills: 25 };
export const npcDefaultState: SimState = { energy: 75, curiosity: 55, stress: 25, affinity: 45, solitude: 35, openness: 55, stubbornness: 35, resonanceWithPrompt: 40, groupBond: 25, money: 45, skills: 45 };
export const defaultScores: SimScores = { interaction: 0, wisdom: 0, community: 0, resource: 0, skill: 0, care: 0 };

export function clampValue(value: number): number { return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0)); }
export function clampState(state: SimState): SimState { return Object.fromEntries(Object.entries(state).map(([k, v]) => [k, clampValue(v)])) as unknown as SimState; }
export function applyDelta(state: SimState, delta: Partial<SimState>): SimState {
  const next = { ...state };
  for (const [key, value] of Object.entries(delta) as Array<[keyof SimState, number | undefined]>) {
    if (typeof value === 'number') next[key] = clampValue(next[key] + value);
  }
  return next;
}
export function deriveNpcState(text: string): SimState {
  const lower = text.toLowerCase();
  const state = { ...npcDefaultState };
  if (/fund|grant|budget|resource|補助|資金|錢/.test(lower)) state.money += 20;
  if (/craft|technical|tool|textile|skill|工藝|工具|技術/.test(lower)) state.skills += 20;
  if (/care|community|support|照顧|支持|社群/.test(lower)) { state.affinity += 18; state.openness += 12; }
  if (/critical|philosophy|identity|ontology|哲學|身分|存在/.test(lower)) { state.curiosity += 12; state.stubbornness += 15; }
  return clampState(state);
}
