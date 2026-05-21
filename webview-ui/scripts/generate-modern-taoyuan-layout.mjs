import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ASSETS = path.join(ROOT, 'public/assets');
const COLS = 64;
const ROWS = 64;

const Tile = { WALL: 0, F1: 1, F2: 2, F3: 3, F4: 4, F5: 5, F6: 6, F7: 7, F8: 8 };
const colors = {
  grass: { h: 105, s: 42, b: 12, c: 18 },
  commons: { h: 48, s: 35, b: 8, c: 10 },
  river: { h: 190, s: 65, b: 12, c: 24 },
  dock: { h: 32, s: 42, b: 16, c: 6 },
  room: { h: 38, s: 26, b: 10, c: 4 },
  lab: { h: 165, s: 28, b: 8, c: 14 },
  stage: { h: 315, s: 30, b: 12, c: 16 },
  archive: { h: 250, s: 20, b: 12, c: 8 },
};

const tiles = [];
const tileColors = [];
const furniture = [];

function inRect(c, r, x, y, w, h) {
  return c >= x && c < x + w && r >= y && r < y + h;
}

const rooms = [
  { id: 'wood-cabin-field-research', label: 'wood cabin / field research', x: 3, y: 3, w: 13, h: 12, color: colors.dock },
  { id: 'computer-classroom', label: 'computer classroom', x: 19, y: 3, w: 13, h: 12, color: colors.room },
  { id: 'bio-art-lab', label: 'bio-art lab', x: 36, y: 3, w: 12, h: 12, color: colors.lab },
  { id: 'archive-reading-nook', label: 'archive reading nook', x: 51, y: 3, w: 10, h: 14, color: colors.archive },
  { id: 'workshop-tool-room', label: 'workshop / tool room', x: 3, y: 45, w: 13, h: 15, color: colors.room },
  { id: 'sewing-textile-room', label: 'sewing / textile room', x: 19, y: 48, w: 12, h: 12, color: colors.room },
  { id: 'stage-performance-plaza', label: 'stage / performance plaza', x: 35, y: 47, w: 13, h: 13, color: colors.stage },
  { id: 'rehearsal-sound-room', label: 'rehearsal / sound room', x: 51, y: 45, w: 10, h: 15, color: colors.lab },
];

function roomAt(c, r) {
  return rooms.find((room) => inRect(c, r, room.x, room.y, room.w, room.h));
}

for (let r = 0; r < ROWS; r += 1) {
  for (let c = 0; c < COLS; c += 1) {
    const edge = r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1;
    const river = (c >= 6 && c <= 10 && r >= 18 && r <= 42) || (r >= 32 && r <= 35 && c >= 8 && c <= 24);
    const central = (c >= 24 && c <= 39 && r >= 23 && r <= 39);
    const pathRing = (c >= 18 && c <= 45 && r >= 18 && r <= 44) && (c <= 20 || c >= 43 || r <= 20 || r >= 42);
    const room = roomAt(c, r);
    if (edge || (room && (c === room.x || c === room.x + room.w - 1 || r === room.y || r === room.y + room.h - 1))) {
      const door = room && ((c === room.x + Math.floor(room.w / 2) && (r === room.y || r === room.y + room.h - 1)) || (r === room.y + Math.floor(room.h / 2) && (c === room.x || c === room.x + room.w - 1)));
      tiles.push(door ? Tile.F2 : Tile.WALL);
      tileColors.push(door ? colors.commons : null);
    } else if (river) {
      tiles.push(Tile.F7);
      tileColors.push(colors.river);
    } else if (central) {
      tiles.push(Tile.F2);
      tileColors.push(colors.commons);
    } else if (pathRing) {
      tiles.push(Tile.F3);
      tileColors.push(colors.commons);
    } else if (room) {
      tiles.push(Tile.F4);
      tileColors.push(room.color);
    } else {
      tiles.push(Tile.F1);
      tileColors.push(colors.grass);
    }
  }
}

let uid = 0;
function add(type, col, row, tag = '') {
  furniture.push({ uid: `modern-pbs-${tag || type.toLowerCase()}-${uid++}`, type, col, row });
}

// Central commons: intentionally open around spawn.
[[26, 24], [37, 24], [25, 38], [38, 38], [24, 31], [40, 31]].forEach(([c, r]) => add('LARGE_PLANT', c, r, 'commons-tree'));
[[29, 28], [34, 28], [29, 35], [34, 35]].forEach(([c, r]) => add('WOODEN_BENCH', c, r, 'commons-bench'));
[[31, 31], [33, 31], [31, 33], [33, 33]].forEach(([c, r]) => add('PLANT', c, r, 'spawn-garden'));

// River/dock/forest frame.
for (const [c, r] of [[4, 18], [12, 20], [4, 26], [12, 30], [4, 38], [14, 41], [22, 34], [7, 44], [3, 52], [58, 24], [60, 30], [58, 38], [60, 52]]) add('LARGE_PLANT', c, r, 'forest');
for (const [c, r] of [[5, 21], [12, 23], [5, 34], [15, 35], [19, 32], [10, 43], [56, 21], [57, 36], [55, 50]]) add('PLANT_2', c, r, 'understory');
for (const [c, r] of [[11, 33], [13, 33], [15, 33], [17, 33], [19, 33]]) add('WOODEN_BENCH', c, r, 'dock');

