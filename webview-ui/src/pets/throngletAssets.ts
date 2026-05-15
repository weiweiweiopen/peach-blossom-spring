import type { SimAction } from '../simulation/types.js';

export const throngletExpressionTypes = [
  'idle',
  'social',
  'happy',
  'curious',
  'stressed',
  'sleepy',
] as const;

export type ThrongletExpressionType = (typeof throngletExpressionTypes)[number];

export interface ThrongletAnimationAsset {
  source: string;
  expressionFrames: Record<ThrongletExpressionType, string[]>;
}

export interface ThrongletSocialSignals {
  social?: number;
  learning?: number;
  tension?: number;
  energy?: number;
  stress?: number;
  curiosity?: number;
  affinity?: number;
  groupBond?: number;
  resonanceWithPrompt?: number;
}

const FRAME_COUNT = 22;

function makeExpressionFrames(expression: ThrongletExpressionType): string[] {
  return Array.from(
    { length: FRAME_COUNT },
    (_item, index) => `/assets/thronglets/pet/${expression}/pet-${expression}-${index.toString().padStart(2, '0')}.png`,
  );
}

export const throngletMvpAnimation: ThrongletAnimationAsset = {
  source: 'Peach Blossom Spring pet sprites',
  expressionFrames: Object.fromEntries(
    throngletExpressionTypes.map((expression) => [expression, makeExpressionFrames(expression)]),
  ) as Record<ThrongletExpressionType, string[]>,
};

export function chooseThrongletExpression(
  signals: ThrongletSocialSignals = {},
  currentAction?: SimAction,
): ThrongletExpressionType {
  const energy = signals.energy ?? 70;
  const stress = signals.stress ?? signals.tension ?? 25;
  const social = signals.social ?? signals.affinity ?? 40;
  const groupBond = signals.groupBond ?? 15;
  const learning = signals.learning ?? signals.curiosity ?? 50;
  const resonance = signals.resonanceWithPrompt ?? 50;

  if (energy < 28 || currentAction === 'rest') return 'sleepy';
  if (stress > 68) return 'stressed';
  if (currentAction === 'talk' || currentAction === 'listen' || currentAction === 'seekConversation') return 'social';
  if (currentAction === 'practiceSkill' || learning > 72 || resonance > 82) return 'curious';
  if (currentAction === 'joinThrong' || social > 68 || groupBond > 62) return 'happy';
  return 'idle';
}

export function getThrongletExpressionFrames(expression: ThrongletExpressionType): string[] {
  return throngletMvpAnimation.expressionFrames[expression] ?? throngletMvpAnimation.expressionFrames.idle;
}
