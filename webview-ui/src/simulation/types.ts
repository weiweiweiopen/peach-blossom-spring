import type { QuestionPetAppearance } from '../pets/generateQuestionPet.js';

export interface SimState {
  energy: number; curiosity: number; stress: number; affinity: number; solitude: number; openness: number; stubbornness: number; resonanceWithPrompt: number; groupBond: number; money: number; skills: number;
}
export type SimAction = 'wander' | 'seekConversation' | 'talk' | 'listen' | 'rest' | 'seekMoney' | 'practiceSkill' | 'shareSkill' | 'visitRiver' | 'visitPeachTree' | 'joinThrong' | 'leaveThrong' | 'reflect';
export type SimEntityKind = 'player' | 'npc' | 'thronglet';
export interface DispatchedQuestion { id: string; ownerPlayerId: number | string; ownerName: string; text: string; createdAt: number; tags: string[]; }
export interface ThrongletMemoryEvent { id: string; tick: number; text: string; significance: number; }
export interface SimEntity { id: string; kind: SimEntityKind; characterId: number; displayName: string; prompt?: string; personaId?: string; ownerPlayerId?: string | number; state: SimState; memory: ThrongletMemoryEvent[]; }
export type ProblemMaturationStage = 'seed' | 'sprout' | 'mycelium' | 'fruit';
export interface ProblemMaturationProfile { revision: number; stage: ProblemMaturationStage; attentionHypothesis: string; materialSignals: string[]; mentaleseAttributes: string[]; a2aDirectives: string[]; sourceQueries: string[]; rejectedShortcuts: string[]; lastUpdatedTick: number; }
export interface PetPersonaJson { role: string; intentMode: string; mentaleseBias: string[]; voice: string; constraints: string[]; revision?: number; growthLog?: string[]; tensionProfile?: string[]; }
export interface PetKnowledgeJson { sourceText: string; skillText: string; tags: string[]; preferredDocumentModes: string[]; referencePolicy: string; revision?: number; sourceQueries?: string[]; hypotheses?: string[]; collectedInsights?: string[]; maturationStage?: ProblemMaturationStage; }
export interface A2ANutrientSource { title: string; url: string; description: string; extractedText: string; imageUrl?: string; }
export interface A2ATurnEvaluation { usefulReferences: string[]; mentaleseAttributes: string[]; socialDelta: Partial<SimState>; contradictionSurprise: number; documentModeTendency: string; }
export interface A2ATurn { id: string; speakerId: string; targetId: string; text: string; evaluation: A2ATurnEvaluation; }
export interface A2AExchange { id: string; petId: string; tick: number; targetId: string; targetLabel: string; turns: A2ATurn[]; summary: string; nutrientSources?: A2ANutrientSource[]; }
export interface A2AState { nextExchangeTick: number; exchangeCount: number; turnCount: number; requiredExchanges: number; requiredTurns: number; }
export type FinalDocumentMode = 'story' | 'poem' | 'manufacturing_technical_file' | 'travel_plan' | 'philosophical_debate';
export interface FinalDocumentLogEntry { tick: number; speaker: string; target?: string; text: string; source: 'a2a' | 'player'; }
export interface FinalDocument { id: string; petId: string; tick: number; title: string; mode: FinalDocumentMode; modeLabel: string; body: string; references: Array<{ label: string; url: string; anchorText: string }>; reviewLog: FinalDocumentLogEntry[]; sourceExchangeIds: string[]; images?: Array<{ url: string; alt: string; sourceUrl: string; caption: string }>; }
export interface Thronglet extends SimEntity { kind: 'thronglet'; question: DispatchedQuestion; currentAction: SimAction; currentZoneId?: string; targetCharacterId?: number; throngId?: string; appearance: QuestionPetAppearance; personaJson?: PetPersonaJson; knowledgeJson?: PetKnowledgeJson; problemMaturation?: ProblemMaturationProfile; a2aState?: A2AState; }
export type SimEventType = 'player_player_dialogue' | 'player_npc_dialogue' | 'player_thronglet_response' | 'thronglet_interaction' | 'state_threshold' | 'throng_formed' | 'throng_dissolved' | 'thought_generated';
export interface SimEvent { id: string; type: SimEventType; createdAt: number; tick: number; actorId: string; targetId?: string; questionId?: string; promptText?: string; text?: string; delta: Partial<SimState>; significance: number; }
export interface SimScores { interaction: number; wisdom: number; community: number; resource: number; skill: number; care: number; }
export interface SimThrong { id: string; memberIds: string[]; center: { col: number; row: number }; topic: string; createdAtTick: number; stability: number; }
export interface SimSnapshot { tick: number; entities: SimEntity[]; thronglets: Thronglet[]; events: SimEvent[]; scores: SimScores; throngs: SimThrong[]; thoughts: string[]; a2aExchanges: A2AExchange[]; finalDocuments: FinalDocument[]; }
