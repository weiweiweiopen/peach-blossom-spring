import { getNpcBehaviorProfile } from './npcBehaviorProfiles.js';
import { buildExpeditionPrompt } from './expeditionPrompt.js';
import type { ExpeditionEvent, ExpeditionReport, ExpeditionResult, RunExpeditionInput } from './types.js';

const encounterTypes = ['friction circle', 'field test', 'night kitchen argument', 'archive detour', 'prototype omen'];
const topicOrder = ['camp', 'independent', 'artScience', 'sustainability', 'nomadic', 'funding', 'exchange'];

function chooseTopic(mission: string, round: number): string {
  const q = mission.toLowerCase();
  const keywordTopics: Array<[string, string[]]> = [
    ['funding', ['fund', 'grant', 'money', '資金', '補助']],
    ['sustainability', ['sustain', 'long-term', 'community', '永續', '社群']],
    ['artScience', ['art', 'science', 'tech', '藝術', '科技', '科學']],
    ['exchange', ['exchange', 'international', '國際', '交流']],
    ['camp', ['camp', 'village', '黑客', '營隊', '村']],
    ['nomadic', ['travel', 'nomad', '移動', '旅行']],
    ['independent', ['independent', 'autonomy', '獨立', '自治']],
  ];
  const matched = keywordTopics.find(([, words]) => words.some((word) => q.includes(word)));
  return matched?.[0] ?? topicOrder[round % topicOrder.length];
}

function summarize(text: string, max = 170): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}...` : trimmed;
}

function interpretMission(mission: string, constraints?: string): string {
  const base = mission.trim() || 'Find a mission that can survive contact with the camp.';
  return constraints?.trim()
    ? `${base} The expedition must respect these constraints: ${constraints.trim()}`
    : `${base} The expedition should expose conflict before it produces synthesis.`;
}

export function runExpedition(input: RunExpeditionInput): ExpeditionResult {
  const selected = input.personas.filter((persona) => input.selectedNpcIds.includes(persona.id));
  const expeditionNpcs = selected.length > 0 ? selected : input.personas.slice(0, 6);
  void buildExpeditionPrompt(input.avatar, input.mission, expeditionNpcs);
  const interpretedMission = interpretMission(input.mission, input.avatar.constraints);
  const rounds = Math.max(1, Math.min(input.maxRounds, 20));
  const events: ExpeditionEvent[] = Array.from({ length: rounds }, (_, index) => {
    const round = index + 1;
    const persona = expeditionNpcs[index % expeditionNpcs.length];
    const profile = getNpcBehaviorProfile(persona);
    const topic = chooseTopic(input.mission, index);
    const response = persona.responses[topic] ?? persona.responses.camp ?? persona.intro;
    return {
      round,
      npcId: persona.id,
      encounterType: encounterTypes[index % encounterTypes.length],
      npcContribution: `${persona.name} contributes from ${profile.expertise}: ${summarize(response)}`,
      challengeToUser: `${profile.disagreementStyle} Likely objection: ${profile.likelyToReject}`,
      newLead: `Follow ${profile.likelyToNotice}`,
      avatarBeliefUpdate: `${input.avatar.name} updates the mission from "make the idea convincing" toward "make the idea accountable to ${profile.perspective}".`,
      nextQuestion: `What would change if ${profile.bias.toLowerCase()}?`,
    };
  });

  const report: ExpeditionReport = {
    originalMission: input.mission,
    interpretedMission,
    keyEncounters: events.slice(0, 6).map((event) => {
      const persona = input.personas.find((item) => item.id === event.npcId);
      return `Round ${event.round}, ${persona?.name ?? event.npcId}: ${event.encounterType} -> ${event.npcContribution}`;
    }),
    strongestEmergentDirection: `Turn the mission into a living prototype: one small camp-scale test, one visible conflict log, one care/maintenance protocol, and one shareable artifact that other nodes can fork.`,
    disagreementsBetweenNpcs: [
      'Scale conflict: commons organizers and field practitioners pull toward small accountable units, while network educators ask for portability across nodes.',
      'Tempo conflict: hacker-camp improvisers want fast playful failure, while care and infrastructure voices slow the mission down for consent, safety, and maintenance.',
      'Output conflict: storyteller logic wants mythic transformation, while technical commons logic asks for repeatable SOPs and repair lines.',
    ],
    blindSpots: [
      'Who has refusal power when the idea enters a real community?',
      'What maintenance burden appears after the first exciting demo?',
      'Which local host benefits if the avatar leaves tomorrow?',
    ],
    concreteNextActions: [
      'Write a one-page mission covenant covering consent, credit, maintenance, and what will not be scaled.',
      'Run a 48-hour camp prototype with fewer than twelve people and document every disagreement as design material.',
      'Create a forkable artifact: recipe, map, SOP, wish wall, or field notebook that another node can adapt.',
      'Name one local steward and one external peer reviewer before seeking funding.',
    ],
    followUpQuestions: events.slice(-4).map((event) => event.nextQuestion),
    openCallResearchLeads: [
      'Placeholder: open call for field hosts who can challenge the mission from land, care, repair, or education contexts.',
      'Placeholder: research lead list for transcripts, wiki links, and future backend orchestrator citations.',
    ],
  };

  return { events, report };
}
