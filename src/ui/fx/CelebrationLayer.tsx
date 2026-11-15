import { useEffect } from 'react';
import { installCelebrations } from './celebrate';
import { useReducedMotion } from '../hooks';

/**
 * Mount once at the app root (main.tsx). Turns award() / promotion events
 * into bursts, pop-ups, banners and sounds, and mirrors the reduced-motion
 * choice onto <html data-oc-reduce-motion> for CSS.
 */
export function CelebrationLayer() {
  const reduce = useReducedMotion();
  useEffect(() => installCelebrations(), []);
  useEffect(() => { document.documentElement.dataset.ocReduceMotion = String(reduce); }, [reduce]);
  return null;
}
