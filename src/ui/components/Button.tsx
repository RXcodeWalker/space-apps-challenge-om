import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { sfx } from '../fx/sound';
import { cx } from './statusVars';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  /** primary = Signal Blue (one per view), secondary = raised grey, ghost = outline, danger = blocked/over-budget. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** sm 32, md 40 (default), lg 56 (Run Day), xl 64 (Begin Mission). lg/xl put label left and `right` right. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Square icon button (± on sliders). */
  icon?: boolean;
  block?: boolean;
  /** Mono text on the right of lg/xl buttons ("96 / 100 MW", a clock). */
  right?: ReactNode;
  /** 0–1. Shows the accent-track fill behind the label and switches to the busy look. */
  progress?: number;
  /** Disabled but still focusable and announced (aria-disabled), so the reason stays readable. */
  disabled?: boolean;
  /** Play the UI tick on press. Default true. */
  clickSound?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, block, right, progress, disabled, clickSound = true, className, children, onClick, type = 'button', ...rest },
  ref,
) {
  const busy = progress !== undefined && progress > 0 && progress < 1;
  return (
    <button
      ref={ref}
      type={type}
      aria-disabled={disabled || busy || undefined}
      className={cx('oc-btn', `oc-btn--${variant}`, size !== 'md' && `oc-btn--${size}`, icon && 'oc-btn--icon', block && 'oc-btn--block', busy && 'oc-btn--busy', className)}
      onClick={e => {
        if (disabled || busy) { e.preventDefault(); return; }
        if (clickSound) sfx.play('tick');
        onClick?.(e);
      }}
      {...rest}
    >
      {progress !== undefined && <span className="oc-btn__progress" style={{ width: Math.max(0, Math.min(1, progress)) * 100 + '%' }} />}
      <span className="oc-btn__label">{children}</span>
      {right !== undefined && <span className="oc-btn__right">{right}</span>}
    </button>
  );
});
