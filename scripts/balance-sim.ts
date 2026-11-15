// ============================================================
// balance-sim.ts — headless difficulty balance simulator
//
// Plays every world × rank × fixed seed with a handful of simple
// player strategies, using the real engine (processTurn) and the
// real seeded incident schedule, and reports win rates plus the day
// and cause of each loss.
//
//   npx tsx scripts/balance-sim.ts            # table + target check (exit 1 if off-target)
//   npx tsx scripts/balance-sim.ts --report   # table only, never fails
//   npx tsx scripts/balance-sim.ts --json     # machine-readable summary
//   npx tsx scripts/balance-sim.ts --verbose  # also print the day report's loss explanation for sample losses
//   npx tsx scripts/balance-sim.ts --strategies minimums,default   # subset of strategies
//   npx tsx scripts/balance-sim.ts --set commander.deficitPenaltyMultiplier=1.2   # try a tuning value
//
// "Win" = the mission reached day 10 without a critical loss
// (mission_success or partial_success — both show "Mission complete").
// ============================================================
import {
  LUNAR_SOUTH_POLE,
  MARS_GALE_CRATER,
  EUROPA_UNDER_ICE,
  TITAN_HYDROCARBON,
  TOTAL_TURNS,
  type MissionEnvironment,
} from "../src/data/nasaConstants.ts";
import {
  createInitialGameState,
  processTurn,
  applyIncidentChoice,
  getDefaultAllocation,
  getEffectivePowerBudget,
  DIFFICULTY_PRESETS,
  type GameState,
  type PowerAllocation,
  type SubsystemId,
  type DifficultyTier,
  type TurnResult,
} from "../src/engine/simulationEngine.ts";
import * as Engine from "../src/engine/simulationEngine.ts";
import { getIncidentForSol, type IncidentCard, type IncidentChoice } from "../src/data/incidentCards.ts";
import { createSeededRNG } from "../src/utils/seededRandom.ts";

const argv = process.argv.slice(2);
const args = new Set(argv);
const argValues = (flag: string) => argv.flatMap((a, i) => (a === flag && argv[i + 1] ? [argv[i + 1]] : []));

// --set rank.key=value  (numbers only; e.g. --set cadet.baselinePowerDemands.lifeSupport=16)
for (const spec of argValues("--set")) {
  const [path, raw] = spec.split("=");
  const keys = path.split(".");
  let obj = DIFFICULTY_PRESETS as unknown as Record<string, unknown>;
  for (const k of keys.slice(0, -1)) obj = obj[k] as Record<string, unknown>;
  obj[keys[keys.length - 1]] = Number(raw);
}
const JSON_OUT = args.has("--json");
const REPORT_ONLY = args.has("--report") || JSON_OUT;
const VERBOSE = args.has("--verbose");

const WORLDS: MissionEnvironment[] = [LUNAR_SOUTH_POLE, MARS_GALE_CRATER, EUROPA_UNDER_ICE, TITAN_HYDROCARBON];
const RANKS: DifficultyTier[] = ["cadet", "commander", "flight_director"];
const SEEDS = Array.from({ length: 20 }, (_, i) => `BAL-${String(i + 1).padStart(2, "0")}`);
const IDS: SubsystemId[] = ["powerGrid", "lifeSupport", "radiationShielding", "foodProduction"];

// ------------------------------------------------------------
// Strategies
// ------------------------------------------------------------
export interface Strategy {
  id: string;
  label: string;
  allocate(state: GameState, budget: number): PowerAllocation;
  pickIncident(state: GameState, incident: IncidentCard): IncidentChoice;
}

const choicesOf = (card: IncidentCard) => card.choices.filter((c): c is IncidentChoice => !!c);

/** A cautious reading of a choice card: protect health, air and food; mild dislike of power cuts. */
function safetyValue(c: IncidentChoice): number {
  const e = c.effects;
  return (
    (e.lifeSupportHealthDelta ?? 0) +
    (e.shieldingHealthDelta ?? 0) +
    (e.powerGridHealthDelta ?? 0) +
    (e.oxygenBufferDelta ?? 0) +
    (e.foodDaysDelta ?? 0) * 4 +
    (e.moraleDelta ?? 0) * 0.3 -
    (e.radiationDeltaMSv ?? 0) * 3 +
    (e.powerDeltaMW ?? 0) * 0.8
  );
}
const safestChoice = (card: IncidentCard) =>
  choicesOf(card).reduce((best, c) => (safetyValue(c) > safetyValue(best) ? c : best));

