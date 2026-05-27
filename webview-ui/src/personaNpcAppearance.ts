export type PersonaGender = 'female' | 'male';

export interface PersonaNpcAppearance {
  gender: PersonaGender;
  palette: number;
  hueShift: number;
}

const PERSONA_NPC_APPEARANCE: Record<string, PersonaNpcAppearance> = {
  'andreas-siagian': { gender: 'male', palette: 0, hueShift: 0 },
  'anastassia-pistofidou': { gender: 'female', palette: 1, hueShift: 0 },
  'giulia-tomasello': { gender: 'female', palette: 5, hueShift: 0 },
  'christian-dils': { gender: 'male', palette: 3, hueShift: 0 },
  'jonathan-minchin': { gender: 'male', palette: 4, hueShift: 0 },
  'marc-dusseiller': { gender: 'male', palette: 15, hueShift: 0 },
  'mika-satomi': { gender: 'female', palette: 7, hueShift: 0 },
  'rully-shabara': { gender: 'male', palette: 2, hueShift: 0 },
  'wukir-suryadi': { gender: 'male', palette: 6, hueShift: 0 },
  'ryu-oyama': { gender: 'male', palette: 8, hueShift: 0 },
  'stephanie-pan': { gender: 'female', palette: 11, hueShift: 0 },
  'stelio-manousakis': { gender: 'male', palette: 10, hueShift: 0 },
  'svenja-keune': { gender: 'female', palette: 12, hueShift: 0 },
  'ted-hung': { gender: 'male', palette: 13, hueShift: 0 },
  'tincuta-heinzel': { gender: 'female', palette: 14, hueShift: 0 },
  abao: { gender: 'female', palette: 9, hueShift: 0 },
};

export function getPersonaNpcAppearance(personaId: string, fallbackIndex = 0): PersonaNpcAppearance {
  return PERSONA_NPC_APPEARANCE[personaId] ?? {
    gender: 'male',
    palette: fallbackIndex % 16,
    hueShift: 0,
  };
}
