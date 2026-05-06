import type { SimEvent, SimState } from './types.js';

export function shouldTriggerThought(state: SimState, recentEvent?: SimEvent): boolean {
  return (state.resonanceWithPrompt > 75 && state.curiosity > 70 && !!recentEvent) || state.stress > 80 || state.groupBond > 65 || state.money < 20 || state.skills > 70 || recentEvent?.type === 'throng_formed' || recentEvent?.type === 'player_thronglet_response';
}

export function deterministicThought(state: SimState, question: string, event?: SimEvent): string {
  if (event?.type === 'throng_formed' || state.groupBond > 65) return '它不再像一個單獨的問題，而像幾個人暫時圍成的一張桌子。';
  if (state.money < 20) return '這個問題還想往前走，但它開始意識到，沒有資源的好奇心很快會變成疲勞。';
  if (state.stress > 80) return '它吸收了太多回答，於是退到河邊，把自己拆成比較小的疑問。';
  if (state.skills > 70) return '這個問題學會了一種手勢：先交換技術，再交換立場。';
  return `「${question.slice(0, 24)}」在桃花源裡閃了一下，像剛學會聽人的小生物。`;
}
