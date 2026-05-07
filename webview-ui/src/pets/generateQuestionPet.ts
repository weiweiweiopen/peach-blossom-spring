import type { SpriteData } from "../office/types.js";
import { hashQuestion, mulberry32 } from "./hashQuestion.js";

export interface QuestionPetAppearance {
  seed: number;
  seedKey: string;
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

const bodyTypes = [
  "tamaEgg",
  "beanGhost",
  "blockBuddy",
  "wideToad",
  "bellSprite",
  "longSeed",
  "oddGourd",
  "shellBug",
];
const eyeTypes = ["dot", "sleep", "oneBig", "mismatch", "blankGap"];
const mouthTypes = ["none", "dash", "o", "fang", "offset"];
const accessoryTypes = [
  "none",
  "singleAntenna",
  "cornerEar",
  "sprout",
  "tailBit",
  "crownTicks",
  "sideKnob",
  "questionBead",
];

type Palette = QuestionPetAppearance["palette"];
type Stamp = readonly string[];

const colorfulPalettes: Palette[] = [
  {
    primary: "#ff7fb6",
    secondary: "#fff0a8",
    accent: "#4ad6ff",
    outline: "#21121f",
  },
  {
    primary: "#7ee86d",
    secondary: "#fff4c8",
    accent: "#ff8b3d",
    outline: "#102414",
  },
  {
    primary: "#8fa8ff",
    secondary: "#ffe7f5",
    accent: "#ffd23f",
    outline: "#161a3a",
  },
  {
    primary: "#ffb347",
    secondary: "#e8fff4",
    accent: "#6c5ce7",
    outline: "#2b1708",
  },
  {
    primary: "#50e3c2",
    secondary: "#fff3d6",
    accent: "#ff5f7e",
    outline: "#082721",
  },
  {
    primary: "#c084fc",
    secondary: "#f5ffe8",
    accent: "#64d96b",
    outline: "#25133d",
  },
];

const bodyStamps: Record<string, Stamp> = {
  tamaEgg: [
    "....111.....",
    "...11111....",
    "..1111111...",
    ".111111111..",
    ".111111111..",
    ".111111111..",
    "..1111111...",
    "..1111111...",
    "...11111....",
    "...11.11....",
  ],
  beanGhost: [
    "...1111.....",
    "..111111....",
    ".11111111...",
    ".111111111..",
    ".111111111..",
    "..11111111..",
    "..1111111...",
    "..111111....",
    ".111.111....",
    ".11...11....",
  ],
  blockBuddy: [
    "..1111111...",
    ".111111111..",
    ".111111111..",
    ".111111111..",
    ".111111111..",
    ".111111111..",
    ".111111111..",
    "..1111111...",
    "..11...11...",
    "..11...11...",
  ],
  wideToad: [
    ".............",
    "..111...111..",
    ".11111111111.",
    "1111111111111",
    "1111111111111",
    ".11111111111.",
    ".11111111111.",
    "..111111111..",
    ".1111...1111.",
    ".11.......11.",
  ],
  bellSprite: [
    "....111.....",
    "...11111....",
    "...11111....",
    "..1111111...",
    ".111111111..",
    ".111111111..",
    "11111111111.",
    "11111111111.",
    "..11...11...",
    ".11.....11..",
  ],
  longSeed: [
    "....111.....",
    "...1111.....",
    "...11111....",
    "..111111....",
    "..1111111...",
    "..1111111...",
    "...111111...",
    "...11111....",
    "....1111....",
    "....11.11...",
  ],
  oddGourd: [
    "...111......",
    "..11111.....",
    "..11111.....",
    "...111111...",
    "..11111111..",
    ".111111111..",
    ".111111111..",
    "..1111111...",
    "..11..111...",
    ".11....11...",
  ],
  shellBug: [
    ".............",
    "...11111....",
    "..1111111...",
    ".111111111..",
    "11111111111.",
    "11111111111.",
    ".111111111..",
    "..1111111...",
    ".11.111.11..",
    "11.......11.",
  ],
};

function stamp(
  grid: number[][],
  pattern: Stamp,
  ox: number,
  oy: number,
  value: number,
): void {
  pattern.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === "1") set(grid, ox + x, oy + y, value);
    });
  });
}

function set(grid: number[][], x: number, y: number, value: number): void {
  if (x >= 0 && x < 16 && y >= 0 && y < 16) grid[y][x] = value;
}

function clear(grid: number[][], x: number, y: number): void {
  set(grid, x, y, 0);
}

function addEyes(grid: number[][], eyeType: string, seed: number): void {
  const y = seed % 3 === 0 ? 7 : 8;
  if (eyeType === "sleep") {
    set(grid, 5, y, 1);
    set(grid, 6, y, 1);
    set(grid, 10, y, 1);
    set(grid, 11, y, 1);
  } else if (eyeType === "oneBig") {
    set(grid, 5, y, 1);
    set(grid, 6, y, 1);
    set(grid, 10, y, 1);
    set(grid, 10, y + 1, 1);
    clear(grid, 6, y + 1);
  } else if (eyeType === "mismatch") {
    set(grid, 5, y, 1);
    set(grid, 10, y - 1, 1);
    set(grid, 11, y, 1);
  } else if (eyeType === "blankGap") {
    clear(grid, 5, y);
    clear(grid, 10, y);
    set(grid, 6, y, 1);
    set(grid, 11, y, 1);
  } else {
    set(grid, 5, y, 1);
    set(grid, 10, y, 1);
  }
}

