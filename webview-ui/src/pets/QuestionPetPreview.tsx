import { useEffect, useMemo, useState } from 'react';

import { appearanceToAnimationData, generateQuestionPet, type QuestionPetAppearance } from './generateQuestionPet.js';

interface Props {
  question: string;
  appearance?: QuestionPetAppearance;
  size?: number;
  fill?: boolean;
}

export function QuestionPetPreview({ question, appearance, size = 8, fill = false }: Props) {
  const pet = useMemo(() => appearance ?? generateQuestionPet(question), [appearance, question]);
  const frames = useMemo(() => appearanceToAnimationData(pet), [pet]);
  const [frameIndex, setFrameIndex] = useState(0);
  const sprite = frames[frameIndex % frames.length];

  useEffect(() => {
    setFrameIndex(0);
    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, 140);
    return () => window.clearInterval(timer);
  }, [frames.length]);

  return (
    <div
      className="question-pet-preview inline-grid border-2"
      style={{
        gridTemplateColumns: 'repeat(16, 1fr)',
        gridTemplateRows: 'repeat(16, 1fr)',
        width: fill ? '100%' : 16 * size,
        height: fill ? '100%' : 16 * size,
        borderColor: pet.palette.outline,
        background: '#fff',
        imageRendering: 'pixelated',
      }}
      aria-label={`16x16 animated question pet preview: ${pet.moodType}`}
    >
      {sprite.flatMap((row, y) => row.map((color, x) => (
        <span key={`${x}-${y}`} style={{ background: color || 'transparent' }} />
      )))}
    </div>
  );
}
