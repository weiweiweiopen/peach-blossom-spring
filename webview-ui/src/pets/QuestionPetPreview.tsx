import { useEffect, useMemo, useState } from 'react';

import { appearanceToAnimationData, generateQuestionPet, type QuestionPetAppearance } from './generateQuestionPet.js';

interface Props {
  question: string;
  appearance?: QuestionPetAppearance;
  size?: number;
}

export function QuestionPetPreview({ question, appearance, size = 8 }: Props) {
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
        width: 16 * size,
        height: 16 * size,
        borderColor: pet.palette.outline,
        background: '#F9E9C2',
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