function evenSplit(budget: number): PowerAllocation {
  const q = Math.round(budget * 0.25);
  return { powerGrid: q, lifeSupport: q, radiationShielding: q, foodProduction: Math.max(0, budget - 3 * q) };
}

/**
 * Sensible play: start every slider on its safe-minimum marker. Short day → take the missing
 * megawatts from whichever system looks healthiest; spare power → top up whichever looks worst.
 */
function minimumsFirst(state: GameState, budget: number): PowerAllocation {
  const base = DIFFICULTY_PRESETS[state.difficulty].baselinePowerDemands;
  const order: SubsystemId[] = ["lifeSupport", "radiationShielding", "foodProduction", "powerGrid"];
  const a: PowerAllocation = { ...base };
  // What the player sees on the meters (air = the lower of O₂ and scrubber health).
  const need = (id: SubsystemId) =>
    id === "lifeSupport"
      ? Math.min(state.crew.oxygenBufferPercent, state.subsystems.lifeSupport.health)
      : id === "foodProduction"
        ? Math.min(state.subsystems.foodProduction.health, state.crew.foodReserveDays * 12)
        : state.subsystems[id].health;
  let left = budget - IDS.reduce((t, id) => t + a[id], 0);
  while (left < 0) {
    // Health left after the cut, in "MW of slack": cut the system that can best afford it.
    const victim = order.filter((id) => a[id] > 0).sort((x, y) => need(y) - (base[y] - a[y]) * 3 - (need(x) - (base[x] - a[x]) * 3))[0];
    a[victim] -= 1;
    left += 1;
  }
  while (left > 0) {
    const room = order.filter((id) => a[id] < Math.floor(base[id] * 1.2));
    if (room.length === 0) break;
    room.sort((x, y) => need(x) - need(y));
    a[room[0]] += 1;
    left -= 1;
  }
  if (left > 0) a.lifeSupport += left;
  return a;
}

function outcomeValue(r: TurnResult): number {
  if (r.outcome === "critical_alert") return -1000 + r.missionScorePercent;
  const c = r.crew;
  const s = r.subsystems;
  // Greedy one-day lookahead: reward the score, but keep a margin on the things that end missions.
  const margin =
    Math.min(c.oxygenBufferPercent, 60) * 0.5 +
    Math.min(...IDS.map((id) => s[id].health), 50) * 0.5 +
    Math.min(c.foodReserveDays, 6) * 2 -
    (c.radiationExposureMSv / c.safeRadiationLimitMSv) * 20;
  return r.missionScorePercent + margin;
}

/** One-day lookahead over a coarse grid of full-budget splits. */
function greedy(state: GameState, budget: number): PowerAllocation {
  const step = 5;
  const units = Math.floor(budget / step);
  const extra = budget - units * step;
  let best: PowerAllocation = minimumsFirst(state, budget);
  let bestV = outcomeValue(processTurn(state, best).result);
  for (let g = 0; g <= units; g++)
    for (let l = 0; l <= units - g; l++)
      for (let r = 0; r <= units - g - l; r++) {
        const f = units - g - l - r;
        const a: PowerAllocation = { powerGrid: g * step, lifeSupport: l * step + extra, radiationShielding: r * step, foodProduction: f * step };
        if (IDS.some((id) => a[id] > 50)) continue; // slider max
        const v = outcomeValue(processTurn(state, a).result);
        if (v > bestV) { bestV = v; best = a; }
      }
  return best;
}

/**
 * First-time player model: aims for the safe-minimum markers (default sliders) but misses each
 * slider by up to ±6 MW, sometimes leaving power unassigned, and picks incident cards at random.
 * Deterministic per seed + day so the table is reproducible.
 */
