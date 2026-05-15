import { Direction, type SpriteData } from '../office/types.js';
import { type HomePetRole,homePetRoles, homePetSlug, makeHomePetGrid } from './homePetVisuals.js';
import type { ThrongletExpressionType } from './throngletAssets.js';

const FRAME_COUNT = 22;
const TEMPLATE_FRAMES_PER_ROW = 7;
const FRAME_W = 16;
const FRAME_H = 32;
const GRID_SIZE = 14;
const GRID_X = 1;
const GRID_Y = 17;

export type PetRoleSlug = ReturnType<typeof homePetSlug>;

const bodyTypeToRole: Record<string, string> = {
  petArtist: 'artist',
  petScientist: 'scientist',
  petEngineer: 'engineer',
  petCook: 'cook',
  petDancer: 'dancer',
  petWorkshopologist: 'workshopologist',
  petDrinker: 'drinker',
  petSocialist: 'socialist',
  petProfessor: 'professor',
  petFireMaker: 'fire maker',
  petTailor: 'tailor',
  petMusician: 'musician',
  petShaman: 'shaman',
  petBubbleMaker: 'bubble maker',
  petArchitect: 'architect',
  petHerbalist: 'herbalist',
};

const roleBySlug = new Map(homePetRoles.map((role) => [homePetSlug(role.label), role]));

function makeSprite(): SpriteData {
  return Array.from({ length: FRAME_H }, () => new Array(FRAME_W).fill(''));
}

function setPixel(sprite: SpriteData, x: number, y: number, color: string): void {
  if (x < 0 || x >= FRAME_W || y < 0 || y >= FRAME_H) return;
  sprite[y][x] = color;
}

function clearPixel(sprite: SpriteData, x: number, y: number): void {
  if (x < 0 || x >= FRAME_W || y < 0 || y >= FRAME_H) return;
  sprite[y][x] = '';
}

function drawPixels(sprite: SpriteData, pixels: Array<[number, number]>, color: string): void {
  pixels.forEach(([x, y]) => setPixel(sprite, x, y, color));
}

function flipSpriteHorizontal(sprite: SpriteData): SpriteData {
  return sprite.map((row) => [...row].reverse());
}

function getRole(roleSlug: PetRoleSlug): HomePetRole {
  return roleBySlug.get(roleSlug) ?? homePetRoles[0];
}

function getRoleIndex(role: HomePetRole): number {
  return Math.max(0, homePetRoles.findIndex((candidate) => candidate.label === role.label));
}

export function resolvePetRoleSlug(bodyType: string, seed = 0): PetRoleSlug {
  const fixedRole = bodyTypeToRole[bodyType];
  if (fixedRole) return homePetSlug(fixedRole);
  return homePetSlug(homePetRoles[Math.abs(seed) % homePetRoles.length].label);
}

function copyHomeGrid(sprite: SpriteData, role: HomePetRole, frame: number, yOffset: number): void {
  const grid = makeHomePetGrid(role, getRoleIndex(role));
  const runLift = frame % 2 === 1 ? -1 : 0;
  const yBase = GRID_Y + yOffset + runLift;

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const color = grid[y][x];
      if (!color) continue;
      setPixel(sprite, GRID_X + x, yBase + y, color);
    }
  }
}