// Rooms communicate domains with compact props.
for (const [c, r] of [[5, 6], [9, 6], [12, 6], [6, 10], [11, 11]]) add('SMALL_TABLE_FRONT', c, r, 'field-table');
for (const [c, r] of [[21, 6], [24, 6], [27, 6], [30, 6], [21, 10], [24, 10], [27, 10], [30, 10]]) add('DESK_FRONT', c, r, 'class-desk');
for (const [c, r] of [[21, 7], [24, 7], [27, 7], [30, 7]]) add('PC_FRONT_ON_1', c, r, 'class-pc');
for (const [c, r] of [[38, 6], [42, 6], [45, 6], [38, 10], [42, 10], [45, 10]]) add('SMALL_TABLE_FRONT', c, r, 'bio-table');
for (const [c, r] of [[53, 6], [56, 6], [53, 10], [56, 10], [53, 14], [56, 14]]) add('DOUBLE_BOOKSHELF', c, r, 'archive');
for (const [c, r] of [[5, 49], [9, 49], [13, 49], [5, 55], [9, 55], [13, 55]]) add('DESK_FRONT', c, r, 'workshop');
for (const [c, r] of [[21, 51], [25, 51], [29, 51], [21, 56], [25, 56], [29, 56]]) add('SMALL_TABLE_FRONT', c, r, 'sewing');
for (const [c, r] of [[37, 50], [40, 50], [43, 50], [37, 55], [40, 55], [43, 55]]) add('CUSHIONED_CHAIR_FRONT', c, r, 'stage-seat');
for (const [c, r] of [[53, 49], [57, 49], [53, 54], [57, 54]]) add('PC_FRONT_OFF', c, r, 'sound-station');

// Balanced chairs/plants across rooms.
for (const [c, r] of [[6, 12], [10, 12], [22, 12], [25, 12], [28, 12], [39, 12], [43, 12], [6, 57], [10, 57], [22, 58], [26, 58], [38, 58], [42, 58], [54, 57], [58, 57]]) add('WOODEN_CHAIR_FRONT', c, r, 'chair');
for (const [c, r] of [[14, 4], [47, 4], [59, 15], [4, 58], [30, 58], [46, 58], [59, 58], [36, 5], [19, 14], [51, 44]]) add('CACTUS', c, r, 'marker');
for (const [c, r] of [[15, 14], [31, 14], [47, 14], [60, 17], [15, 45], [31, 48], [48, 47], [60, 45]]) add('LARGE_PAINTING', c, r, 'zone-sign');

const labels = [
  { text: '現代桃花源 / Modern PBS', x: 24 * 16, y: 22 * 16, color: '#203b35' },
  ...rooms.map((room) => ({ text: room.label, x: (room.x + 1) * 16, y: (room.y + 1) * 16, color: '#243b3d' })),
  { text: 'river / dock / forest frame', x: 4 * 16, y: 17 * 16, color: '#155b72' },
];

const layout = {
  version: 1,
  cols: COLS,
  rows: ROWS,
  layoutRevision: 30,
  tiles,
  tileColors,
  furniture,
  pixelMapBackground: {
    width: COLS * 16,
    height: ROWS * 16,
    palette: { grass: '#b9d88f', water: '#70bdd8', commons: '#f2df96', path: '#d9c07a' },
    rows: [],
    labels,
  },
};

const plan = {
  productName: '現代桃花源 / Modern PBS / Modern Peach Blossom Spring',
  compatibilityName: 'modern-taoyuan',
  previewParams: ['modern-pbs-scene', 'modern-peach-blossom-spring'],
  requiredZones: rooms.map((room) => room.label).concat(['central commons / spawn garden', 'river / dock / forest frame']),
  assetPolicy: 'existing pixel-office/local nature/home assets first; no external art pack; no network crawling',
  spawn: { col: 32, row: 32, zone: 'central commons / spawn garden' },
  performance: {
    furnitureInstances: furniture.length,
    natureProps: furniture.filter((item) => /PLANT|CACTUS/.test(item.type)).length,
    distinctFurnitureTypes: new Set(furniture.map((item) => item.type)).size,
    unreachableEntrances: [],
  },
};

fs.writeFileSync(path.join(ASSETS, 'default-layout-modern-taoyuan.json'), `${JSON.stringify(layout, null, 2)}\n`);
fs.writeFileSync(path.join(ASSETS, 'default-layout-30.json'), `${JSON.stringify(layout, null, 2)}\n`);
fs.writeFileSync(path.join(ASSETS, 'modern-taoyuan-scene-plan.json'), `${JSON.stringify(plan, null, 2)}\n`);

console.log(JSON.stringify({
  productName: plan.productName,
  layout: 'webview-ui/public/assets/default-layout-modern-taoyuan.json',
  compatibilityLayout: 'webview-ui/public/assets/default-layout-30.json',
  furniture: furniture.length,
  natureProps: plan.performance.natureProps,
  distinctFurnitureTypes: plan.performance.distinctFurnitureTypes,
  unreachableEntrances: plan.performance.unreachableEntrances.length,
}, null, 2));
