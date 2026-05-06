import type { Direction, SpriteData } from "../office/types.js";
import { Direction as Dir } from "../office/types.js";
import { hashQuestion } from "../pets/hashQuestion.js";

export type ThrongletRole = "player" | "npc" | "pet" | "dispatch" | "agent";

export interface ThrongletPalette {
  outline: string;
  body: string;
  shade: string;
  belly: string;
  eye: string;
  foot: string;
  accent: string;
}

export interface ThrongletSpriteVariant {
  seed: number;
  role: ThrongletRole;
  palette: ThrongletPalette;
  earMode: number;
  tuftMode: number;
  accessoryMode: number;
}

const palettes: ThrongletPalette[] = [
  {
    outline: "#3B3A2A",
    body: "#FCF46B",
    shade: "#E3C94A",
    belly: "#69C3AA",
    eye: "#F7FAFF",
    foot: "#74583A",
    accent: "#FFD4FF",
  },
  {
    outline: "#293E46",
    body: "#FFE66A",
    shade: "#D9B94B",
    belly: "#5FB4DB",
    eye: "#F7FAFF",
    foot: "#6C5635",
    accent: "#FF9FD7",
  },
  {
    outline: "#33402E",
    body: "#FFF07B",
    shade: "#DCC457",
    belly: "#65C7A4",
    eye: "#FFFFFF",
    foot: "#7A5B32",
    accent: "#BAC3D9",
  },
];

function set(sprite: SpriteData, x: number, y: number, color: string): void {
  if (x >= 0 && x < 16 && y >= 0 && y < sprite.length) sprite[y][x] = color;
}

function rect(
  sprite: SpriteData,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) set(sprite, xx, yy, color);
}

export function getThrongletPalette(
  role: ThrongletRole,
  seed: string | number,
): ThrongletPalette {
  const n = typeof seed === "number" ? seed : hashQuestion(seed);
  const base = palettes[Math.abs(n) % palettes.length];
  if (role === "player") return { ...base, accent: "#F9E9C2" };
  if (role === "npc") return { ...base, accent: "#FFD4FF" };
  if (role === "dispatch") return { ...base, belly: "#73A7FF" };
  return base;
}

export function createThrongletSpriteVariant(
  seed: string | number,
  role: ThrongletRole = "pet",
): ThrongletSpriteVariant {
  const n = typeof seed === "number" ? seed : hashQuestion(seed);
  return {
    seed: n,
    role,
    palette: getThrongletPalette(role, n),
    earMode: Math.abs(n) % 3,
    tuftMode: Math.abs(n >> 3) % 3,
    accessoryMode: Math.abs(n >> 5) % 5,
  };
}

