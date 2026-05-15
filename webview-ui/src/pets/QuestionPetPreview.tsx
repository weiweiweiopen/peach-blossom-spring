import { useEffect, useMemo, useState } from 'react';

import type { SimAction } from '../simulation/types.js';
import { appearanceToAnimationData, generateQuestionPet, type QuestionPetAppearance } from './generateQuestionPet.js';
import { chooseThrongletExpression, getThrongletExpressionFrames, type ThrongletSocialSignals } from './throngletAssets.js';
import { createThrongletWaAnimation, resolvePetRoleSlug } from './throngletWaSprites.js';

interface Props {
  question: string;
  appearance?: QuestionPetAppearance;
  size?: number;
  fill?: boolean;
  socialSignals?: ThrongletSocialSignals;
  currentAction?: SimAction;
}

export function QuestionPetPreview({ question, appearance, size = 8, fill = false, socialSignals, currentAction }: Props) {
  const pet = useMemo(() => appearance ?? generateQuestionPet(question), [appearance, question]);
  const expression = useMemo(
    () => chooseThrongletExpression(socialSignals, currentAction),
    [currentAction, socialSignals],
  );
  const imageFrames = useMemo(() => getThrongletExpressionFrames(expression), [expression]);
  const petFrames = useMemo(
    () => createThrongletWaAnimation(expression, resolvePetRoleSlug(pet.bodyType, pet.seed)),
    [expression, pet.bodyType, pet.seed],
  );
  const frames = useMemo(() => appearanceToAnimationData(pet), [pet]);
  const [frameIndex, setFrameIndex] = useState(0);
  const sprite = petFrames[frameIndex % petFrames.length] ?? frames[frameIndex % frames.length];
  const pixelSize = fill ? `var(--question-pet-pixel, ${size.toString()}px)` : `${size.toString()}px`;

  useEffect(() => {
    setFrameIndex(0);
    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, 140);
    return () => window.clearInterval(timer);
  }, [frames.length]);

  if (imageFrames.length > 0 && petFrames.length === 0) {
    return (
      <img
        className="question-pet-preview border-2 object-contain"
        src={imageFrames[frameIndex % imageFrames.length]}
        width={fill ? undefined : 16 * size}
        height={fill ? undefined : 32 * size}
        style={{
          width: fill ? `calc(16 * ${pixelSize})` : 16 * size,
          height: fill ? `calc(32 * ${pixelSize})` : 32 * size,
          borderColor: pet.palette.outline,
          background: 'transparent',
          imageRendering: 'pixelated',
        }}
        alt={`Thronglet ${expression} animation frame from ${pet.throngletAnimation.source}`}
      />
    );
  }

  return (
    <div
      className="question-pet-preview inline-grid border-2"
      style={{
        gridTemplateColumns: `repeat(16, ${pixelSize})`,
        gridTemplateRows: `repeat(${sprite.length.toString()}, ${pixelSize})`,
        width: fill ? `calc(16 * ${pixelSize})` : 16 * size,
        height: fill ? `calc(${sprite.length.toString()} * ${pixelSize})` : sprite.length * size,
        borderColor: pet.palette.outline,
        background: 'transparent',
        imageRendering: 'pixelated',
        aspectRatio: `16 / ${sprite.length.toString()}`,
      }}
      aria-label={`16x${sprite.length.toString()} animated question pet preview: ${pet.moodType}`}
    >
      {sprite.flatMap((row, y) => row.map((color, x) => (
        <span key={`${x}-${y}`} style={{ background: color || 'transparent' }} />
      )))}
    </div>
  );
}
