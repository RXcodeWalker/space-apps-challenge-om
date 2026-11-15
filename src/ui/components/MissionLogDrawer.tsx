import { useEffect, useRef, useState } from 'react';
import { objectiveRows, resetProgress } from '../game/progress';
import { RANKS } from '../game/objectives';
import { useRank, useProgress } from '../hooks';
import { Button } from './Button';
import { Bar } from './Bar';

/** Right-hand drawer listing every objective, the rank ladder and XP. Escape or the scrim closes it. */
export function MissionLogDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { xp, index, level, total, rank, next, frac, toNext } = useRank();
  useProgress(); // re-render on any award
  const rows = objectiveRows();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!open) { setConfirm(false); return; }
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); opener?.focus?.(); };
  }, [open, onClose]);

  const doneCount = rows.filter(r => r.done).length;
  return (
    <>
      <div className={'oc-scrim' + (open ? ' oc-scrim--open' : '')} onClick={onClose} aria-hidden="true" />
      <aside className={'oc-drawer' + (open ? ' oc-drawer--open' : '')} role="dialog" aria-modal="true" aria-label="Mission log" aria-hidden={!open}>
        <div className="oc-drawer__head">
          <span className="oc-type-label">Mission log</span>
          <Button ref={closeRef} size="sm" onClick={onClose}>Close</Button>
        </div>
        <div className="oc-drawer__rank">
          <span className="oc-type-code text-oc-text-3">Rank {level} of {total}</span>
          <span className="oc-type-display">{rank.name}</span>
          <Bar value={frac * 100} max={100} size="md" fill="var(--oc-accent)" label={`${Math.round(frac * 100)}% of the way to the next rank`} />
          <div className="oc-drawer__xp">
            <span>{xp} XP · {doneCount}/{rows.length} done</span>
            <span>{next ? `${toNext} XP to ${next.name}` : 'Max rank'}</span>
          </div>
          <div className="oc-ladder">
            {RANKS.map((r, i) => <div key={r.short} data-reached={i <= index}><i /><span>{r.short}</span></div>)}
          </div>
        </div>
        <ul className="oc-drawer__list">
          {rows.map(r => {
            const hidden = r.secret && !r.done;
            const tail = r.done ? `✓ ${r.xp} XP` : r.need ? `${r.have}/${r.need} · +${r.xp}` : `+${r.xp} XP`;
            return (
              <li key={r.id} className="oc-obj" data-done={r.done} data-secret={hidden || undefined}>
                <span className="oc-obj__shape" aria-hidden="true" />
                <span className="oc-obj__title">{hidden ? 'Hidden objective' : r.title}<span className="sr-only">{r.done ? ', done' : ', not done'}</span></span>
                <span className="oc-obj__tail">{hidden ? '???' : tail}</span>
              </li>
            );
          })}
        </ul>
        <div className="oc-drawer__foot">
          <span>Progress saves on this device</span>
          {confirm
            ? <Button size="sm" variant="danger" onClick={() => { resetProgress(); setConfirm(false); }}>Erase all</Button>
            : <Button size="sm" variant="ghost" onClick={() => setConfirm(true)}>Reset</Button>}
        </div>
      </aside>
    </>
  );
}
