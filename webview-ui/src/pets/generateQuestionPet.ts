import type { SpriteData } from "../office/types.js";
import { hashQuestion, mulberry32 } from "./hashQuestion.js";
import { chooseThrongletExpression, type ThrongletAnimationAsset, throngletMvpAnimation, type ThrongletSocialSignals } from "./throngletAssets.js";

export const petMoodTypes = [
  "Idle",
  "Walk",
  "Jump",
  "Sleep",
  "Eat",
  "Play",
  "Bored",
  "Surprised",
  "Happy",
  "Dance",
  "Fish",
  "Talk",
  "Cute",
  "Original Theme",
  "Space Theme",
  "Underwater Theme",
] as const;

export type PetMoodType = (typeof petMoodTypes)[number];

export interface QuestionPetAppearance {
  seed: number;
  seedKey: string;
  bodyType: string;
  eyeType: string;
  mouthType: string;
  accessoryType: string;
  moodType: PetMoodType;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    outline: string;
    skin: string;
    eyes: string;
  };
  sprite16: number[][];
  animations: Record<PetMoodType, number[][][]>;
  throngletAnimation: ThrongletAnimationAsset;
}

type Palette = QuestionPetAppearance["palette"];
type Stamp = readonly string[];

const FRAME_COUNT = 22;

export function selectThrongletMood(signals?: ThrongletSocialSignals, currentAction?: string): PetMoodType {
  const expression = chooseThrongletExpression(signals, currentAction as never);
  if (expression === "sleepy") return "Sleep";
  if (expression === "stressed") return "Bored";
  if (expression === "social") return "Talk";
  if (expression === "happy") return "Happy";
  if (expression === "curious") return "Surprised";
  return "Idle";
}

const throngletMvpSpriteStamp: Stamp = [
  "................",
  "....111111......",
  "...12222211.....",
  "..1223332211....",
  ".122333332211...",
  ".123322333221...",
  "12233223332211..",
  "12332523333221..",
  "12333333335221..",
  ".123334333221...",
  "..1223333221....",
  "...11222211.....",
  ".....1221.......",
  "....112211......",
  "...11....11.....",
  "................",
];

const throngletMvpPalette: Palette = {
  primary: "#f0af17",
  skin: "#f0af17",
  secondary: "#f3cc41",
  accent: "#e04812",
  outline: "#3c1e1e",
  eyes: "#3c1e1e",
};

const fixedPetBodyTypes: Record<string, string> = {
  artist: "petArtist",
  scientist: "petScientist",
  engineer: "petEngineer",
  cook: "petCook",
  dancer: "petDancer",
  workshopologist: "petWorkshopologist",
  drinker: "petDrinker",
  socialist: "petSocialist",
  professor: "petProfessor",
  "fire maker": "petFireMaker",
  tailor: "petTailor",
  musician: "petMusician",
  shaman: "petShaman",
  "bubble maker": "petBubbleMaker",
  architect: "petArchitect",
  herbalist: "petHerbalist",
};

const fixedPetColorCounts: Record<string, 1 | 2 | 3 | 4> = {
  petArtist: 4,
  petScientist: 2,
  petEngineer: 3,
  petCook: 2,
  petDancer: 4,
  petWorkshopologist: 3,
  petDrinker: 1,
  petSocialist: 4,
  petProfessor: 2,
  petFireMaker: 3,
  petTailor: 4,
  petMusician: 3,
  petShaman: 1,
  petBubbleMaker: 4,
  petArchitect: 2,
  petHerbalist: 3,
};

export const bodyTypes = [
  "batabatchiWings",
  "ichigotchiBerry",
  "nikatchiDuck",
  "pirorirotchiTune",
  "hikotchiShip",
  "hinatchiChick",
  "youngmimitchiEars",
  "ringotchiApple",
];
export const eyeTypes = ["dot", "sleep", "sparkle", "mismatch", "round"];
export const mouthTypes = ["none", "dash", "o", "smile", "fang"];
export const accessoryTypes = [
  "none",
  "singleAntenna",
  "cornerEar",
  "sprout",
  "tailBit",
  "crownTicks",
  "sideKnob",
  "questionBead",
];

