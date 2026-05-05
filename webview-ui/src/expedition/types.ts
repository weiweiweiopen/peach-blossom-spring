export interface ExpeditionAvatar {
  name: string;
  currentRole: string;
  mission: string;
  constraints?: string;
  skills?: string;
}

export interface ExpeditionPersona {
  id: string;
  name: string;
  role: string;
  intro: string;
  responses: Record<string, string>;
}

export type ExpeditionMode = 'template-simulation';

export interface NpcBehaviorProfile {
  npcId: string;
  perspective: string;
  expertise: string;
  bias: string;
  disagreementStyle: string;
  likelyToNotice: string;
  likelyToReject: string;
}

export interface ExpeditionEvent {
  round: number;
  npcId: string;
  encounterType: string;
  npcContribution: string;
  challengeToUser: string;
  newLead: string;
  avatarBeliefUpdate: string;
  nextQuestion: string;
}

export interface ExpeditionReport {
  originalMission: string;
  interpretedMission: string;
  keyEncounters: string[];
  strongestEmergentDirection: string;
  disagreementsBetweenNpcs: string[];
  blindSpots: string[];
  concreteNextActions: string[];
  followUpQuestions: string[];
  openCallResearchLeads: string[];
}

export interface ExpeditionResult {
  events: ExpeditionEvent[];
  report: ExpeditionReport;
}

export interface RunExpeditionInput {
  avatar: ExpeditionAvatar;
  mission: string;
  selectedNpcIds: string[];
  maxRounds: number;
  mode: ExpeditionMode;
  personas: ExpeditionPersona[];
}
