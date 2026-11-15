// ============================================================
// LandingPage — destination, rank, class code, begin mission.
// Composed from src/ui only. Replaces MissionBriefingScreen in the menu phase.
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { Button, Panel, Segmented, StatusShape, motionMs, useReducedMotion } from '../ui';
import { createPlanet, PLANET_OF, type PlanetView } from '../ui/scene/planet';
import { LUNAR_SOUTH_POLE, MARS_GALE_CRATER, EUROPA_UNDER_ICE, TITAN_HYDROCARBON, type MissionEnvironment } from '../data/nasaConstants';
import { HISTORIC_SCENARIOS, type HistoricScenario } from '../data/scenarioData';
import { DIFFICULTY_PRESETS, type DifficultyTier } from '../data/difficultyTiers';
import { generateMissionSeed, normalizeSeed } from '../utils/seededRandom';

const ENVS: MissionEnvironment[] = [LUNAR_SOUTH_POLE, MARS_GALE_CRATER, EUROPA_UNDER_ICE, TITAN_HYDROCARBON];
const PLANET = PLANET_OF;
const TIERS: DifficultyTier[] = ['cadet', 'commander', 'flight_director'];

export interface LandingPageProps {
  onStart: (env: MissionEnvironment, difficulty: DifficultyTier, seed: string, scenario?: HistoricScenario) => void;
  seed: string;
  onSeedChange: (seed: string) => void;
  initialEnvironmentId?: string;
  initialScenarioId?: string;
  initialDifficulty?: DifficultyTier;
  /** Reports the highlighted destination to the nav ticker. */
  onPreview?: (label: string) => void;
}

