import type { ColorValue } from "../components/ui/types.js";
import {
  type OfficeLayout,
  type PlacedFurniture,
  TileType,
  type TileType as TileTypeVal,
} from "../office/types.js";

export type WorldZone = {
  id: string;
  name: string;
  kind:
    | "river"
    | "bridge"
    | "school"
    | "restaurant"
    | "theatre"
    | "forest"
    | "campfire"
    | "archiveTree"
    | "village"
    | "caveEntrance"
    | "temple"
    | "storyCircle"
    | "farm"
    | "greenhouse"
    | "guesthouse";
  bounds: { col: number; row: number; w: number; h: number };
  description: string;
};

export type NpcPlacement = {
  personaId: string;
  col: number;
  row: number;
  zoneId: string;
  idleBehavior?:
    | "stand"
    | "wander"
    | "sit"
    | "perform"
    | "fish"
    | "boat"
    | "campfire";
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
  const item: PlacedFurniture = {
    uid: `${type}-${col}-${row}-${furniture.length}`,
    type,
    col,
    row,
  };
  if (color) item.color = color;
  furniture.push(item);
}

export const worldZones: WorldZone[] = [
  {
    id: "zone-a-river-farm",
    name: "A Zone - River Farm",
    kind: "farm",
    bounds: { col: 2, row: 2, w: 27, h: 27 },
    description:
      "River, farm, greenhouse, insects, cows, drones, trailer home, and tractor.",
  },
  {
    id: "zone-a-river",
    name: "A Zone River",
    kind: "river",
    bounds: { col: 2, row: 20, w: 27, h: 7 },
    description: "A clear river running beside the farm.",
  },
  {
    id: "zone-a-greenhouse",
    name: "A Zone Greenhouse",
    kind: "greenhouse",
    bounds: { col: 17, row: 6, w: 9, h: 8 },
    description: "A glassy greenhouse surrounded by insects and plants.",
  },
  {
    id: "zone-b-temple-restaurant",
    name: "B Zone - Chinese Temple Restaurant",
    kind: "temple",
    bounds: { col: 32, row: 2, w: 29, h: 27 },
    description:
      "Chinese temple, Chinese restaurant, peach trees, and water buffalo.",
  },
  {
    id: "zone-b-bridge",
    name: "B Zone Stone Bridge",
    kind: "bridge",
    bounds: { col: 29, row: 21, w: 5, h: 5 },
    description: "A compact stone bridge connecting A and B across the river.",
  },
  {
    id: "zone-b-restaurant",
    name: "B Zone Chinese Restaurant",
    kind: "restaurant",
    bounds: { col: 47, row: 10, w: 12, h: 9 },
    description: "A Chinese-style restaurant tucked between peach trees.",
  },
  {
    id: "zone-c-thai-temple",
    name: "C Zone - Thai Temple",
    kind: "temple",
    bounds: { col: 3, row: 34, w: 19, h: 20 },
    description: "A Thai temple stage inspired by the reference photos.",
  },
  {
    id: "zone-c-parang-cnx",
    name: "parang cnx Coffee Homestay",
    kind: "guesthouse",
    bounds: { col: 25, row: 35, w: 18, h: 16 },
    description:
      "A coffee homestay with tables, plants, and warm gathering lights.",
  },
  {
    id: "zone-c-dj-stage",
    name: "C Zone DJ Stage",
    kind: "theatre",
    bounds: { col: 46, row: 36, w: 15, h: 14 },
    description: "DJ booth, audio desk, and speaker area.",
  },
  {
    id: "campfire-circle",
    name: "Campfire Circle",
    kind: "campfire",
    bounds: { col: 30, row: 52, w: 10, h: 8 },
    description: "Gathering circle for future roundtable mode.",
  },
  {
    id: "archive-tree",
    name: "Archive Tree",
    kind: "archiveTree",
    bounds: { col: 29, row: 30, w: 7, h: 6 },
    description: "The big tree keeps persona knowledge and community links.",
  },
  {
    id: "abao-story-circle",
    name: "Abao Story Circle",
    kind: "storyCircle",
    bounds: { col: 36, row: 29, w: 10, h: 8 },
    description:
      "The central conversation ground where Abao pulls the map into a storytelling split scene.",
  },
];