const colorBanks = {
  skin: ["#ff8fbd", "#79e26c", "#91a7ff", "#ffb64f", "#57ddc6", "#c68dff", "#f4df62", "#ff8a72"],
  secondary: ["#fff0a8", "#fff5ce", "#ffe6f6", "#e8fff4", "#dff7ff", "#f4ffe8", "#ffe0c8", "#e7ddff"],
  accent: ["#43c9ff", "#ff8c3f", "#ffd23f", "#6c5ce7", "#ff5f7e", "#64d96b", "#3de0a7", "#ff6edb"],
  outline: ["#21121f", "#102414", "#161a3a", "#2b1708", "#082721", "#25133d", "#2a2105", "#32120f"],
  eyes: ["#1a1020", "#102414", "#10183a", "#2a1306", "#032722", "#24103d", "#07111f", "#2c0916"],
};

const bodyStamps: Record<string, Stamp> = {
  batabatchiWings: [
    "....111111......",
    "..1111111111....",
    ".111111111111...",
    "11111111111111..",
    "111111111111111.",
    ".111111111111...",
    "..1111111111....",
    ".111111111111...",
    "111..1111..111..",
    "11....11....11..",
  ],
  ichigotchiBerry: [
    ".....1111.......",
    "....111111......",
    "...11111111.....",
    "..1111111111....",
    "..1111111111....",
    "...11111111.....",
    "....111111......",
    "...11111111.....",
    "..1111..1111....",
    "..11......11....",
  ],
  nikatchiDuck: [
    "....111111......",
    "...11111111.....",
    "..1111111111....",
    ".111111111111...",
    ".111111111111...",
    "..1111111111....",
    "...11111111.....",
    "..1111111111....",
    ".1111....1111...",
    ".11......11.....",
  ],
  pirorirotchiTune: [
    ".....111........",
    "....11111.......",
    "...1111111......",
    "..111111111.....",
    "..111111111.....",
    "...11111111.....",
    "....1111111.....",
    "...11111111.....",
    "..111..111......",
    ".11....11.......",
  ],
  hikotchiShip: [
    ".....11111......",
    "....1111111.....",
    "...111111111....",
    "..11111111111...",
    ".1111111111111..",
    "111111111111111.",
    "..11111111111...",
    "...111111111....",
    "..1111...1111...",
    ".11.......11....",
  ],
  hinatchiChick: [
    ".....11111......",
    "....1111111.....",
    "...111111111....",
    "..11111111111...",
    "..11111111111...",
    "...111111111....",
    "....1111111.....",
    "...111111111....",
    "..1111...1111...",
    "...11.....11....",
  ],
  youngmimitchiEars: [
    "..11......11....",
    ".1111....1111...",
    ".111111111111...",
    "..1111111111....",
    ".111111111111...",
    ".111111111111...",
    "..1111111111....",
    "..1111111111....",
    "...111..111.....",
    "...11....11.....",
  ],
  ringotchiApple: [
    ".....111........",
    "....111111......",
    "...11111111.....",
    "..1111111111....",
    ".111111111111...",
    ".111111111111...",
    "..1111111111....",
    "...11111111.....",
    "..1111..1111....",
    "..11......11....",
  ],
};