function sloppy(state: GameState, budget: number): PowerAllocation {
  const rng = createSeededRNG(`sloppy_${state.missionSeed}_${state.environment.id}_${state.difficulty}_${state.currentTurn}`);
  const a = getDefaultAllocation(budget, state.difficulty);
  for (const id of IDS) a[id] = Math.max(0, Math.min(50, a[id] + Math.round((rng.next() - 0.5) * 12)));
  // Over budget? The Run button is disabled, so the player trims the biggest slider until it fits.
  let total = IDS.reduce((t, id) => t + a[id], 0);
  while (total > budget) {
    const big = IDS.reduce((x, y) => (a[y] > a[x] ? y : x));
    a[big] -= 1;
    total -= 1;
  }
  return a;
}
const randomChoice = (state: GameState, card: IncidentCard) => {
  const cs = choicesOf(card);
  const rng = createSeededRNG(`sloppy_card_${state.missionSeed}_${card.id}_${state.difficulty}`);
  return cs[Math.floor(rng.next() * cs.length)];
};

const ALL_STRATEGIES: Strategy[] = [
  { id: "even", label: "Even split", allocate: (_s, b) => evenSplit(b), pickIncident: (_s, c) => choicesOf(c)[0] },
  { id: "default", label: "Default sliders", allocate: (s, b) => getDefaultAllocation(b, s.difficulty), pickIncident: (_s, c) => choicesOf(c)[0] },
  { id: "sloppy", label: "First-timer (sloppy)", allocate: sloppy, pickIncident: randomChoice },
  { id: "minimums", label: "Safe minimums first", allocate: minimumsFirst, pickIncident: (_s, c) => safestChoice(c) },
  { id: "greedy", label: "Greedy lookahead", allocate: greedy, pickIncident: (_s, c) => safestChoice(c) },
];
const only = argValues("--strategies")[0]?.split(",");
const STRATEGIES = only ? ALL_STRATEGIES.filter((s) => only.includes(s.id)) : ALL_STRATEGIES;

// ------------------------------------------------------------
// Loss classification
// ------------------------------------------------------------
type LossCauseFn = (prev: GameState, result: TurnResult) => { cause: string; decision?: string };
const engineDiagnose = (Engine as unknown as { diagnoseMissionLoss?: (p: GameState, r: TurnResult) => { cause: string; decisionText?: string } | null }).diagnoseMissionLoss;

/** Fallback classifier (mirrors the original computeOutcome floors) for engines without diagnoseMissionLoss. */
const localCause: LossCauseFn = (_prev, r) => {
  const d = r.difficulty;
  const hFloor = d === "cadet" ? 8 : d === "flight_director" ? 20 : 15;
  const oFloor = d === "cadet" ? 5 : d === "flight_director" ? 15 : 10;
  const cfg = DIFFICULTY_PRESETS[d];
  if (r.crew.oxygenBufferPercent < oFloor) return { cause: "oxygen" };
  if (r.crew.radiationExposureMSv > cfg.missionRadiationLimitMSv) return { cause: "radiation" };
  if (cfg.strictCareerLimitEnforcement && r.crew.careerRadiationExposureMSv > cfg.careerRadiationLimitMSv) return { cause: "career-dose" };
  const sys = IDS.find((id) => r.subsystems[id].health < hFloor);
  if (sys) return { cause: `${sys}-failed` };
  return { cause: "low-score" };
};
const classify: LossCauseFn = (prev, r) => {
  if (engineDiagnose) {
    const d = engineDiagnose(prev, r);
    if (d) return { cause: d.cause, decision: d.decisionText };
  }
  return localCause(prev, r);
};

// ------------------------------------------------------------
// Runner
// ------------------------------------------------------------
interface RunResult { win: boolean; full: boolean; lossDay?: number; cause?: string; decision?: string; minBudget: number; day1Budget: number; day1MinsFit: boolean }