export const npcPlacements: NpcPlacement[] = [
  {
    personaId: "andreas-siagian",
    col: 9,
    row: 9,
    zoneId: "zone-a-river-farm",
    idleBehavior: "wander",
  },
  {
    personaId: "anastassia-pistofidou",
    col: 20,
    row: 9,
    zoneId: "zone-a-greenhouse",
    idleBehavior: "stand",
  },
  {
    personaId: "giulia-tomasello",
    col: 53,
    row: 15,
    zoneId: "zone-b-restaurant",
    idleBehavior: "sit",
  },
  {
    personaId: "christian-dils",
    col: 39,
    row: 9,
    zoneId: "zone-b-temple-restaurant",
    idleBehavior: "stand",
  },
  {
    personaId: "jonathan-minchin",
    col: 28,
    row: 44,
    zoneId: "zone-c-parang-cnx",
    idleBehavior: "wander",
  },
  {
    personaId: "marc-dusseiller",
    col: 51,
    row: 42,
    zoneId: "zone-c-dj-stage",
    idleBehavior: "perform",
  },
  {
    personaId: "mika-satomi",
    col: 29,
    row: 23,
    zoneId: "zone-b-bridge",
    idleBehavior: "fish",
  },
  {
    personaId: "rully-shabara",
    col: 14,
    row: 24,
    zoneId: "zone-a-river",
    idleBehavior: "boat",
  },
  {
    personaId: "ryu-oyama",
    col: 33,
    row: 55,
    zoneId: "campfire-circle",
    idleBehavior: "campfire",
  },
  {
    personaId: "stephanie-pan",
    col: 39,
    row: 45,
    zoneId: "zone-c-parang-cnx",
    idleBehavior: "wander",
  },
  {
    personaId: "stelio-manousakis",
    col: 56,
    row: 43,
    zoneId: "zone-c-dj-stage",
    idleBehavior: "perform",
  },
  {
    personaId: "svenja-keune",
    col: 18,
    row: 13,
    zoneId: "zone-a-greenhouse",
    idleBehavior: "sit",
  },
  {
    personaId: "ted-hung",
    col: 7,
    row: 44,
    zoneId: "zone-c-thai-temple",
    idleBehavior: "campfire",
  },
  {
    personaId: "tincuta-heinzel",
    col: 47,
    row: 20,
    zoneId: "zone-b-temple-restaurant",
    idleBehavior: "wander",
  },
  {
    personaId: "abao",
    col: 40,
    row: 33,
    zoneId: "abao-story-circle",
    idleBehavior: "stand",
  },
];

export const communityLinks: CommunityLink[] = [
  { label: "Hackteria", url: "https://hackteria.org" },
  { label: "Lifepatch", url: "https://lifepatch.org" },
  { label: "Fabricademy", url: "https://fabricademy.org" },
  { label: "Fablab Taipei", url: "https://www.fablabtaipei.tw" },
  {
    label: "Modern Body Festival",
    url: "https://www.facebook.com/modernbodyfestival",
  },
  { label: "KOBAKANT", url: "https://www.kobakant.at" },
  { label: "Green FabLab", url: "https://greenfablab.org" },
  { label: "NGM / Non-Governmental Matters", url: "https://www.nonmatter.tw" },
];