const pixelArtStamps: Record<string, Stamp> = {
  petArtist: [
    "................",
    "................",
    "......11........",
    ".....1..1.......",
    "....122221......",
    "...12222221.....",
    "...12122121..1..",
    "...12222221.1...",
    "...122112211....",
    "....122221......",
    ".....1111.......",
    "....122221......",
    "...12222221.....",
    "....1....1......",
    "...11....11.....",
    "................",
  ],
  petScientist: [
    "................",
    ".......1........",
    ".......1........",
    "......111.......",
    ".....12221......",
    "....1222221.....",
    "....1212121.....",
    "....1222221.....",
    "....1221221.....",
    ".....12221......",
    "......111.......",
    ".....12221......",
    "....1222221.....",
    ".....1...1......",
    "....11...11.....",
    "................",
  ],
  petEngineer: [
    "................",
    "................",
    ".....11111......",
    "....1.2221......",
    "...11222211.....",
    "...12222221.....",
    "..1121221211....",
    "..1222222221....",
    "...12211221.....",
    "....122221......",
    ".....1111.......",
    "....122221......",
    "...12222221.....",
    "....1....1......",
    "...11....11.....",
    "................",
  ],
  petCook: [
    "................",
    ".....1111.......",
    "....1....1......",
    "...11111111.....",
    "....122221......",
    "...12222221.....",
    "...12122121.....",
    "...12222221.....",
    "...12211221.....",
    "....122221......",
    ".....1111.......",
    "....122221......",
    "...12222221.....",
    "....1....1......",
    "...11....11.....",
    "................",
  ],
  petDancer: [
    "................",
    "................",
    "....1......1....",
    ".....111111.....",
    "....1222221.....",
    "...122122121....",
    "..1.1222221.1...",
    "....1221121.....",
    ".....12221......",
    "....112211......",
    "...1.1221.1.....",
    "..1..1..1..1....",
    ".....1..1.......",
    "....11..11......",
    "................",
    "................",
  ],
  petWorkshopologist: [
    "................",
    "....1.....1.....",
    ".....11111......",
    "....1222221.....",
    "...122222221....",
    "...121222121....",
    "..11222222211...",
    "..12221122221...",
    "...122222221....",
    "....1222221.....",
    ".....11111......",
    "....1222221.....",
    "...1..1.1..1....",
    "......111.......",
    ".....11.11......",
    "................",
  ],
  petDrinker: [
    "................",
    "................",
    "......111.......",
    ".....12221......",
    "....1222221.....",
    "...11212211.....",
    "...12222221..1..",
    "...12211221.1...",
    "....122221.1....",
    ".....1111.......",
    "....122221......",
    "...12222221.....",
    "....1....1......",
    "...11....11.....",
    "................",
    "................",
  ],
  petSocialist: [
    "................",
    "................",
    ".....11.11......",
    "....1222221.....",
    "...122222221....",
    "...121222121....",
    "..11222222211...",
    "..12221122221...",
    "...122222221....",
    "....1222221.....",
    ".....11111......",
    "...111222111....",
    "..1..12221..1...",
    ".....1...1......",
    "....11...11.....",
    "................",
  ],
  petProfessor: [
    "................",
    "....1111111.....",
    "...1.......1....",
    "...111111111....",
    ".....12221......",
    "....1212121.....",
    "....1222221.....",
    "....1221221.....",
    ".....12221......",
    "......111.......",
    ".....12221......",
    "....1222221.....",
    "...1..222..1....",
    ".....1...1......",
    "....11...11.....",
    "................",
  ],
  petFireMaker: [
    "................",
    ".......1........",
    "......111.......",
    ".....11111......",
    "....1.2221......",
    "...12222221.....",
    "...12122121.....",
    "...12222221.....",
    "...12211221.....",
    "....122221......",
    ".....1111.......",
    "....122221......",
    "...12222221.....",
    "....1....1......",
    "...11....11.....",
    "................",
  ],
  petTailor: [
    "................",
    "................",
    "....11....11....",
    ".....12221......",
    "....1222221.....",
    "...11212211.....",
    "...12222221.....",
    "...12211221.....",
    "....122221......",
    ".....1111.......",
    "....122221......",
    "...12222221.....",
    "....1....1......",
    "...11....11.....",
    "................",
    "................",
  ],
  petMusician: [
    "................",
    "..........11....",
    "..........1.1...",
    "....111...11....",
    "...12221........",
    "..1222221.......",
    "..1212211.......",
    "..1222221.......",
    "...12211........",
    "....111.........",
    "...12221........",
    "..1222221.......",
    "...1....1.......",
    "..11....11......",
    "................",
    "................",
  ],
  petShaman: [
    "................",
    "...1...1...1....",
    "....1.111.1.....",
    ".....12221......",
    "....1222221.....",
    "...11212211.....",
    "...12222221.....",
    "...12211221.....",
    "....122221......",
    ".....1111.......",
    "....122221......",
    "...12222221.....",
    "....1....1......",
    "...11....11.....",
    "................",
    "................",
  ],
  petBubbleMaker: [
    "............11..",
    "...11......1221.",
    "..1221......11..",
    "...11..1111.....",
    ".....1122221....",
    "....12222221....",
    "...11212211.....",
    "...12222221.....",
    "...12211221.....",
    "....122221......",
    ".....1111.......",
    "....122221......",
    "...12222221.....",
    "....1....1......",
    "...11....11.....",
    "................",
  ],
  petArchitect: [
    "................",
    ".....111111.....",
    "....1222221.....",
    "...122222221....",
    "...121222121....",
    "..11222222211...",
    "..12222222221...",
    "...122211221....",
    "....1222221.....",
    ".....11111......",
    "....1222221.....",
    "...122222221....",
    "....1.222.1.....",
    ".....1...1......",
    "....11...11.....",
    "................",
  ],
  petHerbalist: [
    "................",
    "......1.........",
    ".....1.1........",
    "......1.........",
    ".....1111.......",
    "....122221......",
    "...12122121.....",
    "...12222221.....",
    "...12211221.....",
    "....122221......",
    ".....1111.......",
    "....122221......",
    "...12222221.....",
    "....1....1......",
    "...11....11.....",
    "................",
  ],
};

