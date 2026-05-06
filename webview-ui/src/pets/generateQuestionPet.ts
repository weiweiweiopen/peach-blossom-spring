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
  "roundBlob",
  "ovalEgg",
  "softBlock",
  "seedBody",
  "teardrop",
  "doubleLobed",
  "antennaCreature",
  "wingSide",
  "tinyMushroom",
  "longBean",
];
const eyeTypes = ["dot", "sleepy", "wide", "mismatch", "spark"];
const mouthTypes = ["open", "line", "surprised", "none", "crooked"];
const accessoryTypes = [
  "questionAntenna",
  "leafSprout",
  "horn",
  "tinyFin",
  "sideEars",
  "tailNub",
  "floatingDot",
  "haloPixel",
  "blushDots",
  "lopsidedEar",
  "tinyCrown",
];

type Palette = QuestionPetAppearance["palette"];

const tamaPalettes: Palette[] = [
  {
    primary: "#FCF46B",
    secondary: "#F9E9C2",
    accent: "#69C3AA",
    outline: "#000000",
  },
  {
    primary: "#BAC3D9",
    secondary: "#FFD4FF",
    accent: "#FCF46B",
    outline: "#000000",
  },
  {
    primary: "#FFD4FF",
    secondary: "#F9E9C2",
    accent: "#BAC3D9",
    outline: "#000000",
  },
];

function pickPalette(seed: number): Palette {
  return tamaPalettes[seed % tamaPalettes.length];
}

function inBody(bodyType: string, x: number, y: number): boolean {
  const dx = x - 7.5;
  const dy = y - 8;
  if (bodyType === "roundBlob") return (dx * dx) / 31 + (dy * dy) / 27 <= 1;
  if (bodyType === "ovalEgg")
    return (dx * dx) / 22 + ((y - 8.5) * (y - 8.5)) / 36 <= 1;
  if (bodyType === "softBlock")
    return (
      x >= 4 &&
      x <= 11 &&
      y >= 4 &&
      y <= 13 &&
      !((x === 4 || x === 11) && (y === 4 || y === 13))
    );
  if (bodyType === "seedBody")
    return (dx * dx) / 20 + ((y - 9) * (y - 9)) / 30 <= 1 && !(x < 5 && y < 6);
  if (bodyType === "teardrop")
    return (dx * dx) / (14 + y) + ((y - 9) * (y - 9)) / 30 <= 1 && y >= 3;
  if (bodyType === "doubleLobed")
    return (
      (x - 5.5) ** 2 / 14 + (y - 8) ** 2 / 24 <= 1 ||
      (x - 9.5) ** 2 / 14 + (y - 8) ** 2 / 24 <= 1
    );
  if (bodyType === "wingSide")
    return (
      (dx * dx) / 22 + (dy * dy) / 28 <= 1 ||
      ((x === 2 || x === 13) && y >= 7 && y <= 10)
    );
  if (bodyType === "tinyMushroom")
    return (
      (y >= 4 && y <= 8 && (dx * dx) / 28 + (y - 7) ** 2 / 11 <= 1) ||
      (x >= 6 && x <= 9 && y >= 8 && y <= 13)
    );
  if (bodyType === "longBean") return (dx * dx) / 15 + (y - 8.5) ** 2 / 38 <= 1;
  return (dx * dx) / 25 + (dy * dy) / 30 <= 1;
}