export function isInZone(
  col: number,
  row: number,
  zone: WorldZone,
  padding = 0,
): boolean {
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
  const tileColors = new Array<ColorValue | null>(cols * rows).fill(
    villageColor,
  );
  const furniture: PlacedFurniture[] = [];

  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 0, row: 0, w: cols, h: rows },
    TileType.FLOOR_1,
    villageColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 0, row: 0, w: cols, h: 1 },
    TileType.WALL,
    wallColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 0, row: rows - 1, w: cols, h: 1 },
    TileType.WALL,
    wallColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 0, row: 0, w: 1, h: rows },
    TileType.WALL,
    wallColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: cols - 1, row: 0, w: 1, h: rows },
    TileType.WALL,
    wallColor,
  );

  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 2, row: 2, w: 27, h: 18 },
    TileType.FLOOR_2,
    fieldColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 5, row: 5, w: 9, h: 11 },
    TileType.FLOOR_8,
    cropColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 17, row: 6, w: 9, h: 8 },
    TileType.FLOOR_4,
    glassColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 2, row: 20, w: 27, h: 7 },
    TileType.WALL,
    waterColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 28, row: 21, w: 7, h: 5 },
    TileType.FLOOR_3,
    bridgeColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 3, row: 17, w: 26, h: 2 },
    TileType.FLOOR_3,
    trailColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 3, row: 3, w: 8, h: 3 },
    TileType.FLOOR_5,
    petalGroundColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 20, row: 15, w: 8, h: 3 },
    TileType.FLOOR_5,
    petalGroundColor,
  );
  addFurniture(furniture, "DOUBLE_BOOKSHELF", 18, 6, {
    h: 170,
    s: 45,
    b: 30,
    c: 0,
  });
  addFurniture(furniture, "DOUBLE_BOOKSHELF", 21, 6, {
    h: 170,
    s: 45,
    b: 30,
    c: 0,
  });
  addFurniture(furniture, "LARGE_PLANT", 18, 9);
  addFurniture(furniture, "LARGE_PLANT", 23, 9);
  addFurniture(furniture, "WHITEBOARD", 7, 4, { h: 210, s: 45, b: 5, c: 25 });
  addFurniture(furniture, "SOFA_SIDE", 7, 11, { h: 0, s: -40, b: 25, c: -10 });
  addFurniture(furniture, "CUSHIONED_BENCH", 9, 11, {
    h: 0,
    s: -45,
    b: 10,
    c: 0,
  });
  addFurniture(furniture, "DESK_SIDE", 12, 11, {
    h: 205,
    s: 55,
    b: -10,
    c: 20,
  });
  addFurniture(furniture, "PC_SIDE", 12, 10, { h: 205, s: 65, b: 5, c: 25 });
  addFurniture(furniture, "SMALL_TABLE_SIDE", 14, 7, {
    h: 205,
    s: 70,
    b: 10,
    c: 30,
  });
  addFurniture(furniture, "CLOCK", 13, 6, { h: 205, s: 70, b: 10, c: 30 });
  for (const [col, row] of [
    [4, 4],
    [15, 4],
    [25, 5],
    [6, 15],
    [20, 15],
    [25, 16],
    [8, 3],
    [23, 17],
  ] as const) {
    addFurniture(furniture, "PLANT", col, row, peachBloomColor);
  }
  for (const [col, row] of [
    [3, 6],
    [11, 5],
    [18, 17],
    [27, 18],
  ] as const) {
    addFurniture(furniture, "PLANT_2", col, row, peachBloomColor);
  }
  for (const [col, row] of [
    [4, 9],
    [6, 13],
    [13, 6],
    [16, 16],
    [26, 12],
  ] as const) {
    addFurniture(furniture, "COFFEE", col, row, { h: 54, s: 70, b: 8, c: 30 });
  }
  for (const [col, row] of [
    [10, 14],
    [12, 14],
    [14, 14],
  ] as const) {
    addFurniture(furniture, "CUSHIONED_CHAIR_SIDE", col, row, {
      h: 0,
      s: -80,
      b: 20,
      c: 0,
    });
  }

  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 32, row: 2, w: 29, h: 27 },
    TileType.FLOOR_1,
    villageColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 35, row: 5, w: 10, h: 9 },
    TileType.FLOOR_5,
    templeColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 47, row: 10, w: 12, h: 9 },
    TileType.FLOOR_6,
    tavernColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 33, row: 22, w: 28, h: 2 },
    TileType.FLOOR_3,
    trailColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 34, row: 3, w: 24, h: 2 },
    TileType.FLOOR_5,
    petalGroundColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 35, row: 19, w: 24, h: 3 },
    TileType.FLOOR_5,
    petalGroundColor,
  );
  addFurniture(furniture, "BOOKSHELF", 38, 5, { h: 8, s: 65, b: 5, c: 35 });
  addFurniture(furniture, "BOOKSHELF", 40, 5, { h: 8, s: 65, b: 5, c: 35 });
  addFurniture(furniture, "LARGE_PAINTING", 38, 7, {
    h: 44,
    s: 70,
    b: 14,
    c: 30,
  });
  addFurniture(furniture, "TABLE_FRONT", 50, 13, {
    h: 18,
    s: 42,
    b: -4,
    c: 18,
  });
  addFurniture(furniture, "SMALL_TABLE_FRONT", 54, 13, {
    h: 18,
    s: 42,
    b: -4,
    c: 18,
  });
  addFurniture(furniture, "WOODEN_BENCH", 50, 16);
  addFurniture(furniture, "WOODEN_BENCH", 54, 16);
  for (const [col, row] of [
    [34, 4],
    [48, 4],
    [57, 5],
    [33, 15],
    [45, 18],
    [58, 21],
    [37, 24],
    [52, 25],
    [41, 4],
    [51, 20],
    [59, 17],
  ] as const) {
    addFurniture(furniture, "PLANT_2", col, row, peachBloomColor);
  }
  for (const [col, row] of [
    [36, 18],
    [39, 20],
    [43, 3],
    [55, 3],
  ] as const) {
    addFurniture(furniture, "PLANT", col, row, peachBloomColor);
  }
  for (const [col, row] of [
    [42, 18],
    [45, 21],
    [55, 23],
  ] as const) {
    addFurniture(furniture, "SOFA_SIDE", col, row, {
      h: 0,
      s: -80,
      b: -18,
      c: 10,
    });
  }

  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 3, row: 34, w: 19, h: 20 },
    TileType.FLOOR_5,
    thaiTempleColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 25, row: 35, w: 18, h: 16 },
    TileType.FLOOR_7,
    cafeColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 46, row: 36, w: 15, h: 14 },
    TileType.FLOOR_6,
    theatreColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 30, row: 52, w: 10, h: 8 },
    TileType.FLOOR_8,
    campColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 29, row: 30, w: 7, h: 6 },
    TileType.FLOOR_9,
    treeColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 36, row: 29, w: 10, h: 8 },
    TileType.FLOOR_6,
    lcdMintColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 24, row: 29, w: 8, h: 3 },
    TileType.FLOOR_5,
    petalGroundColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 39, row: 34, w: 15, h: 3 },
    TileType.FLOOR_5,
    petalGroundColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 8, row: 31, w: 49, h: 2 },
    TileType.FLOOR_3,
    trailColor,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 31, row: 24, w: 2, h: 34 },
    TileType.FLOOR_3,
    trailColor,
  );
  addFurniture(furniture, "LARGE_PAINTING", 9, 36, {
    h: 48,
    s: 72,
    b: 18,
    c: 35,
  });
  addFurniture(furniture, "BOOKSHELF", 8, 38, { h: 42, s: 70, b: 18, c: 30 });
  addFurniture(furniture, "BOOKSHELF", 12, 38, { h: 42, s: 70, b: 18, c: 30 });
  addFurniture(furniture, "SMALL_PAINTING", 16, 39, {
    h: 315,
    s: 45,
    b: 15,
    c: 15,
  });
  addFurniture(furniture, "TABLE_FRONT", 30, 40, {
    h: 20,
    s: 48,
    b: -6,
    c: 15,
  });
  addFurniture(furniture, "COFFEE_TABLE", 35, 42, {
    h: 20,
    s: 48,
    b: -6,
    c: 15,
  });
  addFurniture(furniture, "COFFEE", 31, 39);
  addFurniture(furniture, "COFFEE", 36, 41);
  addFurniture(furniture, "LARGE_PLANT", 27, 38);
  addFurniture(furniture, "HANGING_PLANT", 40, 37, peachBloomColor);
  addFurniture(furniture, "DESK_FRONT", 51, 39, {
    h: 240,
    s: 30,
    b: -12,
    c: 20,
  });
  addFurniture(furniture, "PC_FRONT_ON_1", 51, 38, {
    h: 270,
    s: 60,
    b: 5,
    c: 25,
  });
  addFurniture(furniture, "WHITEBOARD", 48, 40, {
    h: 0,
    s: -100,
    b: -20,
    c: 10,
  });
  addFurniture(furniture, "WHITEBOARD", 57, 40, {
    h: 0,
    s: -100,
    b: -20,
    c: 10,
  });
  addFurniture(furniture, "BIN", 47, 44, { h: 0, s: -100, b: -28, c: 20 });
  addFurniture(furniture, "BIN", 59, 44, { h: 0, s: -100, b: -28, c: 20 });
  for (const [col, row] of [
    [5, 55],
    [12, 56],
    [22, 57],
    [43, 56],
    [55, 55],
    [59, 31],
  ] as const) {
    addFurniture(furniture, "PLANT_2", col, row, peachBloomColor);
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

export type TerrainPalette = Record<string, ColorValue>;
export type TileStamp = {
  name: string;
  rows: string[];
  legend: Record<
    string,
    { tile: TileTypeVal; color: ColorValue | null; solid?: boolean }
  >;
};
export type BuildingType =
  | "villageHouse"
  | "restaurantTeaHouse"
  | "openTechLab"
  | "temple"
  | "church";
export type BuildingStamp = TileStamp & {
  type: BuildingType;
  door: { col: number; row: number };
};
export type GeneratedPeachLayout = OfficeLayout & {
  zones: WorldZone[];
  buildingStamps: BuildingType[];
  collision: boolean[];
  metrics: { peachTrees: number; riverTiles: number; bridgeTiles: number };
};

export function createSeededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++)
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const terrainPalette: TerrainPalette = {
  indoorFloor: { h: 43, s: 48, b: 30, c: 8 },
  grass: { h: 143, s: 38, b: 12, c: 18 },
  water: { h: 185, s: 62, b: 0, c: 24 },
  path: { h: 36, s: 54, b: 16, c: 16 },
  bridge: { h: 27, s: 58, b: -4, c: 20 },
  glass: { h: 190, s: 32, b: 28, c: 6 },
  peach: { h: 324, s: 70, b: 34, c: 0 },
  mountain: { h: 104, s: 30, b: -8, c: 18 },
  wall: { h: 220, s: 20, b: 18, c: 8 },
  warm: { h: 39, s: 72, b: 22, c: 10 },
};

