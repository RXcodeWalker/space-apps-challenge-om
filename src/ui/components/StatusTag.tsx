import type { CSSProperties, ReactNode } from 'react';
import { STATUS, type Status } from '../tokens';
import { useReducedMotion } from '../hooks';
import { cx, statusVars } from './statusVars';

/**
 * The status shape on its own: circle (nominal) → triangle (caution) → diamond (critical).
 * Always pair it with a word somewhere nearby — shape + word + color is the rule.
 */
export function StatusShape({ status, size = 10, color, blink, className, style }: { status: Status; size?: number; color?: string; blink?: boolean; className?: string; style?: CSSProperties }) {
  const reduce = useReducedMotion();
  const L = STATUS[status];
  return (
    <span
      aria-hidden="true"
      className={cx('oc-shape', blink && status === 'crit' && !reduce && 'oc-blink', className)}
      style={{ width: size, height: size, clipPath: L.shape, background: color ?? L.fg, ...style }}
    />
  );
}

export interface StatusTagProps {
  status: Status;
  /** Override the tag word (default NOMINAL / CAUTION / CRITICAL). */
  label?: string;
  size?: 'md' | 'lg';
  /** Critical tags blink at 1 Hz unless reduced motion is on. Default true. */
  blink?: boolean;
  className?: string;
}

/** The three-cue status tag: shape + word + color, escalating together. */
export function StatusTag({ status, label, size = 'md', blink = true, className }: StatusTagProps) {
  const reduce = useReducedMotion();
  const L = STATUS[status];
  return (
    <span
      role="status"
      className={cx('oc-tag', size === 'lg' && 'oc-tag--lg', blink && status === 'crit' && !reduce && 'oc-blink', className)}
      style={statusVars(status)}
    >
      <span className="oc-shape" aria-hidden="true" style={{ clipPath: L.shape, background: L.tagFg }} />
      <span>{label ?? L.label}</span>
    </span>
  );
}

/** Inline status line: shape + sentence in the signal color (forecast notes, slider hints, crew words). */
export function StatusText({ status, children, blink, className }: { status: Status; children: ReactNode; blink?: boolean; className?: string }) {
  return (
    <span className={cx('oc-status-inline', className)} style={statusVars(status)}>
      <StatusShape status={status} blink={blink} />
      <span>{children}</span>
    </span>
  );
}