function makePalette(seed: number, rng: () => number): Palette {
  const pick = (items: string[], salt: number): string => items[(seed + salt + Math.floor(rng() * items.length)) % items.length];
  const skin = pick(colorBanks.skin, 0);
  return {
    primary: skin,
    skin,
    secondary: pick(colorBanks.secondary, 7),
    accent: pick(colorBanks.accent, 13),
    outline: pick(colorBanks.outline, 19),
    eyes: pick(colorBanks.eyes, 23),
  };
}

function set(grid: number[][], x: number, y: number, value: number): void {
  if (x >= 0 && x < 16 && y >= 0 && y < 16) grid[y][x] = value;
}

function stamp(grid: number[][], pattern: Stamp, ox: number, oy: number, value: number): void {
  pattern.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === "1") set(grid, ox + x, oy + y, value);
    });
  });
}

function pixelArt(grid: number[][], pattern: Stamp): void {
  pattern.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === "1") set(grid, x, y, 1);
      if (cell === "2") set(grid, x, y, 2);
    });
  });
}

function addPixelArtAccent(grid: number[][], bodyType: string): void {
  const colorCount = fixedPetColorCounts[bodyType] ?? 2;
  const fillCells: Array<[number, number]> = [];
  grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === 2) fillCells.push([x, y]);
    });
  });
  if (fillCells.length === 0) return;
  if (colorCount === 1) {
    fillCells.forEach(([x, y]) => set(grid, x, y, 1));
    return;
  }
  if (colorCount === 2) return;
  const midX = Math.floor((Math.min(...fillCells.map(([x]) => x)) + Math.max(...fillCells.map(([x]) => x))) / 2);
  let changed = 0;
  fillCells.forEach(([x, y]) => {
    if (x > midX && y > 3 && y < 13) {
      set(grid, x, y, 3);
      changed += 1;
    }
  });
  if (changed === 0) fillCells.slice(-Math.max(1, Math.floor(fillCells.length / 4))).forEach(([x, y]) => set(grid, x, y, 3));
  if (colorCount === 4) {
    fillCells.forEach(([x, y], index) => {
      if (index % 5 === 0 && y > 4 && y < 12) set(grid, x, y, 4);
    });
  }
}