function setTile(
  tiles: TileTypeVal[],
  colors: Array<ColorValue | null>,
  cols: number,
  rows: number,
  col: number,
  row: number,
  tile: TileTypeVal,
  color: ColorValue | null,
): void {
  if (col < 0 || row < 0 || col >= cols || row >= rows) return;
  const idx = row * cols + col;
  tiles[idx] = tile;
  colors[idx] = color;
}

function stampTemplate(
  tiles: TileTypeVal[],
  colors: Array<ColorValue | null>,
  collision: boolean[],
  cols: number,
  rows: number,
  template: TileStamp,
  col: number,
  row: number,
): void {
  template.rows.forEach((line, dy) =>
    [...line].forEach((mark, dx) => {
      if (mark === " ") return;
      const entry = template.legend[mark];
      if (!entry) return;
      const c = col + dx;
      const r = row + dy;
      setTile(tiles, colors, cols, rows, c, r, entry.tile, entry.color);
      collision[r * cols + c] = Boolean(entry.solid);
    }),
  );
}

export function stamp(
  template: TileStamp,
  col: number,
  row: number,
  options: {
    tiles: TileTypeVal[];
    tileColors: Array<ColorValue | null>;
    collision: boolean[];
    cols: number;
    rows: number;
  },
): void {
  stampTemplate(
    options.tiles,
    options.tileColors,
    options.collision,
    options.cols,
    options.rows,
    template,
    col,
    row,
  );
}

