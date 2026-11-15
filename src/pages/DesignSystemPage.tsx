import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import {
  Bar, Button, Panel, Readout, Segmented, Slider, StatusShape, StatusTag, StatusText, Toggle,
  SOUNDS, award, color, dur, ease, motionMs, sfx, space, statusOf, STATUS, useReducedMotion, useSettings,
  type SoundId, type Status,
} from '../ui';
import PageFrame from './PageFrame';

// Sections 01–08 of the Flight Panel design system, built only from src/ui primitives.

const label = 'oc-type-label text-oc-text-2';
const code = 'oc-type-code text-oc-text-3';

function SectionHead({ n, title, hint }: { n: string; title: string; hint: string }) {
  return (
    <div className="mt-16 flex flex-wrap items-end gap-6 border-b border-oc-line pb-4 first:mt-0">
      <span className="font-oc-data text-[64px] font-medium leading-[56px] text-oc-accent">{n}</span>
      <h2 className="oc-type-display m-0">{title}</h2>
      <span className="ml-auto max-w-[400px] text-sm leading-5 text-oc-text-3">{hint}</span>
    </div>
  );
}

/** Ticks every `ms` while motion is allowed; frozen at 0 under reduced motion. */
function useTick(ms: number, reduce: boolean) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (reduce) { setT(0); return; }
    const id = setInterval(() => setT(v => v + 1), ms);
    return () => clearInterval(id);
  }, [ms, reduce]);
  return t;
}

// ---------------------------------------------------------------- 01 Principles

const ORDER: Status[] = ['ok', 'warn', 'crit'];

function PrincipleCard({ id, title, text, children }: { id: string; title: string; text: string; children: ReactNode }) {
  return (
    <Panel size="lg">
      <div className="flex h-[120px] flex-col justify-center gap-4 rounded-oc-1 border border-oc-line bg-oc-inset p-4">{children}</div>
      <span className={code}>{id}</span>
      <span className="oc-type-title">{title}</span>
      <span className="oc-type-body text-oc-text-2">{text}</span>
    </Panel>
  );
}

function Principles({ reduce }: { reduce: boolean }) {
  const slow = useTick(2500, reduce), p2 = useTick(1400, reduce), p3 = useTick(140, reduce), p4 = useTick(80, reduce);
  const hot = [[5, 14, 21][slow % 3]];
  const st = ORDER[p2 % 3];
  const num = [11.11, 81.08, 17.71, 44.04, 10.01, 98.18, 71.11][p3 % 7].toFixed(2);
  const cause = 47 + 35 * Math.sin(p4 / 12);
  const effect = 47 + 35 * Math.sin(Math.max(0, p4 - 2) / 12);

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-2">
      <PrincipleCard id="P1" title="Color means attention" text="Nominal is quiet grey, so the one thing going wrong finds your eye before you read a word.">
        <div className="grid grid-cols-8 justify-items-center gap-y-4" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => hot.includes(i)
            ? <StatusShape key={i} status="warn" />
            : <StatusShape key={i} status="ok" color={color.lineStrong} />)}
        </div>
      </PrincipleCard>
      <PrincipleCard id="P2" title="Three cues, always" text="Shape, word and color escalate together. It still reads in grayscale and for colorblind students.">
        <div className="flex flex-col items-center gap-4">
          <StatusShape status={st} size={40} />
          <StatusTag status={st} blink={false} />
        </div>
      </PrincipleCard>
      <PrincipleCard id="P3" title="Numbers are instruments" text="Tabular mono digits, fixed decimals, a unit on every value. The top number shuffles sideways. The bottom one never does.">
        <div className="flex items-baseline justify-between"><StatusText status="warn">WOBBLES</StatusText><span className="font-oc-ui text-[32px] font-medium leading-10 text-oc-text-3">{num}</span></div>
        <div className="flex items-baseline justify-between"><StatusText status="ok">STEADY</StatusText><span className="oc-type-data-l">{num}</span></div>
      </PrincipleCard>
      <PrincipleCard id="P4" title="Motion shows cause" text="Nothing moves for decoration. The effect trails its cause by a beat, so students can see the link.">
        <div className="flex flex-col gap-1"><span className={code}>RAD slider · cause</span><Bar value={cause} size="md" fill={color.accent} /></div>
        <div className="flex flex-col gap-1"><span className={code}>Shield dome · effect +160 ms</span><Bar value={effect} size="md" /></div>
      </PrincipleCard>
    </div>
  );
}

type DrillPhase = 'idle' | 'wait' | 'go' | 'done';
const CELLS = 32, ROUNDS = 8;
const GRADES: Array<[number, string, Status]> = [[450, 'S', 'ok'], [600, 'A', 'ok'], [800, 'B', 'warn'], [Infinity, 'C', 'crit']];