function set(grid: number[][], x: number, y: number, value: number): void {
  if (x >= 0 && x < 16 && y >= 0 && y < 16) grid[y][x] = value;
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
  const palette = pickPalette(seed);
  const grid = Array.from({ length: 16 }, () =>
    Array.from({ length: 16 }, () => 0),
  );

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (!inBody(bodyType, x, y)) continue;
      const edge =
        !inBody(bodyType, x - 1, y) ||
        !inBody(bodyType, x + 1, y) ||
        !inBody(bodyType, x, y - 1) ||
        !inBody(bodyType, x, y + 1);
      grid[y][x] = edge ? 1 : (x + y + seed) % 7 === 0 ? 3 : 2;
    }
  }

  const eyeY = bodyType === "teardrop" ? 7 : 8;
  const eyes =
    eyeType === "mismatch"
      ? [
          [6, eyeY, 1],
          [10, eyeY, 2],
        ]
      : [
          [6, eyeY, 1],
          [10, eyeY, 1],
        ];
  for (const [x, y, h] of eyes) {
    if (eyeType === "sleepy") {
      set(grid, x - 1, y, 1);
      set(grid, x, y, 1);
    } else if (eyeType === "wide") {
      set(grid, x, y, 1);
      set(grid, x, y + 1, 1);
    } else if (eyeType === "spark") {
      set(grid, x, y, 1);
      set(grid, x - 1, y, 3);
    } else {
      for (let dy = 0; dy < h; dy++) set(grid, x, y + dy, 1);
    }
  }
  if (mouthType === "line") {
    set(grid, 7, 11, 1);
    set(grid, 8, 11, 1);
  }
  if (mouthType === "open") {
    set(grid, 8, 11, 1);
    set(grid, 8, 12, 1);
  }
  if (mouthType === "surprised") {
    set(grid, 8, 11, 1);
    set(grid, 7, 11, 1);
    set(grid, 8, 12, 1);
  }
  if (mouthType === "crooked") {
    set(grid, 7, 11, 1);
    set(grid, 9, 12, 1);
  }

  // Tamagotchi-ish tiny feet and a black baseline make the creature read as a pet,
  // not just a random pixel cloud.
  const footY = bodyType === "tinyMushroom" ? 14 : 13;
  set(grid, 5, footY, 1);
  set(grid, 6, footY, 1);
  set(grid, 10, footY, 1);
  set(grid, 11, footY, 1);
  if (bodyType !== "longBean") {
    set(grid, 4, footY - 1, 1);
    set(grid, 12, footY - 1, 1);
  }

  if (accessoryType === "questionAntenna") {
    set(grid, 8, 3, 1);
    set(grid, 9, 2, 1);
    set(grid, 10, 2, 1);
    set(grid, 9, 1, 1);
  }
  if (accessoryType === "leafSprout") {
    set(grid, 7, 3, 3);
    set(grid, 8, 2, 3);
    set(grid, 9, 3, 3);
  }
  if (accessoryType === "horn") {
    set(grid, 6, 3, 1);
    set(grid, 9, 3, 1);
  }
  if (accessoryType === "tinyFin") {
    set(grid, 13, 8, 3);
    set(grid, 14, 7, 3);
    set(grid, 14, 9, 3);
  }
  if (accessoryType === "sideEars") {
    set(grid, 3, 7, 3);
    set(grid, 12, 7, 3);
  }
  if (accessoryType === "tailNub") {
    set(grid, 12, 11, 3);
    set(grid, 13, 11, 1);
  }
  if (accessoryType === "floatingDot") {
    set(grid, 12, 3, 3);
    set(grid, 13, 2, 1);
  }
  if (accessoryType === "haloPixel") {
    set(grid, 6, 2, 3);
    set(grid, 7, 2, 3);
    set(grid, 8, 2, 3);
    set(grid, 9, 2, 3);
  }
  if (accessoryType === "blushDots") {
    set(grid, 4, 10, 3);
    set(grid, 11, 10, 3);
  }
  if (accessoryType === "lopsidedEar") {
    set(grid, 3, 6, 3);
    set(grid, 2, 5, 1);
  }
  if (accessoryType === "tinyCrown") {
    set(grid, 6, 3, 3);
    set(grid, 8, 2, 3);
    set(grid, 10, 3, 3);
  }

  if (seed % 2 === 0) set(grid, 11, 5, 3);
  if (seed % 5 === 0) set(grid, 4, 12, 1);

  return {
    seed,
    seedKey: normalizedSeedKey,
    bodyType,
    eyeType,
    mouthType,
    accessoryType,
    palette,
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