function paintThickLine(
  tiles: TileTypeVal[],
  colors: Array<ColorValue | null>,
  collision: boolean[],
  cols: number,
  rows: number,
  points: Array<{ col: number; row: number }>,
  width: number,
  tile: TileTypeVal,
  color: ColorValue,
  solid: boolean,
): number {
  let count = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const steps = Math.max(Math.abs(b.col - a.col), Math.abs(b.row - a.row), 1);
    for (let step = 0; step <= steps; step++) {
      const cc = Math.round(a.col + ((b.col - a.col) * step) / steps);
      const rr = Math.round(a.row + ((b.row - a.row) * step) / steps);
      for (let y = rr - width; y <= rr + width; y++)
        for (let x = cc - width; x <= cc + width; x++) {
          if ((x - cc) ** 2 + (y - rr) ** 2 > (width + 0.35) ** 2) continue;
          if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
          setTile(tiles, colors, cols, rows, x, y, tile, color);
          collision[y * cols + x] = solid;
          count++;
        }
    }
  }
  return count;
}

export function paintRiver(
  points: Array<{ col: number; row: number }>,
  width: number,
  ctx?: {
    tiles: TileTypeVal[];
    tileColors: Array<ColorValue | null>;
    collision: boolean[];
    cols: number;
    rows: number;
  },
): number {
  if (!ctx) return 0;
  return paintThickLine(
    ctx.tiles,
    ctx.tileColors,
    ctx.collision,
    ctx.cols,
    ctx.rows,
    points,
    width,
    TileType.WALL,
    terrainPalette.water,
    true,
  );
}
export function paintPath(
  points: Array<{ col: number; row: number }>,
  width: number,
  ctx?: {
    tiles: TileTypeVal[];
    tileColors: Array<ColorValue | null>;
    collision: boolean[];
    cols: number;
    rows: number;
  },
): void {
  if (ctx)
    paintThickLine(
      ctx.tiles,
      ctx.tileColors,
      ctx.collision,
      ctx.cols,
      ctx.rows,
      points,
      width,
      TileType.FLOOR_3,
      terrainPalette.path,
      false,
    );
}
export function paintIndoorWaterGarden(
  area: { col: number; row: number; w: number; h: number },
  ctx?: {
    tiles: TileTypeVal[];
    tileColors: Array<ColorValue | null>;
    collision: boolean[];
    cols: number;
    rows: number;
  },
): void {
  if (!ctx) return;
  fillRect(
    ctx.tiles,
    ctx.tileColors,
    ctx.cols,
    area,
    TileType.WALL,
    terrainPalette.water,
  );
  for (let r = area.row; r < area.row + area.h; r++)
    for (let c = area.col; c < area.col + area.w; c++)
      ctx.collision[r * ctx.cols + c] = true;
}

function makeBuilding(type: BuildingType): BuildingStamp {
  const base = {
    "#": { tile: TileType.WALL, color: terrainPalette.wall, solid: true },
    ".": { tile: TileType.FLOOR_7, color: terrainPalette.warm },
    d: { tile: TileType.FLOOR_3, color: terrainPalette.path },
  };
  const rows: Record<BuildingType, string[]> = {
    villageHouse: [" #### ", "######", "##..##", "##dd##"],
    restaurantTeaHouse: ["########", "#......#", "#......#", "###dd###"],
    openTechLab: ["########", "#..##..#", "#......#", "###dd###"],
    temple: ["  ####  ", "########", "##....##", "###dd###"],
    church: ["   ##   ", " ###### ", "##....##", "###dd###"],
  };
  return {
    name: type,
    type,
    rows: rows[type],
    legend: base,
    door: {
      col: Math.floor(rows[type][0].length / 2),
      row: rows[type].length - 1,
    },
  };
}

