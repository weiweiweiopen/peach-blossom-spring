import type { SpriteData } from '../office/types.js';
import { hashQuestion, mulberry32 } from './hashQuestion.js';

export interface QuestionPetAppearance {
  seed: number;
  bodyType: string;
  eyeType: string;
  mouthType: string;
  accessoryType: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    outline: string;
  };
  sprite16: number[][];
}

const bodyTypes = ['roundBlob', 'ovalEgg', 'softBlock', 'seedBody', 'teardrop', 'doubleLobed', 'antennaCreature', 'wingSide'];
const eyeTypes = ['dot', 'sleepy', 'wide', 'mismatch'];
const mouthTypes = ['open', 'line', 'surprised', 'none'];
const accessoryTypes = ['questionAntenna', 'leafSprout', 'horn', 'tinyFin', 'sideEars', 'tailNub', 'floatingDot', 'haloPixel', 'blushDots'];

type Palette = QuestionPetAppearance['palette'];

const themePalettes: Array<{ words: string[]; palette: Palette }> = [
  { words: ['money', 'funding', 'grant', 'resource', 'budget', '補助', '資金', '錢'], palette: { primary: '#F7D94A', secondary: '#FFF2A6', accent: '#FF7A2F', outline: '#1B1B14' } },
  { words: ['care', 'community', 'support', '照顧', '支持', '社群'], palette: { primary: '#FF8FBC', secondary: '#FFD0E4', accent: '#FFF2A6', outline: '#1B1B14' } },
  { words: ['technology', 'tool', 'media', 'digital', '科技', '工具', '媒體'], palette: { primary: '#B7D879', secondary: '#79C7C5', accent: '#45A6FF', outline: '#253421' } },
  { words: ['ecology', 'plant', 'multispecies', 'forest', '生態', '植物', '多物種'], palette: { primary: '#B7D879', secondary: '#FF8FBC', accent: '#FFD0E4', outline: '#253421' } },
  { words: ['conflict', 'pressure', 'burnout', '衝突', '壓力', '疲勞'], palette: { primary: '#1B1B14', secondary: '#FF7A2F', accent: '#FF4FA3', outline: '#FFF2A6' } },
  { words: ['philosophy', 'identity', 'ontology', '哲學', '身分', '存在'], palette: { primary: '#B7D879', secondary: '#FFF2A6', accent: '#45A6FF', outline: '#253421' } },
];

const fallbackPalettes: Palette[] = [
  { primary: '#F7D94A', secondary: '#FFF2A6', accent: '#FF8FBC', outline: '#1B1B14' },
  { primary: '#B7D879', secondary: '#79C7C5', accent: '#FF8FBC', outline: '#253421' },
  { primary: '#FFD0E4', secondary: '#FF8FBC', accent: '#45A6FF', outline: '#1B1B14' },
];

function pickPalette(question: string, seed: number): Palette {
  const lower = question.toLowerCase();
  const themed = themePalettes.find((entry) => entry.words.some((word) => lower.includes(word)));
  const base = themed?.palette ?? fallbackPalettes[seed % fallbackPalettes.length];
  const accents = ['#FF7A2F', '#FF4FA3', '#45A6FF', '#79C7C5', '#FF8FBC'];
  return { ...base, accent: accents[(seed >>> 3) % accents.length] };
}

function inBody(bodyType: string, x: number, y: number): boolean {
  const dx = x - 7.5;
  const dy = y - 8;
  if (bodyType === 'roundBlob') return dx * dx / 31 + dy * dy / 27 <= 1;
  if (bodyType === 'ovalEgg') return dx * dx / 22 + (y - 8.5) * (y - 8.5) / 36 <= 1;
  if (bodyType === 'softBlock') return x >= 4 && x <= 11 && y >= 4 && y <= 13 && !((x === 4 || x === 11) && (y === 4 || y === 13));
  if (bodyType === 'seedBody') return dx * dx / 20 + (y - 9) * (y - 9) / 30 <= 1 && !(x < 5 && y < 6);
  if (bodyType === 'teardrop') return dx * dx / (14 + y) + (y - 9) * (y - 9) / 30 <= 1 && y >= 3;
  if (bodyType === 'doubleLobed') return (x - 5.5) ** 2 / 14 + (y - 8) ** 2 / 24 <= 1 || (x - 9.5) ** 2 / 14 + (y - 8) ** 2 / 24 <= 1;
  if (bodyType === 'wingSide') return dx * dx / 22 + dy * dy / 28 <= 1 || ((x === 2 || x === 13) && y >= 7 && y <= 10);
  return dx * dx / 25 + dy * dy / 30 <= 1;
}

