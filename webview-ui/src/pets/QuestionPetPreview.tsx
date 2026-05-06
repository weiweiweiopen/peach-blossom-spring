import { useMemo } from 'react';

import { appearanceToSpriteData, generateQuestionPet, type QuestionPetAppearance } from './generateQuestionPet.js';

interface Props {
  question: string;
  appearance?: QuestionPetAppearance;
  size?: number;
}

export function QuestionPetPreview({ question, appearance, size = 8 }: Props) {
  const pet = useMemo(() => appearance ?? generateQuestionPet(question), [appearance, question]);
  const sprite = useMemo(() => appearanceToSpriteData(pet), [pet]);
  return (
    <div
      className="question-pet-preview inline-grid border-2"
      style={{
        gridTemplateColumns: 'repeat(16, 1fr)',
        width: 16 * size,
        height: 16 * size,
        borderColor: pet.palette.outline,
        background: '#B7D879',
        imageRendering: 'pixelated',
      }}
      aria-label="16x16 question pet preview"
    >
      {sprite.flatMap((row, y) => row.map((color, x) => (
        <span key={`${x}-${y}`} style={{ background: color || 'transparent' }} />
      )))}
    </div>
  );
}
