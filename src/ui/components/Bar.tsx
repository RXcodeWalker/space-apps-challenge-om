import { STATUS, type Status } from '../tokens';
import { cx, statusVars } from './statusVars';

export interface BarProps {
  value: number;
  max?: number;
  status?: Status;
  /** Threshold tick marks, in the same units as value. */
  ticks?: number[];
  /** thin = 4px crew bar, md = 8px resource bar, thick = 16px budget bar. */
  size?: 'thin' | 'md' | 'thick';
  /** Turn off the 480ms settle while a value is animating frame by frame (Run Day). */
  live?: boolean;
  /** Override the fill (e.g. accent for progress bars). */
  fill?: string;
  label?: string;
  className?: string;
}

/** Horizontal level bar. Nominal is pale grey, caution amber, critical hatched red. */
export function Bar({ value, max = 100, status = 'ok', ticks, size = 'md', live, fill, label, className }: BarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cx('oc-bar', size !== 'md' && `oc-bar--${size}`, live && 'oc-bar--live', className)}
      style={statusVars(status)}
      role={label ? 'meter' : undefined}
      aria-label={label}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? max : undefined}
      aria-valuenow={label ? value : undefined}
      aria-valuetext={label ? `${Math.round(value)} of ${max}, ${STATUS[status].name.toLowerCase()}` : undefined}
    >
      <div className="oc-bar__fill" style={{ width: pct + '%', background: fill }} />
      {ticks?.map(t => <div key={t} className="oc-bar__tick" style={{ left: (t / max) * 100 + '%' }} />)}
    </div>
  );
}
