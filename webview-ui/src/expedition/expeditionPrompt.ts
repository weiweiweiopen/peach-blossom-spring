import type { ExpeditionAvatar, ExpeditionPersona, AgentProfile, NpcBehaviorProfile } from './types.js';

export const EXPEDITION_REASONING_RULES = [
  'NPC transcripts and persona responses are memory and worldview sources, not answer boundaries.',
  'NPCs may extrapolate to unfamiliar topics by mapping the mission to their values, methods, conflicts, and experience.',
  'Each NPC must distinguish source-grounded memory, cautious extrapolation, and speculative proposal.',
  'NPCs must respond to the player skills, not only the mission statement.',
  'NPCs should disagree with each other when disagreement helps the mission become more accountable.',
].join(' ');

interface ExpeditionPromptContextInput {
  avatar: ExpeditionAvatar;
  persona: ExpeditionPersona;
  agentProfile?: AgentProfile;
  behaviorProfile: NpcBehaviorProfile;
  topic: string;
  sourceResponse: string;
}

function joinOrFallback(values: string[] | undefined, fallback: string): string {
  return values && values.length > 0 ? values.join(', ') : fallback;
}

export function buildExpeditionPromptContext({
  avatar,
  persona,
  agentProfile,
  behaviorProfile,
  topic,
  sourceResponse,
}: ExpeditionPromptContextInput): { sourceGroundedMemory: string; cautiousExtrapolation: string; speculativeProposal: string } {
  const playerSkills = avatar.skills?.trim() || 'generalist curiosity';
  const transferableMethods = joinOrFallback(agentProfile?.transferableMethods, behaviorProfile.expertise);
  const likelyQuestions = joinOrFallback(agentProfile?.likelyQuestions, behaviorProfile.likelyToNotice);
  const profileSkills = joinOrFallback(agentProfile?.skills, behaviorProfile.expertise);
  const sourceGroundedMemory = `${persona.name} remembers: ${sourceResponse}`;
  const cautiousExtrapolation = `${persona.name} cautiously extends that memory toward ${topic} by using ${transferableMethods} and by taking the player's skills in ${playerSkills} seriously.`;
  const speculativeProposal = `${persona.name} proposes a next experiment shaped by ${profileSkills}, while still asking: ${likelyQuestions}.`;
  return { sourceGroundedMemory, cautiousExtrapolation, speculativeProposal };
}