function playMission(env: MissionEnvironment, rank: DifficultyTier, seed: string, strat: Strategy): RunResult {
  let state = createInitialGameState(env, rank, seed);
  const base = DIFFICULTY_PRESETS[rank].baselinePowerDemands;
  const minsSum = IDS.reduce((s, id) => s + base[id], 0);
  let minBudget = Infinity;
  let day1Budget = 0;
  for (let day = 1; day <= TOTAL_TURNS; day++) {
    const incident = getIncidentForSol(env.id, day, state.missionSeed);
    if (incident) state = applyIncidentChoice(state, incident, strat.pickIncident(state, incident));
    const mod = (state.activeModifiers || []).reduce((s, m) => s + (m.powerDeltaMW || 0), 0);
    const budget = getEffectivePowerBudget(env, day, mod, rank, state.missionSeed, state.scenario);
    if (day === 1) day1Budget = budget;
    const alloc = strat.allocate(state, budget);
    const prev = state;
    const { nextState, result } = processTurn(state, alloc);
    minBudget = Math.min(minBudget, result.powerBudgetMW);
    state = nextState;
    if (result.outcome === "critical_alert") {
      const c = classify(prev, result);
      return { win: false, full: false, lossDay: day, cause: c.cause, decision: c.decision, minBudget, day1Budget, day1MinsFit: day1Budget >= minsSum };
    }
    if (day === TOTAL_TURNS) {
      return { win: true, full: result.outcome === "mission_success", minBudget, day1Budget, day1MinsFit: day1Budget >= minsSum };
    }
  }
  throw new Error("unreachable");
}

export interface Cell { world: string; rank: DifficultyTier; strategy: string; runs: number; wins: number; full: number; lossDays: number[]; causes: Record<string, number>; day1MinsFit: number; minBudget: number; samples: string[] }

export function simulate(ranks: DifficultyTier[] = RANKS, strategies: Strategy[] = STRATEGIES, worlds: MissionEnvironment[] = WORLDS): Cell[] {
  const cells: Cell[] = [];
  for (const env of worlds)
  for (const rank of ranks)
    for (const strat of strategies) {
      const cell: Cell = { world: env.id, rank, strategy: strat.id, runs: 0, wins: 0, full: 0, lossDays: [], causes: {}, day1MinsFit: 0, minBudget: Infinity, samples: [] };
      for (const seed of SEEDS) {
        const r = playMission(env, rank, seed, strat);
        cell.runs++;
        if (r.win) cell.wins++;
        if (r.full) cell.full++;
        if (r.day1MinsFit) cell.day1MinsFit++;
        cell.minBudget = Math.min(cell.minBudget, r.minBudget);
        if (!r.win) {
          cell.lossDays.push(r.lossDay!);
          cell.causes[r.cause!] = (cell.causes[r.cause!] ?? 0) + 1;
          if (r.decision && cell.samples.length < 2) cell.samples.push(`${seed} day ${r.lossDay}: ${r.decision}`);
        }
      }
      cells.push(cell);
    }
  return cells;
}
export { ALL_STRATEGIES, WORLDS, RANKS };

// Imported as a library (e.g. by a tuning script)? Stop here.
const AS_LIBRARY = process.env.BALANCE_SIM_LIB === "1";
const t0 = Date.now();
const cells: Cell[] = AS_LIBRARY ? [] : simulate();

// ------------------------------------------------------------
// Output
// ------------------------------------------------------------
const pct = (n: number, d: number) => `${Math.round((n / d) * 100)}%`.padStart(4);
const SHORT: Record<string, string> = { lunar_south_pole: "Moon", mars_gale_crater: "Mars", europa_under_ice: "Europa", titan_hydrocarbon: "Titan" };
const RANK_SHORT: Record<DifficultyTier, string> = { cadet: "Cadet", commander: "Commander", flight_director: "Flight Dir" };