export function stampBridge(
  col: number,
  row: number,
  ctx?: {
    tiles: TileTypeVal[];
    tileColors: Array<ColorValue | null>;
    collision: boolean[];
    cols: number;
    rows: number;
  },
): void {
  if (!ctx) return;
  fillRect(
    ctx.tiles,
    ctx.tileColors,
    ctx.cols,
    { col, row, w: 7, h: 3 },
    TileType.FLOOR_8,
    terrainPalette.bridge,
  );
  for (let r = row; r < row + 3; r++)
    for (let c = col; c < col + 7; c++) ctx.collision[r * ctx.cols + c] = false;
}
export function stampHouse(
  type: BuildingType,
  col: number,
  row: number,
  ctx?: {
    tiles: TileTypeVal[];
    tileColors: Array<ColorValue | null>;
    collision: boolean[];
    cols: number;
    rows: number;
  },
): void {
  if (ctx)
    stampTemplate(
      ctx.tiles,
      ctx.tileColors,
      ctx.collision,
      ctx.cols,
      ctx.rows,
      makeBuilding(type),
      col,
      row,
    );
}
export function stampRestaurantTeaHouse(
  col: number,
  row: number,
  ctx?: Parameters<typeof stampHouse>[3],
): void {
  stampHouse("restaurantTeaHouse", col, row, ctx);
}
export function stampOpenTechLab(
  col: number,
  row: number,
  ctx?: Parameters<typeof stampHouse>[3],
): void {
  stampHouse("openTechLab", col, row, ctx);
}
export function stampTemple(
  col: number,
  row: number,
  ctx?: Parameters<typeof stampHouse>[3],
): void {
  stampHouse("temple", col, row, ctx);
}
export function stampChurch(
  col: number,
  row: number,
  ctx?: Parameters<typeof stampHouse>[3],
): void {
  stampHouse("church", col, row, ctx);
}
export function stampArchiveTree(
  col: number,
  row: number,
  ctx?: { furniture: PlacedFurniture[] },
): void {
  if (ctx)
    addFurniture(ctx.furniture, "LARGE_PLANT", col, row, peachBloomColor);
}
export function stampMountainBand(
  area: { col: number; row: number; w: number; h: number },
  ctx?: {
    tiles: TileTypeVal[];
    tileColors: Array<ColorValue | null>;
    collision: boolean[];
    cols: number;
    rows: number;
  },
): void {
  if (!ctx) return;
  fillRect(
    ctx.tiles,
    ctx.tileColors,
    ctx.cols,
    area,
    TileType.WALL,
    terrainPalette.mountain,
  );
  for (let r = area.row; r < area.row + area.h; r++)
    for (let c = area.col; c < area.col + area.w; c++)
      ctx.collision[r * ctx.cols + c] = true;
}
export function stampIndoorCanopy(
  area: { col: number; row: number; w: number; h: number },
  ctx?: {
    tiles: TileTypeVal[];
    tileColors: Array<ColorValue | null>;
    cols: number;
  },
): void {
  if (ctx)
    fillRect(
      ctx.tiles,
      ctx.tileColors,
      ctx.cols,
      area,
      TileType.FLOOR_6,
      terrainPalette.glass,
    );
}
export function stampOrchard(
  area: { col: number; row: number; w: number; h: number },
  ctx?: { furniture: PlacedFurniture[]; seed?: string; density?: number },
): number {
  return ctx
    ? scatterPeachTrees(
        area,
        ctx.density ?? 0.12,
        ctx.seed ?? "orchard",
        ctx.furniture,
      )
    : 0;
}
export function applyCollisionForWaterAndBuildings(
  layout: GeneratedPeachLayout,
): boolean[] {
  return layout.collision;
}
export function scatterPeachTrees(
  area: { col: number; row: number; w: number; h: number },
  density: number,
  seed: string,
  furniture: PlacedFurniture[] = [],
): number {
  const rng = createSeededRandom(seed);
  let count = 0;
  for (let r = area.row; r < area.row + area.h; r++)
    for (let c = area.col; c < area.col + area.w; c++) {
      if (rng() < density) {
        addFurniture(
          furniture,
          rng() > 0.5 ? "PLANT" : "PLANT_2",
          c,
          r,
          peachBloomColor,
        );
        count++;
      }
    }
  return count;
}

