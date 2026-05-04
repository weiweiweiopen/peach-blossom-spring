import type { ColorValue } from '../components/ui/types.js';
import { TileType, type OfficeLayout, type TileType as TileTypeVal } from '../office/types.js';

export type WorldZone = {
  id: string;
  name: string;
  kind:
    | 'river'
    | 'bridge'
    | 'school'
    | 'restaurant'
    | 'theatre'
    | 'forest'
    | 'campfire'
    | 'archiveTree'
    | 'village';
  bounds: { col: number; row: number; w: number; h: number };
  description: string;
};

export type NpcPlacement = {
  personaId: string;
  col: number;
  row: number;
  zoneId: string;
  idleBehavior?: 'stand' | 'wander' | 'sit' | 'perform' | 'fish' | 'boat' | 'campfire';
};

export type CommunityLink = { label: string; url: string };

const wallColor: ColorValue = { h: 45, s: 18, b: -22, c: 0 };
const villageColor: ColorValue = { h: 38, s: 35, b: 12, c: 0 };
const trailColor: ColorValue = { h: 32, s: 40, b: 0, c: 10 };
const waterColor: ColorValue = { h: 205, s: 58, b: 0, c: 20 };
const bridgeColor: ColorValue = { h: 28, s: 36, b: -10, c: 18 };
const woodsColor: ColorValue = { h: 105, s: 42, b: -8, c: 18 };
const schoolColor: ColorValue = { h: 26, s: 38, b: 10, c: 8 };
const tavernColor: ColorValue = { h: 18, s: 45, b: 4, c: 20 };
const theatreColor: ColorValue = { h: 8, s: 44, b: 4, c: 18 };
const campColor: ColorValue = { h: 15, s: 55, b: 8, c: 18 };
const treeColor: ColorValue = { h: 88, s: 50, b: -12, c: 15 };
const peachBloomColor: ColorValue = { h: 342, s: 48, b: 22, c: 8 };
const templeColor: ColorValue = { h: 14, s: 38, b: -8, c: 24 };
const innRoofColor: ColorValue = { h: 20, s: 50, b: -10, c: 26 };

function fillRect(
  tiles: TileTypeVal[],
  tileColors: Array<ColorValue | null>,
  cols: number,
  rect: { col: number; row: number; w: number; h: number },
  tile: TileTypeVal,
  color: ColorValue | null,
): void {
  for (let r = rect.row; r < rect.row + rect.h; r++) {
    for (let c = rect.col; c < rect.col + rect.w; c++) {
      const idx = r * cols + c;
      tiles[idx] = tile;
      tileColors[idx] = color;
    }
  }
}

export const worldZones: WorldZone[] = [
  {
    id: 'river-crossing',
    name: 'River Crossing',
    kind: 'river',
    bounds: { col: 0, row: 26, w: 64, h: 10 },
    description: 'A calm river crossing the village, with fishers and a passing boat.',
  },
  {
    id: 'old-bridge',
    name: 'Old Stone Bridge',
    kind: 'bridge',
    bounds: { col: 28, row: 27, w: 8, h: 8 },
    description: 'A small old bridge connecting both riverbanks.',
  },
  {
    id: 'village-houses',
    name: 'Riverside Village',
    kind: 'village',
    bounds: { col: 6, row: 8, w: 22, h: 14 },
    description: 'Workshops and houses where daily life unfolds.',
  },
  {
    id: 'school-workshop',
    name: 'Private School Workshop',
    kind: 'school',
    bounds: { col: 34, row: 10, w: 12, h: 10 },
    description: 'A learning area for decentralized education and infrastructure talks.',
  },
  {
    id: 'restaurant-tavern',
    name: 'Tea Tavern',
    kind: 'restaurant',
    bounds: { col: 48, row: 12, w: 12, h: 10 },
    description: 'A social food corner with a waiter, stories, and debate.',
  },
  {
    id: 'music-theatre',
    name: 'Music Theatre',
    kind: 'theatre',
    bounds: { col: 8, row: 38, w: 14, h: 10 },
    description: 'Guqin and ribbon-dance references around a tiny open stage.',
  },
  {
    id: 'forest-hut',
    name: 'Forest Hut',
    kind: 'forest',
    bounds: { col: 40, row: 38, w: 18, h: 14 },
    description: 'Woodland and hut for ecological and field-based conversations.',
  },
  {
    id: 'campfire-circle',
    name: 'Campfire Circle',
    kind: 'campfire',
    bounds: { col: 25, row: 42, w: 10, h: 8 },
    description: 'Gathering circle for future roundtable mode.',
  },
  {
    id: 'archive-tree',
    name: 'Archive Tree',
    kind: 'archiveTree',
    bounds: { col: 29, row: 4, w: 8, h: 8 },
    description: 'The big tree keeps persona knowledge and community links.',
  },
];

