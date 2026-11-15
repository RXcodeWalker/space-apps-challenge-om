import type { CSSProperties } from 'react';
import { STATUS, type Status } from '../tokens';

/** CSS custom properties for a status. Components set these; components.css reads them. */
export function statusVars(status: Status): CSSProperties {
  const L = STATUS[status];
  return {
    '--oc-status-fg': L.fg,
    '--oc-status-value': L.value,
    '--oc-status-bar': L.bar,
    '--oc-status-tag-bg': L.tagBg,
    '--oc-status-tag-border': L.tagBorder,
    '--oc-status-tag-fg': L.tagFg,
    '--oc-panel-border': L.border,
  } as CSSProperties;
}

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');