function Drill() {
  const [phase, setPhase] = useState<DrillPhase>('idle');
  const [target, setTarget] = useState(-1);
  const [kind, setKind] = useState<'warn' | 'crit'>('warn');
  const [times, setTimes] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [flash, setFlash] = useState<{ i: number; ok: boolean } | null>(null);
  const [now, setNow] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const shownAt = useRef(0), last = useRef(-1), timer = useRef<number>(0), flashT = useRef<number>(0);
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(flashT.current); }, []);
  useEffect(() => {
    if (phase !== 'go') return;
    const id = setInterval(() => setNow(performance.now() - shownAt.current), 30);
    return () => clearInterval(id);
  }, [phase]);

  const queue = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      let t: number;
      do t = Math.floor(Math.random() * CELLS); while (t === last.current);
      last.current = t;
      setTarget(t); setKind(Math.random() < 0.5 ? 'warn' : 'crit'); shownAt.current = performance.now(); setPhase('go');
    }, 600 + Math.random() * 1200);
  }, []);
  const mark = (i: number, ok: boolean) => {
    clearTimeout(flashT.current); setFlash({ i, ok });
    flashT.current = window.setTimeout(() => setFlash(null), 280);
  };
  const start = () => {
    clearTimeout(timer.current);
    if (phase === 'wait' || phase === 'go') { setPhase('idle'); setTarget(-1); setTimes([]); setMisses(0); return; }
    setTimes([]); setMisses(0); setTarget(-1); last.current = -1; setPhase('wait'); queue();
  };
  const hit = (i: number) => {
    if (phase !== 'go' && phase !== 'wait') return;
    if (phase === 'go' && i === target) {
      const t = Math.round(performance.now() - shownAt.current), all = [...times, t];
      mark(i, true); setTimes(all); setTarget(-1);
      if (all.length >= ROUNDS) {
        const avg = Math.round(all.reduce((a, b) => a + b, 0) / all.length + misses * 100);
        setPhase('done'); setBest(b => (b === null ? avg : Math.min(b, avg)));
        award('ds-drill');
        if (avg < 450) award('ds-drill-s');
      } else { setPhase('wait'); queue(); }
    } else { mark(i, false); setMisses(m => m + 1); }
  };

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length + misses * 100) : null;
  const [, grade, gradeSt] = GRADES.find(g => (avg ?? 0) < g[0])!;
  const clock = phase === 'go' ? Math.min(9999, Math.round(now)) : times.length ? times[times.length - 1] : null;
  const phaseText = { idle: 'READY', wait: 'WATCH THE PANEL', go: 'HIT IT', done: 'DRILL COMPLETE' }[phase];

  return (
    <div className="flex flex-wrap gap-2">
      <Panel size="lg" className="min-w-0 flex-[1_1_480px]">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <span className={label}>Drill · spot the anomaly</span>
          <span className="text-sm text-oc-text-3">Rule P1 under pressure. Eight rounds. Hit the one that isn't grey.</span>
        </div>
        <Panel inset className="grid grid-cols-8 gap-1 p-2">
          {Array.from({ length: CELLS }, (_, i) => {
            const on = phase === 'go' && i === target, f = flash?.i === i ? flash : null;
            return (
              <button key={i} type="button" aria-label={on ? `Anomaly, ${STATUS[kind].name}` : 'Panel cell'} onPointerDown={() => hit(i)}
                className={`grid min-h-11 cursor-crosshair place-items-center rounded-oc-1 border p-0 transition-colors duration-[160ms] hover:bg-oc-raised ${f ? (f.ok ? 'border-oc-accent bg-oc-accent-track' : 'border-oc-critical bg-oc-critical-bg') : 'border-oc-line bg-oc-panel'}`}>
                <StatusShape status={on ? kind : 'ok'} size={on ? 16 : 8} color={on ? undefined : color.lineStrong} />
              </button>
            );
          })}
        </Panel>
      </Panel>
      <Panel size="lg" className="flex-[1_1_300px]">
        <span className={code}>{phaseText}</span>
        <div className="flex items-baseline gap-2">
          <span className="font-oc-data text-[64px] font-medium leading-[64px] tabular-nums">{clock === null ? '---' : String(clock).padStart(3, '0')}</span>
          <span className="font-oc-data text-base text-oc-text-3">MS</span>
        </div>
        <div className="grid grid-cols-8 gap-1">
          {Array.from({ length: ROUNDS }, (_, i) => <Bar key={i} size="thin" value={i < times.length ? 1 : 0} max={1} fill={color.accent} />)}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([['AVG MS', avg === null ? '---' : String(avg)], ['MISSES', String(misses)], ['BEST', best === null ? '---' : String(best)]] as const).map(([k, v]) => (
            <Panel key={k} inset className="gap-1 p-2"><span className={code}>{k}</span><span className="oc-type-data-l">{v}</span></Panel>
          ))}
        </div>
        <div className="flex min-h-[72px] flex-1 items-center gap-4">
          <span className="w-14 flex-none font-oc-label text-[72px] font-semibold leading-[64px]" style={{ color: phase === 'done' ? STATUS[gradeSt].fg : color.text3 }}>{phase === 'done' ? grade : '–'}</span>
          <span className="text-sm leading-5 text-oc-text-2 text-pretty">
            {phase === 'done' ? (grade === 'S' ? 'Anomaly found before you finished reading it.' : 'Faster means the panel did its job. Try again.') : 'Average includes a 100 ms penalty for every miss.'}
          </span>
        </div>
        <Button variant={phase === 'wait' || phase === 'go' ? 'secondary' : 'primary'} size="lg" block onClick={start}>
          {phase === 'wait' || phase === 'go' ? 'STOP DRILL' : phase === 'done' ? 'RUN AGAIN' : 'START DRILL'}
        </Button>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------- 02 Color