function cloneGrid(grid: number[][]): number[][] {
  return grid.map((row) => [...row]);
}

function outlineSprite(grid: number[][]): void {
  const bodyCells = cloneGrid(grid);
  bodyCells.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === 0) return;
      [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].forEach(([nx, ny]) => {
        const isInside = nx >= 0 && nx < 16 && ny >= 0 && ny < 16;
        if (isInside && grid[ny][nx] === 0) grid[ny][nx] = 1;
      });
    });
  });
}

function replaceValue(grid: number[][], from: number, to: number): void {
  grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === from) grid[y][x] = to;
    });
  });
}

function addFaceDetails(grid: number[][], seed: number): void {
  const cheekY = seed % 3 === 0 ? 9 : 10;
  set(grid, 4, cheekY, 4);
  set(grid, 11, cheekY, 4);
  set(grid, 7, seed % 2 === 0 ? 6 : 5, 3);
  set(grid, 8, seed % 2 === 0 ? 6 : 5, 3);
}

function addEyes(grid: number[][], eyeType: string, seed: number): void {
  const y = seed % 3 === 0 ? 7 : 8;
  if (eyeType === "sleep") {
    set(grid, 5, y, 5);
    set(grid, 6, y, 5);
    set(grid, 10, y, 5);
    set(grid, 11, y, 5);
  } else if (eyeType === "sparkle") {
    set(grid, 5, y, 5);
    set(grid, 10, y, 5);
    set(grid, 10, y - 1, 4);
  } else if (eyeType === "mismatch") {
    set(grid, 5, y, 5);
    set(grid, 10, y - 1, 5);
    set(grid, 11, y, 5);
  } else if (eyeType === "round") {
    set(grid, 5, y, 5);
    set(grid, 6, y, 5);
    set(grid, 10, y, 5);
    set(grid, 11, y, 5);
    set(grid, 5, y + 1, 5);
    set(grid, 10, y + 1, 5);
  } else {
    set(grid, 5, y, 5);
    set(grid, 10, y, 5);
  }
}

function addMouth(grid: number[][], mouthType: string): void {
  if (mouthType === "dash") {
    set(grid, 7, 11, 5);
    set(grid, 8, 11, 5);
  }
  if (mouthType === "o") {
    set(grid, 8, 10, 5);
    set(grid, 7, 11, 5);
    set(grid, 8, 12, 5);
  }
  if (mouthType === "smile") {
    set(grid, 6, 10, 5);
    set(grid, 7, 11, 5);
    set(grid, 8, 11, 5);
    set(grid, 9, 10, 5);
  }
  if (mouthType === "fang") {
    set(grid, 7, 11, 5);
    set(grid, 9, 11, 5);
    set(grid, 8, 12, 4);
  }
}

function addAccessory(grid: number[][], accessoryType: string): void {
  if (accessoryType === "singleAntenna") [[8, 3], [8, 2], [9, 1]].forEach(([x, y]) => set(grid, x, y, 3));
  if (accessoryType === "cornerEar") [[4, 4], [3, 3], [2, 3]].forEach(([x, y]) => set(grid, x, y, 3));
  if (accessoryType === "sprout") [[7, 3], [8, 2], [9, 3]].forEach(([x, y]) => set(grid, x, y, 3));
  if (accessoryType === "tailBit") [[13, 10], [14, 10], [14, 9]].forEach(([x, y]) => set(grid, x, y, 3));
  if (accessoryType === "crownTicks") [[5, 4], [7, 3], [9, 4]].forEach(([x, y]) => set(grid, x, y, 3));
  if (accessoryType === "sideKnob") [[2, 8], [13, 7]].forEach(([x, y]) => set(grid, x, y, 3));
  if (accessoryType === "questionBead") [[12, 3], [13, 2], [12, 1]].forEach(([x, y]) => set(grid, x, y, 3));
}