function addMouth(grid: number[][], mouthType: string): void {
  if (mouthType === "dash") {
    set(grid, 7, 11, 1);
    set(grid, 8, 11, 1);
  }
  if (mouthType === "o") {
    set(grid, 8, 10, 1);
    set(grid, 7, 11, 1);
    set(grid, 8, 12, 1);
  }
  if (mouthType === "fang") {
    set(grid, 7, 11, 1);
    set(grid, 9, 11, 1);
    set(grid, 8, 12, 1);
  }
  if (mouthType === "offset") {
    set(grid, 6, 11, 1);
    set(grid, 7, 12, 1);
  }
}

function outlineSprite(grid: number[][]): void {
  const bodyCells = grid.map((row) => [...row]);
  bodyCells.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === 0) return;
      [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ].forEach(([nx, ny]) => {
        const isInside = nx >= 0 && nx < 16 && ny >= 0 && ny < 16;
        if (isInside && grid[ny][nx] === 0) grid[ny][nx] = 1;
      });
    });
  });
}

function addFaceDetails(grid: number[][], seed: number): void {
  const cheekY = seed % 3 === 0 ? 9 : 10;
  set(grid, 4, cheekY, 4);
  set(grid, 11, cheekY, 4);
  if (seed % 2 === 0) {
    set(grid, 7, 6, 4);
    set(grid, 8, 6, 4);
  } else {
    set(grid, 6, 5, 4);
    set(grid, 9, 5, 4);
  }
}

function addAccessory(grid: number[][], accessoryType: string): void {
  if (accessoryType === "singleAntenna") {
    set(grid, 8, 3, 3);
    set(grid, 8, 2, 3);
    set(grid, 9, 1, 3);
  }
  if (accessoryType === "cornerEar") {
    set(grid, 4, 4, 3);
    set(grid, 3, 3, 3);
    set(grid, 2, 3, 3);
  }
  if (accessoryType === "sprout") {
    set(grid, 7, 3, 3);
    set(grid, 8, 2, 3);
    set(grid, 9, 3, 3);
  }
  if (accessoryType === "tailBit") {
    set(grid, 13, 10, 3);
    set(grid, 14, 10, 3);
    set(grid, 14, 9, 3);
  }
  if (accessoryType === "crownTicks") {
    set(grid, 5, 4, 3);
    set(grid, 7, 3, 3);
    set(grid, 9, 4, 3);
  }
  if (accessoryType === "sideKnob") {
    set(grid, 2, 8, 3);
    set(grid, 13, 7, 3);
  }
  if (accessoryType === "questionBead") {
    set(grid, 12, 3, 3);
    set(grid, 13, 2, 3);
    set(grid, 12, 1, 3);
  }
}

export function makePetSeed(question: string, nonce = Date.now()): string {
  return `${hashQuestion(`${question}|${nonce}|${Math.random()}`).toString(36)}-${nonce.toString(36)}`;
}

export function generateQuestionPet(
  question: string,
  seedKey?: string,
): QuestionPetAppearance {
  const normalizedSeedKey =
    seedKey ?? hashQuestion(question || "question-pet").toString(36);
  const seed = hashQuestion(
    `${question || "question-pet"}|${normalizedSeedKey}`,
  );
  const rng = mulberry32(seed);
  const bodyType = bodyTypes[Math.floor(rng() * bodyTypes.length)];
  const eyeType = eyeTypes[Math.floor(rng() * eyeTypes.length)];
  const mouthType = mouthTypes[Math.floor(rng() * mouthTypes.length)];
  const accessoryType =
    accessoryTypes[Math.floor(rng() * accessoryTypes.length)];
  const grid = Array.from({ length: 16 }, () =>
    Array.from({ length: 16 }, () => 0),
  );

  stamp(grid, bodyStamps[bodyType], seed % 2 === 0 ? 2 : 3, 4, 2);
  outlineSprite(grid);
  addFaceDetails(grid, seed);
  addEyes(grid, eyeType, seed);
  addMouth(grid, mouthType);
  addAccessory(grid, accessoryType);

  if (seed % 4 === 0) clear(grid, 4, 9);
  if (seed % 6 === 0) set(grid, 11, 6, 1);
  if (seed % 7 === 0) clear(grid, 9, 12);

  return {
    seed,
    seedKey: normalizedSeedKey,
    bodyType,
    eyeType,
    mouthType,
    accessoryType,
    palette: colorfulPalettes[seed % colorfulPalettes.length],
    sprite16: grid,
  };
}

export function appearanceToSpriteData(
  appearance: QuestionPetAppearance,
): SpriteData {
  const colors = [
    "",
    appearance.palette.outline,
    appearance.palette.primary,
    appearance.palette.accent,
    appearance.palette.secondary,
  ];
  return appearance.sprite16.map((row) =>
    row.map((cell) => colors[cell] ?? ""),
  );
}