function set(grid: number[][], x: number, y: number, value: number): void {
  if (x >= 0 && x < 16 && y >= 0 && y < 16) grid[y][x] = value;
}

export function generateQuestionPet(question: string): QuestionPetAppearance {
  const seed = hashQuestion(question || 'question-pet');
  const rng = mulberry32(seed);
  const bodyType = bodyTypes[Math.floor(rng() * bodyTypes.length)];
  const eyeType = eyeTypes[Math.floor(rng() * eyeTypes.length)];
  const mouthType = mouthTypes[Math.floor(rng() * mouthTypes.length)];
  const accessoryType = accessoryTypes[Math.floor(rng() * accessoryTypes.length)];
  const palette = pickPalette(question, seed);
  const grid = Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => 0));

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (!inBody(bodyType, x, y)) continue;
      const edge = !inBody(bodyType, x - 1, y) || !inBody(bodyType, x + 1, y) || !inBody(bodyType, x, y - 1) || !inBody(bodyType, x, y + 1);
      grid[y][x] = edge ? 1 : (x + y + seed) % 7 === 0 ? 3 : 2;
    }
  }

  const eyeY = bodyType === 'teardrop' ? 7 : 8;
  const eyes = eyeType === 'mismatch' ? [[6, eyeY, 1], [10, eyeY, 2]] : [[6, eyeY, 1], [10, eyeY, 1]];
  for (const [x, y, h] of eyes) {
    if (eyeType === 'sleepy') { set(grid, x - 1, y, 1); set(grid, x, y, 1); }
    else if (eyeType === 'wide') { set(grid, x, y, 1); set(grid, x, y + 1, 1); }
    else { for (let dy = 0; dy < h; dy++) set(grid, x, y + dy, 1); }
  }
  if (mouthType === 'line') { set(grid, 7, 11, 1); set(grid, 8, 11, 1); }
  if (mouthType === 'open') { set(grid, 8, 11, 1); set(grid, 8, 12, 1); }
  if (mouthType === 'surprised') { set(grid, 8, 11, 1); set(grid, 7, 11, 1); set(grid, 8, 12, 1); }

  if (accessoryType === 'questionAntenna') { set(grid, 8, 3, 1); set(grid, 9, 2, 1); set(grid, 10, 2, 1); set(grid, 9, 1, 1); }
  if (accessoryType === 'leafSprout') { set(grid, 7, 3, 3); set(grid, 8, 2, 3); set(grid, 9, 3, 3); }
  if (accessoryType === 'horn') { set(grid, 6, 3, 1); set(grid, 9, 3, 1); }
  if (accessoryType === 'tinyFin') { set(grid, 13, 8, 3); set(grid, 14, 7, 3); set(grid, 14, 9, 3); }
  if (accessoryType === 'sideEars') { set(grid, 3, 7, 3); set(grid, 12, 7, 3); }
  if (accessoryType === 'tailNub') { set(grid, 12, 11, 3); set(grid, 13, 11, 1); }
  if (accessoryType === 'floatingDot') { set(grid, 12, 3, 3); set(grid, 13, 2, 1); }
  if (accessoryType === 'haloPixel') { set(grid, 6, 2, 3); set(grid, 7, 2, 3); set(grid, 8, 2, 3); set(grid, 9, 2, 3); }
  if (accessoryType === 'blushDots') { set(grid, 4, 10, 3); set(grid, 11, 10, 3); }

  return { seed, bodyType, eyeType, mouthType, accessoryType, palette, sprite16: grid };
}

export function appearanceToSpriteData(appearance: QuestionPetAppearance): SpriteData {
  const colors = ['', appearance.palette.outline, appearance.palette.primary, appearance.palette.accent, appearance.palette.secondary];
  return appearance.sprite16.map((row) => row.map((cell) => colors[cell] ?? ''));
}