export const tamagotchiPeachForestZones: WorldZone[] = [
  {
    id: "indoorCanopy",
    name: "Indoor Canopy",
    kind: "greenhouse",
    bounds: { col: 2, row: 2, w: 66, h: 8 },
    description:
      "室內森林天幕 / Indoor forest canopy: glasshouse beams and soft pavilion light.",
  },
  {
    id: "greenhouseRoof",
    name: "Greenhouse Roof",
    kind: "greenhouse",
    bounds: { col: 1, row: 1, w: 68, h: 5 },
    description:
      "玻璃溫室屋頂 / Translucent roof ribs hold the allegorical ecosystem indoors.",
  },
  {
    id: "mountainGate",
    name: "Mountain Gate",
    kind: "caveEntrance",
    bounds: { col: 3, row: 7, w: 16, h: 8 },
    description:
      "山門 / Pale constructed mountains mark entry into the secluded dimension.",
  },
  {
    id: "riverCrossing",
    name: "River Crossing",
    kind: "river",
    bounds: { col: 7, row: 19, w: 57, h: 12 },
    description:
      "河流渡口 / A blue-green indoor river crosses the simulator floor.",
  },
  {
    id: "bridge",
    name: "Bridge",
    kind: "bridge",
    bounds: { col: 31, row: 23, w: 8, h: 4 },
    description:
      "小橋 / A wooden bridge keeps the main path walkable over water.",
  },
  {
    id: "peachForest",
    name: "Peach Forest",
    kind: "forest",
    bounds: { col: 5, row: 14, w: 24, h: 25 },
    description:
      "桃花樹林 / Pink blossom organisms surround the path with strange clues.",
  },
  {
    id: "restaurant",
    name: "Restaurant / Teahouse",
    kind: "restaurant",
    bounds: { col: 49, row: 12, w: 14, h: 10 },
    description: "餐館茶屋 / Warm food, tea, and arguments under indoor trees.",
  },
  {
    id: "laboratory",
    name: "Open Tech Laboratory",
    kind: "school",
    bounds: { col: 47, row: 36, w: 16, h: 12 },
    description:
      "開源科技實驗室 / A forest lab with antennas, jars, and open tools.",
  },
  {
    id: "church",
    name: "Church",
    kind: "temple",
    bounds: { col: 9, row: 42, w: 12, h: 11 },
    description: "教堂 / A quiet chapel-like pavilion for careful listening.",
  },
  {
    id: "temple",
    name: "Temple",
    kind: "temple",
    bounds: { col: 25, row: 43, w: 14, h: 12 },
    description: "寺廟 / A gentle ritual house in pixel allegory language.",
  },
  {
    id: "archiveTree",
    name: "Archive Tree",
    kind: "archiveTree",
    bounds: { col: 33, row: 31, w: 9, h: 9 },
    description:
      "資料檔案樹 / The great tree indexes personas, field notes, and wiki traces.",
  },
  {
    id: "village",
    name: "Village",
    kind: "village",
    bounds: { col: 7, row: 55, w: 55, h: 11 },
    description:
      "村落 / Small cabins form an indoor open-source technology art village.",
  },
  {
    id: "workshopClearing",
    name: "Workshop Clearing",
    kind: "campfire",
    bounds: { col: 39, row: 50, w: 18, h: 11 },
    description:
      "工作坊空地 / Campfire tables for shared prototypes and stories.",
  },
];

export const tamagotchiNpcPlacements: NpcPlacement[] = [
  {
    personaId: "andreas-siagian",
    col: 12,
    row: 32,
    zoneId: "peachForest",
    idleBehavior: "wander",
  },
  {
    personaId: "anastassia-pistofidou",
    col: 51,
    row: 39,
    zoneId: "laboratory",
    idleBehavior: "stand",
  },
  {
    personaId: "giulia-tomasello",
    col: 54,
    row: 16,
    zoneId: "restaurant",
    idleBehavior: "stand",
  },
  {
    personaId: "christian-dils",
    col: 28,
    row: 24,
    zoneId: "riverCrossing",
    idleBehavior: "stand",
  },
  {
    personaId: "jonathan-minchin",
    col: 15,
    row: 58,
    zoneId: "village",
    idleBehavior: "wander",
  },
  {
    personaId: "marc-dusseiller",
    col: 52,
    row: 52,
    zoneId: "workshopClearing",
    idleBehavior: "wander",
  },
  {
    personaId: "mika-satomi",
    col: 35,
    row: 31,
    zoneId: "archiveTree",
    idleBehavior: "fish",
  },
  {
    personaId: "rully-shabara",
    col: 33,
    row: 23,
    zoneId: "bridge",
    idleBehavior: "boat",
  },
  {
    personaId: "ryu-oyama",
    col: 29,
    row: 48,
    zoneId: "temple",
    idleBehavior: "campfire",
  },
  {
    personaId: "stephanie-pan",
    col: 38,
    row: 35,
    zoneId: "archiveTree",
    idleBehavior: "stand",
  },
  {
    personaId: "stelio-manousakis",
    col: 14,
    row: 46,
    zoneId: "church",
    idleBehavior: "perform",
  },
  {
    personaId: "svenja-keune",
    col: 19,
    row: 20,
    zoneId: "peachForest",
    idleBehavior: "sit",
  },
  {
    personaId: "ted-hung",
    col: 43,
    row: 55,
    zoneId: "workshopClearing",
    idleBehavior: "campfire",
  },
  {
    personaId: "tincuta-heinzel",
    col: 58,
    row: 40,
    zoneId: "laboratory",
    idleBehavior: "wander",
  },
  {
    personaId: "abao",
    col: 36,
    row: 34,
    zoneId: "archiveTree",
    idleBehavior: "stand",
  },
];

