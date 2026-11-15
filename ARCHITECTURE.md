# Outpost Commander — UI Architecture (Flight Panel v3)

This is the guide for every session that builds screens on the new design system. Read it before touching UI code. If a rule here and existing code disagree, the rule wins for new work; old screens get migrated one at a time.

## Layout

```
src/ui/                    ← the design system. New UI imports ONLY from here (via src/ui/index.ts)
  theme.css                tokens as CSS vars (--oc-*), Tailwind @theme bridge, keyframes, .oc-type-* classes
  components.css           styles for every component (.oc-panel, .oc-btn, .oc-slider …)
  tokens.ts                TS mirror of the tokens + STATUS looks + THRESHOLDS + statusOf()
  hooks.ts                 useReducedMotion, useProgress, useSettings, useRank, prefersReducedMotion()
  components/              Panel, StatusShape/StatusTag/StatusText, Bar, Readout, Slider, Button, Toggle, Segmented, RankHud
  game/objectives.ts       RANKS ladder + OBJECTIVES registry (the only place objectives are defined)
  game/progress.ts         progress store: award(), settings, stats, saved mission, events
  game/dayReport.ts        buildDayReport(): turn result → cause-first report lines (pure)
  scene/planet.ts          3D globe for the landing screen; PLANET_OF maps environment id → world
  scene/habitat.ts         3D habitat diorama for the game screen (sliders drive dome, lights, lamps)
  fx/sound.ts              sfx engine (Web Audio, no files)
  fx/celebrate.ts          burst, achievementToast, promoteBanner, scramble, installCelebrations()
  fx/CelebrationLayer.tsx  mounted once in main.tsx
src/components, src/utils  legacy screens and helpers (pre-v3). Migrate, don't extend.
```

The v3 source design lives outside the repo (`Design System v3.dc.html`, `tokens.css`, `Game Screen.dc.html`, `Landing.dc.html`). `src/ui/theme.css` is the in-repo copy of `tokens.css`; when tokens change, update **both** `theme.css` and `tokens.ts`.

## The four rules of the panel

1. **Color means attention.** Nominal is grey. Only three signal colors exist: Signal Blue (`--oc-accent`, interactive only), Caution amber, Critical red. Never use color for decoration. No gradients, no shadows, no glow, no transparency on cards.
2. **Three cues, always.** Status is shape + word + color together: circle/NOMINAL/grey → triangle/CAUTION/amber → diamond/CRITICAL/red. Use `StatusTag`, `StatusText` or `StatusShape` + a word. Never show status by color alone.
3. **Numbers are instruments.** Every number uses IBM Plex Mono with `tabular-nums`, a fixed number of decimals (`toFixed`) and a unit. Use `.oc-type-data-*` or `Readout`.
4. **Motion shows cause.** Nothing moves for decoration. The effect trails its cause by a beat. The only looping motion is the 1 Hz critical blink. Everything respects reduced motion.

## Tokens

- In CSS/JSX use `var(--oc-*)`, the `.oc-type-*` classes, or Tailwind utilities from the bridge: `bg-oc-panel`, `text-oc-text-2`, `border-oc-line`, `font-oc-data`, `rounded-oc-2`, `ease-oc-out`.
- In JS (Web Animations, canvas, three.js) import from `src/ui/tokens.ts`: `color`, `font`, `space`, `dur`, `ease`, `motionMs(key, reduce)`.
- Spacing is the 8px grid (`--oc-space-1..8`). 4px only inside dense controls. Panels: 1px border, 4px radius. Controls: 2px radius, min target 40px (44px on touch, handled by `--oc-target-min`).
- Type: Barlow for words, Barlow Condensed for labels (uppercase, +0.12em), IBM Plex Mono for every number and code. Fonts load from Google Fonts in `index.html`.
- Never hard-code a hex in a component. If a value is missing, add a token.

## Status

```ts
import { statusOf, STATUS, worstStatus } from '../ui';
const st = statusOf('oxygen', 52);   // 'warn'
STATUS[st].label                      // 'CAUTION'
```

`THRESHOLDS` in `tokens.ts` is the single table for battery, oxygen, dose, food and crew. Don't re-implement thresholds in screens or the engine — import them. Only `crit` lights up a panel border (`<Panel status="crit">`).

## Components

All are plain function components styled by `components.css`. Per-status colors are passed through CSS custom properties from `statusVars(status)`, so hover/focus/transition rules stay in CSS. Patterns to follow when adding a component:

- One file in `src/ui/components/`, one `.oc-<name>` class family in `components.css`, export it from `src/ui/index.ts`.
- Props are semantic (`status`, `value`, `variant`), never raw colors.
- Accessible by default: real `<button>`s, `role="slider"` with full keyboard support, `aria-disabled` (not `disabled`) so blocked buttons still explain themselves, visible `:focus-visible` rings.
- Interactive components play `sfx.play('tick')` themselves; screens don't need to.

