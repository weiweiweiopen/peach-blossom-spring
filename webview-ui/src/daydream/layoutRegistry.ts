export type DaydreamLayoutId = 'editorial_spread' | 'matrix_typographic_wall' | 'pbs_reset_title_kinetic' | 'soft_sound_commons' | 'aino_motion_grid' | 'aino_tui_blocks' | 'glyph_mask_flow';

export interface DaydreamLayoutPreset {
  id: DaydreamLayoutId;
  name: string;
  intent: string;
  minColumns: number;
  maxColumns: number;
  minRows: number;
  maxRows: number;
  textDensity: 'essay' | 'fragment' | 'poster';
  status?: 'official' | 'provisional' | 'research';
  artifactGuardRequired?: boolean;
}

export const DAYDREAM_LAYOUT_PRESETS: DaydreamLayoutPreset[] = [
  {
    id: 'editorial_spread',
    name: 'Editorial Spread',
    intent: 'Long-form zine spreads with large quotes and readable sections.',
    minColumns: 1,
    maxColumns: 4,
    minRows: 4,
    maxRows: 8,
    textDensity: 'essay',
    status: 'official',
    artifactGuardRequired: true,
  },
  {
    id: 'matrix_typographic_wall',
    name: 'Matrix Typographic Wall',
    intent: 'Poster-like pages split into generated 10×10–20×20 cells with mixed typography, clipped words, and varied spans.',
    minColumns: 10,
    maxColumns: 20,
    minRows: 10,
    maxRows: 20,
    textDensity: 'poster',
    status: 'research',
    artifactGuardRequired: true,
  },

  {
    id: 'pbs_reset_title_kinetic',
    name: 'PBS Reset Title Kinetic',
    intent: 'PBS-palette title-led public Daydream artifact; readable body, kinetic title only.',
    minColumns: 1,
    maxColumns: 4,
    minRows: 4,
    maxRows: 8,
    textDensity: 'essay',
    status: 'official',
    artifactGuardRequired: true,
  },
  {
    id: 'soft_sound_commons',
    name: 'Soft Sound Commons',
    intent: 'Soft-sound / commons zine direction for public Daydream outputs.',
    minColumns: 1,
    maxColumns: 4,
    minRows: 4,
    maxRows: 10,
    textDensity: 'essay',
    status: 'official',
    artifactGuardRequired: true,
  },
  {
    id: 'aino_motion_grid',
    name: 'Aino Motion Grid',
    intent: 'Character-grid typography with true DOM text and restrained title motion.',
    minColumns: 4,
    maxColumns: 8,
    minRows: 8,
    maxRows: 16,
    textDensity: 'fragment',
    status: 'provisional',
    artifactGuardRequired: true,
  },
  {
    id: 'aino_tui_blocks',
    name: 'Aino TUI Text Blocks',
    intent: 'Pure text block layout; interface made from typography, spacing, labels, and ASCII imagery.',
    minColumns: 4,
    maxColumns: 12,
    minRows: 8,
    maxRows: 18,
    textDensity: 'fragment',
    status: 'official',
    artifactGuardRequired: true,
  },
  {
    id: 'glyph_mask_flow',
    name: 'Glyph Mask Flow',
    intent: 'Research layout where curved title glyph masks affect all readable text blocks; still under development.',
    minColumns: 6,
    maxColumns: 16,
    minRows: 12,
    maxRows: 24,
    textDensity: 'poster',
    status: 'research',
    artifactGuardRequired: true,
  },
];

export function getDaydreamLayoutPreset(id: DaydreamLayoutId): DaydreamLayoutPreset {
  const preset = DAYDREAM_LAYOUT_PRESETS.find((layout) => layout.id === id);
  if (!preset) throw new Error(`Unknown Daydream layout preset: ${id}`);
  return preset;
}
