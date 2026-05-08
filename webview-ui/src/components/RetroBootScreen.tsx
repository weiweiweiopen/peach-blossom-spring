import "./RetroBootScreen.css";

import { type KeyboardEvent } from "react";

interface RetroBootScreenProps {
  onStart: () => void;
}

type PetRole = {
  label: string;
  shape: "round" | "tall" | "squat" | "drop" | "mushroom" | "bird" | "blob" | "tower";
  accessory: "ears" | "cap" | "sprout" | "antenna" | "tail" | "halo" | "horns";
};

const WORLD_COLORS = {
  black: "#000000",
  yellow: "#FCF46B",
  blue: "#69C3AA",
  silver: "#BAC3D9",
  pink: "#FFD4FF",
  cream: "#F9E9C2",
} as const;

const petRoles: PetRole[] = [
  { label: "artist", shape: "round", accessory: "ears" },
  { label: "scientist", shape: "tower", accessory: "antenna" },
  { label: "engineer", shape: "squat", accessory: "cap" },
  { label: "cook", shape: "mushroom", accessory: "halo" },
  { label: "dancer", shape: "bird", accessory: "tail" },
  { label: "workshopologist", shape: "tall", accessory: "sprout" },
  { label: "drinker", shape: "drop", accessory: "cap" },
  { label: "socialist", shape: "round", accessory: "tail" },
  { label: "professor", shape: "tall", accessory: "halo" },
  { label: "fire maker", shape: "drop", accessory: "horns" },
  { label: "tailor", shape: "squat", accessory: "sprout" },
  { label: "musician", shape: "bird", accessory: "antenna" },
  { label: "shaman", shape: "blob", accessory: "halo" },
  { label: "bubble maker", shape: "round", accessory: "antenna" },
  { label: "architect", shape: "tower", accessory: "cap" },
  { label: "herbalist", shape: "tall", accessory: "tail" },
];

const colorCycle = [
  WORLD_COLORS.yellow,
  WORLD_COLORS.blue,
  WORLD_COLORS.pink,
  WORLD_COLORS.cream,
  WORLD_COLORS.silver,
] as const;

const shapeRows: Record<PetRole["shape"], number[]> = {
  round: [0, 0, 4, 8, 10, 10, 10, 10, 8, 6, 4, 0, 0, 0],
  tall: [0, 0, 4, 6, 6, 8, 8, 8, 8, 6, 6, 4, 0, 0],
  squat: [0, 0, 0, 0, 8, 10, 12, 12, 10, 8, 0, 0, 0, 0],
  drop: [0, 0, 2, 4, 6, 8, 10, 10, 8, 6, 4, 0, 0, 0],
  mushroom: [0, 0, 6, 10, 12, 10, 8, 6, 6, 6, 4, 0, 0, 0],
  bird: [0, 0, 4, 6, 8, 8, 8, 6, 8, 10, 4, 0, 0, 0],
  blob: [0, 0, 6, 8, 10, 8, 10, 10, 8, 10, 6, 0, 0, 0],
  tower: [0, 0, 4, 4, 6, 6, 8, 8, 8, 8, 6, 4, 0, 0],
};

function shouldFillBody(x: number, y: number, role: PetRole, seed: number): boolean {
  const width = shapeRows[role.shape][y] ?? 0;
  const lean = role.shape === "bird" && y > 6 ? 1 : seed % 5 === 0 && y > 6 ? 1 : 0;
  const start = Math.floor((14 - width) / 2) + lean;
  return width > 0 && x >= start && x < start + width;
}