export function makeThrongletSprite(
  variant: ThrongletSpriteVariant,
  frame = 0,
  dir: Direction = Dir.DOWN,
): SpriteData {
  const p = variant.palette;
  const s: SpriteData = Array.from({ length: 24 }, () =>
    Array.from({ length: 16 }, () => ""),
  );
  const bob = frame % 2;
  // ears / side hair tufts
  if (variant.earMode === 0) {
    rect(s, 2, 7 + bob, 2, 4, p.outline);
    rect(s, 12, 7 + bob, 2, 4, p.outline);
    rect(s, 3, 8 + bob, 1, 2, p.body);
    rect(s, 12, 8 + bob, 1, 2, p.body);
  }
  if (variant.earMode === 1) {
    rect(s, 1, 9 + bob, 3, 2, p.outline);
    rect(s, 12, 9 + bob, 3, 2, p.outline);
    rect(s, 2, 9 + bob, 1, 1, p.body);
    rect(s, 13, 9 + bob, 1, 1, p.body);
  }
  if (variant.earMode === 2) {
    rect(s, 3, 5 + bob, 2, 3, p.outline);
    rect(s, 11, 5 + bob, 2, 3, p.outline);
  }
  // body outline and yellow mass
  rect(s, 4, 5 + bob, 8, 1, p.outline);
  rect(s, 3, 6 + bob, 10, 2, p.outline);
  rect(s, 2, 8 + bob, 12, 7, p.outline);
  rect(s, 3, 15 + bob, 10, 3, p.outline);
  rect(s, 4, 6 + bob, 8, 2, p.body);
  rect(s, 3, 8 + bob, 10, 6, p.body);
  rect(s, 4, 14 + bob, 8, 3, p.shade);
  // blue clothing / belly block
  rect(s, 5, 12 + bob, 6, 5, p.belly);
  rect(s, 4, 13 + bob, 1, 3, p.belly);
  rect(s, 11, 13 + bob, 1, 3, p.belly);
  // square eyes vary by direction
  if (dir === Dir.UP) {
    rect(s, 5, 8 + bob, 2, 2, p.shade);
    rect(s, 9, 8 + bob, 2, 2, p.shade);
  } else {
    rect(s, dir === Dir.RIGHT ? 6 : 5, 8 + bob, 2, 2, p.eye);
    rect(s, dir === Dir.LEFT ? 8 : 9, 8 + bob, 2, 2, p.eye);
    set(s, dir === Dir.RIGHT ? 7 : 6, 9 + bob, p.outline);
    set(s, dir === Dir.LEFT ? 9 : 10, 9 + bob, p.outline);
  }
  // feet
  rect(s, 4, 18 + bob, 3, 2, p.foot);
  rect(s, 9, 18 + bob, 3, 2, p.foot);
  // tufts and accessories identify variants without copying any licensed sprite.
  if (variant.tuftMode === 0) {
    set(s, 7, 4 + bob, p.outline);
    set(s, 8, 3 + bob, p.outline);
    set(s, 9, 4 + bob, p.outline);
  }
  if (variant.tuftMode === 1) {
    rect(s, 6, 4 + bob, 4, 1, p.accent);
    set(s, 8, 3 + bob, p.accent);
  }
  if (variant.accessoryMode === 1) rect(s, 4, 11 + bob, 8, 1, p.accent);
  if (variant.accessoryMode === 2) {
    set(s, 12, 6 + bob, p.accent);
    set(s, 13, 5 + bob, p.accent);
  }
  if (variant.accessoryMode === 3) {
    rect(s, 11, 12 + bob, 2, 4, "#8DDCFF");
    set(s, 12, 11 + bob, "#FFFFFF");
  }
  if (variant.accessoryMode === 4) {
    set(s, 4, 5 + bob, p.accent);
    set(s, 11, 5 + bob, p.accent);
  }
  return s;
}

export function appearanceToThrongletSpriteData(
  seed: string | number,
  role: ThrongletRole = "pet",
): SpriteData {
  return makeThrongletSprite(createThrongletSpriteVariant(seed, role));
}

export function createThrongletCharacterSprites(
  seed: string | number,
  role: ThrongletRole = "agent",
) {
  const variant = createThrongletSpriteVariant(seed, role);
  const walk = (
    dir: Direction,
  ): [SpriteData, SpriteData, SpriteData, SpriteData] =>
    [0, 1, 0, 1].map((frame) => makeThrongletSprite(variant, frame, dir)) as [
      SpriteData,
      SpriteData,
      SpriteData,
      SpriteData,
    ];
  const pair = (dir: Direction): [SpriteData, SpriteData] => [
    makeThrongletSprite(variant, 0, dir),
    makeThrongletSprite(variant, 1, dir),
  ];
  return {
    walk: {
      [Dir.DOWN]: walk(Dir.DOWN),
      [Dir.UP]: walk(Dir.UP),
      [Dir.RIGHT]: walk(Dir.RIGHT),
      [Dir.LEFT]: walk(Dir.LEFT),
    },
    typing: {
      [Dir.DOWN]: pair(Dir.DOWN),
      [Dir.UP]: pair(Dir.UP),
      [Dir.RIGHT]: pair(Dir.RIGHT),
      [Dir.LEFT]: pair(Dir.LEFT),
    },
    reading: {
      [Dir.DOWN]: pair(Dir.DOWN),
      [Dir.UP]: pair(Dir.UP),
      [Dir.RIGHT]: pair(Dir.RIGHT),
      [Dir.LEFT]: pair(Dir.LEFT),
    },
  };
}

export function drawThronglet(
  ctx: {
    fillStyle: string;
    fillRect: (x: number, y: number, w: number, h: number) => void;
  },
  x: number,
  y: number,
  options: {
    seed: string | number;
    role?: ThrongletRole;
    frame?: number;
    scale?: number;
  },
): void {
  const sprite = makeThrongletSprite(
    createThrongletSpriteVariant(options.seed, options.role ?? "pet"),
    options.frame ?? 0,
  );
  const scale = options.scale ?? 1;
  sprite.forEach((row, yy) =>
    row.forEach((color, xx) => {
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x + xx * scale, y + yy * scale, scale, scale);
    }),
  );
}