const lum = (h: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => { const A = lum(a), B = lum(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); };

type Swatch = [name: string, hex: string, token: string, use: string];
const GROUPS: Array<{ title: string; note: string; ratio: boolean; items: Swatch[] }> = [
  { title: 'SURFACES', note: 'Neutral, very slightly cool. No gradients, no transparency on cards.', ratio: false, items: [
    ['Void', color.bgVoid, '--oc-bg-void', 'Page background, Moon sky'], ['Panel', color.bgPanel, '--oc-bg-panel', 'Every instrument panel'],
    ['Raised', color.bgRaised, '--oc-bg-raised', 'Buttons, inactive controls'], ['Inset', color.bgInset, '--oc-bg-inset', 'Rails and bar tracks'],
    ['Line', color.line, '--oc-line', 'Panel borders'], ['Line strong', color.lineStrong, '--oc-line-strong', 'Control borders'] ] },
  { title: 'TEXT', note: 'Three steps, all above 4.5:1 on Panel.', ratio: true, items: [
    ['Text 1', color.text1, '--oc-text-1', 'Values, headings'], ['Text 2', color.text2, '--oc-text-2', 'Labels, body, nominal'], ['Text 3', color.text3, '--oc-text-3', 'Codes, units, hints'] ] },
  { title: 'SIGNAL', note: 'The only colors that mean anything.', ratio: true, items: [
    ['Signal Blue', color.accent, '--oc-accent', 'Interactive only: sliders, Run Day, focus'], ['Caution', color.caution, '--oc-caution', 'Drifting toward a limit'],
    ['Critical', color.critical, '--oc-critical', 'Limit crossed, act now'], ['Accent track', color.accentTrack, '--oc-accent-track', 'Progress behind accent'],
    ['Caution bg', color.cautionBg, '--oc-caution-bg', 'Caution tag fill'], ['Accent ink', color.accentInk, '--oc-accent-ink', 'Text on Signal Blue'] ] },
  { title: 'SCENE', note: '3D viewport only. Never UI chrome.', ratio: false, items: [
    ['Moon regolith', color.sceneMoon, '--oc-scene-moon', 'Lunar south pole'], ['Mars regolith', color.sceneMars, '--oc-scene-mars', 'Gale Crater'], ['Mars sky', color.sceneMarsSky, '—', 'Mars background, fog'] ] },
];

function ColorSection() {
  const [toast, setToast] = useState('');
  const t = useRef<number>(0);
  useEffect(() => () => clearTimeout(t.current), []);
  const copy = (hex: string) => {
    navigator.clipboard?.writeText(hex).catch(() => {});
    award('ds-copy3', { key: hex });
    setToast(`Copied ${hex}`); clearTimeout(t.current); t.current = window.setTimeout(() => setToast(''), 1600);
  };
  return (
    <>
      <Panel size="lg">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <span className={label}>Signal budget · share of a typical screen</span>
          <span className="text-sm text-oc-text-3">If more than a tenth of the screen is colored, something is wrong with the design or the mission.</span>
        </div>
        <div className="flex h-10 gap-0.5" role="img" aria-label="Neutrals 91 percent, Signal Blue 6, Caution 2, Critical 1">
          <div className="flex items-center overflow-hidden whitespace-nowrap bg-oc-line pl-4 font-oc-data text-xs text-oc-text-2" style={{ width: '91%' }}>NEUTRALS 91%</div>
          <div className="bg-oc-accent" style={{ width: '6%' }} /><div className="bg-oc-caution" style={{ width: '2%' }} /><div className="bg-oc-critical" style={{ width: '1%' }} />
        </div>
        <div className="flex flex-wrap gap-6 font-oc-data text-xs text-oc-text-2">
          <span>■ SIGNAL BLUE 6% · YOU CAN TOUCH THIS</span><span className="text-oc-caution">▲ CAUTION 2%</span><span className="text-oc-critical">◆ CRITICAL 1%</span>
        </div>
      </Panel>
      {GROUPS.map(g => (
        <section key={g.title} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline gap-4"><span className={label}>{g.title}</span><span className="text-sm text-oc-text-3">{g.note}</span></div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2">
            {g.items.map(([name, hex, token, use]) => {
              const r = contrast(hex, color.bgPanel);
              return (
                <button key={token + name} type="button" onClick={() => copy(hex)} aria-label={`Copy ${name} ${hex}`}
                  className="flex flex-col overflow-hidden rounded-oc-2 border border-oc-line bg-oc-panel p-0 text-left text-oc-text-1 transition-colors duration-[160ms] hover:border-oc-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oc-accent">
                  <div className="h-[72px] w-full border-b border-oc-line" style={{ background: hex }} />
                  <div className="flex w-full flex-col gap-1 p-4">
                    <div className="flex justify-between gap-2"><span className="font-semibold">{name}</span><span className="oc-type-data-s text-oc-text-2">{hex}</span></div>
                    <span className="font-oc-data text-xs text-oc-text-3">{token}</span>
                    <span className="text-sm leading-5 text-oc-text-2">{use}</span>
                    <span className={`font-oc-data text-xs ${g.ratio && r < 4.5 ? 'text-oc-caution' : 'text-oc-text-3'}`}>{g.ratio ? `${r.toFixed(1)}:1 · ${r >= 4.5 ? 'AA TEXT' : 'NON-TEXT'}` : 'SURFACE'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <div role="status" className="oc-type-data-s h-5 text-oc-accent">{toast}</div>
    </>
  );
}

// ---------------------------------------------------------------- 03 Status lab

const RULES: Array<[text: string, min: Status, spec: string]> = [
  ['Tag word and fill', 'ok', 'LABEL 14'], ['Shape: circle → triangle → diamond', 'ok', 'CLIP 24 PT'],
  ['Value and bar turn the signal color', 'warn', '240 MS'], ['Bar becomes hatched', 'crit', '4 PX STRIPE'],
  ['Panel border turns red', 'crit', '1 PX'], ['Tag blinks at 1 Hz', 'crit', 'STEPS(1)'],
];
const RANK: Record<Status, number> = { ok: 0, warn: 1, crit: 2 };
const THRESHOLD_ROWS = [
  ['Battery', '≥ 40 %', '20–39 %', '< 20 %'], ['Oxygen', '≥ 60 %', '35–59 %', '< 35 %'], ['Radiation dose', '< 50 mSv', '50–79 mSv', '≥ 80 mSv'],
  ['Food left', '≥ 4 days', '2–3.9 days', '< 2 days'], ['Crew health', '≥ 70', '40–69', '< 40'], ['Power budget', '≤ 100 MW', 'Slider below safe min', '> 100 MW · Run Day blocked'],
];

function StatusLab({ reduce }: { reduce: boolean }) {
  const [o2, setO2] = useState(72);
  const [auto, setAuto] = useState(true);
  const [gray, setGray] = useState(false);
  const tick = useTick(120, reduce || !auto);
  const v = auto && !reduce ? Math.round(55 + 40 * Math.cos((tick * 120) / 9000 * Math.PI * 2)) : o2;
  const value = Math.max(12, Math.min(96, v));
  const st = statusOf('oxygen', value);

  useEffect(() => {
    if (st === 'crit' && !auto) { award('ds-crit'); if (gray) award('ds-gray'); }
  }, [st, auto, gray]);

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-2 transition-[filter] duration-[480ms]" style={{ filter: gray ? 'grayscale(1)' : undefined }}>
        <div className="flex flex-col gap-4">
          <Readout code="O₂" name="Oxygen" value={value} unit="%" status={st} max={100} ticks={[35, 60]} note="4 crew breathe 3.4 kg a day" />
          <Panel size="lg">
            <Slider name="Oxygen level" code="O₂" unit="%" pad={false} min={0} max={100} value={value} safeMin={60}
              hint={st === 'crit' ? 'Below 35 %. Act now.' : st === 'warn' ? 'Below 60 %. Drifting toward the limit.' : 'Above 60 %. Nominal.'}
              onChange={n => { setAuto(false); setO2(n); }} />
            <div className="flex flex-wrap gap-2 pt-2">
              <Toggle on={auto} onChange={a => { setAuto(a); if (a) setO2(value); }} onLabel="Auto sweep ON">Auto sweep</Toggle>
              <Toggle on={gray} onChange={setGray} onLabel="Grayscale check ON">Grayscale check</Toggle>
            </div>
          </Panel>
        </div>
        <Panel size="flush" status={st}>
          <div className="flex flex-col gap-1 p-6 pb-4">
            <span className={code}>WHAT CHANGES AT</span>
            <span className="oc-type-display flex items-center gap-4" style={{ color: STATUS[st].value }}>
              <StatusShape status={st} size={32} blink /> {STATUS[st].label}
            </span>
          </div>
          {RULES.map(([text, min, spec]) => {
            const on = min === 'ok' || (st !== 'ok' && RANK[st] >= RANK[min]);
            return (
              <div key={text} className={`flex items-center gap-4 border-t border-oc-line px-6 py-4 transition-colors duration-[240ms] ${on && min !== 'ok' ? 'bg-oc-raised' : ''}`}>
                <StatusShape status={on ? st : 'ok'} size={10} color={on ? undefined : color.lineStrong} />
                <span className={`flex-1 text-base leading-5 ${on ? 'text-oc-text-1' : 'text-oc-text-3'}`}>{text}</span>
                <span className={code}>{spec}</span>
              </div>
            );
          })}
        </Panel>
      </div>
      <Panel size="flush" className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-[minmax(160px,1.4fr)_repeat(3,minmax(120px,1fr))] gap-4 border-b border-oc-line px-6 py-4">
          <span className={code}>THRESHOLD</span>
          {(['ok', 'warn', 'crit'] as Status[]).map(s => <StatusText key={s} status={s}><span className="oc-type-code">{STATUS[s].label}</span></StatusText>)}
        </div>
        {THRESHOLD_ROWS.map(([name, ...cells]) => (
          <div key={name} className="grid min-w-[640px] grid-cols-[minmax(160px,1.4fr)_repeat(3,minmax(120px,1fr))] gap-4 border-b border-oc-line px-6 py-4 last:border-b-0 hover:bg-oc-raised">
            <span className="font-semibold">{name}</span>
            {cells.map((c, i) => <span key={i} className={`oc-type-data-s ${['text-oc-text-2', 'text-oc-caution', 'text-oc-critical'][i]}`}>{c}</span>)}
          </div>
        ))}
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------- 04 Type

const TYPE_ROWS: Array<[name: string, spec: string, use: string, cls: string, sample: string]> = [
  ['Display XL', 'Barlow Cond 600 · 64/64', 'Landing headline', 'oc-type-display-xl', 'Ten days on the Moon'],
  ['Display', 'Barlow Cond 600 · 40/44', 'Report headlines', 'oc-type-display', 'Close call'],
  ['Title', 'Barlow 600 · 20/24', 'Card titles', 'oc-type-title', 'Shackleton crater rim'],
  ['Body', 'Barlow 400 · 16/24', 'Every sentence. The floor.', 'oc-type-body', 'Oxygen dropped. Life support needs more power.'],
  ['Label', 'Barlow Cond 600 · 14/16 · +.12em', 'Panel labels, buttons', 'oc-type-label', 'Power allocation'],
  ['Data XL', 'Plex Mono 500 · 40/40 · tnum', 'Primary readouts', 'oc-type-data-xl', '84.2 mSv'],
  ['Data L', 'Plex Mono 500 · 24/28 · tnum', 'Slider values, day', 'oc-type-data-l', '30 MW · DAY 04'],
  ['Data S', 'Plex Mono 400 · 14/20 · tnum', 'Deltas', 'oc-type-data-s', '▼ 6.8   ▲ 4.4   96 / 100 MW'],
  ['Code', 'Plex Mono 500 · 12/16 · +.08em', 'NASA codes, captions', 'oc-type-code', 'ECLSS · RAD · AGRI · EPS'],
];
const WRITING = [
  { k: 'SAY THE CAUSE, THEN THE FIX', yes: 'Oxygen dropped. Life support needs more power.', no: 'ECLSS O₂ partial pressure deficit detected.' },
  { k: 'PLAIN NAME FIRST', yes: 'Life support · ECLSS', no: 'ECLSS-ARS Subsystem 2' },
  { k: 'NUMBERS WITH UNITS', yes: '84.2 mSv of 100', no: '84.2 (high!!)' },
];

function TypeSection() {
  const [text, setText] = useState('');
  const t = text.trim();
  return (
    <>
      <Panel className="flex-row items-center gap-4 px-6 py-4">
        <label htmlFor="ds-tester" className={`flex-none ${label}`}>TYPE TESTER</label>
        <input id="ds-tester" value={text} placeholder="Type a message to the crew…"
          onChange={e => { setText(e.target.value); if (e.target.value.trim().length >= 3) award('ds-type'); }}
          className="h-12 min-w-0 flex-1 rounded-oc-1 border border-oc-line-strong bg-oc-inset px-4 text-base text-oc-text-1 outline-none focus:border-oc-accent" />
      </Panel>
      <Panel size="flush">
        {TYPE_ROWS.map(([name, spec, use, cls, sample]) => (
          <div key={name} className="flex flex-wrap items-center gap-x-6 gap-y-4 border-b border-oc-line p-6 last:border-b-0 hover:bg-oc-raised">
            <div className="flex flex-[0_0_200px] flex-col gap-1">
              <span className="font-semibold">{name}</span><span className="font-oc-data text-xs text-oc-text-3">{spec}</span><span className="text-sm leading-5 text-oc-text-2">{use}</span>
            </div>
            <div className={`min-w-0 flex-[1_1_320px] [overflow-wrap:anywhere] ${cls}`}>{t || sample}</div>
          </div>
        ))}
      </Panel>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-2">
        {WRITING.map(w => (
          <Panel key={w.k} size="lg">
            <span className={label}>{w.k}</span>
            <StatusText status="ok"><span className="text-base leading-6 text-oc-text-1">{w.yes}</span></StatusText>
            <StatusText status="crit"><span className="text-base leading-6 text-oc-text-3 line-through decoration-oc-critical">{w.no}</span></StatusText>
          </Panel>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- 05 Space

const SPACE_ROWS: Array<[token: string, px: number, use: string]> = [
  ['--oc-space-0-5', space.half, 'Inside dense controls only'],
  ['--oc-space-1', space.s1, 'Stack gap, icon to label'],
  ['--oc-space-2', space.s2, 'Panel padding'],
  ['--oc-space-3', space.s3, 'Large panel padding'],
  ['--oc-space-4', space.s4, 'Hero panel padding'],
  ['--oc-space-6', space.s6, 'Between page blocks'],
  ['--oc-space-8', space.s8, 'Section breaks'],
];

type Zone = [name: string, size: string, left: number, top: number, w: number, h: number, tone: string];
const LAYOUTS: Record<'desk' | 'tab', { w: number; h: number; note: string; zones: Zone[] }> = {
  desk: {
    w: 640, h: 360,
    note: 'At 1280 × 720 everything fits on one screen. Resources, habitat and power stay in view for the whole mission.',
    zones: [
      ['HEADER', '1264 × 56', 0.6, 1.1, 98.8, 7.8, color.accent], ['RESOURCES', '264', 0.6, 10.1, 20.6, 88.8, color.text2],
      ['3D HABITAT', 'FLUID', 21.9, 10.1, 48.7, 72.1, color.text3], ['CREW × 4', '112 H', 21.9, 83.3, 48.7, 15.6, color.text2], ['POWER', '360', 71.3, 10.1, 28.1, 88.8, color.accent],
    ],
  },
  tab: {
    w: 300, h: 510,
    note: 'At tablet width resources and habitat sit side by side. Power drops to full width underneath so the sliders stay thumb-sized.',
    zones: [
      ['HEADER', '752 × 56', 1, 0.6, 98, 4.3, color.accent], ['RESOURCES', '264', 1, 5.5, 34.4, 46, color.text2],
      ['3D HABITAT', 'FLUID', 36.5, 5.5, 62.5, 36.8, color.text3], ['CREW × 4', '112 H', 36.5, 42.9, 62.5, 8.6, color.text2], ['POWER', 'FULL WIDTH', 1, 52.1, 98, 47.2, color.accent],
    ],
  },
};

function SpaceSection({ reduce }: { reduce: boolean }) {
  const [xray, setXray] = useState(false);
  const [mode, setMode] = useState<'desk' | 'tab'>('desk');
  const L = LAYOUTS[mode];
  const fade = reduce ? undefined : `opacity ${dur.base}ms`;
  const move = reduce ? undefined : `${dur.slow}ms ${ease.inout}`;
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-2">
      <Panel size="lg">
        <div className="flex items-center justify-between gap-2">
          <span className={label}>X-ray a readout</span>
          <Toggle size="sm" on={xray} onChange={on => { setXray(on); if (on) award('ds-xray'); }} onLabel="X-ray ON">X-ray</Toggle>
        </div>
        <div className="relative">
          <Readout code="EPS" name="Battery" value={72} unit="%" status="ok" max={100} ticks={[20, 40]} note="Dark hours drain the battery" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ opacity: xray ? 0.18 : 0, transition: fade, backgroundImage: `linear-gradient(${color.accent} 1px, transparent 1px), linear-gradient(90deg, ${color.accent} 1px, transparent 1px)`, backgroundSize: `${space.s1}px ${space.s1}px` }} />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-oc-2 border-oc-accent" style={{ opacity: xray ? 0.25 : 0, transition: fade, borderWidth: space.s2, borderStyle: 'solid' }} />
        </div>
        <div className="flex flex-wrap gap-4 font-oc-data text-xs text-oc-text-3" style={{ opacity: xray ? 1 : 0.4, transition: fade }}>
          <span>PADDING 16</span><span>STACK GAP 8</span><span>TAG H 24</span><span>BAR H 8</span><span>RADIUS 4</span>
        </div>
        <div className="flex flex-col gap-2 border-t border-oc-line pt-2">
          {SPACE_ROWS.map(([token, px, use]) => (
            <div key={token} className="grid grid-cols-[120px_40px_1fr] items-center gap-4">
              <span className={code}>{token}</span>
              <span className="oc-type-data-s">{px}</span>
              <div className="flex min-w-0 items-center gap-4">
                <div className="h-4 flex-none bg-oc-accent" style={{ width: px }} />
                <span className="truncate text-sm text-oc-text-2">{use}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel size="lg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={label}>Game screen · responsive</span>
          <Segmented label="Layout" value={mode} onChange={m => { setMode(m); if (m === 'tab') award('ds-tablet'); }}
            options={[{ value: 'desk', label: '1280 × 720' }, { value: 'tab', label: '768 · TABLET' }]} />
        </div>
        <div className="flex min-h-[420px] flex-1 items-center justify-center">
          <div className="relative max-w-full border border-oc-line-strong bg-oc-void" style={{ width: L.w, height: L.h, transition: reduce ? undefined : `width ${move}, height ${move}` }}>
            {L.zones.map(([name, size, l, t, w, h, tone]) => (
              <div key={name} className="absolute flex flex-col gap-0.5 overflow-hidden border bg-oc-panel p-2 font-oc-data text-[10px] leading-3"
                style={{ left: l + '%', top: t + '%', width: w + '%', height: h + '%', borderColor: tone, color: tone, transition: reduce ? undefined : `left ${move}, top ${move}, width ${move}, height ${move}` }}>
                <span>{name}</span><span className="text-oc-text-3">{size}</span>
              </div>
            ))}
          </div>
        </div>
        <span className="text-sm leading-5 text-oc-text-2">{L.note}</span>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------- 06 Motion

const bez = (a: number, b: number, c: number, d: number) => `M0 96 C ${a * 96} ${96 - b * 96} ${c * 96} ${96 - d * 96} 96 0`;
type MotionRow = { key: keyof typeof dur; token: string; easing: string; path: string; use: string; alarm?: boolean };
const MOTION: MotionRow[] = [
  { key: 'instant', token: '--oc-dur-instant', easing: 'linear', path: 'M0 96 L96 0', use: 'Slider step, ± press' },
  { key: 'fast', token: '--oc-dur-fast', easing: ease.out, path: bez(0.2, 0, 0, 1), use: 'Hover, fills following a slider' },
  { key: 'base', token: '--oc-dur-base', easing: ease.out, path: bez(0.2, 0, 0, 1), use: 'Drawer, report card, state change' },
  { key: 'slow', token: '--oc-dur-slow', easing: ease.inout, path: bez(0.4, 0, 0.2, 1), use: 'Bars settling, entrance reveals' },
  { key: 'sim', token: '--oc-dur-sim', easing: ease.inout, path: bez(0.4, 0, 0.2, 1), use: 'Run Day: clock, numbers, sun' },
  { key: 'alarm', token: '--oc-dur-alarm', easing: 'steps(1, end)', path: 'M0 96 L96 96 L96 0', use: 'Critical tag blink. Nothing else.', alarm: true },
];

function MotionCard({ row, reduce, on, onFire }: { row: MotionRow; reduce: boolean; on: boolean; onFire: () => void }) {
  const xRef = useRef<HTMLDivElement>(null), yRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduce || !xRef.current || !yRef.current) return;
    const a = xRef.current.animate([{ left: '0%' }, { left: '100%' }], { duration: 2400, iterations: Infinity, easing: 'linear' });
    const b = yRef.current.animate([{ bottom: '0%' }, { bottom: '100%' }], { duration: 2400, iterations: Infinity, easing: row.easing });
    return () => { a.cancel(); b.cancel(); };
  }, [reduce, row.easing]);
  const ms = dur[row.key];
  return (
    <button type="button" onClick={onFire} aria-pressed={on} aria-label={`Fire the ${ms} millisecond curve`}
      className="flex flex-col gap-4 rounded-oc-2 border border-oc-line bg-oc-panel p-6 text-left text-oc-text-1 transition-colors duration-[160ms] hover:border-oc-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oc-accent">
      <div className="flex w-full items-baseline justify-between"><span className="oc-type-data-l">{ms}ms</span><span className="font-oc-data text-xs text-oc-text-3">{row.token}</span></div>
      <div className="flex w-full items-end gap-4">
        <div className="relative h-24 w-24 flex-none border-b border-l border-oc-line-strong" aria-hidden="true">
          <svg width="96" height="96" viewBox="0 0 96 96" className="absolute inset-0 overflow-visible"><path d={row.path} fill="none" stroke={color.accent} strokeWidth="2" /></svg>
          <div ref={xRef} className="absolute bottom-0 top-0 w-0" style={{ left: reduce ? '100%' : undefined }}>
            <div ref={yRef} className="absolute -left-[5px] h-2.5 w-2.5 translate-y-1/2 rounded-full bg-oc-text-1" style={{ bottom: reduce ? '100%' : undefined }} />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-oc-data text-xs text-oc-text-2 [overflow-wrap:anywhere]">{row.easing}</span>
          <span className="text-sm leading-5 text-oc-text-2">{row.use}</span>
        </div>
      </div>
      <div className="relative h-6 w-full rounded-oc-1 border border-oc-line bg-oc-inset" aria-hidden="true">
        <div className={`absolute top-[3px] h-4 w-4 rounded-[1px] ${row.alarm ? 'bg-oc-critical' : 'bg-oc-accent'}`}
          style={{ left: on ? 'calc(100% - 19px)' : '3px', transition: reduce ? 'none' : `left ${ms}ms ${row.easing}` }} />
      </div>
    </button>
  );
}

const PHASES: Array<[name: string, time: string, from: number, to: number]> = [
  ['COMMIT', '0–280 MS', 0, 0.1], ['SIMULATE 24 H', '280–2660 MS', 0.1, 0.95], ['SETTLE', '', 0.95, 1],
];
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const pad2 = (n: number) => String(n).padStart(2, '0');

function Digits({ text, tone, reduce }: { text: string; tone: string; reduce: boolean }) {
  return (
    <div role="img" aria-label={text} className="flex h-12 overflow-hidden font-oc-data text-[48px] font-medium leading-[48px]" style={{ color: tone }}>
      {text.split('').map((ch, i) => (
        <span key={i} aria-hidden="true" className="block h-12 w-[0.6em] overflow-hidden">
          <span className="flex flex-col" style={{ transform: `translateY(-${+ch * 48}px)`, transition: reduce ? 'none' : `transform ${dur.base}ms ${ease.inout}` }}>
            {Array.from({ length: 10 }, (_, n) => <span key={n} className="block h-12">{n}</span>)}
          </span>
        </span>
      ))}
    </div>
  );
}

function Choreography({ reduce }: { reduce: boolean }) {
  const [p, setP] = useState(0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0), drag = useRef(false);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const finish = (v: number) => { if (v >= 0.99) award('ds-scrub'); };
  const play = () => {
    cancelAnimationFrame(raf.current);
    const total = motionMs('sim', reduce), t0 = performance.now() - (p >= 1 ? 0 : p) * total;
    setPlaying(true);
    const step = (now: number) => {
      const v = Math.min(1, (now - t0) / total);
      setP(v);
      if (v < 1) raf.current = requestAnimationFrame(step);
      else { setPlaying(false); finish(1); }
    };
    raf.current = requestAnimationFrame(step);
  };
  const fromX = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect(), v = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    setP(v); finish(v);
  };
  const onKey = (e: KeyboardEvent) => {
    const m = ({ ArrowRight: 0.05, ArrowUp: 0.05, ArrowLeft: -0.05, ArrowDown: -0.05 } as Record<string, number>)[e.key];
    if (m) { e.preventDefault(); cancelAnimationFrame(raf.current); setPlaying(false); const v = Math.max(0, Math.min(1, p + m)); setP(v); finish(v); }
    else if (e.key === 'Home') { e.preventDefault(); setP(0); } else if (e.key === 'End') { e.preventDefault(); setP(1); finish(1); }
  };

  const k = easeInOut(Math.max(0, Math.min(1, (p - 0.1) / 0.85)));
  const bat = Math.round(72 + (38 - 72) * k), st = statusOf('battery', bat), hr = p * 24;
  const clock = `${pad2(Math.floor(hr))}:${pad2(Math.floor((hr % 1) * 60))}`;
  const sunX = 80 - 72 * Math.cos(p * Math.PI), sunY = 60 - 56 * Math.sin(p * Math.PI);
  const reported = p >= 1;

  return (
    <Panel size="hero">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1"><span className={label}>Run Day · choreography</span><span className="text-sm text-oc-text-2">Drag the playhead to scrub one simulated day.</span></div>
        <Button variant="primary" onClick={play} progress={playing ? p : undefined}>{playing ? 'PLAYING DAY' : p >= 1 ? 'REPLAY DAY' : 'PLAY DAY'}</Button>
      </div>
      <div role="slider" tabIndex={0} aria-label="Day playhead" aria-valuemin={0} aria-valuemax={24} aria-valuenow={Math.round(hr)} aria-valuetext={`Hour ${Math.floor(hr)} of 24`}
        className="relative h-16 cursor-ew-resize touch-none rounded-oc-1 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oc-accent"
        onKeyDown={onKey}
        onPointerDown={e => { cancelAnimationFrame(raf.current); setPlaying(false); drag.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); fromX(e); }}
        onPointerMove={e => { if (drag.current) fromX(e); }} onPointerUp={() => { drag.current = false; }} onPointerCancel={() => { drag.current = false; }}>
        <div className="absolute inset-x-0 top-4 flex h-10 gap-0.5">
          {PHASES.map(([name, time, a, b]) => {
            const on = (p >= a && p < b) || (b === 1 && p >= 1);
            return (
              <div key={name} className={`flex min-w-0 flex-col justify-center overflow-hidden border px-2 transition-colors duration-[160ms] ${on ? 'border-oc-accent bg-oc-accent-track' : 'border-oc-line bg-oc-inset'}`} style={{ flex: `${b - a} 1 0` }}>
                <span className={`whitespace-nowrap font-oc-label text-sm font-semibold tracking-[0.08em] ${on ? 'text-oc-text-1' : 'text-oc-text-3'}`}>{name}</span>
                <span className="whitespace-nowrap font-oc-data text-[10px] text-oc-text-3">{time}</span>
              </div>
            );
          })}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-px bg-oc-text-1" style={{ left: p * 100 + '%' }} />
        <div aria-hidden="true" className="pointer-events-none absolute top-0 h-4 w-4 -translate-x-1/2 rounded-oc-1 bg-oc-text-1" style={{ left: p * 100 + '%' }} />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2">
        <Panel inset status={st} className="gap-2">
          <div className="flex items-center justify-between"><span className={code}>EPS · BATTERY</span><StatusTag status={st} /></div>
          <div className="flex items-baseline gap-1"><Digits text={pad2(bat)} tone={STATUS[st].value} reduce={reduce} /><span className="font-oc-data text-base text-oc-text-3">%</span></div>
        </Panel>
        <Panel inset className="gap-2"><span className={code}>MISSION CLOCK</span><span className="font-oc-data text-[48px] font-medium leading-[48px] tabular-nums">{clock}</span></Panel>
        <Panel inset className="gap-2">
          <span className={code}>SUN · 3D SCENE</span>
          <svg viewBox="0 0 160 64" className="h-14 w-full overflow-visible" role="img" aria-label={`Sun at hour ${Math.floor(hr)}`}>
            <path d="M8 60 A72 56 0 0 1 152 60" fill="none" stroke={color.lineStrong} strokeDasharray="3 3" />
            <line x1="0" y1="60" x2="160" y2="60" stroke={color.lineStrong} />
            <circle cx={sunX} cy={sunY} r="6" fill={color.text1} />
          </svg>
        </Panel>
        <Panel inset className="gap-2">
          <span className={code}>REPORT CARD</span>
          <div className="flex flex-1 items-center" style={{ opacity: reported ? 1 : 0, transform: reported ? 'none' : 'translateY(8px)', transition: reduce ? 'none' : `opacity ${dur.base}ms, transform ${dur.base}ms ${ease.out}` }}>
            <StatusText status="warn"><span className="text-base leading-5 text-oc-text-1">Dark hours drained the battery.</span></StatusText>
          </div>
        </Panel>
      </div>
    </Panel>
  );
}

function MotionSection({ reduce }: { reduce: boolean }) {
  const [fired, setFired] = useState<Record<number, boolean>>({});
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-2">
        {MOTION.map((row, i) => (
          <MotionCard key={row.key} row={row} reduce={reduce} on={!!fired[i]}
            onFire={() => { setFired(f => ({ ...f, [i]: !f[i] })); award('ds-fire6', { key: String(i) }); }} />
        ))}
      </div>
      <Choreography reduce={reduce} />
    </>
  );
}

// ---------------------------------------------------------------- 07 Sound

function SoundSection({ reduce }: { reduce: boolean }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState<SoundId | null>(null);
  const { sfx: audible } = useSettings();

  useEffect(() => {
    let raf = 0, buf: Uint8Array<ArrayBuffer> | null = null;
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const np = sfx.nowPlaying();
      setPlaying(prev => (prev === np ? prev : np));
      const c = cv.current; if (!c) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight;
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      const g = c.getContext('2d'); if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      g.strokeStyle = color.line; g.lineWidth = 1;
      for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h); g.stroke(); }
      for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(w, y + 0.5); g.stroke(); }
      g.strokeStyle = color.accent; g.lineWidth = 2; g.beginPath();
      const an = sfx.getAnalyser();
      if (an && np) {
        if (!buf || buf.length !== an.fftSize) buf = new Uint8Array(an.fftSize);
        an.getByteTimeDomainData(buf);
        for (let i = 0; i < buf.length; i++) { const x = (i / buf.length) * w, y = h / 2 + ((buf[i] - 128) / 128) * h * 0.42; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      } else {
        for (let x = 0; x <= w; x += 4) { const y = h / 2 + (reduce ? 0 : Math.sin(x / 40 + t / 600) * 1.5); if (x) g.lineTo(x, y); else g.moveTo(x, y); }
      }
      g.stroke();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const play = (id: SoundId) => { sfx.play(id, { force: true }); award('ds-sounds6', { key: id }); };
  return (
    <>
      {!audible && <StatusText status="warn">Sound is switched off in Settings. These previews still play.</StatusText>}
      <Panel size="flush" inset className="relative h-40 overflow-hidden">
        <canvas ref={cv} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
        <span className={`absolute left-4 top-4 ${code}`}>OSCILLOSCOPE · {playing ? playing.toUpperCase() : 'IDLE'}</span>
      </Panel>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-2">
        {SOUNDS.map(s => {
          const on = playing === s.id;
          return (
            <button key={s.id} type="button" onClick={() => play(s.id)} aria-label={`Play ${s.name}`}
              className={`flex items-center gap-4 rounded-oc-2 border bg-oc-panel p-4 text-left text-oc-text-1 transition-colors duration-[160ms] hover:border-oc-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oc-accent ${on ? 'border-oc-accent' : 'border-oc-line'}`}>
              <span className={`grid h-12 w-12 flex-none place-items-center rounded-oc-1 transition-colors duration-[160ms] ${on ? 'bg-oc-accent' : 'bg-oc-raised'}`}>
                <span className={`block h-4 w-4 ${on ? 'bg-oc-accent-ink' : 'bg-oc-text-1'}`} style={{ clipPath: 'polygon(20% 0,100% 50%,20% 100%)' }} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex justify-between gap-2"><span className="font-semibold">{s.name}</span><span className="font-oc-data text-xs text-oc-text-3">sfx.{s.id}</span></span>
                <span className="font-oc-data text-xs text-oc-text-2">{s.spec}</span>
                <span className="text-sm leading-5 text-oc-text-3">{s.use}</span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- 08 Component bench

interface BenchState { o2: number; hp: number; delta: number; used: number[]; msg: string; fc: [string, string]; btn: [string, string] }
const BENCH: Record<Status, BenchState> = {
  ok: { o2: 88, hp: 96, delta: 2.8, used: [30, 18, 22, 26], msg: '4 MW unassigned. Unused power is wasted.', fc: ['DAY 02 FORECAST', 'Clear, steady sunlight'], btn: ['RUN DAY 2', '96 / 100 MW'] },
  warn: { o2: 52, hp: 46, delta: -5.6, used: [26, 10, 32, 32], msg: 'RAD below safe minimum of 14 MW.', fc: ['DAY 06 FORECAST', 'Solar flare likely'], btn: ['RUN DAY 6', '100 / 100 MW'] },
  crit: { o2: 24, hp: 31, delta: -8.4, used: [34, 30, 20, 22], msg: 'Over budget by 6 MW. Lower a slider.', fc: ['DAY 08 FORECAST', 'Near-darkness at the pole'], btn: ['OVER BUDGET', 'CUT 6 MW'] },
};
const CYCLE: Status[] = ['ok', 'warn', 'crit'];

function BenchSection({ reduce }: { reduce: boolean }) {
  const [mode, setMode] = useState<Status>('ok');
  const [auto, setAuto] = useState(true);
  const tick = useTick(2400, reduce || !auto);
  const st: Status = auto && !reduce ? CYCLE[tick % 3] : mode;
  const B = BENCH[st];
  const used = B.used.reduce((a, b) => a + b, 0), rem = 100 - used;
  const fcSt: Status = st === 'ok' ? 'ok' : 'warn';

  return (
    <>
      <Panel className="flex-row flex-wrap items-center gap-4">
        <span className={label}>Mission state</span>
        <Segmented<Status> label="Mission state" value={st}
          onChange={s => { setAuto(false); setMode(s); if (s === 'crit') award('ds-bench'); }}
          options={CYCLE.map(s => ({ value: s, label: <span className="inline-flex items-center gap-2"><StatusShape status={s} />{STATUS[s].label}</span> }))} />
        <Toggle className="ml-auto" on={auto} onChange={a => { setAuto(a); if (!a) setMode(st); }} onLabel="Auto cycle ON">Auto cycle</Toggle>
      </Panel>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-2">
        <Readout code="O₂" name="Oxygen" value={B.o2} unit="%" status={st} max={100} ticks={[35, 60]} delta={B.delta} deltaStatus={st} note="4 crew breathe 3.4 kg a day" />
        <Panel status={st}>
          <div className="flex flex-col"><span className="font-semibold leading-5">Dr. Chen</span><span className={code}>MEDIC</span></div>
          <div className="flex items-baseline justify-between">
            <StatusText status={st} blink><span className="text-sm font-medium">{STATUS[st].word}</span></StatusText>
            <span className="font-oc-data text-xl font-medium tabular-nums" style={{ color: STATUS[st].value }}>{B.hp}</span>
          </div>
          <Bar size="thin" value={B.hp} status={st} label="Dr. Chen health" />
          <div className="flex flex-col gap-2 border-t border-oc-line pt-2">
            <span className={code}>{B.fc[0]}</span>
            <StatusText status={fcSt}><span className="text-base font-medium">{B.fc[1]}</span></StatusText>
          </div>
        </Panel>
        <Panel className="gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-base text-oc-text-2">Power left to assign</span>
            <span className="flex items-baseline gap-1">
              <span className="oc-type-data-xl" style={{ color: st === 'crit' ? STATUS.crit.value : undefined }}>{(rem < 0 ? '−' : '') + pad2(Math.abs(rem))}</span>
              <span className="font-oc-data text-base text-oc-text-3">MW</span>
            </span>
          </div>
          <Bar size="thick" value={used} max={Math.max(100, used)} status={st === 'crit' ? 'crit' : 'ok'} fill={st === 'crit' ? undefined : st === 'warn' ? color.caution : color.accent} ticks={st === 'crit' ? [100] : undefined} label="Power assigned" />
          <StatusText status={st}><span className="text-sm">{B.msg}</span></StatusText>
          <Button size="lg" block variant={st === 'crit' ? 'danger' : 'primary'} disabled={st === 'crit'} right={B.btn[1]} className="mt-2">{B.btn[0]}</Button>
        </Panel>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Page

const TABS = [['p', '01 Principles'], ['c', '02 Color'], ['s', '03 Status'], ['t', '04 Type'], ['sp', '05 Space'], ['m', '06 Motion'], ['so', '07 Sound'], ['b', '08 Components']] as const;

export default function DesignSystemPage() {
  const reduce = useReducedMotion();
  const [jump, setJump] = useState<string>('p');
  const go = (id: string) => {
    setJump(id);
    document.getElementById(`ds-${id}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };
  return (
    <PageFrame eyebrow="DESIGN SYSTEM · FLIGHT PANEL v3 · NASA SPACE APPS 2026" title="Flight Panel"
      lead="The visual language of Outpost Commander. A flat instrument panel where color means trouble, numbers never wobble, and everything that moves is telling you why.">
      <div className="overflow-x-auto"><Segmented label="Jump to section" value={jump} onChange={go} options={TABS.map(([value, l]) => ({ value, label: l }))} /></div>
      <section id="ds-p" className="flex scroll-mt-24 flex-col gap-6">
        <SectionHead n="01" title="Four rules of the panel" hint="Every card below is running the rule it describes. Then prove you can read it." />
        <Principles reduce={reduce} />
        <Drill />
      </section>
      <section id="ds-c" className="flex scroll-mt-24 flex-col gap-6">
        <SectionHead n="02" title="Color" hint="Click any swatch to copy it. Contrast is measured live against Panel." />
        <ColorSection />
      </section>
      <section id="ds-s" className="flex scroll-mt-24 flex-col gap-6">
        <SectionHead n="03" title="Status lab" hint="Drag the oxygen level. Then switch on the grayscale check and do it again." />
        <StatusLab reduce={reduce} />
      </section>
      <section id="ds-t" className="flex scroll-mt-24 flex-col gap-6">
        <SectionHead n="04" title="Typography" hint="Barlow for words, Barlow Condensed for labels, IBM Plex Mono for every number." />
        <TypeSection />
      </section>
      <section id="ds-sp" className="flex scroll-mt-24 flex-col gap-6">
        <SectionHead n="05" title="Space and layout" hint="8px grid. 4px only inside dense controls. 1px borders, 4px panel radius, no shadows." />
        <SpaceSection reduce={reduce} />
      </section>
      <section id="ds-m" className="flex scroll-mt-24 flex-col gap-6">
        <SectionHead n="06" title="Motion" hint="Curves are drawn slowed down. The block underneath moves at the real speed. Tap a card to fire it." />
        <MotionSection reduce={reduce} />
      </section>
      <section id="ds-so" className="flex scroll-mt-24 flex-col gap-6">
        <SectionHead n="07" title="Sound" hint="Synthesised live with Web Audio. No files, works offline. Turn your volume on." />
        <SoundSection reduce={reduce} />
      </section>
      <section id="ds-b" className="flex scroll-mt-24 flex-col gap-6">
        <SectionHead n="08" title="Component bench" hint="One switch drives every component, the way one bad day ripples through the whole panel." />
        <BenchSection reduce={reduce} />
      </section>
    </PageFrame>
  );
}
