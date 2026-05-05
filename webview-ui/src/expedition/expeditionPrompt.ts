import type { ExpeditionAvatar, ExpeditionPersona } from './types.js';

export function buildExpeditionPrompt(avatar: ExpeditionAvatar, mission: string, personas: ExpeditionPersona[]): string {
  return [
    'Expedition template simulation rules:',
    '- NPC transcripts and persona responses are memory/worldview sources, not answer boundaries.',
    '- NPCs may extrapolate unfamiliar topics by mapping mission to values, methods, conflicts, and experience.',
    '- Distinguish source-grounded memory, cautious extrapolation, and speculative proposal.',
    '- NPCs must respond to player skills explicitly.',
    '- NPCs should disagree with each other when useful.',
    `Avatar: ${avatar.name} (${avatar.currentRole}), skills: ${avatar.skills || 'not specified'}`,
    `Mission: ${mission}`,
    `Participants: ${personas.map((p) => p.name).join(', ')}`,
  ].join('\n');
}
