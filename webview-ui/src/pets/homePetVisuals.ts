export type HomePetShape = 'round' | 'tall' | 'squat' | 'drop' | 'mushroom' | 'bird' | 'blob' | 'tower';
export type HomePetAccessory = 'ears' | 'cap' | 'sprout' | 'antenna' | 'tail' | 'halo' | 'horns';

export interface HomePetRole {
  label: string;
  shape: HomePetShape;
  accessory: HomePetAccessory;
}

export const homePetRoles: HomePetRole[] = [
  { label: 'artist', shape: 'round', accessory: 'ears' },
  { label: 'scientist', shape: 'tower', accessory: 'antenna' },
  { label: 'engineer', shape: 'squat', accessory: 'cap' },
  { label: 'cook', shape: 'mushroom', accessory: 'halo' },
  { label: 'dancer', shape: 'bird', accessory: 'tail' },
  { label: 'workshopologist', shape: 'tall', accessory: 'sprout' },
  { label: 'drinker', shape: 'drop', accessory: 'cap' },
  { label: 'socialist', shape: 'round', accessory: 'tail' },
  { label: 'professor', shape: 'tall', accessory: 'halo' },
  { label: 'fire maker', shape: 'drop', accessory: 'horns' },
  { label: 'tailor', shape: 'squat', accessory: 'sprout' },
  { label: 'musician', shape: 'bird', accessory: 'antenna' },
  { label: 'shaman', shape: 'blob', accessory: 'halo' },
  { label: 'bubble maker', shape: 'round', accessory: 'antenna' },
  { label: 'architect', shape: 'tower', accessory: 'cap' },
  { label: 'herbalist', shape: 'tall', accessory: 'tail' },
];

export const homePetColors = {
  black: '#000000',
  yellow: '#FCF46B',
  blue: '#69C3AA',
  silver: '#BAC3D9',
  pink: '#FFD4FF',
  cream: '#F9E9C2',
} as const;

export const homePetColorCycle = [
  homePetColors.yellow,
  homePetColors.blue,
  homePetColors.pink,
  homePetColors.cream,
  homePetColors.silver,
] as const;

const shapeRows: Record<HomePetShape, number[]> = {
  round: [0, 0, 4, 8, 10, 10, 10, 10, 8, 6, 4, 0, 0, 0],
  tall: [0, 0, 4, 6, 6, 8, 8, 8, 8, 6, 6, 4, 0, 0],
  squat: [0, 0, 0, 0, 8, 10, 12, 12, 10, 8, 0, 0, 0, 0],
  drop: [0, 0, 2, 4, 6, 8, 10, 10, 8, 6, 4, 0, 0, 0],
  mushroom: [0, 0, 6, 10, 12, 10, 8, 6, 6, 6, 4, 0, 0, 0],
  bird: [0, 0, 4, 6, 8, 8, 8, 6, 8, 10, 4, 0, 0, 0],
  blob: [0, 0, 6, 8, 10, 8, 10, 10, 8, 10, 6, 0, 0, 0],
  tower: [0, 0, 4, 4, 6, 6, 8, 8, 8, 8, 6, 4, 0, 0],
};

function shouldFillBody(x: number, y: number, role: HomePetRole, seed: number): boolean {
  const width = shapeRows[role.shape][y] ?? 0;
  const lean = role.shape === 'bird' && y > 6 ? 1 : seed % 5 === 0 && y > 6 ? 1 : 0;
  const start = Math.floor((14 - width) / 2) + lean;
  return width > 0 && x >= start && x < start + width;
}

function addAccessory(grid: string[][], role: HomePetRole, seed: number, accent: string): void {
  if (role.accessory === 'ears') {
    grid[2][4] = accent;
    grid[2][9] = accent;
    grid[1][3 + (seed % 2)] = accent;
    grid[1][9] = accent;
  }
  if (role.accessory === 'cap') {
    for (let x = 4; x <= 9; x += 1) grid[2][x] = accent;
    grid[3][9] = accent;
  }
  if (role.accessory === 'sprout') {
    grid[1][6] = accent;
    grid[0][5] = accent;
    grid[0][7] = accent;
    grid[2][6] = accent;
  }
  if (role.accessory === 'antenna') {
    grid[0][6] = accent;
    grid[1][6] = accent;
    grid[2][6] = accent;
    grid[0][8] = accent;
  }
  if (role.accessory === 'tail') {
    grid[7][10] = accent;
    grid[7][11] = accent;
    grid[6][11] = accent;
  }
  if (role.accessory === 'halo') {
    for (let x = 5; x <= 8; x += 1) grid[1][x] = accent;
    grid[2][4] = accent;
    grid[2][9] = accent;
  }
  if (role.accessory === 'horns') {
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
          grid[ny][nx] = homePetColors.black;
        }
      });
    });
  });
}

export function makeHomePetGrid(role: HomePetRole, seed: number): string[][] {
  const body = homePetColorCycle[seed % homePetColorCycle.length];
  const belly = homePetColorCycle[(seed + 3) % homePetColorCycle.length];
  const accent = homePetColorCycle[(seed + 1) % homePetColorCycle.length];
  const eye = homePetColors.black;
  const grid = Array.from({ length: 14 }, () => Array.from({ length: 14 }, () => ''));

  for (let y = 0; y < 14; y += 1) {
    for (let x = 0; x < 14; x += 1) {
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

export function homePetSlug(label: string): string {
  return label.replaceAll(' ', '-');
}
