import { useEffect, useState } from 'react';

export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

function calculateStageScale(): number {
  if (typeof window === 'undefined') {
    return 1;
  }

  return Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
}

export function useStageScale(): number {
  const [scale, setScale] = useState(calculateStageScale);

  useEffect(() => {
    const updateScale = () => setScale(calculateStageScale());

    updateScale();
    window.addEventListener('resize', updateScale);

    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return scale;
}
