import { applyDelta } from './defaults.js';
import type { SimEvent, SimScores } from './types.js';

export function scoreEvent(scores: SimScores, event: SimEvent): SimScores {
  const next = { ...scores };
  if (event.type === 'player_player_dialogue') { next.interaction += 5; next.community += 3; if ((event.delta.stress ?? 0) < 0) next.care += 1; }
  if (event.type === 'player_npc_dialogue') { next.interaction += 4; next.wisdom += event.significance / 20; if ((event.delta.skills ?? 0) > 0) next.skill += 1; }
  if (event.type === 'player_thronglet_response') { next.interaction += 6; next.wisdom += 4; next.community += 4; next.care += 2; }
  if (event.type === 'thronglet_interaction') { next.interaction += 1; next.wisdom += event.significance / 30; next.community += (event.delta.groupBond ?? 0) / 40; }
  if ((event.delta.money ?? 0) > 0) next.resource += (event.delta.money ?? 0) / 2;
  if ((event.delta.skills ?? 0) > 0) next.skill += (event.delta.skills ?? 0) / 2;
  if ((event.delta.stress ?? 0) < 0) next.care += Math.abs(event.delta.stress ?? 0) / 3;
  return next;
}

export { applyDelta };