if (AS_LIBRARY) {
  // nothing to print
} else if (JSON_OUT) {
  console.log(JSON.stringify(cells.map((c) => ({ ...c, winRate: c.wins / c.runs })), null, 2));
} else {
  console.log(`Outpost Commander balance sim — ${WORLDS.length} worlds × ${RANKS.length} ranks × ${SEEDS.length} seeds × ${STRATEGIES.length} strategies (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`);
  console.log("Win rate (full success in brackets) · median loss day · top loss cause");
  for (const rank of RANKS) {
    console.log(`\n${RANK_SHORT[rank].toUpperCase()}`);
    console.log(`${"world".padEnd(8)}${STRATEGIES.map((s) => s.label.padEnd(26)).join("")}day-1 mins fit · lowest MW`);
    for (const env of WORLDS) {
      const row = STRATEGIES.map((s) => {
        const c = cells.find((x) => x.world === env.id && x.rank === rank && x.strategy === s.id)!;
        const days = [...c.lossDays].sort((a, b) => a - b);
        const med = days.length ? `d${days[Math.floor(days.length / 2)]}` : "  ";
        const top = Object.entries(c.causes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
        return `${pct(c.wins, c.runs)} (${pct(c.full, c.runs).trim()}) ${med.padEnd(3)} ${top}`.slice(0, 25).padEnd(26);
      }).join("");
      const any = cells.find((x) => x.world === env.id && x.rank === rank)!;
      console.log(`${SHORT[env.id].padEnd(8)}${row}${pct(any.day1MinsFit, any.runs)} · ${any.minBudget} MW`);
    }
  }
  if (VERBOSE) {
    console.log("\nSample loss explanations:");
    for (const c of cells) for (const s of c.samples) console.log(`  ${SHORT[c.world]} ${RANK_SHORT[c.rank]} ${c.strategy}: ${s}`);
  }
}

// ------------------------------------------------------------
// Targets: Cadet winnable with sensible play, Commander a challenge, Flight Director hard.
// "Sensible play" = safe minimums first. Ranges are per world.
// ------------------------------------------------------------
const TARGETS: Record<DifficultyTier, { strategy: string; min: number; max: number }[]> = {
  // Cadet: a first-time player wins on every world.
  cadet: [
    { strategy: "sloppy", min: 0.7, max: 1.0 },
    { strategy: "minimums", min: 0.9, max: 1.0 },
  ],
  // Commander: sensible play wins, careless play usually doesn't.
  commander: [
    { strategy: "sloppy", min: 0.1, max: 0.75 },
    { strategy: "minimums", min: 0.6, max: 1.0 },
  ],
  // Flight Director: even sensible play loses most runs.
  flight_director: [
    { strategy: "sloppy", min: 0, max: 0.1 },
    { strategy: "minimums", min: 0.05, max: 0.6 },
  ],
};

if (!REPORT_ONLY && !AS_LIBRARY) {
  const misses: string[] = [];
  for (const rank of RANKS)
    for (const t of TARGETS[rank].filter((x) => STRATEGIES.some((s) => s.id === x.strategy)))
      for (const env of WORLDS) {
        const c = cells.find((x) => x.world === env.id && x.rank === rank && x.strategy === t.strategy)!;
        const rate = c.wins / c.runs;
        if (rate < t.min || rate > t.max)
          misses.push(`${SHORT[env.id]} ${RANK_SHORT[rank]} ${t.strategy}: ${Math.round(rate * 100)}% (target ${t.min * 100}–${t.max * 100}%)`);
      }
  // Ordering: on every world, a higher rank must never be easier for sensible play.
  for (const env of STRATEGIES.some((s) => s.id === "minimums") ? WORLDS : []) {
    const r = RANKS.map((rank) => cells.find((x) => x.world === env.id && x.rank === rank && x.strategy === "minimums")!.wins);
    if (!(r[0] >= r[1] && r[1] >= r[2])) misses.push(`${SHORT[env.id]}: rank ordering broken (${r.join(" / ")} wins)`);
  }
  // Safe minimums must fit the day-1 budget on Cadet and Commander.
  for (const env of WORLDS)
    for (const rank of ["cadet", "commander"] as DifficultyTier[]) {
      const c = cells.find((x) => x.world === env.id && x.rank === rank)!;
      if (c.day1MinsFit < c.runs) misses.push(`${SHORT[env.id]} ${RANK_SHORT[rank]}: safe minimums exceed day-1 power on ${c.runs - c.day1MinsFit}/${c.runs} seeds`);
    }
  if (misses.length) {
    console.error(`\n❌ ${misses.length} balance target(s) missed:\n  ${misses.join("\n  ")}`);
    process.exit(1);
  }
  console.log("\n✅ All balance targets met.");
}
