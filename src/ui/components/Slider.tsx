import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { color, shape } from '../tokens';
import { sfx } from '../fx/sound';
import { cx } from './statusVars';

export interface SliderProps {
  name: string;
  /** NASA code shown before the name (ECLSS, RAD, AGRI, EPS). */
  code?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** Safe minimum. Below it the fill, value and hint turn caution. */
  safeMin?: number;
  /** What the subsystem does, shown in the hint when safe ("makes oxygen"). */
  does?: string;
  /** Override the hint line entirely. */
  hint?: string;
  disabled?: boolean;
  /** Zero-pad the value to 2 digits (power sliders). Default true. */
  pad?: boolean;
  className?: string;
}

/**
 * Power slider: − / track / + with drag, keyboard (arrows, PgUp/PgDn ±5, Home/End),
 * a safe-minimum marker and a tick sound on every step.
 */
export function Slider({ name, code, value, onChange, min = 0, max = 50, step = 1, unit = 'MW', safeMin, does, hint, disabled, pad = true, className }: SliderProps) {
  const [dragging, setDragging] = useState(false);
  const last = useRef(value);
  last.current = value;
  const below = safeMin !== undefined && value < safeMin;

  const set = (v: number) => {
    if (disabled) return;
    v = Math.max(min, Math.min(max, Math.round(v / step) * step));
    if (v === last.current) return;
    sfx.play('tick', { pitch: (v - min) / (max - min || 1) });
    last.current = v;
    onChange(v);
  };
  const fromX = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    set(min + Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (max - min));
  };
  const onKey = (e: KeyboardEvent) => {
    const m = ({ ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 5, PageDown: -5 } as Record<string, number>)[e.key];
    if (m) { e.preventDefault(); set(value + m * step); }
    else if (e.key === 'Home') { e.preventDefault(); set(min); }
    else if (e.key === 'End') { e.preventDefault(); set(max); }
  };

  const pct = ((value - min) / (max - min || 1)) * 100;
  const valStr = pad ? String(value).padStart(2, '0') : String(value);
  const hintText = hint ?? (safeMin === undefined ? '' : below ? `Below safe minimum of ${safeMin} ${unit}` : `Safe minimum ${safeMin} ${unit}${does ? ` · ${does}` : ''}`);
  const vars = {
    '--oc-slider-fill': below ? color.caution : color.accent,
    '--oc-slider-val': below ? color.caution : color.text1,
    '--oc-slider-hint': below ? color.caution : color.text3,
  } as CSSProperties;

  return (
    <div className={cx('oc-slider', disabled && 'oc-slider--disabled', dragging && 'oc-slider--dragging', className)} style={vars}>
      <div className="oc-slider__head">
        <div className="oc-readout__id">
          {code && <span className="oc-readout__code">{code}</span>}
          <span className="oc-readout__name">{name}</span>
        </div>
        <div className="oc-readout__value">
          <span className="oc-slider__val">{valStr}</span>
          {unit && <span className="oc-slider__unit">{unit}</span>}
        </div>
      </div>
      <div className="oc-slider__row">
        <button type="button" className="oc-btn oc-btn--icon" aria-label={`Lower ${name}`} aria-disabled={disabled || undefined} onClick={() => set(value - step)}>−</button>
        <div
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={name}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value} ${unit === 'MW' ? 'megawatts' : unit}${below ? ', below safe minimum' : ''}`}
          aria-disabled={disabled || undefined}
          className="oc-slider__track"
          onPointerDown={e => { if (disabled) return; e.currentTarget.setPointerCapture?.(e.pointerId); setDragging(true); fromX(e); }}
          onPointerMove={e => { if (dragging) fromX(e); }}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onKeyDown={onKey}
        >
          <div className="oc-slider__rail" />
          <div className="oc-slider__fill" style={{ width: pct + '%' }} />
          {safeMin !== undefined && <div className="oc-slider__min" style={{ left: ((safeMin - min) / (max - min || 1)) * 100 + '%' }} />}
          <div className="oc-slider__thumb" style={{ left: pct + '%' }} />
        </div>
        <button type="button" className="oc-btn oc-btn--icon" aria-label={`Raise ${name}`} aria-disabled={disabled || undefined} onClick={() => set(value + step)}>+</button>
      </div>
      {hintText && (
        <div className="oc-slider__hint">
          <span className="oc-shape" aria-hidden="true" style={{ clipPath: below ? shape.triangle : shape.dash, background: 'currentColor' }} />
          <span>{hintText}</span>
        </div>
      )}
    </div>
  );
}
