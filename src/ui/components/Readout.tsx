import type { ReactNode } from 'react';
import { STATUS, type Status } from '../tokens';
import { Panel } from './Panel';
import { StatusTag } from './StatusTag';
import { Bar } from './Bar';
import { cx } from './statusVars';

export interface ReadoutProps {
  /** NASA-style code shown before the plain name (EPS, O₂, RAD …). */
  code?: string;
  name: string;
  value: number;
  /** Fixed decimals — numbers never wobble. */
  decimals?: number;
  unit?: string;
  status?: Status;
  /** Bar scale. Omit `max` to hide the bar. */
  max?: number;
  ticks?: number[];
  /** Projected change, e.g. +4.4. Shown as ▲/▼ under TOMORROW. */
  delta?: number;
  /** Which direction is good: 1 = higher is better, -1 = lower is better. Colors the delta. */
  good?: 1 | -1;
  /** Status of the projected value; colors the delta when it worsens into caution/critical. */
  deltaStatus?: Status;
  deltaCaption?: string;
  note?: ReactNode;
  size?: 'md' | 'sm';
  live?: boolean;
  className?: string;
}

/** A resource readout: code + name + tag, big tabular value with unit, delta, bar with thresholds, note. */
export function Readout({ code, name, value, decimals = 0, unit, status = 'ok', max, ticks, delta, good = 1, deltaStatus, deltaCaption = 'TOMORROW', note, size = 'md', live, className }: ReadoutProps) {
  let deltaText: string | null = null, deltaColor = 'var(--oc-text-2)';
  if (delta !== undefined) {
    const arrow = Math.abs(delta) < 0.05 ? '=' : delta > 0 ? '▲' : '▼';
    deltaText = `${arrow} ${Math.abs(delta).toFixed(Math.max(1, decimals))}`;
    if (deltaStatus && deltaStatus !== 'ok' && delta * good < -0.05) deltaColor = STATUS[deltaStatus].fg;
  }
  return (
    <Panel status={status} className={cx('oc-readout', size === 'sm' && 'oc-readout--sm', className)}>
      <div className="oc-panel__head" style={{ alignItems: 'center' }}>
        <div className="oc-readout__id">
          {code && <span className="oc-readout__code">{code}</span>}
          <span className="oc-readout__name">{name}</span>
        </div>
        <StatusTag status={status} />
      </div>
      <div className="oc-readout__row">
        <div className="oc-readout__value">
          <span className="oc-readout__num">{value.toFixed(decimals)}</span>
          {unit && <span className="oc-readout__unit">{unit}</span>}
        </div>
        {deltaText && (
          <div className="oc-readout__delta">
            <span className="oc-readout__delta-cap">{deltaCaption}</span>
            <span className="oc-readout__delta-val" style={{ color: deltaColor }}>{deltaText}</span>
          </div>
        )}
      </div>
      {max !== undefined && <Bar value={value} max={max} status={status} ticks={ticks} live={live} />}
      {note && <div className="oc-readout__note">{note}</div>}
    </Panel>
  );
}