function drawExpression(sprite: SpriteData, expression: ThrongletExpressionType, direction: Direction, yOffset: number): void {
  const yBase = GRID_Y + yOffset;
  const black = '#000000';
  const accent = '#FCF46B';
  const blush = '#FFD4FF';

  if (direction === Direction.UP) {
    clearPixel(sprite, GRID_X + 5, yBase + 5);
    clearPixel(sprite, GRID_X + 8, yBase + 5);
    clearPixel(sprite, GRID_X + 7, yBase + 6);
    drawPixels(sprite, [[GRID_X + 6, yBase + 6], [GRID_X + 7, yBase + 5], [GRID_X + 8, yBase + 6]], accent);
    return;
  }

  if (direction === Direction.RIGHT) {
    clearPixel(sprite, GRID_X + 5, yBase + 5);
    clearPixel(sprite, GRID_X + 8, yBase + 5);
    clearPixel(sprite, GRID_X + 7, yBase + 6);
    drawPixels(sprite, [[GRID_X + 10, yBase + 5]], black);
    if (expression === 'sleepy') drawPixels(sprite, [[GRID_X + 9, yBase + 5], [GRID_X + 10, yBase + 5]], black);
    if (expression === 'happy') drawPixels(sprite, [[GRID_X + 10, yBase + 7], [GRID_X + 11, yBase + 8]], black);
    else if (expression === 'stressed') drawPixels(sprite, [[GRID_X + 10, yBase + 8], [GRID_X + 11, yBase + 7]], black);
    else drawPixels(sprite, [[GRID_X + 10, yBase + 7], [GRID_X + 11, yBase + 7]], black);
    if (expression === 'curious') drawPixels(sprite, [[GRID_X + 12, yBase + 3], [GRID_X + 13, yBase + 2], [GRID_X + 13, yBase + 4]], accent);
    setPixel(sprite, GRID_X + 11, yBase + 6, blush);
    return;
  }

  if (expression === 'sleepy') {
    drawPixels(sprite, [[GRID_X + 5, yBase + 5], [GRID_X + 6, yBase + 5], [GRID_X + 8, yBase + 5], [GRID_X + 9, yBase + 5]], black);
  }
  if (expression === 'happy') drawPixels(sprite, [[GRID_X + 6, yBase + 7], [GRID_X + 7, yBase + 8], [GRID_X + 8, yBase + 7]], black);
  else if (expression === 'social') drawPixels(sprite, [[GRID_X + 6, yBase + 7], [GRID_X + 7, yBase + 7], [GRID_X + 8, yBase + 7]], accent);
  else if (expression === 'curious') drawPixels(sprite, [[GRID_X + 11, yBase + 3], [GRID_X + 12, yBase + 2], [GRID_X + 13, yBase + 3], [GRID_X + 12, yBase + 5]], accent);
  else if (expression === 'stressed') drawPixels(sprite, [[GRID_X + 6, yBase + 8], [GRID_X + 7, yBase + 7], [GRID_X + 8, yBase + 8], [GRID_X + 4, yBase + 6], [GRID_X + 10, yBase + 6]], black);
  else drawPixels(sprite, [[GRID_X + 6, yBase + 7], [GRID_X + 7, yBase + 7]], black);
}

function drawRunFeet(sprite: SpriteData, role: HomePetRole, frame: number, direction: Direction, yOffset: number): void {
  const grid = makeHomePetGrid(role, getRoleIndex(role));
  const footColor = grid[10][5] || '#000000';
  const yBase = GRID_Y + yOffset;
  const kick = frame % 2 === 1 ? 1 : 0;
  if (direction === Direction.RIGHT) {
    drawPixels(sprite, [[GRID_X + 5, yBase + 13 + kick], [GRID_X + 9, yBase + 13 - kick]], footColor);
    return;
  }
  drawPixels(sprite, [[GRID_X + 5, yBase + 13 + kick], [GRID_X + 8, yBase + 13 - kick]], footColor);
}

function drawPetFrame(expression: ThrongletExpressionType, frame: number, direction: Direction, roleSlug: PetRoleSlug): SpriteData {
  if (direction === Direction.LEFT) return flipSpriteHorizontal(drawPetFrame(expression, frame, Direction.RIGHT, roleSlug));

  const role = getRole(roleSlug);
  const sprite = makeSprite();
  const yOffset = Math.round(Math.sin((frame / TEMPLATE_FRAMES_PER_ROW) * Math.PI * 2));
  copyHomeGrid(sprite, role, frame, yOffset);
  drawExpression(sprite, expression, direction, yOffset);
  drawRunFeet(sprite, role, frame, direction, yOffset);
  return sprite;
}

export function createThrongletWaAnimation(expression: ThrongletExpressionType, roleSlug: PetRoleSlug = 'artist'): SpriteData[] {
  return Array.from({ length: FRAME_COUNT }, (_item, frame) => drawPetFrame(expression, frame % TEMPLATE_FRAMES_PER_ROW, Direction.DOWN, roleSlug));
}

export function createThrongletWaDirectionalAnimations(
  expression: ThrongletExpressionType,
  roleSlug: PetRoleSlug = 'artist',
): Partial<Record<Direction, SpriteData[]>> {
  const down = Array.from({ length: TEMPLATE_FRAMES_PER_ROW }, (_item, frame) => drawPetFrame(expression, frame, Direction.DOWN, roleSlug));
  const up = Array.from({ length: TEMPLATE_FRAMES_PER_ROW }, (_item, frame) => drawPetFrame(expression, frame, Direction.UP, roleSlug));
  const right = Array.from({ length: TEMPLATE_FRAMES_PER_ROW }, (_item, frame) => drawPetFrame(expression, frame, Direction.RIGHT, roleSlug));
  return {
    [Direction.DOWN]: down,
    [Direction.UP]: up,
    [Direction.RIGHT]: right,
    [Direction.LEFT]: right.map(flipSpriteHorizontal),
  };
}
