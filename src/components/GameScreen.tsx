// ============================================================
// GameScreen — Outpost Commander 10-day mission (Flight Panel v3).
// One screen: resources left · live habitat + crew centre · power
// allocation right. Composed only from src/ui components and tokens.
//
// Engine, incidents, debrief, root-cause, tutorial and audio logic are
// unchanged; this file replaces the legacy ControlDeck/Visualizer UI.
// ============================================================
import { useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";

import {
  Bar,
  Button,
  MissionLogDrawer,
  Panel,
  RankHud,
  Readout,
  Slider,
  STATUS,
  StatusShape,
  StatusText,
  award,
  bumpStat,
  motionMs,
  sfx,
  statusOf,
  updateSettings,
  useReducedMotion,
  useSettings,
  type Status,
} from "../ui";
import { createHabitat, type HabitatView } from "../ui/scene/habitat";
import { PLANET_OF } from "../ui/scene/planet";
import { buildDayReport, membersOf, type DayReport } from "../ui/game/dayReport";

import CrewPanel from "./CrewPanel";
import IncidentModal from "./IncidentModal";
import MissionDebriefModal from "./MissionDebriefModal";
import RootCauseModal from "./RootCauseModal";
import EducatorHubModal from "./EducatorHubModal";
import AmbientAudioModal from "./AmbientAudioModal";
import QuickTutorialOverlay, { TUTORIAL_STORAGE_KEY } from "./QuickTutorialOverlay";
import {
  type RootCauseProfile,
  type RootCauseFailureType,
  type RootCauseEvaluationContext,
  BROWNOUT_OVERBUDGET,
  LIFE_SUPPORT_FAILURE,
  RADIATION_SHIELD_FAILURE,
  BROWNOUT_BATTERY_DEPLETION,
} from "../data/rootCauseData";
import { useTranslation } from "../i18n/LanguageContext";
import { soundEffects, useSoundMuted } from "../utils/soundEffects";
import { ambientAudio } from "../utils/ambientAudio";
import {
  announceSolStart,
  announceHazard,
  announceHarvest,
  announceBrownout,
  cancelCapComSpeech,
} from "../utils/capComVoice";
import type { SpecialistRepairOption } from "../data/crewData";
import type { HistoricScenario } from "../data/scenarioData";

import type { MissionEnvironment } from "../data/nasaConstants";
import { TOTAL_TURNS } from "../data/nasaConstants";
import {
  createInitialGameState,
  createInitialCrewMembers,
  processTurn,
  getDefaultAllocation,
  getEffectivePowerBudget,
  applyIncidentChoice,
  type GameState,
  type PowerAllocation,
  type DifficultyTier,
  type TurnResult,
} from "../engine/simulationEngine";
import { DIFFICULTY_PRESETS } from "../data/difficultyTiers";
import { getIncidentForSol, type IncidentCard, type IncidentChoice } from "../data/incidentCards";
import { createSol9CrisisGameState, getSpeIncidentForEnvironment } from "../utils/judgeDemoData";

interface GameScreenProps {
  environment: MissionEnvironment;
  difficulty?: DifficultyTier;
  missionSeed?: string;
  scenario?: HistoricScenario;
  onMissionEnd: (finalState: GameState) => void;
  onShowNasaData: () => void;
  onSwitchPlanet?: () => void;
  onToggleDemoBar?: () => void;
  isDemoBarOpen?: boolean;
  initialGameStateOverride?: GameState | null;
  sol9CrisisTrigger?: number;
}

/** Slider order follows the design: air, shield, food, power. */
const SUBS: ReadonlyArray<{ id: keyof PowerAllocation; code: string; name: string; does: string }> = [
  { id: "lifeSupport", code: "ECLSS", name: "Life support", does: "makes oxygen" },
  { id: "radiationShielding", code: "RAD", name: "Radiation shield", does: "blocks radiation" },
  { id: "foodProduction", code: "AGRI", name: "Food production", does: "grows crops" },
  { id: "powerGrid", code: "EPS", name: "Power grid", does: "keeps batteries charged" },
];

/** Scale of the food bar. The engine caps reserves at 30 days; 20 keeps the thresholds readable. */
const FOOD_MAX = 20;
const FLARE_AT = 1.6;

const pad = (n: number) => String(n).padStart(2, "0");
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const sum = (a: PowerAllocation) => a.powerGrid + a.lifeSupport + a.radiationShielding + a.foodProduction;

function rootCauseType(r: TurnResult): RootCauseFailureType {
  if (r.subsystems.powerGrid.health < 35 || sum(r.allocation) > r.powerBudgetMW) return "brownout";
  if (r.crew.oxygenBufferPercent < 45 || r.subsystems.lifeSupport.health < 40) return "life_support";
  return "radiation_shield";
}

export default function GameScreen({
  environment,
  difficulty = "commander",
  missionSeed,
  scenario,
  onMissionEnd,
  onShowNasaData,
  onSwitchPlanet,
  onToggleDemoBar,
  isDemoBarOpen,
  initialGameStateOverride,
  sol9CrisisTrigger,
}: GameScreenProps) {
  const reduce = useReducedMotion();
  const settings = useSettings();
  const { language, setLanguage, languages } = useTranslation();
  const [gameState, setGameState] = useState<GameState>(() =>
    initialGameStateOverride || createInitialGameState(environment, difficulty, missionSeed, scenario)
  );
  const [phase, setPhase] = useState<"allocate" | "running" | "result">("allocate");
  const [lastResult, setLastResult] = useState<TurnResult | null>(null);
  const [report, setReport] = useState<DayReport | null>(null);
  const [sim, setSim] = useState<{ result: TurnResult } | null>(null);
  const [p, setP] = useState(0);

  // Dynamic incident state
  const [activeIncident, setActiveIncident] = useState<IncidentCard | null>(() => {
    if (initialGameStateOverride && initialGameStateOverride.currentTurn === 8) {
      return getSpeIncidentForEnvironment(environment);
    }
    return null;
  });
  const [dismissedIncidents, setDismissedIncidents] = useState<Record<number, boolean>>({});

  // Overlays
  const [showDebriefModal, setShowDebriefModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [isMuted, toggleMute] = useSoundMuted();
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isCrewModalOpen, setIsCrewModalOpen] = useState(false);
  const [isEducatorOpen, setIsEducatorOpen] = useState(false);
  const [selectedRootCauseProfile, setSelectedRootCauseProfile] = useState<RootCauseProfile | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(TUTORIAL_STORAGE_KEY) !== "true";
    } catch {
      return false;
    }
  });

  const viewRef = useRef<HTMLDivElement>(null);
  const habitatRef = useRef<HabitatView | null>(null);
  const [glFailed, setGlFailed] = useState(false);
  const rafRef = useRef(0);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const lastAnnouncedSolRef = useRef(0);
  const startedRef = useRef(false);
  const closeLog = useCallback(() => setLogOpen(false), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const fallbackCrew = useMemo(() => createInitialCrewMembers(gameState.difficulty), [gameState.difficulty]);

  // ---------- Day, budget, forecast ----------
  const showingResult = phase === "result" && lastResult;
  const day = Math.min(TOTAL_TURNS, showingResult ? lastResult.turn : gameState.currentTurn + 1);
  const currentTurn = gameState.currentTurn + 1; // the day being planned (engine, 1-indexed)

  const modifierPowerDelta = (gameState.activeModifiers || []).reduce((s, m) => s + (m.powerDeltaMW || 0), 0);
  const effectiveBudget = getEffectivePowerBudget(
    environment,
    currentTurn,
    modifierPowerDelta,
    gameState.difficulty,
    gameState.missionSeed,
    gameState.scenario
  );
  const currentEvent = gameState.scenario?.turnEvents
    ? gameState.scenario.turnEvents[currentTurn - 1]
    : environment.turnEvents[currentTurn - 1];

  const [allocation, setAllocation] = useState<PowerAllocation>(() =>
    getDefaultAllocation(effectiveBudget, gameState.difficulty)
  );

  const budget = showingResult ? lastResult.powerBudgetMW : effectiveBudget;
  const event = showingResult ? lastResult.event : currentEvent;
  const used = sum(allocation);
  const remaining = budget - used;
  const over = remaining < 0;
  const running = phase === "running";

  // ---------- Habitat 3D scene ----------
  useEffect(() => {
    if (!viewRef.current) return;
    try {
      habitatRef.current = createHabitat(viewRef.current, { env: PLANET_OF[environment.id] ?? "moon", reduceMotion: reduce });
    } catch {
      setGlFailed(true);
    }
    return () => {
      habitatRef.current?.dispose();
      habitatRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    habitatRef.current?.setReduceMotion(reduce);
  }, [reduce]);

  // ---------- Mission counters ----------
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    bumpStat("missionsStarted");
  }, []);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);
  useEffect(() => () => cancelCapComSpeech(), []);
  useEffect(() => {
    if (isMuted) cancelCapComSpeech();
  }, [isMuted]);

  // ---------- Judge demo: jump to the day-9 crisis ----------
  const handleJumpToSol9Crisis = useCallback(() => {
    soundEffects.playIncidentAlert();
    ambientAudio.triggerGeigerBurst(4.0, 95);
    cancelAnimationFrame(rafRef.current);

    const crisisState = createSol9CrisisGameState(environment, gameState.difficulty, gameState.missionSeed, gameState.scenario);
    setGameState(crisisState);
    setPhase("allocate");
    setSim(null);
    setReport(null);
    setLastResult(null);
    setDismissedIncidents((prev) => {
      const copy = { ...prev };
      delete copy[9];
      return copy;
    });
    setActiveIncident(getSpeIncidentForEnvironment(environment));

    const modPower = (crisisState.activeModifiers || []).reduce((s, m) => s + (m.powerDeltaMW || 0), 0);
    const b = getEffectivePowerBudget(environment, 9, modPower, crisisState.difficulty, crisisState.missionSeed, crisisState.scenario);
    setAllocation(getDefaultAllocation(b, crisisState.difficulty));
  }, [environment, gameState.difficulty, gameState.missionSeed, gameState.scenario]);

  useEffect(() => {
    if (sol9CrisisTrigger && sol9CrisisTrigger > 0) handleJumpToSol9Crisis();
  }, [sol9CrisisTrigger, handleJumpToSol9Crisis]);

  // ---------- Incidents (seeded, one per day at most) ----------
  useEffect(() => {
    if (phase === "allocate" && currentTurn <= TOTAL_TURNS) {
      const incident = getIncidentForSol(environment.id, currentTurn, gameState.missionSeed);
      const alreadyHandled = gameState.incidentHistory?.some((h) => h.sol === currentTurn && h.incidentId === incident?.id);

      if (incident && !alreadyHandled && !dismissedIncidents[currentTurn]) {
        setActiveIncident(incident);
        soundEffects.playIncidentAlert();
        announceHazard(incident.title);

        const lowerId = incident.id.toLowerCase();
        const lowerTitle = incident.title.toLowerCase();
        if (
          lowerId.includes("solar") || lowerId.includes("radiation") || lowerId.includes("flare") ||
          lowerTitle.includes("solar") || lowerTitle.includes("radiation")
        ) {
          ambientAudio.triggerGeigerBurst(3.5, 95);
        } else {
          ambientAudio.triggerAirlock(0.75);
        }
      }
    }
  }, [currentTurn, environment.id, phase, gameState.incidentHistory, dismissedIncidents, gameState.missionSeed]);

  // CapCom reads out the day once any incident is cleared
  useEffect(() => {
    if (phase === "allocate" && currentTurn <= TOTAL_TURNS && !activeIncident) {
      const incident = getIncidentForSol(environment.id, currentTurn, gameState.missionSeed);
      const alreadyHandled = gameState.incidentHistory?.some((h) => h.sol === currentTurn && h.incidentId === incident?.id);
      if (incident && !alreadyHandled && !dismissedIncidents[currentTurn]) return;

      if (lastAnnouncedSolRef.current !== currentTurn) {
        lastAnnouncedSolRef.current = currentTurn;
        const weatherDesc = currentEvent?.label
          ? `${currentEvent.label}. Solar array operating at ${Math.round(effectiveBudget)} megawatts.`
          : `Solar array operating at ${Math.round(effectiveBudget)} megawatts.`;
        announceSolStart(currentTurn, weatherDesc);
      }
    }
  }, [phase, currentTurn, activeIncident, environment.id, gameState.missionSeed, gameState.incidentHistory, dismissedIncidents, currentEvent?.label, effectiveBudget]);

  // Ambient audio follows habitat telemetry
  useEffect(() => {
    const radMultiplier = currentEvent?.radiationSpikeMultiplier ?? 1.0;
    const baselines = DIFFICULTY_PRESETS[gameState.difficulty].baselinePowerDemands;
    ambientAudio.updateTelemetry({
      environmentId: environment.id,
      radiationMultiplier: radMultiplier,
      lifeSupportHealth: gameState.subsystems.lifeSupport.health,
      lifeSupportPowerRatio: allocation.lifeSupport / baselines.lifeSupport,
      shieldingHealth: gameState.subsystems.radiationShielding.health,
      shieldingPowerRatio: allocation.radiationShielding / baselines.radiationShielding,
    });
  }, [environment.id, currentEvent?.radiationSpikeMultiplier, gameState.subsystems.lifeSupport.health, gameState.subsystems.radiationShielding.health, allocation.lifeSupport, allocation.radiationShielding, gameState.difficulty]);

  // New day, new budget: sliders reset to an even split
  useEffect(() => {
    if (phase === "allocate") {
      const modPower = (gameState.activeModifiers || []).reduce((s, m) => s + (m.powerDeltaMW || 0), 0);
      const b = getEffectivePowerBudget(environment, gameState.currentTurn + 1, modPower, gameState.difficulty, gameState.missionSeed, gameState.scenario);
      setAllocation(getDefaultAllocation(b, gameState.difficulty));
    }
  }, [gameState.currentTurn, phase, environment, gameState.activeModifiers, gameState.difficulty, gameState.missionSeed, gameState.scenario]);

  const handleSelectIncidentChoice = useCallback(
    (choice: IncidentChoice, specialistRepair?: SpecialistRepairOption) => {
      if (!activeIncident) return;
      cancelCapComSpeech();
      soundEffects.playButtonClick();
      ambientAudio.triggerAirlock(0.8);
      const updatedState = applyIncidentChoice(gameState, activeIncident, choice, specialistRepair);
      setGameState(updatedState);
      setDismissedIncidents((prev) => ({ ...prev, [currentTurn]: true }));
      setActiveIncident(null);

      const modPower = (updatedState.activeModifiers || []).reduce((s, m) => s + (m.powerDeltaMW || 0), 0);
      const b = getEffectivePowerBudget(environment, currentTurn, modPower, updatedState.difficulty, updatedState.missionSeed, updatedState.scenario);
      setAllocation(getDefaultAllocation(b, updatedState.difficulty));
    },
    [activeIncident, gameState, environment, currentTurn]
  );

  // ---------- What is on the instruments right now ----------
  // While a day runs, values glide from the old state to the result.
  const members = membersOf(gameState.crew, fallbackCrew);
  const k = running ? easeInOut(Math.max(0, Math.min(1, (p - 0.1) / 0.85))) : 1;
  const to = running && sim ? sim.result : null;
  const toMembers = to ? membersOf(to.crew, fallbackCrew) : members;
  const mix = (a: number, b: number | undefined) => (to && b !== undefined ? lerp(a, b, k) : a);
  const limit = gameState.crew.safeRadiationLimitMSv || 100;
  const now = {
    grid: mix(gameState.subsystems.powerGrid.health, to?.subsystems.powerGrid.health),
    o2: mix(gameState.crew.oxygenBufferPercent, to?.crew.oxygenBufferPercent),
    dose: mix(gameState.crew.radiationExposureMSv, to?.crew.radiationExposureMSv),
    food: mix(gameState.crew.foodReserveDays, to?.crew.foodReserveDays),
  };
  const crewHp = members.map((m, i) => mix(m.health, toMembers[i]?.health));

  // Tomorrow, if the player runs the day with these sliders (the engine is deterministic).
  const proj = useMemo(() => {
    if (phase !== "allocate" || over || currentTurn > TOTAL_TURNS) return null;
    try {
      return processTurn(gameState, allocation).result;
    } catch {
      return null;
    }
  }, [phase, over, currentTurn, gameState, allocation]);

  const doseStatus = (mSv: number): Status => statusOf("dose", (mSv / limit) * 100);
  const resources = [
    { key: "grid", code: "EPS", name: "Power grid", unit: "%", value: now.grid, dec: 0, max: 100, ticks: [20, 40], good: 1 as const, status: statusOf("battery", now.grid), note: "Dark hours wear the grid down", next: proj?.subsystems.powerGrid.health, nextStatus: proj && statusOf("battery", proj.subsystems.powerGrid.health) },
    { key: "o2", code: "O₂", name: "Oxygen", unit: "%", value: now.o2, dec: 0, max: 100, ticks: [35, 60], good: 1 as const, status: statusOf("oxygen", now.o2), note: "4 crew breathe 3.4 kg a day", next: proj?.crew.oxygenBufferPercent, nextStatus: proj && statusOf("oxygen", proj.crew.oxygenBufferPercent) },
    { key: "dose", code: "RAD", name: "Radiation dose", unit: "mSv", value: now.dose, dec: 1, max: limit, ticks: [limit * 0.5, limit * 0.8], good: -1 as const, status: doseStatus(now.dose), note: `Mission limit: ${limit} mSv`, next: proj?.crew.radiationExposureMSv, nextStatus: proj && doseStatus(proj.crew.radiationExposureMSv) },
    { key: "food", code: "FOOD", name: "Food left", unit: "days", value: now.food, dec: 1, max: FOOD_MAX, ticks: [2, 4], good: 1 as const, status: statusOf("food", now.food), note: "4 crew eat 10,000 kcal a day", next: proj?.crew.foodReserveDays, nextStatus: proj && statusOf("food", proj.crew.foodReserveDays) },
  ];

  // Habitat lamps, dome and greenhouse follow the sliders and the grid
  useEffect(() => {
    habitatRef.current?.set({ shield: allocation.radiationShielding, food: allocation.foodProduction, batt: allocation.powerGrid, battery: now.grid });
  }, [allocation.radiationShielding, allocation.foodProduction, allocation.powerGrid, now.grid]);

  // ---------- Run the day ----------
  function finishDay(from: GameState, nextState: GameState, result: TurnResult, rep: DayReport, usedMW: number) {
    setGameState(nextState);
    setLastResult(result);
    setReport(rep);
    setSim(null);
    setPhase("result");

    // Sound: the worst thing in the report decides
    sfx.play(rep.end && !rep.lost ? "victory" : rep.status === "crit" ? "alarm" : rep.status === "warn" ? "caution" : "chime");

    // CapCom
    const isBrownout = result.subsystems.powerGrid.health < 35 || usedMW > result.powerBudgetMW || result.alerts.some((a) => a.subsystem === "power" || a.headline.toLowerCase().includes("brownout"));
    const isHarvest = nextState.crew.harvestYieldKg > from.crew.harvestYieldKg || result.crew.recentMoraleEvents?.some((e) => e.sol === result.turn && e.id.startsWith("harvest-"));
    if (result.event.radiationSpikeMultiplier > 1.6) ambientAudio.triggerGeigerBurst(3.2, 85);
    if (isBrownout) announceBrownout();
    else if (isHarvest) announceHarvest();

    // Progress
    bumpStat("daysRun");
    award("first-day");
    if (usedMW === result.powerBudgetMW) award("full-budget");
    if (rep.headline === "Smooth day") award("smooth-day", { at: "hud" });
    if (rep.flareBlocked) award("flare-blocked");
    const before = { grid: statusOf("battery", from.subsystems.powerGrid.health), o2: statusOf("oxygen", from.crew.oxygenBufferPercent), food: statusOf("food", from.crew.foodReserveDays), dose: doseStatus(from.crew.radiationExposureMSv) };
    const after = { grid: statusOf("battery", result.subsystems.powerGrid.health), o2: statusOf("oxygen", result.crew.oxygenBufferPercent), food: statusOf("food", result.crew.foodReserveDays), dose: doseStatus(result.crew.radiationExposureMSv) };
    if ((Object.keys(before) as Array<keyof typeof before>).some((m) => before[m] === "crit" && after[m] === "ok")) award("close-call");
    if (rep.end && !rep.lost) {
      award("mission-complete", { at: "hud" });
      bumpStat("missionsCompleted");
      if (membersOf(result.crew, fallbackCrew).every((m) => statusOf("crew", m.health) === "ok")) award("all-healthy");
      if (environment.id === "lunar_south_pole" || environment.id === "mars_gale_crater") award("both-worlds", { key: environment.id });
      if (from.difficulty === "flight_director") award("flight-director");
    }
  }

  function runDay() {
    if (phase !== "allocate" || over || currentTurn > TOTAL_TURNS) return;
    cancelCapComSpeech();
    sfx.play("commit");
    ambientAudio.triggerAirlock(0.7);

    const from = gameState;
    const usedMW = used;
    const { nextState, result } = processTurn(from, allocation);
    const rep = buildDayReport({ subsystems: from.subsystems, crew: from.crew, members: membersOf(from.crew, fallbackCrew) }, result, TOTAL_TURNS);
    const dur = motionMs("sim", reduce);

    setSim({ result });
    setP(0);
    setPhase("running");
    habitatRef.current?.runDay(dur, { flare: result.event.radiationSpikeMultiplier >= FLARE_AT });

    const t0 = performance.now();
    const step = (t: number) => {
      const q = Math.min(1, (t - t0) / dur);
      if (q < 1) {
        setP(q);
        rafRef.current = requestAnimationFrame(step);
      } else {
        setP(1);
        finishDay(from, nextState, result, rep, usedMW);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }

  function continueDay() {
    if (!report) return;
    cancelCapComSpeech();
    if (report.end) {
      setShowDebriefModal(true);
      return;
    }
    sfx.play("tick");
    setPhase("allocate");
    setLastResult(null);
    setReport(null);
  }

  // The report card takes focus so Enter moves on
  useEffect(() => {
    if (phase === "result") ctaRef.current?.focus();
  }, [phase]);

  // ---------- Restart / leave ----------
  const handlePlayAgain = useCallback(() => {
    cancelCapComSpeech();
    cancelAnimationFrame(rafRef.current);
    lastAnnouncedSolRef.current = 0;
    const fresh = createInitialGameState(environment, gameState.difficulty, gameState.missionSeed, gameState.scenario);
    setGameState(fresh);
    setPhase("allocate");
    setLastResult(null);
    setReport(null);
    setSim(null);
    setP(0);
    setActiveIncident(null);
    setDismissedIncidents({});
    setShowDebriefModal(false);
    setMenuOpen(false);
    bumpStat("missionsStarted");
    const b = getEffectivePowerBudget(environment, 1, 0, gameState.difficulty, gameState.missionSeed, gameState.scenario);
    setAllocation(getDefaultAllocation(b, gameState.difficulty));
  }, [environment, gameState.difficulty, gameState.missionSeed, gameState.scenario]);

  const handleSwitchPlanetAction = useCallback(() => {
    cancelCapComSpeech();
    setShowDebriefModal(false);
    if (onSwitchPlanet) onSwitchPlanet();
    else onMissionEnd(gameState);
  }, [onSwitchPlanet, onMissionEnd, gameState]);

  // ---------- Root cause drill-down ----------
  const rootCauseContext = (): RootCauseEvaluationContext => ({
    environment,
    currentTurn: lastResult ? lastResult.turn : currentTurn,
    allocation: lastResult ? lastResult.allocation : allocation,
    effectiveBudgetMW: lastResult ? lastResult.powerBudgetMW : effectiveBudget,
    subsystems: lastResult ? lastResult.subsystems : gameState.subsystems,
    crew: lastResult ? lastResult.crew : gameState.crew,
    currentEvent: lastResult ? lastResult.event : currentEvent,
    alerts: lastResult ? lastResult.alerts : [],
  });

  const handleInspectTypeRootCause = (type: RootCauseFailureType) => {
    soundEffects.playButtonClick();
    const ctx = rootCauseContext();
    let profile = BROWNOUT_OVERBUDGET;
    if (type === "brownout") {
      const total = ctx.allocation.powerGrid + ctx.allocation.lifeSupport + ctx.allocation.radiationShielding;
      profile = total > ctx.effectiveBudgetMW ? BROWNOUT_OVERBUDGET : BROWNOUT_BATTERY_DEPLETION;
    } else if (type === "life_support") {
      profile = LIFE_SUPPORT_FAILURE;
    } else {
      profile = RADIATION_SHIELD_FAILURE;
    }
    setSelectedRootCauseProfile(profile);
  };

  const handleApplyCounterfactualAllocation = useCallback((next: PowerAllocation) => {
    soundEffects.playVictoryChord();
    setAllocation(next);
    setSelectedRootCauseProfile(null);
  }, []);

  // ---------- Copy for the panels ----------
  const baselines = DIFFICULTY_PRESETS[gameState.difficulty].baselinePowerDemands;
  const solDirective = gameState.incidentHistory?.find((h) => h.sol === day);
  const spike = event?.radiationSpikeMultiplier ?? 1;
  const forecastStatus: Status = spike >= FLARE_AT || (event?.powerDeltaMW ?? 0) <= -8 ? "warn" : "ok";
  const budgetMsg = over
    ? `Over budget by ${-remaining} MW. Lower a slider.`
    : remaining > 0
      ? `${remaining} MW unassigned. Unused power is wasted.`
      : "Every megawatt is assigned.";
  const hrs = p * 24;
  const clock = `${pad(Math.floor(hrs) % 25)}:${pad(Math.floor((hrs % 1) * 60))}`;
  const siteLine = [scenario?.title ?? environment.name, environment.subtitle, DIFFICULTY_PRESETS[gameState.difficulty].title, `#${gameState.missionSeed}`].filter(Boolean).join(" · ");

  const menuItems: Array<{ title: string; sub: string; value?: string; warn?: boolean; act: () => void }> = [
    { title: "Mission data", sub: "The NASA sources behind every number", value: "NASA", act: () => { setMenuOpen(false); onShowNasaData(); } },
    { title: "Teacher tools", sub: "Class seeds, lab worksheet, rubric", value: "NGSS", act: () => { setMenuOpen(false); setIsEducatorOpen(true); } },
    { title: "How to play", sub: "Replay the 3-step tutorial", act: () => { setMenuOpen(false); setIsTutorialOpen(true); } },
    { title: "Crew roster", sub: "Dossiers, skills and morale", value: "4", act: () => { setMenuOpen(false); setIsCrewModalOpen(true); } },
    { title: "Reduce motion", sub: "Shorter day simulation, no blinking alarms", value: settings.reduceMotion === null ? "SYSTEM" : settings.reduceMotion ? "ON" : "OFF", act: () => updateSettings({ reduceMotion: settings.reduceMotion === null ? true : settings.reduceMotion ? false : null }) },
    { title: "Language", sub: languages.map((l) => l.code.toUpperCase()).join(" · "), value: language.toUpperCase(), act: () => setLanguage(languages[(languages.findIndex((l) => l.code === language) + 1) % languages.length].code) },
    { title: "Sound", sub: "Slider clicks, alarms, CAPCOM voice", value: isMuted ? "OFF" : "ON", warn: isMuted, act: () => toggleMute() },
    { title: "Ambient audio", sub: "Procedural habitat sounds", act: () => { setMenuOpen(false); setIsAudioModalOpen(true); } },
    ...(onToggleDemoBar ? [{ title: "Judge demo bar", sub: "Jump to key moments", value: isDemoBarOpen ? "ON" : "OFF", act: () => { setMenuOpen(false); onToggleDemoBar(); } }] : []),
    { title: "Restart mission", sub: "Back to day 1 with the same seed", act: handlePlayAgain },
    { title: "Change destination", sub: "Pick another world", act: () => { setMenuOpen(false); handleSwitchPlanetAction(); } },
  ];

  const btn = running
    ? { variant: "secondary" as const, label: `Simulating day ${day}`, right: clock, disabled: true, progress: p }
    : phase === "result"
      ? { variant: "secondary" as const, label: "Day report", right: "REVIEW ABOVE", disabled: true, progress: undefined }
      : over
        ? { variant: "danger" as const, label: "Over budget", right: `CUT ${-remaining} MW`, disabled: true, progress: undefined }
        : { variant: "primary" as const, label: `Run day ${day}`, right: `${used} / ${budget} MW`, disabled: false, progress: undefined };

  return (
    <div className="oc-shell flex min-h-screen flex-col gap-2 bg-oc-void p-2 font-oc-ui text-oc-text-1">
      {/* ---------- Legacy flow modals (mid-mission incidents, crew, debrief, root cause) ---------- */}
      {activeIncident && (
        <IncidentModal incident={activeIncident} isOpen={activeIncident !== null} crewMembers={members} onSelectChoice={handleSelectIncidentChoice} />
      )}

      {isCrewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 sm:p-5">
          <div className="relative my-auto w-full max-w-4xl">
            <div className="mb-2 flex justify-end">
              <Button size="sm" onClick={() => setIsCrewModalOpen(false)}>Close crew roster</Button>
            </div>
            <CrewPanel crew={gameState.crew} />
          </div>
        </div>
      )}

      <QuickTutorialOverlay isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />

      {showDebriefModal && (
        <MissionDebriefModal isOpen={showDebriefModal} gameState={gameState} environment={environment} onPlayAgain={handlePlayAgain} onSwitchPlanet={handleSwitchPlanetAction} onShowNasaData={onShowNasaData} />
      )}

      <AmbientAudioModal isOpen={isAudioModalOpen} onClose={() => setIsAudioModalOpen(false)} environmentName={environment.name} />
      <EducatorHubModal isOpen={isEducatorOpen} onClose={() => setIsEducatorOpen(false)} />

      {selectedRootCauseProfile && (
        <RootCauseModal
          isOpen={selectedRootCauseProfile !== null}
          onClose={() => setSelectedRootCauseProfile(null)}
          profile={selectedRootCauseProfile}
          context={rootCauseContext()}
          onApplyAllocation={handleApplyCounterfactualAllocation}
          canApplyAllocation={phase === "allocate"}
        />
      )}

      <MissionLogDrawer open={logOpen} onClose={closeLog} />
      <MenuDrawer open={menuOpen} onClose={closeMenu} items={menuItems} footer={`CLASS SEED · ${gameState.missionSeed}`} />

      {/* ---------- Header ---------- */}
      <header>
        <Panel size="flush" className="!h-14 !flex-row !items-center !gap-4 !pl-4 !pr-2">
          <div className="flex min-w-0 flex-1 items-baseline gap-4">
            <span className="flex-none whitespace-nowrap font-oc-label text-[20px] font-semibold uppercase leading-6 tracking-[0.08em] max-sm:hidden">Outpost Commander</span>
            <span className="oc-type-code hidden min-w-0 truncate text-oc-text-3 md:block">{siteLine}</span>
          </div>
          <div className="flex flex-none items-center gap-4">
            <div className="flex items-baseline gap-2">
              <span className="oc-type-label text-oc-text-2">Day</span>
              <span className="oc-type-data-l">{pad(day)}</span>
              <span className="oc-type-data-s text-oc-text-3">/ {TOTAL_TURNS}</span>
            </div>
            <div className="hidden gap-1 sm:flex" aria-hidden="true">
              {Array.from({ length: TOTAL_TURNS }, (_, i) => {
                const d = i + 1;
                const tone = d < day || (d === day && phase === "result") ? "border-oc-text-2 bg-oc-text-2" : d === day ? "border-oc-accent bg-oc-accent" : "border-oc-line-strong bg-transparent";
                return <span key={d} className={`block h-2 w-4 rounded-[1px] border transition-colors duration-[240ms] ${tone}`} />;
              })}
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            <RankHud onClick={() => setLogOpen(true)} />
            <Button onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <span className="flex flex-col gap-[3px]" aria-hidden="true">
                <span className="block h-0.5 w-3.5 bg-current" />
                <span className="block h-0.5 w-3.5 bg-current" />
                <span className="block h-0.5 w-3.5 bg-current" />
              </span>
              Menu
            </Button>
          </div>
        </Panel>
      </header>

      <main className="flex min-h-0 flex-1 flex-wrap gap-2">
        {/* ---------- Left: resources ---------- */}
        <section aria-label="Outpost resources" className="flex min-w-0 flex-[1_1_264px] flex-col gap-2">
          {resources.map((r) => (
            <Readout
              key={r.key}
              className="min-h-[144px] flex-1 justify-between"
              code={r.code}
              name={r.name}
              unit={r.unit}
              value={r.value}
              decimals={r.dec}
              status={r.status}
              max={r.max}
              ticks={r.ticks}
              good={r.good}
              live={running}
              note={r.note}
              delta={r.next !== undefined ? r.next - r.value : undefined}
              deltaStatus={r.nextStatus ?? undefined}
            />
          ))}
        </section>

        {/* ---------- Centre: habitat + crew ---------- */}
        <section className="flex min-w-0 flex-[999_1_400px] flex-col gap-2">
          <div className="relative min-h-[300px] flex-1 overflow-hidden rounded-oc-2 border border-oc-line bg-[var(--oc-bg-scene)]">
            <div ref={viewRef} className="absolute inset-0" role="img" aria-label={`3D model of the ${environment.name} outpost. The shield dome, greenhouse lights and battery lamps follow the power sliders.`} />
            {glFailed && <div className="oc-type-code absolute inset-0 grid place-items-center text-oc-text-3">3D VIEW UNAVAILABLE</div>}

            <Panel className="absolute left-4 top-4 max-w-[280px]" data-tutorial="incident-alerts">
              <span className="oc-type-code text-oc-text-3">Day {pad(day)} forecast</span>
              <div className="flex items-baseline justify-between gap-6">
                <span className="oc-type-body text-oc-text-2">Power available</span>
                <span className="oc-type-data-l">{budget}<span className="oc-type-data-s ml-1 text-oc-text-3">MW</span></span>
              </div>
              {spike > 1 && (
                <div className="flex items-baseline justify-between gap-6">
                  <span className="oc-type-body text-oc-text-2">Radiation</span>
                  <span className="oc-type-data-l">×{spike.toFixed(1)}</span>
                </div>
              )}
              <StatusText status={forecastStatus} className="!text-base !leading-5 font-medium">{event?.label ?? "Mission complete"}</StatusText>
              {solDirective && <StatusText status="ok" className="!text-sm">Directive: {solDirective.choiceLabel}</StatusText>}
            </Panel>

            {phase === "allocate" && day === 1 && !isTutorialOpen && (
              <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-start">
                <Panel className="!px-4 !py-2 text-sm leading-5 text-oc-text-2">The shield dome, greenhouse lights and battery lamps follow your sliders.</Panel>
              </div>
            )}

            {running && (
              <Panel className="absolute inset-x-4 bottom-4 !flex-row !items-center !gap-4 animate-[oc-in_240ms_var(--oc-ease-out)_both]">
                <span className="oc-type-label flex-none">Simulating day {pad(day)}</span>
                <div className="flex-1"><Bar value={p * 100} max={100} fill="var(--oc-accent)" ticks={[25, 50, 75]} live label="Day simulation progress" /></div>
                <span className="oc-type-data-l flex-none">{clock}</span>
              </Panel>
            )}

            {phase === "result" && report && (
              <div className="absolute inset-0 grid place-items-center bg-[var(--oc-scrim)] p-4 animate-[oc-fade_240ms_both]">
                <Panel size="lg" role="dialog" aria-label="Day report" className="w-full max-w-[440px] animate-[oc-in_240ms_var(--oc-ease-out)_both]" style={{ borderColor: "var(--oc-line-strong)" }}>
                  <div className="flex flex-col gap-1">
                    <span className="oc-type-code text-oc-text-3">{report.caption}</span>
                    <h2 className="oc-type-display m-0" style={{ color: report.status === "ok" ? "var(--oc-text-1)" : STATUS[report.status].fg }}>{report.headline}</h2>
                  </div>
                  <div className="flex flex-col border-t border-oc-line">
                    {report.lines.map((l, i) => (
                      <div key={i} className="flex items-start gap-4 border-b border-oc-line py-2 animate-[oc-in_240ms_var(--oc-ease-out)_both]" style={{ animationDelay: `${i * 80}ms` }}>
                        <StatusShape status={l.status} className="!mt-[5px]" blink={l.status === "crit"} />
                        <span className="oc-type-body flex-1 !leading-5 text-pretty">{l.text}</span>
                        <span className="oc-type-data-s flex-none" style={{ color: STATUS[l.status].fg }}>{l.delta}</span>
                      </div>
                    ))}
                  </div>
                  <Button ref={ctaRef} variant="primary" size="lg" block onClick={continueDay}>{report.cta}</Button>
                  {lastResult && report.status !== "ok" && (
                    <Button variant="ghost" size="sm" block onClick={() => handleInspectTypeRootCause(rootCauseType(lastResult))}>Why did this happen?</Button>
                  )}
                </Panel>
              </div>
            )}
          </div>

          <div aria-label="Crew" className="grid flex-none grid-cols-[repeat(auto-fit,minmax(136px,1fr))] gap-2">
            {members.map((m, i) => {
              const hp = crewHp[i], st = statusOf("crew", hp);
              return (
                <Panel key={m.id} status={st} className="min-w-0">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold leading-5">{m.name}</span>
                    <span className="oc-type-code truncate text-oc-text-3">{m.roleTitle}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <StatusText status={st} blink className="!text-sm font-medium">{STATUS[st].word}</StatusText>
                    <span className="oc-type-data-l" style={{ color: STATUS[st].value }}>{Math.round(hp)}<span className="oc-type-data-s ml-1 text-oc-text-3">hp</span></span>
                  </div>
                  <Bar value={hp} max={100} status={st} size="thin" live={running} label={`${m.name} health`} />
                </Panel>
              );
            })}
          </div>
        </section>

        {/* ---------- Right: power allocation ---------- */}
        <Panel as="section" aria-label="Power allocation" title="Power allocation" meta={`Microgrid ${budget} MW`} className="min-w-0 flex-[1_1_360px] !gap-4">
          <div className="flex flex-col gap-2" data-tutorial="power-budget">
            <div className="flex items-end justify-between gap-2">
              <span className="oc-type-body text-oc-text-2">Power left to assign</span>
              <div className="flex items-baseline gap-1">
                <span className="oc-type-data-xl" style={{ color: over ? "var(--oc-critical)" : undefined }}>{over ? "−" : ""}{pad(Math.abs(remaining))}</span>
                <span className="oc-readout__unit">MW</span>
              </div>
            </div>
            <Bar value={used} max={Math.max(budget, used)} size="thick" status={over ? "crit" : "ok"} fill={over ? undefined : "var(--oc-accent)"} ticks={over ? [budget] : undefined} live label="Power assigned" />
            <StatusText status={over ? "crit" : "ok"}>{budgetMsg}</StatusText>
          </div>

          <div className="flex flex-1 flex-col justify-between gap-2" data-tutorial="tradeoff-arrows">
            {SUBS.map((s) => (
              <Slider
                key={s.id}
                code={s.code}
                name={s.name}
                value={allocation[s.id]}
                max={50}
                safeMin={baselines[s.id]}
                does={s.does}
                disabled={phase !== "allocate"}
                onChange={(v) => setAllocation((a) => ({ ...a, [s.id]: v }))}
              />
            ))}
          </div>

          <Button variant={btn.variant} size="lg" block disabled={btn.disabled} progress={btn.progress} right={btn.right} onClick={runDay} clickSound={false}>
            {btn.label}
          </Button>
        </Panel>
      </main>
    </div>
  );
}

