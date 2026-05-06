import type { ColorValue } from '../components/ui/types.js';
import {
  type OfficeLayout,
  type PlacedFurniture,
  TileType,
  type TileType as TileTypeVal,
} from '../office/types.js';

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
    | 'village'
    | 'caveEntrance'
    | 'temple'
    | 'storyCircle'
    | 'farm'
    | 'greenhouse'
    | 'guesthouse';
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
const fieldColor: ColorValue = { h: 82, s: 48, b: 2, c: 12 };
const cropColor: ColorValue = { h: 104, s: 52, b: -2, c: 18 };
const glassColor: ColorValue = { h: 178, s: 32, b: 24, c: 8 };
const trailColor: ColorValue = { h: 32, s: 40, b: 0, c: 10 };
const waterColor: ColorValue = { h: 205, s: 58, b: 0, c: 20 };
const bridgeColor: ColorValue = { h: 28, s: 36, b: -10, c: 18 };
const tavernColor: ColorValue = { h: 18, s: 45, b: 4, c: 20 };
const theatreColor: ColorValue = { h: 8, s: 44, b: 4, c: 18 };
const campColor: ColorValue = { h: 15, s: 55, b: 8, c: 18 };
const treeColor: ColorValue = { h: 88, s: 50, b: -12, c: 15 };
const peachBloomColor: ColorValue = { h: 342, s: 48, b: 22, c: 8 };
const petalGroundColor: ColorValue = { h: 334, s: 34, b: 28, c: 4 };
const lcdMintColor: ColorValue = { h: 92, s: 24, b: 20, c: 8 };
const templeColor: ColorValue = { h: 14, s: 38, b: -8, c: 24 };
const thaiTempleColor: ColorValue = { h: 46, s: 48, b: 12, c: 24 };
const cafeColor: ColorValue = { h: 19, s: 36, b: -5, c: 18 };

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

function addFurniture(
  furniture: PlacedFurniture[],
  type: string,
  col: number,
  row: number,
  color?: ColorValue,
): void {
  const item: PlacedFurniture = { uid: `${type}-${col}-${row}-${furniture.length}`, type, col, row };
  if (color) item.color = color;
  furniture.push(item);
}

export const worldZones: WorldZone[] = [
  {
    id: 'zone-a-river-farm',
    name: 'A Zone - River Farm',
    kind: 'farm',
    bounds: { col: 2, row: 2, w: 27, h: 27 },
    description: 'River, farm, greenhouse, insects, cows, drones, trailer home, and tractor.',
  },
  {
    id: 'zone-a-river',
    name: 'A Zone River',
    kind: 'river',
    bounds: { col: 2, row: 20, w: 27, h: 7 },
    description: 'A clear river running beside the farm.',
  },
  {
    id: 'zone-a-greenhouse',
    name: 'A Zone Greenhouse',
    kind: 'greenhouse',
    bounds: { col: 17, row: 6, w: 9, h: 8 },
    description: 'A glassy greenhouse surrounded by insects and plants.',
  },
  {
    id: 'zone-b-temple-restaurant',
    name: 'B Zone - Chinese Temple Restaurant',
    kind: 'temple',
    bounds: { col: 32, row: 2, w: 29, h: 27 },
    description: 'Chinese temple, Chinese restaurant, peach trees, and water buffalo.',
  },
  {
    id: 'zone-b-bridge',
    name: 'B Zone Stone Bridge',
    kind: 'bridge',
    bounds: { col: 29, row: 21, w: 5, h: 5 },
    description: 'A compact stone bridge connecting A and B across the river.',
  },
  {
    id: 'zone-b-restaurant',
    name: 'B Zone Chinese Restaurant',
    kind: 'restaurant',
    bounds: { col: 47, row: 10, w: 12, h: 9 },
    description: 'A Chinese-style restaurant tucked between peach trees.',
  },
  {
    id: 'zone-c-thai-temple',
    name: 'C Zone - Thai Temple',
    kind: 'temple',
    bounds: { col: 3, row: 34, w: 19, h: 20 },
    description: 'A Thai temple stage inspired by the reference photos.',
  },
  {
    id: 'zone-c-parang-cnx',
    name: 'parang cnx Coffee Homestay',
    kind: 'guesthouse',
    bounds: { col: 25, row: 35, w: 18, h: 16 },
    description: 'A coffee homestay with tables, plants, and warm gathering lights.',
  },
  {
    id: 'zone-c-dj-stage',
    name: 'C Zone DJ Stage',
    kind: 'theatre',
    bounds: { col: 46, row: 36, w: 15, h: 14 },
    description: 'DJ booth, audio desk, and speaker area.',
  },
  {
    id: 'campfire-circle',
    name: 'Campfire Circle',
    kind: 'campfire',
    bounds: { col: 30, row: 52, w: 10, h: 8 },
    description: 'Gathering circle for future roundtable mode.',
  },
  {
    id: 'archive-tree',
    name: 'Archive Tree',
    kind: 'archiveTree',
    bounds: { col: 29, row: 30, w: 7, h: 6 },
    description: 'The big tree keeps persona knowledge and community links.',
  },
  {
    id: 'abao-story-circle',
    name: 'Abao Story Circle',
    kind: 'storyCircle',
    bounds: { col: 36, row: 29, w: 10, h: 8 },
    description: 'The central conversation ground where Abao pulls the map into a storytelling split scene.',
  },
];

