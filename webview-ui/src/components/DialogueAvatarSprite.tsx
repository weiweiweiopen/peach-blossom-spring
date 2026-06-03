import { useEffect, useMemo, useState } from 'react';

import { getCharacterSprites } from '../office/sprites/spriteData.js';
import { Direction, type SpriteData } from '../office/types.js';

function PixelSprite({ sprite }: { sprite: SpriteData }) {
  return (
    <div
      className="rpg-dialogue-avatar-pixels"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${(sprite[0]?.length ?? 1).toString()}, 2px)`,
        gridAutoRows: '2px',
      }}
    >
      {sprite.flatMap((row, rowIndex) =>
        row.map((color, colIndex) => (
          <span
            key={`${rowIndex.toString()}-${colIndex.toString()}`}
            style={{ backgroundColor: color || 'transparent' }}
          />
        )),
      )}
    </div>
  );
}

export function CharacterDialogueAvatar({ palette, hueShift = 0, label }: { palette: number; hueShift?: number; label: string }) {
  const [frame, setFrame] = useState(0);
  const sprite = useMemo<SpriteData>(() => {
    const sprites = getCharacterSprites(palette, hueShift);
    return sprites.walk[Direction.DOWN][frame % 4];
  }, [frame, hueShift, palette]);

  useEffect(() => {
    const id = window.setInterval(() => setFrame((current) => current + 1), 120);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rpg-dialogue-avatar-sprite" aria-label={label}>
      <PixelSprite sprite={sprite} />
    </div>
  );
}

export function ImageDialogueAvatar({ label, src, intervalMs = 90, frameCount = 1 }: { label: string; src: (frame: number) => string; intervalMs?: number; frameCount?: number }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (frameCount <= 1) return;
    const id = window.setInterval(() => setFrame((current) => current + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [frameCount, intervalMs]);

  return (
    <div className="rpg-dialogue-avatar-sprite" aria-label={label}>
      <img
        src={src(frame % Math.max(1, frameCount))}
        alt=""
        className="block h-auto max-h-full w-auto object-contain object-center"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
