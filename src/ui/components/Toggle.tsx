import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { sfx } from '../fx/sound';
import { cx } from './statusVars';

export interface ToggleProps {
  on: boolean;
  onChange: (on: boolean) => void;
  /** Label when off. */
  children: ReactNode;
  /** Label when on (defaults to children + " ON"). */
  onLabel?: ReactNode;
  size?: 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
}

/** On/off switch as a pressed button: grey when off, Signal Blue when on. Pip goes circle → square. */
export function Toggle({ on, onChange, children, onLabel, size = 'md', className, ...aria }: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={aria['aria-label']}
      className={cx('oc-btn', 'oc-toggle', size === 'sm' && 'oc-btn--sm', className)}
      onClick={() => { sfx.play('tick'); onChange(!on); }}
    >
      <span className="oc-toggle__pip" aria-hidden="true" />
      <span>{on ? onLabel ?? <>{children} ON</> : children}</span>
    </button>
  );
}

export interface SegmentedProps<T extends string> {
  value: T;
  options: ReadonlyArray<{ value: T; label: ReactNode }>;
  onChange: (value: T) => void;
  label: string;
  /** solid = filled Signal Blue selection (scene controls); outline = raised + blue border (rank picker). */
  look?: 'outline' | 'solid';
  className?: string;
}

/** One-of-N picker (radiogroup). Arrow keys move the selection. */
export function Segmented<T extends string>({ value, options, onChange, label, look = 'outline', className }: SegmentedProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const pick = (i: number) => {
    const o = options[(i + options.length) % options.length];
    if (o.value !== value) { sfx.play('tick'); onChange(o.value); }
    refs.current[(i + options.length) % options.length]?.focus();
  };
  const onKey = (e: KeyboardEvent, i: number) => {
    const m = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (m) { e.preventDefault(); pick(i + m); }
  };
  return (
    <div role="radiogroup" aria-label={label} className={cx('oc-seg', look === 'solid' && 'oc-seg--solid', className)}>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={el => { refs.current[i] = el; }}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          className="oc-seg__opt"
          onClick={() => pick(i)}
          onKeyDown={e => onKey(e, i)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
