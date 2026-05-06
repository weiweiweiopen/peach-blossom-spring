import { applyDelta } from './defaults.js';
import type { SimAction, SimEvent, SimState } from './types.js';

export function deltaForAction(action: SimAction, state: SimState): Partial<SimState> {
  const delta: Partial<SimState> = { money: -0.05 };
  if (action === 'rest' || action === 'visitRiver') Object.assign(delta, { energy: 0.45, stress: -0.4, solitude: -0.25 });
  else Object.assign(delta, { energy: -0.25 });
  if (action === 'talk' || action === 'listen' || action === 'seekConversation') Object.assign(delta, { curiosity: 0.2, solitude: 0.2, openness: 0.35, affinity: 0.3, groupBond: 0.4 });
  if (action === 'seekMoney') Object.assign(delta, { money: 2, stress: -0.15 });
  if (action === 'practiceSkill' || action === 'shareSkill') Object.assign(delta, { skills: 1, curiosity: 0.1 });
  if (action === 'visitPeachTree') Object.assign(delta, { stress: -0.35, solitude: -0.1 });
  if (action === 'reflect') Object.assign(delta, { solitude: -0.25, curiosity: -0.15, stubbornness: state.resonanceWithPrompt > 65 && state.affinity < 40 ? 0.35 : -0.25 });
  if (state.energy < 30) delta.stress = (delta.stress ?? 0) + 0.25;
  if (state.money < 30) delta.stress = (delta.stress ?? 0) + 0.25;
  if (state.stress > 70) delta.groupBond = (delta.groupBond ?? 0) - 0.25;
  return delta;
}

export function updateStateForAction(state: SimState, action: SimAction): SimState { return applyDelta(state, deltaForAction(action, state)); }
export function makeEvent(type: SimEvent['type'], tick: number, actorId: string, delta: Partial<SimState>, significance = 20, text?: string): SimEvent {
  return { id: `${type}-${tick}-${actorId}-${Math.round(Math.random() * 100000)}`, type, createdAt: Date.now(), tick, actorId, delta, significance, text };
}
