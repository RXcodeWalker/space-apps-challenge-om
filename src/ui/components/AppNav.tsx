import { RankHud } from './RankHud';
import { Button } from './Button';
import { useProgress, useRank } from '../hooks';
import { cx } from './statusVars';

export interface NavPage { id: string; label: string }

export interface AppNavProps {
  pages: ReadonlyArray<NavPage>;
  current: string;
  onNavigate: (id: string) => void;
  /** Opens the mission log drawer (the rank HUD is its trigger). */
  onOpenLog: () => void;
  /** Right-hand call to action, e.g. "Begin mission". Omit to hide. */
  cta?: { label: string; onClick: () => void };
  /** Extra live items for the ticker, e.g. the selected destination. */
  ticker?: ReadonlyArray<string>;
  /** Short context after the brand, e.g. "Junior astronaut mission trainer". */
  subtitle?: string;
}

/** Page header: brand, page chips, rank HUD (opens the mission log), one primary action, live ticker. */
export function AppNav({ pages, current, onNavigate, onOpenLog, cta, ticker = [], subtitle }: AppNavProps) {
  const { xp, rank, next, frac } = useRank();
  const { last } = useProgress();
  const items = [
    ...ticker,
    `RANK ${rank.name} · ${xp} XP`,
    next ? `${next.xp - xp} XP TO ${next.name}` : 'MAX RANK',
    last ? `LAST UNLOCK · ${last}` : 'NO OBJECTIVES CLEARED YET',
  ];
  return (
    <header className="oc-nav">
      <div className="oc-nav__bar">
        <button type="button" className="oc-nav__brand" onClick={() => onNavigate(pages[0].id)}>Outpost Commander</button>
        {subtitle && <span className="oc-nav__sub">{subtitle}</span>}
        <nav aria-label="Pages" className="oc-nav__chips">
          {pages.map((p, i) => (
            <button key={p.id} type="button" className={cx('oc-nav__chip')} aria-current={p.id === current ? 'page' : undefined} onClick={() => onNavigate(p.id)}>
              <span className="oc-nav__chip-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="oc-nav__chip-label">{p.label}</span>
              <i aria-hidden="true" />
            </button>
          ))}
        </nav>
        <div className="oc-nav__right">
          <RankHud onClick={onOpenLog} />
          {cta && <Button variant="primary" onClick={cta.onClick}>{cta.label}</Button>}
        </div>
      </div>
      <div className="oc-nav__prog" aria-hidden="true"><div style={{ width: frac * 100 + '%' }} /></div>
      <div className="oc-ticker" role="marquee" aria-label="Mission status">
        <div className="oc-ticker__track">
          {[...items, ...items].map((t, i) => <span key={i} className="oc-ticker__item" aria-hidden={i >= items.length || undefined}>{t}</span>)}
        </div>
      </div>
    </header>
  );
}
