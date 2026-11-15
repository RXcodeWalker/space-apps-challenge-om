import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import type { Status } from '../tokens';
import { cx, statusVars } from './statusVars';

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Panel padding: md 16 (default), lg 24, hero 32, flush 0. */
  size?: 'md' | 'lg' | 'hero' | 'flush';
  /** Inset well (rails, nested readouts) instead of a top-level panel. */
  inset?: boolean;
  /** Only `crit` changes the panel itself (red border). */
  status?: Status;
  /** Optional header: a label title on the left, a code/meta on the right. */
  title?: ReactNode;
  meta?: ReactNode;
  as?: 'div' | 'section' | 'aside' | 'article';
}

/** The instrument panel. Flat, 1px border, 4px radius, no shadow. */
export function Panel({ size = 'md', inset, status, title, meta, as: Tag = 'div', className, style, children, ...rest }: PanelProps) {
  const vars: CSSProperties | undefined = status ? statusVars(status) : undefined;
  return (
    <Tag
      className={cx('oc-panel', size !== 'md' && `oc-panel--${size}`, inset && 'oc-panel--inset', className)}
      style={vars ? { ...vars, ...style } : style}
      {...rest}
    >
      {(title || meta) && (
        <div className="oc-panel__head">
          {title && <span className="oc-panel__title">{title}</span>}
          {meta && <span className="oc-panel__meta">{meta}</span>}
        </div>
      )}
      {children}
    </Tag>
  );
}