export const npcPlacements: NpcPlacement[] = [
  { personaId: 'andreas-siagian', col: 16, row: 16, zoneId: 'village-houses', idleBehavior: 'wander' },
  { personaId: 'anastassia-pistofidou', col: 37, row: 13, zoneId: 'school-workshop', idleBehavior: 'stand' },
  { personaId: 'giulia-tomasello', col: 54, row: 16, zoneId: 'restaurant-tavern', idleBehavior: 'sit' },
  { personaId: 'christian-dils', col: 42, row: 14, zoneId: 'school-workshop', idleBehavior: 'stand' },
  { personaId: 'jonathan-minchin', col: 46, row: 46, zoneId: 'forest-hut', idleBehavior: 'wander' },
  { personaId: 'marc-dusseiller', col: 16, row: 42, zoneId: 'music-theatre', idleBehavior: 'perform' },
  { personaId: 'mika-satomi', col: 33, row: 29, zoneId: 'old-bridge', idleBehavior: 'fish' },
  { personaId: 'rully-shabara', col: 31, row: 31, zoneId: 'river-crossing', idleBehavior: 'boat' },
  { personaId: 'ryu-oyama', col: 28, row: 45, zoneId: 'campfire-circle', idleBehavior: 'campfire' },
  { personaId: 'stephanie-pan', col: 51, row: 17, zoneId: 'restaurant-tavern', idleBehavior: 'wander' },
  { personaId: 'stelio-manousakis', col: 12, row: 44, zoneId: 'music-theatre', idleBehavior: 'perform' },
  { personaId: 'svenja-keune', col: 35, row: 15, zoneId: 'school-workshop', idleBehavior: 'sit' },
  { personaId: 'ted-hung', col: 30, row: 45, zoneId: 'campfire-circle', idleBehavior: 'campfire' },
  { personaId: 'tincuta-heinzel', col: 45, row: 44, zoneId: 'forest-hut', idleBehavior: 'wander' },
];

export const communityLinks: CommunityLink[] = [
  { label: 'Hackteria', url: 'https://hackteria.org' },
  { label: 'Lifepatch', url: 'https://lifepatch.org' },
  { label: 'Fabricademy', url: 'https://fabricademy.org' },
  { label: 'Fablab Taipei', url: 'https://www.fablabtaipei.tw' },
  { label: 'Modern Body Festival', url: 'https://www.facebook.com/modernbodyfestival' },
  { label: 'KOBAKANT', url: 'https://www.kobakant.at' },
  { label: 'Green FabLab', url: 'https://greenfablab.org' },
  { label: 'NGM / Non-Governmental Matters', url: 'https://www.nonmatter.tw' },
];

export function isInZone(col: number, row: number, zone: WorldZone, padding = 0): boolean {
  return (
    col >= zone.bounds.col - padding &&
    row >= zone.bounds.row - padding &&
    col < zone.bounds.col + zone.bounds.w + padding &&
    row < zone.bounds.row + zone.bounds.h + padding
  );
}

export function createPeachBlossomLayout(): OfficeLayout {
  const cols = 64;
  const rows = 64;
  const tiles = new Array<TileTypeVal>(cols * rows).fill(TileType.FLOOR_1);
  const tileColors = new Array<ColorValue | null>(cols * rows).fill(villageColor);

  fillRect(tiles, tileColors, cols, { col: 0, row: 0, w: cols, h: rows }, TileType.FLOOR_1, villageColor);

  fillRect(tiles, tileColors, cols, { col: 0, row: 0, w: cols, h: 1 }, TileType.WALL, wallColor);
  fillRect(tiles, tileColors, cols, { col: 0, row: rows - 1, w: cols, h: 1 }, TileType.WALL, wallColor);
  fillRect(tiles, tileColors, cols, { col: 0, row: 0, w: 1, h: rows }, TileType.WALL, wallColor);
  fillRect(tiles, tileColors, cols, { col: cols - 1, row: 0, w: 1, h: rows }, TileType.WALL, wallColor);

  fillRect(tiles, tileColors, cols, { col: 2, row: 24, w: 60, h: 12 }, TileType.WALL, waterColor);
  fillRect(tiles, tileColors, cols, { col: 0, row: 26, w: 64, h: 10 }, TileType.WALL, waterColor);
  fillRect(tiles, tileColors, cols, { col: 29, row: 27, w: 6, h: 8 }, TileType.FLOOR_3, bridgeColor);

  fillRect(tiles, tileColors, cols, { col: 5, row: 7, w: 24, h: 16 }, TileType.FLOOR_2, villageColor);
  fillRect(tiles, tileColors, cols, { col: 34, row: 10, w: 12, h: 10 }, TileType.FLOOR_4, schoolColor);
  fillRect(tiles, tileColors, cols, { col: 48, row: 12, w: 12, h: 10 }, TileType.FLOOR_5, tavernColor);
  fillRect(tiles, tileColors, cols, { col: 8, row: 38, w: 14, h: 10 }, TileType.FLOOR_6, theatreColor);
  fillRect(tiles, tileColors, cols, { col: 40, row: 38, w: 18, h: 14 }, TileType.FLOOR_7, woodsColor);
  fillRect(tiles, tileColors, cols, { col: 25, row: 42, w: 10, h: 8 }, TileType.FLOOR_8, campColor);
  fillRect(tiles, tileColors, cols, { col: 29, row: 4, w: 8, h: 8 }, TileType.FLOOR_9, treeColor);

  // Peach grove and Chinese-style landmarks
  fillRect(tiles, tileColors, cols, { col: 6, row: 52, w: 20, h: 8 }, TileType.FLOOR_9, peachBloomColor);
  fillRect(tiles, tileColors, cols, { col: 50, row: 6, w: 10, h: 8 }, TileType.FLOOR_5, templeColor);
  fillRect(tiles, tileColors, cols, { col: 6, row: 18, w: 12, h: 6 }, TileType.FLOOR_4, innRoofColor);
  fillRect(tiles, tileColors, cols, { col: 18, row: 18, w: 10, h: 6 }, TileType.FLOOR_4, innRoofColor);

  fillRect(tiles, tileColors, cols, { col: 3, row: 31, w: 58, h: 2 }, TileType.FLOOR_3, trailColor);
  fillRect(tiles, tileColors, cols, { col: 31, row: 5, w: 2, h: 48 }, TileType.FLOOR_3, trailColor);

  return {
    version: 1,
    cols,
    rows,
    layoutRevision: 3,
    tiles,
    tileColors,
    furniture: [],
  };
}