export function createIndoorPeachBlossomUtopiaLayout(
  seed = "peach-blossom-spring",
): GeneratedPeachLayout {
  const cols = 70;
  const rows = 70;
  const tiles = new Array<TileTypeVal>(cols * rows).fill(TileType.FLOOR_1);
  const tileColors = new Array<ColorValue | null>(cols * rows).fill(
    terrainPalette.indoorFloor,
  );
  const collision = new Array<boolean>(cols * rows).fill(false);
  const furniture: PlacedFurniture[] = [];
  const ctx = { tiles, tileColors, collision, cols, rows };

  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 0, row: 0, w: cols, h: rows },
    TileType.FLOOR_1,
    terrainPalette.indoorFloor,
  );
  stampIndoorCanopy({ col: 2, row: 2, w: 66, h: 8 }, ctx);
  stampMountainBand({ col: 1, row: 1, w: cols - 2, h: 1 }, ctx);
  stampMountainBand({ col: 1, row: 7, w: 18, h: 5 }, ctx);
  stampMountainBand({ col: 0, row: 0, w: cols, h: 1 }, ctx);
  stampMountainBand({ col: 0, row: rows - 1, w: cols, h: 1 }, ctx);
  stampMountainBand({ col: 0, row: 0, w: 1, h: rows }, ctx);
  stampMountainBand({ col: cols - 1, row: 0, w: 1, h: rows }, ctx);

  const riverTiles = paintRiver(
    [
      { col: 5, row: 24 },
      { col: 22, row: 20 },
      { col: 36, row: 25 },
      { col: 51, row: 23 },
      { col: 64, row: 27 },
    ],
    3,
    ctx,
  );
  stampBridge(31, 23, ctx);
  paintIndoorWaterGarden({ col: 55, row: 29, w: 7, h: 4 }, ctx);
  paintPath(
    [
      { col: 8, row: 65 },
      { col: 20, row: 55 },
      { col: 34, row: 36 },
      { col: 35, row: 24 },
      { col: 54, row: 17 },
    ],
    1,
    ctx,
  );
  paintPath(
    [
      { col: 14, row: 45 },
      { col: 35, row: 35 },
      { col: 56, row: 40 },
    ],
    1,
    ctx,
  );
  paintPath(
    [
      { col: 10, row: 32 },
      { col: 34, row: 34 },
      { col: 50, row: 55 },
    ],
    1,
    ctx,
  );

  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 4, row: 14, w: 25, h: 26 },
    TileType.FLOOR_5,
    { ...terrainPalette.peach, b: 38 },
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 42, row: 34, w: 24, h: 16 },
    TileType.FLOOR_6,
    { ...terrainPalette.glass, b: 20 },
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 6, row: 54, w: 57, h: 12 },
    TileType.FLOOR_2,
    terrainPalette.grass,
  );
  fillRect(
    tiles,
    tileColors,
    cols,
    { col: 39, row: 50, w: 18, h: 11 },
    TileType.FLOOR_8,
    terrainPalette.warm,
  );
  const peachTrees =
    scatterPeachTrees(
      { col: 5, row: 14, w: 24, h: 25 },
      0.18,
      `${seed}:peach`,
      furniture,
    ) +
    scatterPeachTrees(
      { col: 8, row: 56, w: 52, h: 8 },
      0.05,
      `${seed}:orchard`,
      furniture,
    ) +
    scatterPeachTrees(
      { col: 45, row: 12, w: 20, h: 12 },
      0.08,
      `${seed}:tea`,
      furniture,
    );

  stampRestaurantTeaHouse(51, 14, ctx);
  stampOpenTechLab(51, 39, ctx);
  stampChurch(11, 46, ctx);
  stampTemple(27, 47, ctx);
  stampHouse("villageHouse", 12, 58, ctx);
  stampHouse("villageHouse", 24, 58, ctx);
  stampHouse("villageHouse", 56, 58, ctx);
  stampArchiveTree(36, 34, { furniture });
  addFurniture(furniture, "COFFEE_TABLE", 52, 18, terrainPalette.warm);
  addFurniture(furniture, "PC_FRONT_ON_1", 56, 39, terrainPalette.glass);
  addFurniture(furniture, "WHITEBOARD", 59, 40, terrainPalette.glass);
  addFurniture(furniture, "COFFEE", 44, 55);
  addFurniture(furniture, "SMALL_TABLE_FRONT", 45, 55, terrainPalette.warm);
  addFurniture(furniture, "WOODEN_BENCH", 42, 57, terrainPalette.bridge);

  return {
    version: 1,
    cols,
    rows,
    layoutRevision: 12,
    tiles,
    tileColors,
    furniture,
    zones: tamagotchiPeachForestZones,
    buildingStamps: [
      "villageHouse",
      "restaurantTeaHouse",
      "openTechLab",
      "temple",
      "church",
    ],
    collision,
    metrics: { peachTrees, riverTiles, bridgeTiles: 21 },
  };
}

export function createTamagotchiPeachForestLayout(): OfficeLayout {
  return createIndoorPeachBlossomUtopiaLayout();
}