export function makeBaseSprite(bodyType: string, eyeType: string, mouthType: string, accessoryType: string, seed: number): number[][] {
  const grid = Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => 0));
  const pixelStamp = pixelArtStamps[bodyType];
  if (pixelStamp) {
    pixelArt(grid, pixelStamp);
    addPixelArtAccent(grid, bodyType);
    return grid;
  }
  stamp(grid, bodyStamps[bodyType], seed % 2 === 0 ? 1 : 2, 4, 2);
  outlineSprite(grid);
  addFaceDetails(grid, seed);
  addEyes(grid, eyeType, seed);
  addMouth(grid, mouthType);
  addAccessory(grid, accessoryType);
  return grid;
}

function shifted(grid: number[][], dx: number, dy: number): number[][] {
  const next = Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => 0));
  grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell !== 0) set(next, x + dx, y + dy, cell);
    });
  });
  return next;
}

function overlayStamp(grid: number[][], pattern: Stamp, ox: number, oy: number, value: number): void {
  stamp(grid, pattern, ox, oy, value);
}

function emoteEyes(grid: number[][], mood: PetMoodType, frame: number): void {
  if (mood === "Sleep") {
    [[5, 8], [6, 8], [10, 8], [11, 8]].forEach(([x, y]) => set(grid, x, y, 5));
    if (frame % 4 < 2) overlayStamp(grid, ["11", ".1"], 12, 3, 3);
  }
  if (mood === "Surprised") {
    [[5, 7], [6, 7], [5, 8], [10, 7], [11, 7], [10, 8], [8, 11]].forEach(([x, y]) => set(grid, x, y, 5));
  }
  if (mood === "Bored") {
    [[5, 8], [6, 8], [10, 8], [11, 8], [8, 12]].forEach(([x, y]) => set(grid, x, y, 5));
  }
  if (mood === "Happy" || mood === "Dance" || mood === "Cute") {
    [[5, 8], [10, 8], [7, 11], [8, 12], [9, 11]].forEach(([x, y]) => set(grid, x, y, 5));
  }
}

function themedOverlay(grid: number[][], mood: PetMoodType, frame: number): void {
  if (mood === "Eat") overlayStamp(grid, [".11", "111", ".1."], frame % 2 === 0 ? 1 : 12, 10, 3);
  if (mood === "Play") overlayStamp(grid, [".1.", "111", ".1."], 12 - (frame % 4), 3 + (frame % 3), 3);
  if (mood === "Fish") overlayStamp(grid, [".11.", "1111", ".11."], 1 + (frame % 4), 11, 3);
  if (mood === "Talk") overlayStamp(grid, ["111", "1.1", "111"], 12, 4 + (frame % 2), 4);
  if (mood === "Original Theme") overlayStamp(grid, ["1111", "1..1", "1..1", "1111"], 0, 0, 3);
  if (mood === "Space Theme") {
    [[2, 2], [13, 3], [12, 12], [3, 13]].forEach(([x, y]) => set(grid, x, y + (frame % 2), 3));
  }
  if (mood === "Underwater Theme") {
    overlayStamp(grid, ["1.1", ".1.", "1.1"], 1, 2 + (frame % 3), 3);
    overlayStamp(grid, [".1.", "1.1", ".1."], 12, 10 - (frame % 3), 4);
  }
}

function poseOffset(mood: PetMoodType, frame: number): { dx: number; dy: number } {
  if (mood === "Walk") return { dx: frame % 4 < 2 ? -1 : 1, dy: frame % 2 };
  if (mood === "Jump") return { dx: 0, dy: frame % 6 < 3 ? -2 : 0 };
  if (mood === "Dance") return { dx: frame % 4 < 2 ? -1 : 1, dy: frame % 3 === 0 ? -1 : 0 };
  if (mood === "Happy" || mood === "Cute") return { dx: 0, dy: frame % 4 === 0 ? -1 : 0 };
  if (mood === "Sleep") return { dx: 0, dy: frame % 6 === 0 ? 1 : 0 };
  if (mood === "Idle") {
    const offsets = [
      { dx: 0, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: -1, dy: -1 },
      { dx: 0, dy: -1 },
    ];
    return offsets[frame % offsets.length];
  }
  return { dx: 0, dy: 0 };
}

