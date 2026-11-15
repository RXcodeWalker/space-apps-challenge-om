import { useEffect, useRef } from 'react';
import { useRank, useProgress, useReducedMotion } from '../hooks';
import { setHudAnchor } from '../fx/celebrate';
import { OBJECTIVE_IDS } from '../game/objectives';
import { color } from '../tokens';

const CIRC = 75.4; // 2πr for r = 12

/**
 * Header rank badge: progress ring with the level, rank name, rolling XP count and
 * objectives done. It is the landing point for award bursts. Put one in each page header.
 */
export function RankHud({ onClick }: { onClick?: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const xpRef = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(null);
  const { xp, level, rank, frac } = useRank();
  const done = Object.keys(useProgress().done).length;
  const reduce = useReducedMotion();

  useEffect(() => { setHudAnchor(ref.current); return () => setHudAnchor(null); }, []);

  // Roll the XP number toward its target (instant under reduced motion or on first paint).
  useEffect(() => {
    const el = xpRef.current;
    if (!el) return;
    if (reduce || shown.current === null) { shown.current = xp; el.textContent = String(xp); return; }
    let raf = 0;
    const step = () => {
      const cur = shown.current!, next = Math.abs(xp - cur) > 0.5 ? cur + (xp - cur) * 0.1 : xp;
      shown.current = next;
      el.textContent = String(Math.round(next));
      if (next !== xp) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [xp, reduce]);

  return (
    <button ref={ref} type="button" className="oc-rank-hud" onClick={onClick} aria-label={`Rank ${rank.name}, ${xp} XP, ${done} of ${OBJECTIVE_IDS.length} objectives. Open mission log`}>
      <span className="oc-rank-hud__ring" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="12" fill="none" stroke={color.line} strokeWidth="3" />
          <circle cx="14" cy="14" r="12" fill="none" stroke={color.accent} strokeWidth="3" strokeDasharray={CIRC} strokeDashoffset={(CIRC * (1 - frac)).toFixed(1)} />
        </svg>
        <span style={{ position: 'relative' }}>{level}</span>
      </span>
      <span className="oc-rank-hud__text" aria-hidden="true">
        <span className="oc-rank-hud__name">{rank.name}</span>
        <span className="oc-rank-hud__xp"><span ref={xpRef}>{xp}</span> XP · {done}/{OBJECTIVE_IDS.length}</span>
      </span>
    </button>
  );
}
