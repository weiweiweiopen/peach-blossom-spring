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
    | 'region'
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

// Shared palette requested for both the entrance UI and the explorable world:
// yellow #FCF46B, blue #69C3AA, silver #BAC3D9, pale pink #FFD4FF,
// and pale yellow #F9E9C2. Floor/furniture tinting stores colors as HSB+C.
const paletteYellow: ColorValue = { h: 57, s: 96, b: 20, c: 10 };
const paletteBlue: ColorValue = { h: 163, s: 43, b: 5, c: 14 };
const paletteSilver: ColorValue = { h: 223, s: 29, b: 24, c: 6 };
const palettePink: ColorValue = { h: 300, s: 100, b: 36, c: 0 };
const paletteCream: ColorValue = { h: 43, s: 82, b: 32, c: 4 };

const wallColor: ColorValue = paletteSilver;
const villageColor: ColorValue = paletteCream;
const fieldColor: ColorValue = { ...paletteYellow, b: 12, c: 16 };
const cropColor: ColorValue = { ...paletteBlue, b: 10, c: 18 };
const glassColor: ColorValue = { ...paletteBlue, b: 24, c: 8 };
const trailColor: ColorValue = { ...paletteCream, b: 12, c: 18 };
const waterColor: ColorValue = { ...paletteBlue, b: 0, c: 22 };
const bridgeColor: ColorValue = { ...paletteSilver, b: 14, c: 18 };
const tavernColor: ColorValue = { ...palettePink, b: 18, c: 12 };
const theatreColor: ColorValue = { ...palettePink, b: 10, c: 18 };
const campColor: ColorValue = { ...paletteYellow, b: 8, c: 20 };
const treeColor: ColorValue = { ...paletteBlue, b: -4, c: 18 };
const peachBloomColor: ColorValue = palettePink;
const petalGroundColor: ColorValue = { ...palettePink, b: 30, c: 4 };
const lcdMintColor: ColorValue = { ...paletteSilver, b: 22, c: 8 };
const templeColor: ColorValue = { ...paletteYellow, b: 2, c: 24 };
const thaiTempleColor: ColorValue = { ...paletteYellow, b: 16, c: 20 };
const cafeColor: ColorValue = { ...paletteCream, b: 10, c: 18 };

export const NEXT_ROOM_GRID_SIZE = 15;
export const NEXT_ROOM_MAP_SIZE = 20;
export const NEXT_ROOM_MAP_PADDING = Math.floor((NEXT_ROOM_MAP_SIZE - NEXT_ROOM_GRID_SIZE) / 2);

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