function animateFeet(grid: number[][], frame: number): void {
  const y = 15;
  if (frame % 4 === 1) {
    set(grid, 4, y, 2);
    set(grid, 11, y, 0);
  } else if (frame % 4 === 3) {
    set(grid, 4, y, 0);
    set(grid, 11, y, 2);
  }
}

function makeFrame(base: number[][], mood: PetMoodType, frame: number): number[][] {
  const { dx, dy } = poseOffset(mood, frame);
  const next = shifted(base, dx, dy);
  if (mood === "Space Theme") replaceValue(next, 4, 3);
  if (mood === "Underwater Theme") replaceValue(next, 4, frame % 2 === 0 ? 3 : 4);
  emoteEyes(next, mood, frame);
  themedOverlay(next, mood, frame);
  animateFeet(next, frame);
  return next;
}

function makeAnimations(base: number[][]): Record<PetMoodType, number[][][]> {
  return Object.fromEntries(
    petMoodTypes.map((mood) => [mood, Array.from({ length: FRAME_COUNT }, (_item, frame) => makeFrame(base, mood, frame))]),
  ) as Record<PetMoodType, number[][][]>;
}

function makeThrongletMvpSprite(): number[][] {
  return throngletMvpSpriteStamp.map((row) => row.split('').map((cell) => Number(cell) || 0));
}

export function makePetSeed(question: string, nonce = Date.now()): string {
  return `${hashQuestion(`${question}|${nonce}|${Math.random()}`).toString(36)}-${nonce.toString(36)}`;
}

export function generateQuestionPet(question: string, seedKey?: string): QuestionPetAppearance {
  const normalizedSeedKey = seedKey ?? hashQuestion(question || "question-pet").toString(36);
  const fixedPetName = normalizedSeedKey.startsWith("fixed-pet:")
    ? normalizedSeedKey.slice("fixed-pet:".length)
    : null;
  const seedSource = fixedPetName || question || "question-pet";
  const seed = hashQuestion(`${seedSource}|${normalizedSeedKey}`);
  const fixedBodyType = fixedPetName ? fixedPetBodyTypes[fixedPetName] : undefined;
  const moodType = "Idle";
  const sprite16 = makeThrongletMvpSprite();
  const animations = makeAnimations(sprite16);

  return {
    seed,
    seedKey: normalizedSeedKey,
    bodyType: fixedBodyType ? `throngletMvp:${fixedBodyType}` : "throngletMvp",
    eyeType: "socialSignal",
    mouthType: "mvp",
    accessoryType: "none",
    moodType,
    palette: { ...makePalette(seed, mulberry32(seed)), ...throngletMvpPalette },
    sprite16,
    animations,
    throngletAnimation: throngletMvpAnimation,
  };
}

function cellToColor(appearance: QuestionPetAppearance, cell: number): string {
  const colors = [
    "",
    appearance.palette.outline,
    appearance.palette.skin,
    appearance.palette.accent,
    appearance.palette.secondary,
    appearance.palette.eyes,
  ];
  return colors[cell] ?? "";
}

export function appearanceToSpriteData(appearance: QuestionPetAppearance): SpriteData {
  return appearance.sprite16.map((row) => row.map((cell) => cellToColor(appearance, cell)));
}

export function appearanceToAnimationData(appearance: QuestionPetAppearance, mood = appearance.moodType): SpriteData[] {
  const frames = appearance.animations[mood] ?? appearance.animations.Idle;
  return frames.map((frame) => frame.map((row) => row.map((cell) => cellToColor(appearance, cell))));
}
