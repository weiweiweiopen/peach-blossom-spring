import { hashQuestion, mulberry32 } from '../pets/hashQuestion.js';
import type { SimAction, SimState } from './types.js';

export function chooseAction(state: SimState, seedText = ''): SimAction {
  const jitter = mulberry32(hashQuestion(seedText + JSON.stringify(state)));
  const desires: Array<[SimAction, number]> = [
    ['talk', state.curiosity * 0.25 + state.openness * 0.2 + state.resonanceWithPrompt * 0.25 + state.affinity * 0.15 - state.stress * 0.2 - state.solitude * 0.1],
    ['rest', (100 - state.energy) * 0.35 + state.stress * 0.3 + state.solitude * 0.2],
    ['seekMoney', (100 - state.money) * 0.45 + state.stress * 0.15 + state.curiosity * 0.1],
    ['practiceSkill', state.curiosity * 0.2 + (100 - state.skills) * 0.25 + state.resonanceWithPrompt * 0.2],
    ['joinThrong', state.groupBond * 0.3 + state.affinity * 0.25 + state.resonanceWithPrompt * 0.2 - state.stress * 0.25],
    ['reflect', state.solitude * 0.35 + state.stubbornness * 0.2 + state.resonanceWithPrompt * 0.2],
    ['wander', 15 + state.curiosity * 0.15],
  ];
  desires.sort((a, b) => (b[1] + jitter() * 4) - (a[1] + jitter() * 4));
  return desires[0][0];
}