function fillPath(
  tiles: TileTypeVal[],
  tileColors: Array<ColorValue | null>,
  cols: number,
  points: Array<[number, number]>,
  width: number,
  tile: TileTypeVal,
  color: ColorValue | null,
): void {
  for (let i = 1; i < points.length; i++) {
    const [fromCol, fromRow] = points[i - 1];
    const [toCol, toRow] = points[i];
    const dc = Math.sign(toCol - fromCol);
    const dr = Math.sign(toRow - fromRow);
    let col = fromCol;
    let row = fromRow;
    while (col !== toCol || row !== toRow) {
      fillRect(
        tiles,
        tileColors,
        cols,
        { col: col - Math.floor(width / 2), row: row - Math.floor(width / 2), w: width, h: width },
        tile,
        color,
      );
      if (col !== toCol) col += dc;
      else if (row !== toRow) row += dr;
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
  { personaId: 'wukir-suryadi', col: 16, row: 24, zoneId: 'zone-a-river', idleBehavior: 'stand' },
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

export const tamagotchiPeachForestZones: WorldZone[] = [
  { id: 'lab-room', name: 'Wet Lab / E-textile Lab', kind: 'greenhouse', bounds: { col: 3, row: 3, w: 18, h: 17 }, description: 'Workbenches, microscopes, laptops, shelves, and plants.' },
  { id: 'band-room', name: 'Band Rehearsal Room', kind: 'theatre', bounds: { col: 23, row: 3, w: 17, h: 17 }, description: 'A rehearsal room with a mixer desk, monitor lights, and lounge edges.' },
  { id: 'office-room', name: 'Open Research Office', kind: 'school', bounds: { col: 42, row: 3, w: 19, h: 17 }, description: 'A compact pixel office with desks, computers, bookshelves, and meeting chairs.' },
  { id: 'presentation-hall', name: 'Presentation Hall', kind: 'theatre', bounds: { col: 3, row: 23, w: 25, h: 16 }, description: 'Stage, benches, wall boards, and demo posters.' },
  { id: 'factory-room', name: 'Factory / Fabrication Floor', kind: 'farm', bounds: { col: 31, row: 23, w: 30, h: 16 }, description: 'Production tables, bins, equipment, and material stations.' },
  { id: 'campfire-lounge', name: 'Indoor Campfire Lounge', kind: 'campfire', bounds: { col: 3, row: 43, w: 22, h: 17 }, description: 'A soft gathering area for slow conversations and roundtable mode.' },
  { id: 'archive-cafe', name: 'Archive Cafe / Reading Room', kind: 'guesthouse', bounds: { col: 28, row: 43, w: 33, h: 17 }, description: 'Bookshelves, sofas, coffee tables, and archive corners.' },
  { id: 'archive-button', name: 'Peach Archive Button', kind: 'archiveTree', bounds: { col: 0, row: 0, w: 0, h: 0 }, description: 'Archive access now lives in the floating peach HUD button, not on the map.' },
];

export const tamagotchiNpcPlacements: NpcPlacement[] = [
  { personaId: 'andreas-siagian', col: 40, row: 31, zoneId: 'factory-room', idleBehavior: 'wander' },
  { personaId: 'anastassia-pistofidou', col: 10, row: 12, zoneId: 'lab-room', idleBehavior: 'stand' },
  { personaId: 'giulia-tomasello', col: 37, row: 31, zoneId: 'factory-room', idleBehavior: 'stand' },
  { personaId: 'christian-dils', col: 52, row: 12, zoneId: 'office-room', idleBehavior: 'stand' },
  { personaId: 'jonathan-minchin', col: 45, row: 32, zoneId: 'factory-room', idleBehavior: 'wander' },
  { personaId: 'marc-dusseiller', col: 31, row: 11, zoneId: 'band-room', idleBehavior: 'wander' },
  { personaId: 'mika-satomi', col: 36, row: 12, zoneId: 'band-room', idleBehavior: 'stand' },
  { personaId: 'rully-shabara', col: 12, row: 51, zoneId: 'campfire-lounge', idleBehavior: 'stand' },
  { personaId: 'wukir-suryadi', col: 17, row: 52, zoneId: 'campfire-lounge', idleBehavior: 'stand' },
  { personaId: 'ryu-oyama', col: 44, row: 52, zoneId: 'archive-cafe', idleBehavior: 'stand' },
  { personaId: 'stephanie-pan', col: 16, row: 31, zoneId: 'presentation-hall', idleBehavior: 'stand' },
  { personaId: 'stelio-manousakis', col: 29, row: 13, zoneId: 'band-room', idleBehavior: 'perform' },
  { personaId: 'svenja-keune', col: 13, row: 13, zoneId: 'lab-room', idleBehavior: 'sit' },
  { personaId: 'ted-hung', col: 50, row: 31, zoneId: 'factory-room', idleBehavior: 'stand' },
  { personaId: 'tincuta-heinzel', col: 53, row: 50, zoneId: 'archive-cafe', idleBehavior: 'wander' },
  { personaId: 'abao', col: 37, row: 51, zoneId: 'archive-cafe', idleBehavior: 'stand' },
];

export const nextTinyRoomNpcPlacements: NpcPlacement[] = [
  { personaId: 'marc-dusseiller', col: 3, row: 4, zoneId: 'tiny-room', idleBehavior: 'stand' },
  { personaId: 'mika-satomi', col: 6, row: 4, zoneId: 'tiny-room', idleBehavior: 'stand' },
  { personaId: 'anastassia-pistofidou', col: 10, row: 4, zoneId: 'tiny-room', idleBehavior: 'stand' },
  { personaId: 'christian-dils', col: 4, row: 8, zoneId: 'tiny-room', idleBehavior: 'stand' },
  { personaId: 'abao', col: 10, row: 8, zoneId: 'tiny-room', idleBehavior: 'stand' },
];

export function createTamagotchiPeachForestLayout(): OfficeLayout {
  const cols = 64;
  const rows = 64;
  const tiles = new Array<TileTypeVal>(cols * rows).fill(TileType.FLOOR_1);
  const tileColors = new Array<ColorValue | null>(cols * rows).fill({ ...paletteCream, b: 22, c: 3 });
  const furniture: PlacedFurniture[] = [];

  const corridorColor: ColorValue = { ...paletteCream, b: 15, c: 15 };
  const labFloor: ColorValue = { ...paletteBlue, b: 18, c: 8 };
  const bandFloor: ColorValue = { ...palettePink, b: 12, c: 16 };
  const officeFloor: ColorValue = { ...paletteSilver, b: 15, c: 12 };
  const hallFloor: ColorValue = { ...paletteYellow, b: 8, c: 20 };
  const factoryFloor: ColorValue = { ...paletteSilver, b: 6, c: 22 };
  const loungeFloor: ColorValue = { ...paletteYellow, b: 14, c: 10 };
  const cafeFloor: ColorValue = { ...palettePink, b: 18, c: 8 };

  const drawRoom = (rect: { col: number; row: number; w: number; h: number }, floor: ColorValue) => {
    fillRect(tiles, tileColors, cols, rect, TileType.FLOOR_1, floor);
    fillRect(tiles, tileColors, cols, { col: rect.col, row: rect.row, w: rect.w, h: 1 }, TileType.WALL, wallColor);
    fillRect(tiles, tileColors, cols, { col: rect.col, row: rect.row + rect.h - 1, w: rect.w, h: 1 }, TileType.WALL, wallColor);
    fillRect(tiles, tileColors, cols, { col: rect.col, row: rect.row, w: 1, h: rect.h }, TileType.WALL, wallColor);
    fillRect(tiles, tileColors, cols, { col: rect.col + rect.w - 1, row: rect.row, w: 1, h: rect.h }, TileType.WALL, wallColor);
  };
  const door = (col: number, row: number, w: number, h: number) => {
    fillRect(tiles, tileColors, cols, { col, row, w, h }, TileType.FLOOR_3, corridorColor);
  };

  fillRect(tiles, tileColors, cols, { col: 0, row: 0, w: cols, h: rows }, TileType.FLOOR_3, corridorColor);
  fillRect(tiles, tileColors, cols, { col: 0, row: 0, w: cols, h: 1 }, TileType.WALL, wallColor);
  fillRect(tiles, tileColors, cols, { col: 0, row: rows - 1, w: cols, h: 1 }, TileType.WALL, wallColor);
  fillRect(tiles, tileColors, cols, { col: 0, row: 0, w: 1, h: rows }, TileType.WALL, wallColor);
  fillRect(tiles, tileColors, cols, { col: cols - 1, row: 0, w: 1, h: rows }, TileType.WALL, wallColor);

  drawRoom({ col: 3, row: 3, w: 18, h: 17 }, labFloor);
  drawRoom({ col: 23, row: 3, w: 17, h: 17 }, bandFloor);
  drawRoom({ col: 42, row: 3, w: 19, h: 17 }, officeFloor);
  drawRoom({ col: 3, row: 23, w: 25, h: 16 }, hallFloor);
  drawRoom({ col: 31, row: 23, w: 30, h: 16 }, factoryFloor);
  drawRoom({ col: 3, row: 43, w: 22, h: 17 }, loungeFloor);
  drawRoom({ col: 28, row: 43, w: 33, h: 17 }, cafeFloor);

  for (const [col, row, w, h] of [
    [10, 19, 4, 1], [30, 19, 4, 1], [50, 19, 4, 1], [20, 10, 1, 4],
    [39, 10, 1, 4], [14, 23, 4, 1], [44, 23, 4, 1], [27, 30, 1, 4],
    [30, 30, 1, 4], [12, 43, 4, 1], [43, 43, 4, 1], [24, 50, 1, 4],
    [28, 50, 1, 4],
  ] as const) door(col, row, w, h);

  fillPath(tiles, tileColors, cols, [[12, 21], [32, 21], [52, 21]], 2, TileType.FLOOR_3, corridorColor);
  fillPath(tiles, tileColors, cols, [[16, 40], [32, 40], [48, 40]], 2, TileType.FLOOR_3, corridorColor);
  fillPath(tiles, tileColors, cols, [[30, 20], [30, 40], [30, 52]], 2, TileType.FLOOR_3, corridorColor);

  addFurniture(furniture, 'WHITEBOARD', 6, 5, { h: 185, s: 45, b: 8, c: 20 });
  addFurniture(furniture, 'DOUBLE_BOOKSHELF', 15, 5, { h: 185, s: 45, b: 15, c: 10 });
  addFurniture(furniture, 'DESK_FRONT', 7, 9, { h: 190, s: 40, b: -8, c: 18 });
  addFurniture(furniture, 'DESK_FRONT', 13, 9, { h: 190, s: 40, b: -8, c: 18 });
  addFurniture(furniture, 'PC_FRONT_ON_1', 7, 8, { h: 180, s: 70, b: 8, c: 24 });
  addFurniture(furniture, 'PC_FRONT_ON_1', 13, 8, { h: 180, s: 70, b: 8, c: 24 });
  addFurniture(furniture, 'PLANT', 5, 15, peachBloomColor);
  addFurniture(furniture, 'POT', 18, 15, { h: 160, s: 50, b: 5, c: 10 });

  addFurniture(furniture, 'DESK_FRONT', 29, 8, { h: 270, s: 30, b: -12, c: 20 });
  addFurniture(furniture, 'PC_FRONT_ON_1', 29, 7, { h: 285, s: 60, b: 8, c: 25 });
  addFurniture(furniture, 'WHITEBOARD', 34, 6, { h: 285, s: 60, b: 5, c: 25 });
  addFurniture(furniture, 'SOFA_SIDE', 24, 15, { h: 300, s: 10, b: 0, c: 10 });
  addFurniture(furniture, 'COFFEE_TABLE', 31, 14, { h: 25, s: 35, b: -8, c: 15 });
  addFurniture(furniture, 'BIN', 37, 16, { h: 0, s: -80, b: -20, c: 10 });

  for (const [col, row] of [[45, 7], [51, 7], [45, 12], [51, 12]] as const) {
    addFurniture(furniture, 'DESK_FRONT', col, row, { h: 220, s: 20, b: -10, c: 14 });
    addFurniture(furniture, 'PC_FRONT_ON_1', col, row - 1, { h: 220, s: 60, b: 5, c: 25 });
  }
  addFurniture(furniture, 'BOOKSHELF', 57, 5, { h: 28, s: 60, b: 5, c: 20 });
  addFurniture(furniture, 'CLOCK', 55, 5, { h: 40, s: 30, b: 4, c: 15 });
  addFurniture(furniture, 'CUSHIONED_CHAIR_SIDE', 55, 14, { h: 0, s: -80, b: 10, c: 0 });

  addFurniture(furniture, 'LARGE_PAINTING', 12, 25, { h: 44, s: 70, b: 14, c: 30 });
  addFurniture(furniture, 'WHITEBOARD', 18, 25, { h: 0, s: -100, b: -20, c: 10 });
  for (const row of [31, 34]) {
    for (const col of [8, 12, 16, 20]) addFurniture(furniture, 'WOODEN_BENCH', col, row);
  }

  for (const [col, row] of [[35, 27], [43, 27], [51, 27], [35, 33], [43, 33], [51, 33]] as const) {
    addFurniture(furniture, 'TABLE_FRONT', col, row, { h: 35, s: 35, b: -8, c: 18 });
  }
  for (const [col, row] of [[38, 26], [46, 26], [54, 26], [39, 35], [55, 35]] as const) {
    addFurniture(furniture, 'BIN', col, row, { h: 0, s: -80, b: -20, c: 10 });
  }
  addFurniture(furniture, 'WHITEBOARD', 56, 31, { h: 210, s: 40, b: 0, c: 20 });
  addFurniture(furniture, 'CACTUS', 33, 35, { h: 150, s: 45, b: 5, c: 10 });

  addFurniture(furniture, 'COFFEE_TABLE', 12, 50, { h: 25, s: 35, b: -6, c: 15 });
  for (const [col, row] of [[8, 48], [17, 48], [8, 54], [17, 54]] as const) {
    addFurniture(furniture, 'WOODEN_BENCH', col, row, { h: 25, s: 20, b: -8, c: 10 });
  }
  addFurniture(furniture, 'SMALL_TABLE_FRONT', 13, 52, { h: 20, s: 50, b: 0, c: 20 });
  addFurniture(furniture, 'COFFEE', 14, 51, { h: 54, s: 70, b: 8, c: 30 });
  addFurniture(furniture, 'PLANT_2', 5, 56, peachBloomColor);
  addFurniture(furniture, 'LARGE_PLANT', 21, 56);

  addFurniture(furniture, 'DOUBLE_BOOKSHELF', 31, 45, { h: 38, s: 50, b: 5, c: 20 });
  addFurniture(furniture, 'DOUBLE_BOOKSHELF', 55, 45, { h: 38, s: 50, b: 5, c: 20 });
  addFurniture(furniture, 'SOFA_SIDE', 35, 53, { h: 310, s: 20, b: 10, c: 8 });
  addFurniture(furniture, 'SOFA_SIDE', 49, 53, { h: 310, s: 20, b: 10, c: 8 });
  addFurniture(furniture, 'COFFEE_TABLE', 43, 51, { h: 20, s: 48, b: -6, c: 15 });
  addFurniture(furniture, 'COFFEE', 44, 50);
  addFurniture(furniture, 'SMALL_PAINTING', 39, 45, { h: 315, s: 45, b: 15, c: 15 });
  addFurniture(furniture, 'SMALL_PAINTING_2', 47, 45, { h: 180, s: 45, b: 12, c: 15 });
  addFurniture(furniture, 'HANGING_PLANT', 58, 49, peachBloomColor);
  addFurniture(furniture, 'PLANT', 30, 57, peachBloomColor);

  return {
    version: 1,
    cols,
    rows,
    layoutRevision: 12,
    tiles,
    tileColors,
    furniture,
  };
}

export function createNextTinyRoomLayout(): OfficeLayout {
  const roomSize = NEXT_ROOM_GRID_SIZE;
  const padding = NEXT_ROOM_MAP_PADDING;
  const cols = NEXT_ROOM_MAP_SIZE;
  const rows = NEXT_ROOM_MAP_SIZE;
  const tiles = new Array<TileTypeVal>(cols * rows).fill(TileType.FLOOR_5);
  const tileColors = new Array<ColorValue | null>(cols * rows).fill(petalGroundColor);
  const furniture: PlacedFurniture[] = [];
  const room = { col: padding, row: padding, w: roomSize, h: roomSize };
  const entranceCol = padding + Math.floor(roomSize / 2) - 1;
  const topEntranceRow = padding;
  const bottomEntranceRow = padding + roomSize - 1;

  fillRect(tiles, tileColors, cols, room, TileType.FLOOR_1, officeFloorColor());
  fillRect(tiles, tileColors, cols, { col: room.col, row: room.row, w: room.w, h: 1 }, TileType.WALL, wallColor);
  fillRect(tiles, tileColors, cols, { col: room.col, row: room.row + room.h - 1, w: room.w, h: 1 }, TileType.WALL, wallColor);
  fillRect(tiles, tileColors, cols, { col: room.col, row: room.row, w: 1, h: room.h }, TileType.WALL, wallColor);
  fillRect(tiles, tileColors, cols, { col: room.col + room.w - 1, row: room.row, w: 1, h: room.h }, TileType.WALL, wallColor);
  fillRect(tiles, tileColors, cols, { col: entranceCol, row: topEntranceRow, w: 2, h: 1 }, TileType.FLOOR_1, officeFloorColor());
  fillRect(tiles, tileColors, cols, { col: entranceCol, row: bottomEntranceRow, w: 2, h: 1 }, TileType.FLOOR_1, officeFloorColor());
  addFurniture(furniture, 'PC_FRONT_ON_1', padding + Math.floor(roomSize / 2), padding + Math.floor(roomSize / 2), { h: 220, s: 60, b: 5, c: 25 });

  return {
    version: 1,
    cols,
    rows,
    layoutRevision: 14,
    tiles,
    tileColors,
    furniture,
  };
}

function officeFloorColor(): ColorValue {
  return { ...paletteSilver, b: 15, c: 12 };
}
