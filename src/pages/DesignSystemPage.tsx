import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Bar, Button, Panel, Readout, Segmented, Slider, StatusShape, StatusTag, StatusText, Toggle,
  award, color, statusOf, STATUS, useReducedMotion, type Status,
} from '../ui';
import PageFrame from './PageFrame';

// Sections 01–04 of the Flight Panel design system, built only from src/ui primitives.

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

// ---------------------------------------------------------------- Page

const TABS = [['p', '01 Principles'], ['c', '02 Color'], ['s', '03 Status'], ['t', '04 Type']] as const;

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
      <Segmented label="Jump to section" value={jump} onChange={go} options={TABS.map(([value, l]) => ({ value, label: l }))} />
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
    </PageFrame>
  );
}
