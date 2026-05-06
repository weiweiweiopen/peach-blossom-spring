import type { QuestionPetAppearance } from '../pets/generateQuestionPet.js';

export interface SimState {
  energy: number; curiosity: number; stress: number; affinity: number; solitude: number; openness: number; stubbornness: number; resonanceWithPrompt: number; groupBond: number; money: number; skills: number;
}
export type SimAction = 'wander' | 'seekConversation' | 'talk' | 'listen' | 'rest' | 'seekMoney' | 'practiceSkill' | 'shareSkill' | 'visitRiver' | 'visitPeachTree' | 'joinThrong' | 'leaveThrong' | 'reflect';
export type SimEntityKind = 'player' | 'npc' | 'thronglet';
export interface DispatchedQuestion { id: string; ownerPlayerId: number | string; ownerName: string; text: string; createdAt: number; tags: string[]; }
export interface ThrongletMemoryEvent { id: string; tick: number; text: string; significance: number; }
export interface SimEntity { id: string; kind: SimEntityKind; characterId: number; displayName: string; prompt?: string; personaId?: string; ownerPlayerId?: string | number; state: SimState; memory: ThrongletMemoryEvent[]; }
export interface Thronglet extends SimEntity { kind: 'thronglet'; question: DispatchedQuestion; currentAction: SimAction; currentZoneId?: string; targetCharacterId?: number; throngId?: string; appearance: QuestionPetAppearance; }
export type SimEventType = 'player_player_dialogue' | 'player_npc_dialogue' | 'player_thronglet_response' | 'thronglet_interaction' | 'state_threshold' | 'throng_formed' | 'throng_dissolved' | 'thought_generated';
export interface SimEvent { id: string; type: SimEventType; createdAt: number; tick: number; actorId: string; targetId?: string; questionId?: string; promptText?: string; text?: string; delta: Partial<SimState>; significance: number; }
export interface SimScores { interaction: number; wisdom: number; community: number; resource: number; skill: number; care: number; }
export interface SimThrong { id: string; memberIds: string[]; center: { col: number; row: number }; topic: string; createdAtTick: number; stability: number; }
export interface SimSnapshot { tick: number; entities: SimEntity[]; thronglets: Thronglet[]; events: SimEvent[]; scores: SimScores; throngs: SimThrong[]; thoughts: string[]; }