// ------------------------------------------------------------
// Menu drawer — built from the v3 drawer classes, like the mission log.
// ------------------------------------------------------------
function MenuDrawer({ open, onClose, items, footer }: { open: boolean; onClose: () => void; items: Array<{ title: string; sub: string; value?: string; warn?: boolean; act: () => void }>; footer: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); opener?.focus?.(); };
  }, [open, onClose]);

  return (
    <>
      <div className={"oc-scrim" + (open ? " oc-scrim--open" : "")} onClick={onClose} aria-hidden="true" />
      <aside className={"oc-drawer" + (open ? " oc-drawer--open" : "")} role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!open}>
        <div className="oc-drawer__head">
          <span className="oc-type-label">Menu</span>
          <Button ref={closeRef} size="sm" onClick={onClose}>Close</Button>
        </div>
        <ul className="oc-drawer__list">
          {items.map((m) => (
            <li key={m.title}>
              <button
                type="button"
                onClick={() => { sfx.play("tick"); m.act(); }}
                className="flex min-h-[72px] w-full items-center justify-between gap-4 border-b border-oc-line bg-transparent px-4 py-4 text-left text-oc-text-1 transition-colors duration-[160ms] hover:bg-oc-raised focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-oc-accent"
              >
                <span className="flex flex-col gap-1">
                  <span className="font-semibold leading-5">{m.title}</span>
                  <span className="text-sm leading-4 text-oc-text-2">{m.sub}</span>
                </span>
                {m.value && <span className="oc-type-code flex-none" style={{ color: m.warn ? "var(--oc-caution)" : "var(--oc-text-3)" }}>{m.value}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="oc-drawer__foot"><span>{footer}</span></div>
      </aside>
    </>
  );
}