function addAccessory(grid: string[][], role: PetRole, seed: number, accent: string): void {
  if (role.accessory === "ears") {
    grid[2][4] = accent;
    grid[2][9] = accent;
    grid[1][3 + (seed % 2)] = accent;
    grid[1][9] = accent;
  }
  if (role.accessory === "cap") {
    for (let x = 4; x <= 9; x++) grid[2][x] = accent;
    grid[3][9] = accent;
  }
  if (role.accessory === "sprout") {
    grid[1][6] = accent;
    grid[0][5] = accent;
    grid[0][7] = accent;
    grid[2][6] = accent;
  }
  if (role.accessory === "antenna") {
    grid[0][6] = accent;
    grid[1][6] = accent;
    grid[2][6] = accent;
    grid[0][8] = accent;
  }
  if (role.accessory === "tail") {
    grid[7][10] = accent;
    grid[7][11] = accent;
    grid[6][11] = accent;
  }
  if (role.accessory === "halo") {
    for (let x = 5; x <= 8; x++) grid[1][x] = accent;
    grid[2][4] = accent;
    grid[2][9] = accent;
  }
  if (role.accessory === "horns") {
    grid[1][4] = accent;
    grid[2][4] = accent;
    grid[1][9] = accent;
    grid[2][9] = accent;
  }
}

function addOutline(grid: string[][]): void {
  const filled = grid.map((row) => row.map(Boolean));
  filled.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (!cell) return;
      [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].forEach(([nx, ny]) => {
        if (nx >= 0 && nx < 14 && ny >= 0 && ny < 14 && !grid[ny][nx]) {
          grid[ny][nx] = WORLD_COLORS.black;
        }
      });
    });
  });
}

function makePetGrid(role: PetRole, seed: number): string[][] {
  const body = colorCycle[seed % colorCycle.length];
  const belly = colorCycle[(seed + 3) % colorCycle.length];
  const accent = colorCycle[(seed + 1) % colorCycle.length];
  const eye = WORLD_COLORS.black;
  const grid = Array.from({ length: 14 }, () => Array.from({ length: 14 }, () => ""));

  for (let y = 0; y < 14; y++) {
    for (let x = 0; x < 14; x++) {
      if (shouldFillBody(x, y, role, seed)) grid[y][x] = body;
    }
  }

  grid[7][6] = belly;
  grid[7][7] = belly;
  grid[8][5] = belly;
  grid[8][6] = belly;
  grid[8][7] = belly;
  grid[8][8] = belly;
  grid[5][5] = eye;
  grid[5][8] = eye;
  grid[6][7] = eye;
  grid[10][5] = accent;
  grid[10][8] = accent;
  grid[11][5] = accent;
  grid[11][8] = accent;
  addAccessory(grid, role, seed, accent);
  addOutline(grid);

  return grid;
}

function PixelPetSprite({ role, index }: { role: PetRole; index: number }) {
  const grid = makePetGrid(role, index);

  return (
    <div className="retro-pet" aria-label={role.label} title={role.label}>
      {grid.flatMap((row, rowIndex) =>
        row.map((color, colIndex) => (
          <span
            key={`${rowIndex}-${colIndex}`}
            className="retro-pet-pixel"
            style={{ backgroundColor: color || "transparent" }}
          />
        )),
      )}
    </div>
  );
}

function BootScreenOverlay({ onStart }: RetroBootScreenProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onStart();
    }
  };

  return (
    <div className="retro-boot-overlay" role="dialog" aria-label="Retro boot screen">
      <div className="retro-boot-stage">
        <div className="retro-sticker-bar">
          <span>PBS-2026</span>
          <span>HACKER CAMP PORN</span>
        </div>

        <div className="retro-screen">
          <div className="retro-title-card">
            <p className="retro-kicker">Non-Governmental Matters</p>
            <h1>Peach Blossom Spring</h1>
            <p>Dispatching a Thinking Life Simulator</p>
            <button className="retro-start-button" type="button" onClick={onStart} onKeyDown={handleKeyDown} autoFocus>
              PRESS START
            </button>
          </div>

          <div className="retro-pet-field" aria-hidden="true">
            <div className="retro-pet-marquee">
              {[...petRoles, ...petRoles].map((role, index) => (
                <PixelPetSprite key={`${role.label}-${index}`} role={role} index={index} />
              ))}
            </div>
          </div>
        </div>

        <div className="retro-console-label">
          <span>Wise Mouse Culture</span>
          <span>WORLD CONSOLE MODE</span>
        </div>
      </div>
    </div>
  );
}

export function RetroBootScreen({ onStart }: RetroBootScreenProps) {
  return <BootScreenOverlay onStart={onStart} />;
}
