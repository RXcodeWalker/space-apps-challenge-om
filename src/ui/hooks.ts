import { useSyncExternalStore } from 'react';
import { getProgress, getSettings, subscribe } from './game/progress';
import { rankInfo } from './game/objectives';

// ---------- Reduced motion: user setting wins, else the OS ----------

const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

/** Non-React read, for effects and animation code. */
export function prefersReducedMotion(): boolean {
  const s = getSettings().reduceMotion;
  return s ?? !!mq?.matches;
}

function subscribeMotion(fn: () => void) {
  const off = subscribe(fn);
  mq?.addEventListener?.('change', fn);
  return () => { off(); mq?.removeEventListener?.('change', fn); };
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
}

// ---------- Progress ----------

/** Whole progress object; re-renders on any award, setting or stat change. */
export function useProgress() {
  return useSyncExternalStore(subscribe, getProgress, getProgress);
}

export function useSettings() {
  return useSyncExternalStore(subscribe, getSettings, getSettings);
}

/** XP + rank ladder position. */
export function useRank() {
  const p = useProgress();
  return { xp: p.xp, ...rankInfo(p.xp) };
}
