// ============================================================
// Flight Panel tokens — TypeScript mirror of src/ui/theme.css.
// Use these for values JS needs at runtime (Web Animations, canvas,
// three.js, computed styles). In JSX/CSS prefer var(--oc-*) or the
// .oc-* classes so a theme change lands in one place.
// ============================================================

export const color = {
  bgVoid: '#0A0C0D',
  bgPanel: '#111416',
  bgRaised: '#181C1F',
  bgRaisedHover: '#20262A',
  bgInset: '#0D1012',
  bgScene: '#050607',
  line: '#23292D',
  lineStrong: '#333B40',
  text1: '#ECEEEF',
  text2: '#A3ACB2',
  text3: '#7F8990',
  grip: '#6B757C',
  barNominal: '#C9CED1',
  accent: '#5BA8F5',
  accentHover: '#7DB9F7',
  accent2: '#8EC3F8',
  accentInk: '#06121F',
  accentTrack: '#1B3A57',
  caution: '#F2A73B',
  cautionBg: '#3D2A0E',
  critical: '#F0484E',
  criticalDark: '#9A2C30',
  criticalBg: '#3E1416',
  criticalInk: '#1A0607',
  sceneMoon: '#7F7E79',
  sceneMars: '#A0532F',
  sceneMarsSky: '#2E1C15',
} as const;

export const criticalHatch = `repeating-linear-gradient(-45deg, ${color.critical} 0 4px, ${color.criticalDark} 4px 8px)`;

export const font = {
  ui: "'Barlow', system-ui, sans-serif",
  label: "'Barlow Condensed', 'Barlow', sans-serif",
  data: "'IBM Plex Mono', ui-monospace, monospace",
} as const;

/** 8px grid. `half` (4px) only inside dense controls. */
export const space = { half: 4, s1: 8, s2: 16, s3: 24, s4: 32, s6: 48, s8: 64 } as const;
export const radius = { control: 2, panel: 4 } as const;

/** Durations in ms. `sim` and `alarm` shrink under reduced motion — use motionMs(). */
export const dur = { instant: 80, fast: 160, base: 240, slow: 480, sim: 2800, alarm: 1000 } as const;
export const ease = { out: 'cubic-bezier(.2,0,0,1)', inout: 'cubic-bezier(.4,0,.2,1)' } as const;
const REDUCED: Partial<Record<keyof typeof dur, number>> = { sim: 600, alarm: 0 };
export const motionMs = (key: keyof typeof dur, reduce: boolean) => (reduce && REDUCED[key] !== undefined ? REDUCED[key]! : dur[key]);

// ---------- Status: the three-cue system (shape + word + color) ----------

export type Status = 'ok' | 'warn' | 'crit';
export const STATUS_RANK: Record<Status, number> = { ok: 0, warn: 1, crit: 2 };

/** clip-path shapes. Circle → triangle → diamond escalate with the status. */
export const shape = {
  circle: 'circle(50% at 50% 50%)',
  triangle: 'polygon(50% 0,100% 100%,0 100%)',
  diamond: 'polygon(50% 0,100% 50%,50% 100%,0 50%)',
  square: 'inset(0 0 0 0)',
  dash: 'inset(0 4px)',
} as const;

export interface StatusLook {
  shape: string;
  /** Tag word, uppercase. */
  label: string;
  /** Sentence-case name. */
  name: string;
  /** Crew-style word. */
  word: string;
  /** Signal color for icons and words. */
  fg: string;
  tagBg: string;
  tagBorder: string;
  tagFg: string;
  /** Big number color. */
  value: string;
  /** Bar fill (may be a gradient). */
  bar: string;
  /** Panel border. Only critical lights the panel. */
  border: string;
  glyph: string;
}

export const STATUS: Record<Status, StatusLook> = {
  ok: { shape: shape.circle, label: 'NOMINAL', name: 'Nominal', word: 'Healthy', fg: color.text2, tagBg: 'transparent', tagBorder: color.lineStrong, tagFg: color.text2, value: color.text1, bar: color.barNominal, border: color.line, glyph: '○' },
  warn: { shape: shape.triangle, label: 'CAUTION', name: 'Caution', word: 'Strained', fg: color.caution, tagBg: color.cautionBg, tagBorder: color.caution, tagFg: color.caution, value: color.caution, bar: color.caution, border: color.line, glyph: '▲' },
  crit: { shape: shape.diamond, label: 'CRITICAL', name: 'Critical', word: 'Critical', fg: color.critical, tagBg: color.critical, tagBorder: color.critical, tagFg: color.criticalInk, value: color.critical, bar: criticalHatch, border: color.critical, glyph: '◆' },
};

/** Game thresholds from the v3 status lab. One table, every screen. */
export const THRESHOLDS = {
  battery: (v: number): Status => (v < 20 ? 'crit' : v < 40 ? 'warn' : 'ok'),
  oxygen: (v: number): Status => (v < 35 ? 'crit' : v < 60 ? 'warn' : 'ok'),
  dose: (v: number): Status => (v >= 80 ? 'crit' : v >= 50 ? 'warn' : 'ok'),
  food: (v: number): Status => (v < 2 ? 'crit' : v < 4 ? 'warn' : 'ok'),
  crew: (v: number): Status => (v < 40 ? 'crit' : v < 70 ? 'warn' : 'ok'),
} as const;
export type Metric = keyof typeof THRESHOLDS;
export const statusOf = (metric: Metric, value: number): Status => THRESHOLDS[metric](value);
export const worstStatus = (...s: Status[]): Status => s.reduce<Status>((a, b) => (STATUS_RANK[b] > STATUS_RANK[a] ? b : a), 'ok');