| Component | Use |
| --- | --- |
| `Panel` | Every instrument panel. `size` md/lg/hero/flush, `inset`, `status`, optional `title`/`meta` header. |
| `StatusTag` / `StatusText` / `StatusShape` | The three-cue status in tag, inline-sentence and bare-shape form. Critical blinks unless reduced motion. |
| `Bar` | Level bar. `size` thin (crew), md (resource), thick (budget). `ticks` mark thresholds. `live` disables the settle transition while values animate per frame. |
| `Readout` | Resource card: code + name + tag, big value + unit, TOMORROW delta, bar, note. |
| `Slider` | Power slider: −/track/+, drag, arrows, PgUp/PgDn ±5, Home/End, `safeMin` marker that flips to caution. |
| `Button` | `variant` primary (one per view) / secondary / ghost / danger; `size` sm/md/lg/xl; `right` mono slot; `progress` 0–1 busy fill. |
| `Toggle` / `Segmented` | On/off pressed button; one-of-N radiogroup with arrow-key support. |
| `RankHud` | Header rank badge. Registers itself as the landing point for award bursts — put one in each page header. |

## Game state and saving

`src/ui/game/progress.ts` is a framework-free store (module state + listeners). React reads it with `useProgress()` / `useSettings()` / `useRank()`; non-React code calls the functions directly.

**Every page grants progress through one function:**

```ts
import { award } from '../ui';

award('first-day');                        // one-shot: pays out once, ever
award('both-worlds', { key: env });        // counted: completes after `need` distinct keys
award('smooth-day', { at: 'hud' });        // burst from the rank HUD instead of the last tap
```

- `award()` is idempotent and returns `true` only on the call that completes the objective. Call it freely at the moment the player does the thing; don't guard it.
- Objectives are defined **only** in `game/objectives.ts` (`OBJECTIVES`). `ObjectiveId` is derived from it, so a typo is a type error. To add one: add an entry with `title` (instruction), `unlock` (pop-up headline), `xp`, optional `need`.
- Ranks: Cadet 0 → Specialist 150 → Engineer 400 → Flight Director 750 → Commander 1100 XP. Keep total objective XP ≥ the top rank.
- Persistence: `localStorage['oc-progress-v1']` (versioned; bump the key and migrate if the shape changes). Syncs across tabs. Storage failures fall back to memory silently.
- `settings`: `celebrate` (full/subtle/off), `sfx`, `reduceMotion` (`null` = follow the OS). Change with `updateSettings()`.
- `stats` + `bumpStat()` for counters (missions started/completed, days run).
- Resume a mission: `saveMission(data)`, `loadMission()`, `clearMission()` (`localStorage['oc-mission-save-v1']`).
- `onProgressEvent()` emits `award`, `counted` and `promote` events for anything that wants to react (tickers, analytics).

## Celebrations and sound

`<CelebrationLayer />` is mounted once in `main.tsx`. It subscribes to progress events, so **pages never call effects for awards** — `award()` alone produces:

- `full`: shape burst at the last pointer position (or the `RankHud`), +XP float, HUD pulse, achievement pop-up, chime; promotion banner + victory arpeggio 900 ms later on rank-up.
- `subtle`: pop-up and chime only. `off`: silent bookkeeping.
- Reduced motion: no burst or slide/scramble; pop-ups and banner fade only.

The effect functions (`burst`, `achievementToast`, `promoteBanner`, `scramble`) are exported for one-off moments (e.g. mission-complete screen) — reuse them, don't write new confetti.

Sound: `sfx.play(id)` with `tick | commit | chime | caution | alarm | victory` (see `SOUNDS` for when each is used). It is silent until the first user gesture, when `settings.sfx` is false, or when the legacy global mute (`utils/soundEffects`) is on, so there is one mute switch for the whole app. Repeats are rate-limited per sound. `sfx.getAnalyser()` feeds oscilloscopes. Don't add audio files; synthesise.

## Motion

Durations: instant 80, fast 160 (hover, fills following a slider), base 240 (drawers, report cards, state changes), slow 480 (bars settling, reveals), sim 2800 (Run Day), alarm 1000 (critical blink). Easing: `--oc-ease-out` for things arriving, `--oc-ease-inout` for things settling. Under reduced motion `sim` → 600 ms and `alarm` → 0; use `motionMs()` in JS and check `useReducedMotion()` before any JS animation.

## Writing

Say the cause, then the fix ("Oxygen dropped. Life support needs more power."). Plain name first, NASA code second ("Life support · ECLSS"). Numbers always with units ("84.2 mSv of 100"). Sentence case for sentences, uppercase only in labels and tags.

## Checklist for a new or migrated screen

- [ ] Uses `src/ui` components and tokens; no new hex values, no Tailwind slate/emerald palette classes.
- [ ] Every status shows shape + word + color; thresholds come from `statusOf()`.
- [ ] Every number is mono, tabular, fixed decimals, with a unit.
- [ ] Player milestones call `award(id)`; new objectives added to `objectives.ts`.
- [ ] Keyboard and screen-reader usable; works with reduced motion and with sound off.
- [ ] `npm run build` passes (tsc strict, no unused locals).
