import { appearanceToAnimationData, appearanceToSpriteData, generateQuestionPet, makePetSeed } from './generateQuestionPet.js';

export interface PetStats {
  social: number;
  learning: number;
  tension: number;
  curiosity: number;
  energy: number;
}

export interface PetInteraction {
  id: string;
  petId: string;
  actorType: 'npc' | 'player' | 'system';
  actorId?: string;
  message?: string;
  tags?: string[];
  deltaStats?: Partial<PetStats>;
  createdAt: number;
}

export interface PetDispatch {
  id: string;
  ownerId: string;
  ownerName?: string;
  displayName?: string;
  question: string;
  skill?: string;
  seed: string;
  spriteProfile: {
    paletteId: string;
    shapeTags: string[];
    iconData?: string;
    animationData?: string;
    moodType?: string;
    throngletAssetBase?: string;
    throngletFrameCount?: number;
  };
  createdAt: number;
  lastSeenAt?: number;
  worldPosition: {
    mapId: string;
    x: number;
    y: number;
  };
  stats: PetStats;
  interactions: PetInteraction[];
  status: 'active' | 'hibernating' | 'archived';
}

export interface RemotePetStore {
  getOwnerId(): string;
  listPets(): PetDispatch[];
  createDispatch(input: { ownerName?: string; displayName?: string; question: string; skill?: string; seed: string; isMobile?: boolean }): PetDispatch;
  addInteraction(petId: string, interaction: Omit<PetInteraction, 'id' | 'petId' | 'createdAt'>): PetInteraction | null;
  updatePets(pets: PetDispatch[]): void;
  clearLocalDemo(): void;
}

export const OWNER_ID_KEY = 'pbs.ownerId';
export const PETS_KEY = 'pbs.dispatchedPets';
export const INTERACTIONS_KEY = 'pbs.petInteractions';
export const LANGUAGE_KEY = 'pbs.settings.language';

const DESKTOP_MAX_VISIBLE = 40;
const MOBILE_MAX_VISIBLE = 20;

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

let writeTimer = 0;
function debouncedWrite(key: string, value: unknown): void {
  window.clearTimeout(writeTimer);
  writeTimer = window.setTimeout(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, 120);
}

function immediateWrite(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function uuid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function clampStat(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function tagsFromText(text: string): string[] {
  return Array.from(new Set(text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((word) => word.length >= 3).slice(0, 8)));
}

export function getMaxVisiblePets(isMobile = false): number {
  return isMobile ? MOBILE_MAX_VISIBLE : DESKTOP_MAX_VISIBLE;
}

export class LocalPetStore implements RemotePetStore {
  getOwnerId(): string {
    const existing = localStorage.getItem(OWNER_ID_KEY);
    if (existing) return existing;
    const next = uuid('owner');
    localStorage.setItem(OWNER_ID_KEY, next);
    return next;
  }

  listPets(): PetDispatch[] {
    const pets = safeRead<PetDispatch[]>(PETS_KEY, []);
    const interactions = safeRead<PetInteraction[]>(INTERACTIONS_KEY, []);
    const byPet = new Map<string, PetInteraction[]>();
    interactions.forEach((entry) => {
      byPet.set(entry.petId, [...(byPet.get(entry.petId) ?? []), entry]);
    });
    return pets.map((pet) => ({ ...pet, interactions: byPet.get(pet.id) ?? pet.interactions ?? [] }));
  }

  createDispatch(input: { ownerName?: string; displayName?: string; question: string; skill?: string; seed: string; isMobile?: boolean }): PetDispatch {
    const ownerId = this.getOwnerId();
    const appearance = generateQuestionPet(input.question, input.seed);
    const tags = tagsFromText(`${input.question} ${input.skill ?? ''}`);
    const allPets = this.listPets();
    const pet: PetDispatch = {
      id: uuid('pet'),
      ownerId,
      ownerName: input.ownerName,
      displayName: input.displayName || (input.ownerName ? `${input.ownerName}'s pet` : 'Question Pet'),
      question: input.question,
      skill: input.skill,
      seed: input.seed,
      spriteProfile: {
        paletteId: `tama-${appearance.seed % 3}`,
        shapeTags: [appearance.bodyType, appearance.eyeType, appearance.accessoryType, appearance.moodType, ...tags.slice(0, 3)],
        iconData: JSON.stringify(appearanceToSpriteData(appearance)),
        animationData: JSON.stringify(appearanceToAnimationData(appearance)),
        moodType: appearance.moodType,
        throngletAssetBase: appearance.throngletAnimation.source,
        throngletFrameCount: appearance.throngletAnimation.expressionFrames.idle.length,
      },
      createdAt: Date.now(),
      worldPosition: {
        mapId: 'tamagotchi-peach-forest',
        x: 30 + (appearance.seed % 18),
        y: 28 + ((appearance.seed >>> 4) % 18),
      },
      stats: {
        social: 45 + (appearance.seed % 18),
        learning: 35 + ((appearance.seed >>> 3) % 20),
        tension: 20 + ((appearance.seed >>> 6) % 35),
        curiosity: 45 + ((appearance.seed >>> 9) % 35),
        energy: 70 + ((appearance.seed >>> 12) % 25),
      },
      interactions: [],
      status: 'active',
    };
    const next = this.applyVisibilityRules([...allPets, pet], input.isMobile);
    immediateWrite(PETS_KEY, next.map((pet) => ({ ...pet, interactions: [] })));
    immediateWrite(INTERACTIONS_KEY, next.flatMap((item) => item.interactions ?? []));
    return next.find((item) => item.id === pet.id) ?? pet;
  }

  addInteraction(petId: string, interaction: Omit<PetInteraction, 'id' | 'petId' | 'createdAt'>): PetInteraction | null {
    const pets = this.listPets();
    const pet = pets.find((item) => item.id === petId);
    if (!pet) return null;
    const created: PetInteraction = { ...interaction, id: uuid('note'), petId, createdAt: Date.now() };
    pet.interactions = [created, ...(pet.interactions ?? [])].slice(0, 20);
    if (interaction.deltaStats) {
      pet.stats = { ...pet.stats };
      Object.entries(interaction.deltaStats).forEach(([key, delta]) => {
        pet.stats[key as keyof PetStats] = clampStat(pet.stats[key as keyof PetStats] + Number(delta ?? 0));
      });
    }
    this.updatePets(pets);
    return created;
  }

  updatePets(pets: PetDispatch[]): void {
    debouncedWrite(PETS_KEY, pets.map((pet) => ({ ...pet, interactions: [] })));
    debouncedWrite(INTERACTIONS_KEY, pets.flatMap((item) => item.interactions ?? []));
  }

  clearLocalDemo(): void {
    localStorage.removeItem(PETS_KEY);
    localStorage.removeItem(INTERACTIONS_KEY);
  }

  private applyVisibilityRules(pets: PetDispatch[], isMobile = false): PetDispatch[] {
    const max = getMaxVisiblePets(isMobile);
    const active = pets.filter((pet) => pet.status === 'active').sort((a, b) => a.createdAt - b.createdAt);
    const overflow = Math.max(0, active.length - max);
    const hibernateIds = new Set(active.slice(0, overflow).map((pet) => pet.id));
    return pets.map((pet) => hibernateIds.has(pet.id) ? { ...pet, status: 'hibernating' as const } : pet);
  }
}

export const petStore = new LocalPetStore();
export { makePetSeed, tagsFromText };