export const npcPlacements: NpcPlacement[] = [
  { personaId: 'andreas-siagian', col: 9, row: 9, zoneId: 'zone-a-river-farm', idleBehavior: 'wander' },
  { personaId: 'anastassia-pistofidou', col: 20, row: 9, zoneId: 'zone-a-greenhouse', idleBehavior: 'stand' },
  { personaId: 'giulia-tomasello', col: 53, row: 15, zoneId: 'zone-b-restaurant', idleBehavior: 'sit' },
  { personaId: 'christian-dils', col: 39, row: 9, zoneId: 'zone-b-temple-restaurant', idleBehavior: 'stand' },
  { personaId: 'jonathan-minchin', col: 28, row: 44, zoneId: 'zone-c-parang-cnx', idleBehavior: 'wander' },
  { personaId: 'marc-dusseiller', col: 51, row: 42, zoneId: 'zone-c-dj-stage', idleBehavior: 'perform' },
  { personaId: 'mika-satomi', col: 29, row: 23, zoneId: 'zone-b-bridge', idleBehavior: 'fish' },
  { personaId: 'rully-shabara', col: 14, row: 24, zoneId: 'zone-a-river', idleBehavior: 'boat' },
  { personaId: 'ryu-oyama', col: 33, row: 55, zoneId: 'campfire-circle', idleBehavior: 'campfire' },
  { personaId: 'stephanie-pan', col: 39, row: 45, zoneId: 'zone-c-parang-cnx', idleBehavior: 'wander' },
  { personaId: 'stelio-manousakis', col: 56, row: 43, zoneId: 'zone-c-dj-stage', idleBehavior: 'perform' },
  { personaId: 'svenja-keune', col: 18, row: 13, zoneId: 'zone-a-greenhouse', idleBehavior: 'sit' },
  { personaId: 'ted-hung', col: 7, row: 44, zoneId: 'zone-c-thai-temple', idleBehavior: 'campfire' },
  { personaId: 'tincuta-heinzel', col: 47, row: 20, zoneId: 'zone-b-temple-restaurant', idleBehavior: 'wander' },
  { personaId: 'abao', col: 40, row: 33, zoneId: 'abao-story-circle', idleBehavior: 'stand' },
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
  const furniture: PlacedFurniture[] = [];

  fillRect(tiles, tileColors, cols, { col: 0, row: 0, w: cols, h: rows }, TileType.FLOOR_1, villageColor);
  fillRect(tiles, tileColors, cols, { col: 0, row: 0, w: cols, h: 1 }, TileType.WALL, wallColor);
  fillRect(tiles, tileColors, cols, { col: 0, row: rows - 1, w: cols, h: 1 }, TileType.WALL, wallColor);
  fillRect(tiles, tileColors, cols, { col: 0, row: 0, w: 1, h: rows }, TileType.WALL, wallColor);
  fillRect(tiles, tileColors, cols, { col: cols - 1, row: 0, w: 1, h: rows }, TileType.WALL, wallColor);

  fillRect(tiles, tileColors, cols, { col: 2, row: 2, w: 27, h: 18 }, TileType.FLOOR_2, fieldColor);
  fillRect(tiles, tileColors, cols, { col: 5, row: 5, w: 9, h: 11 }, TileType.FLOOR_8, cropColor);
  fillRect(tiles, tileColors, cols, { col: 17, row: 6, w: 9, h: 8 }, TileType.FLOOR_4, glassColor);
  fillRect(tiles, tileColors, cols, { col: 2, row: 20, w: 27, h: 7 }, TileType.WALL, waterColor);
  fillRect(tiles, tileColors, cols, { col: 28, row: 21, w: 7, h: 5 }, TileType.FLOOR_3, bridgeColor);
  fillRect(tiles, tileColors, cols, { col: 3, row: 17, w: 26, h: 2 }, TileType.FLOOR_3, trailColor);
  fillRect(tiles, tileColors, cols, { col: 3, row: 3, w: 8, h: 3 }, TileType.FLOOR_5, petalGroundColor);
  fillRect(tiles, tileColors, cols, { col: 20, row: 15, w: 8, h: 3 }, TileType.FLOOR_5, petalGroundColor);
  addFurniture(furniture, 'DOUBLE_BOOKSHELF', 18, 6, { h: 170, s: 45, b: 30, c: 0 });
  addFurniture(furniture, 'DOUBLE_BOOKSHELF', 21, 6, { h: 170, s: 45, b: 30, c: 0 });
  addFurniture(furniture, 'LARGE_PLANT', 18, 9);
  addFurniture(furniture, 'LARGE_PLANT', 23, 9);
  addFurniture(furniture, 'WHITEBOARD', 7, 4, { h: 210, s: 45, b: 5, c: 25 });
  addFurniture(furniture, 'SOFA_SIDE', 7, 11, { h: 0, s: -40, b: 25, c: -10 });
  addFurniture(furniture, 'CUSHIONED_BENCH', 9, 11, { h: 0, s: -45, b: 10, c: 0 });
  addFurniture(furniture, 'DESK_SIDE', 12, 11, { h: 205, s: 55, b: -10, c: 20 });
  addFurniture(furniture, 'PC_SIDE', 12, 10, { h: 205, s: 65, b: 5, c: 25 });
  addFurniture(furniture, 'SMALL_TABLE_SIDE', 14, 7, { h: 205, s: 70, b: 10, c: 30 });
  addFurniture(furniture, 'CLOCK', 13, 6, { h: 205, s: 70, b: 10, c: 30 });
  for (const [col, row] of [[4, 4], [15, 4], [25, 5], [6, 15], [20, 15], [25, 16], [8, 3], [23, 17]] as const) {
    addFurniture(furniture, 'PLANT', col, row, peachBloomColor);
  }
  for (const [col, row] of [[3, 6], [11, 5], [18, 17], [27, 18]] as const) {
    addFurniture(furniture, 'PLANT_2', col, row, peachBloomColor);
  }
  for (const [col, row] of [[4, 9], [6, 13], [13, 6], [16, 16], [26, 12]] as const) {
    addFurniture(furniture, 'COFFEE', col, row, { h: 54, s: 70, b: 8, c: 30 });
  }
  for (const [col, row] of [[10, 14], [12, 14], [14, 14]] as const) {
    addFurniture(furniture, 'CUSHIONED_CHAIR_SIDE', col, row, { h: 0, s: -80, b: 20, c: 0 });
  }

  fillRect(tiles, tileColors, cols, { col: 32, row: 2, w: 29, h: 27 }, TileType.FLOOR_1, villageColor);
  fillRect(tiles, tileColors, cols, { col: 35, row: 5, w: 10, h: 9 }, TileType.FLOOR_5, templeColor);
  fillRect(tiles, tileColors, cols, { col: 47, row: 10, w: 12, h: 9 }, TileType.FLOOR_6, tavernColor);
  fillRect(tiles, tileColors, cols, { col: 33, row: 22, w: 28, h: 2 }, TileType.FLOOR_3, trailColor);
  fillRect(tiles, tileColors, cols, { col: 34, row: 3, w: 24, h: 2 }, TileType.FLOOR_5, petalGroundColor);
  fillRect(tiles, tileColors, cols, { col: 35, row: 19, w: 24, h: 3 }, TileType.FLOOR_5, petalGroundColor);
  addFurniture(furniture, 'BOOKSHELF', 38, 5, { h: 8, s: 65, b: 5, c: 35 });
  addFurniture(furniture, 'BOOKSHELF', 40, 5, { h: 8, s: 65, b: 5, c: 35 });
  addFurniture(furniture, 'LARGE_PAINTING', 38, 7, { h: 44, s: 70, b: 14, c: 30 });
  addFurniture(furniture, 'TABLE_FRONT', 50, 13, { h: 18, s: 42, b: -4, c: 18 });
  addFurniture(furniture, 'SMALL_TABLE_FRONT', 54, 13, { h: 18, s: 42, b: -4, c: 18 });
  addFurniture(furniture, 'WOODEN_BENCH', 50, 16);
  addFurniture(furniture, 'WOODEN_BENCH', 54, 16);
  for (const [col, row] of [[34, 4], [48, 4], [57, 5], [33, 15], [45, 18], [58, 21], [37, 24], [52, 25], [41, 4], [51, 20], [59, 17]] as const) {
    addFurniture(furniture, 'PLANT_2', col, row, peachBloomColor);
  }
  for (const [col, row] of [[36, 18], [39, 20], [43, 3], [55, 3]] as const) {
    addFurniture(furniture, 'PLANT', col, row, peachBloomColor);
  }
  for (const [col, row] of [[42, 18], [45, 21], [55, 23]] as const) {
    addFurniture(furniture, 'SOFA_SIDE', col, row, { h: 0, s: -80, b: -18, c: 10 });
  }

  fillRect(tiles, tileColors, cols, { col: 3, row: 34, w: 19, h: 20 }, TileType.FLOOR_5, thaiTempleColor);
  fillRect(tiles, tileColors, cols, { col: 25, row: 35, w: 18, h: 16 }, TileType.FLOOR_7, cafeColor);
  fillRect(tiles, tileColors, cols, { col: 46, row: 36, w: 15, h: 14 }, TileType.FLOOR_6, theatreColor);
  fillRect(tiles, tileColors, cols, { col: 30, row: 52, w: 10, h: 8 }, TileType.FLOOR_8, campColor);
  fillRect(tiles, tileColors, cols, { col: 29, row: 30, w: 7, h: 6 }, TileType.FLOOR_9, treeColor);
  fillRect(tiles, tileColors, cols, { col: 36, row: 29, w: 10, h: 8 }, TileType.FLOOR_6, lcdMintColor);
  fillRect(tiles, tileColors, cols, { col: 24, row: 29, w: 8, h: 3 }, TileType.FLOOR_5, petalGroundColor);
  fillRect(tiles, tileColors, cols, { col: 39, row: 34, w: 15, h: 3 }, TileType.FLOOR_5, petalGroundColor);
  fillRect(tiles, tileColors, cols, { col: 8, row: 31, w: 49, h: 2 }, TileType.FLOOR_3, trailColor);
  fillRect(tiles, tileColors, cols, { col: 31, row: 24, w: 2, h: 34 }, TileType.FLOOR_3, trailColor);
  addFurniture(furniture, 'LARGE_PAINTING', 9, 36, { h: 48, s: 72, b: 18, c: 35 });
  addFurniture(furniture, 'BOOKSHELF', 8, 38, { h: 42, s: 70, b: 18, c: 30 });
  addFurniture(furniture, 'BOOKSHELF', 12, 38, { h: 42, s: 70, b: 18, c: 30 });
  addFurniture(furniture, 'SMALL_PAINTING', 16, 39, { h: 315, s: 45, b: 15, c: 15 });
  addFurniture(furniture, 'TABLE_FRONT', 30, 40, { h: 20, s: 48, b: -6, c: 15 });
  addFurniture(furniture, 'COFFEE_TABLE', 35, 42, { h: 20, s: 48, b: -6, c: 15 });
  addFurniture(furniture, 'COFFEE', 31, 39);
  addFurniture(furniture, 'COFFEE', 36, 41);
  addFurniture(furniture, 'LARGE_PLANT', 27, 38);
  addFurniture(furniture, 'HANGING_PLANT', 40, 37, peachBloomColor);
  addFurniture(furniture, 'DESK_FRONT', 51, 39, { h: 240, s: 30, b: -12, c: 20 });
  addFurniture(furniture, 'PC_FRONT_ON_1', 51, 38, { h: 270, s: 60, b: 5, c: 25 });
  addFurniture(furniture, 'WHITEBOARD', 48, 40, { h: 0, s: -100, b: -20, c: 10 });
  addFurniture(furniture, 'WHITEBOARD', 57, 40, { h: 0, s: -100, b: -20, c: 10 });
  addFurniture(furniture, 'BIN', 47, 44, { h: 0, s: -100, b: -28, c: 20 });
  addFurniture(furniture, 'BIN', 59, 44, { h: 0, s: -100, b: -28, c: 20 });
  for (const [col, row] of [[5, 55], [12, 56], [22, 57], [43, 56], [55, 55], [59, 31]] as const) {
    addFurniture(furniture, 'PLANT_2', col, row, peachBloomColor);
  }

  return {
    version: 1,
    cols,
    rows,
    layoutRevision: 5,
    tiles,
    tileColors,
    furniture,
  };
}
