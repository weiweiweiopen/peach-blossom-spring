import { MAX_DELTA_TIME_SEC } from '../../constants.js';

const TARGET_FRAME_MS = 1000 / 30;

/** @internal */
export interface GameLoopCallbacks {
  update: (dt: number) => void;
  render: (ctx: CanvasRenderingContext2D) => void;
}

export function startGameLoop(canvas: HTMLCanvasElement, callbacks: GameLoopCallbacks): () => void {
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  let lastTime = 0;
  let lastRenderTime = 0;
  let rafId = 0;
  let stopped = false;

  const frame = (time: number) => {
    if (stopped) return;
    if (lastRenderTime && time - lastRenderTime < TARGET_FRAME_MS) {
      rafId = requestAnimationFrame(frame);
      return;
    }
    const dt = lastTime === 0 ? 0 : Math.min((time - lastTime) / 1000, MAX_DELTA_TIME_SEC);
    lastTime = time;
    lastRenderTime = time;

    callbacks.update(dt);

    ctx.imageSmoothingEnabled = false;
    callbacks.render(ctx);

    rafId = requestAnimationFrame(frame);
  };

  rafId = requestAnimationFrame(frame);

  return () => {
    stopped = true;
    cancelAnimationFrame(rafId);
  };
}