export default function LandingPage({ onStart, seed, onSeedChange, initialEnvironmentId, initialScenarioId, initialDifficulty = 'commander', onPreview }: LandingPageProps) {
  const reduce = useReducedMotion();
  const [envId, setEnvId] = useState(() => ENVS.find(e => e.id === initialEnvironmentId)?.id ?? LUNAR_SOUTH_POLE.id);
  const [scenarioId, setScenarioId] = useState<string>(initialScenarioId ?? 'none');
  const [tier, setTier] = useState<DifficultyTier>(initialDifficulty);
  const [launch, setLaunch] = useState(0);
  const viewRef = useRef<HTMLDivElement>(null);
  const planetRef = useRef<PlanetView | null>(null);
  const [glFailed, setGlFailed] = useState(false);

  const scenario = HISTORIC_SCENARIOS.find(s => s.id === scenarioId);
  const env = scenario ? scenario.baseEnvironment : ENVS.find(e => e.id === envId) ?? LUNAR_SOUTH_POLE;
  const preset = DIFFICULTY_PRESETS[tier];

  useEffect(() => {
    if (!viewRef.current) return;
    try { planetRef.current = createPlanet(viewRef.current, { env: PLANET[env.id], reduceMotion: reduce }); }
    catch { setGlFailed(true); }
    return () => { planetRef.current?.dispose(); planetRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { planetRef.current?.setEnv(PLANET[env.id]); onPreview?.(`DESTINATION ${env.name} · ${env.subtitle}`); }, [env, onPreview]);
  useEffect(() => { planetRef.current?.setReduceMotion(reduce); }, [reduce]);

  const begin = () => {
    if (launch) return;
    const dur = motionMs('slow', reduce) + (reduce ? 0 : 220);
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setLaunch(p);
      if (p < 1) requestAnimationFrame(step);
      else {
        const s = seed.trim() ? normalizeSeed(seed) : generateMissionSeed();
        onSeedChange(s);
        onStart(env, tier, s, scenario);
      }
    };
    requestAnimationFrame(step);
  };

  const facts: Array<[string, string, string]> = [
    ['GRAVITY', env.gravityG !== undefined ? env.gravityG.toFixed(2) : '—', 'g'],
    ['SURFACE TEMP', env.surfaceTempCelsius ?? '—', ''],
    ['RADIATION', env.baselineDailyRadiationMSv.toFixed(2), 'mSv/day'],
    ['POWER BUDGET', env.basePowerBudgetMW.toFixed(0), 'MW'],
  ];

  return (
    <div className="flex flex-1 flex-wrap gap-2 p-2 min-w-0">
      <Panel size="hero" className="flex-[1_1_520px] min-w-0 !gap-6 max-sm:!p-4">
        <div className="flex flex-col gap-4 animate-[oc-in_480ms_var(--oc-ease-out)_both]">
          <span className="oc-type-code text-oc-text-3">NASA SPACE APPS 2026 · 10-DAY MISSION</span>
          <h1 className="oc-type-display-xl m-0 max-w-[560px] text-balance max-sm:!text-[40px] max-sm:!leading-[44px]">Keep four astronauts alive for ten days.</h1>
          <p className="oc-type-body m-0 max-w-[480px] text-oc-text-2 text-pretty">Every day you get 100 MW of power. Split it between air, shielding, food and batteries. Then see what happens.</p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="oc-type-label text-oc-text-2" id="dest-label">01 · Destination</span>
          <div role="radiogroup" aria-labelledby="dest-label" className="grid grid-cols-2 gap-2">
            {ENVS.map(e => {
              const on = !scenario && e.id === env.id;
              return (
                <button
                  key={e.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => { setScenarioId('none'); setEnvId(e.id); }}
                  className={`flex flex-col gap-2 rounded-oc-2 border p-4 text-left text-oc-text-1 transition-colors duration-[160ms] hover:border-oc-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oc-accent ${on ? 'border-oc-accent bg-oc-raised' : 'border-oc-line-strong bg-oc-panel'}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="oc-type-title">{e.name}</span>
                    <span aria-hidden="true" className={`grid size-5 place-items-center rounded-full border-2 ${on ? 'border-oc-accent' : 'border-oc-line-strong'}`}>
                      <span className={`size-2 rounded-full ${on ? 'bg-oc-accent' : 'bg-transparent'}`} />
                    </span>
                  </span>
                  <span className="oc-type-code text-oc-text-3">{e.subtitle}</span>
                  <span className="line-clamp-2 text-sm leading-5 text-oc-text-2">{e.kidSummary}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="oc-type-label text-oc-text-2">02 · Rank</span>
          <Segmented
            label="Rank"
            value={tier}
            onChange={setTier}
            options={TIERS.map(t => ({ value: t, label: DIFFICULTY_PRESETS[t].title }))}
          />
          <span className="text-sm leading-4 text-oc-text-3">{preset.tagline}</span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="oc-type-label text-oc-text-2">03 · Scenario <span className="text-oc-text-3">(optional)</span></span>
          <Segmented
            label="Historic scenario"
            value={scenarioId}
            onChange={setScenarioId}
            options={[{ value: 'none', label: 'Standard' }, ...HISTORIC_SCENARIOS.map(s => ({ value: s.id as string, label: s.shortTitle }))]}
          />
          {scenario && <span className="text-sm leading-5 text-oc-text-2">{scenario.subtitle} · {scenario.yearOrEra}</span>}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-[200px] flex-1 flex-col gap-2">
            <span className="oc-type-label text-oc-text-2">Class code</span>
            <input
              value={seed}
              onChange={e => onSeedChange(e.target.value)}
              placeholder="e.g. ARTEMIS-4B"
              spellCheck={false}
              autoCapitalize="characters"
              className="oc-type-data-s h-12 rounded-oc-1 border border-oc-line-strong bg-oc-inset px-4 uppercase tracking-[0.08em] text-oc-text-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oc-accent"
            />
          </label>
          <Button onClick={() => onSeedChange(generateMissionSeed())}>New code</Button>
        </div>
        <span className="-mt-4 text-sm leading-5 text-oc-text-3">Same code, same space weather. Compare plans with your class.</span>

        <Button variant="primary" size="xl" block progress={launch || undefined} right={launch ? `${Math.round(launch * 100)}%` : `${env.name.toUpperCase()} · 10 DAYS`} onClick={begin}>
          {launch ? 'Preparing outpost' : 'Begin mission'}
        </Button>
      </Panel>

      <section aria-label="Destination preview" className="relative min-h-[420px] flex-[999_1_420px] overflow-hidden rounded-oc-2 border border-oc-line bg-oc-void">
        <div ref={viewRef} className="absolute inset-0" role="img" aria-label={`Rotating 3D model of ${env.name}`} />
        {glFailed && <div className="oc-type-code absolute inset-0 grid place-items-center text-oc-text-3">3D PREVIEW UNAVAILABLE</div>}
        <div className="pointer-events-none absolute left-6 right-6 top-6 flex flex-col gap-1">
          <span className="oc-type-code text-oc-text-3">YOUR OUTPOST</span>
          <span className="oc-type-display">{env.name}</span>
          <span className="flex items-center gap-2 text-sm leading-5 text-oc-text-2"><StatusShape status="ok" size={8} color="var(--oc-accent)" />{env.subtitle}</span>
        </div>
        <div className="absolute inset-x-4 bottom-4 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
          {facts.map(([k, v, u]) => (
            <Panel key={k} className="!gap-1">
              <span className="oc-type-code text-oc-text-3">{k}</span>
              <span className={`oc-type-data-l [overflow-wrap:anywhere] ${String(v).length > 7 ? '!text-[18px] !leading-6' : ''}`}>{v}{u && <span className="oc-type-data-s ml-1 text-oc-text-3">{u}</span>}</span>
            </Panel>
          ))}
        </div>
      </section>
    </div>
  );
}
