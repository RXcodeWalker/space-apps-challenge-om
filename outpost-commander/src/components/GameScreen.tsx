// ============================================================
// GameScreen — the main 10-turn mission gameplay view
// ============================================================
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Satellite, ToggleLeft, ToggleRight, ChevronRight, Info } from "lucide-react";

import PowerSlider from "./PowerSlider";
import SubsystemCard from "./SubsystemCard";
import CrewPanel from "./CrewPanel";
import AlertBanner from "./AlertBanner";

import type { MissionEnvironment } from "../data/nasaConstants";
import { TOTAL_TURNS } from "../data/nasaConstants";
import {
  createInitialGameState,
  processTurn,
  getDefaultAllocation,
  getEffectivePowerBudget,
  getTradeOffHints,
  type GameState,
  type PowerAllocation,
  type SubsystemId,
} from "../engine/simulationEngine";

const SUBSYSTEM_BASELINE: Record<SubsystemId, number> = {
  powerGrid: 25,
  lifeSupport: 35,
  radiationShielding: 30,
};

const SUBSYSTEM_META: Record<
  SubsystemId,
  { icon: string; color: string; description: string }
> = {
  powerGrid: {
    icon: "⚡",
    color: "#60a5fa",
    description: "Solar arrays, RTG & battery reserves",
  },
  lifeSupport: {
    icon: "🌱",
    color: "#34d399",
    description: "O₂ scrubbing, water recycling & hydroponics",
  },
  radiationShielding: {
    icon: "🛡️",
    color: "#f472b6",
    description: "Magnetic/water-wall & thermal management",
  },
};

interface GameScreenProps {
  environment: MissionEnvironment;
  onMissionEnd: (finalState: GameState) => void;
  onShowNasaData: () => void;
}

export default function GameScreen({
  environment,
  onMissionEnd,
  onShowNasaData,
}: GameScreenProps) {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(environment)
  );
  const [kidMode, setKidMode] = useState(true);
  const [phase, setPhase] = useState<"allocate" | "result">("allocate");
  const [lastResult, setLastResult] = useState<ReturnType<typeof processTurn>["result"] | null>(null);

  const currentTurn = gameState.currentTurn + 1;
  const effectiveBudget = getEffectivePowerBudget(environment, currentTurn);
  const currentEvent = environment.turnEvents[currentTurn - 1];

  const [allocation, setAllocation] = useState<PowerAllocation>(() =>
    getDefaultAllocation(effectiveBudget)
  );

  // Recalculate budget when turn changes
  useEffect(() => {
    if (phase === "allocate") {
      const budget = getEffectivePowerBudget(environment, gameState.currentTurn + 1);
      setAllocation(getDefaultAllocation(budget));
    }
  }, [gameState.currentTurn, phase, environment]);

  const totalAllocated = allocation.powerGrid + allocation.lifeSupport + allocation.radiationShielding;
  const budgetRemaining = effectiveBudget - totalAllocated;
  const hints = getTradeOffHints(allocation, effectiveBudget);

  const handleSliderChange = useCallback(
    (id: SubsystemId, value: number) => {
      setAllocation((prev) => ({ ...prev, [id]: value }));
    },
    []
  );

  const handleConfirmTurn = useCallback(() => {
    const { nextState, result } = processTurn(gameState, allocation);
    setGameState(nextState);
    setLastResult(result);
    setPhase("result");

    if (result.outcome !== "ongoing") {
      setTimeout(() => onMissionEnd(nextState), 2500);
    }
  }, [gameState, allocation, onMissionEnd]);

  const handleNextTurn = useCallback(() => {
    setPhase("allocate");
    setLastResult(null);
  }, []);

  const subsystemIds: SubsystemId[] = ["powerGrid", "lifeSupport", "radiationShielding"];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${environment.backgroundGradient} flex flex-col`}>
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-black/40 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{environment.emoji}</span>
            <div>
              <h1 className="text-sm font-black text-white leading-tight">
                Outpost Commander
              </h1>
              <p className="text-xs text-slate-400">{environment.name} · {environment.subtitle}</p>
            </div>
          </div>

          {/* Turn progress */}
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL_TURNS }).map((_, i) => {
              const turnNum = i + 1;
              const done = turnNum < currentTurn || (phase === "result" && turnNum === currentTurn);
              void done; // used for styling reference only
              const active = turnNum === currentTurn;
              const result = gameState.history[i];
              const dotColor = result
                ? result.missionScorePercent >= 70
                  ? "bg-emerald-400"
                  : result.missionScorePercent >= 45
                  ? "bg-yellow-400"
                  : "bg-red-400"
                : active
                ? "bg-blue-400"
                : "bg-white/15";

              return (
                <div
                  key={i}
                  className={`rounded-full transition-all ${
                    active ? "w-5 h-5 ring-2 ring-blue-400 ring-offset-1 ring-offset-black/50" : "w-3 h-3"
                  } ${dotColor}`}
                  title={`Turn ${turnNum}`}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* Kid mode toggle */}
            <button
              onClick={() => setKidMode((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
              title="Toggle Kid / Expert Mode"
            >
              {kidMode ? <ToggleLeft size={15} className="text-blue-400" /> : <ToggleRight size={15} className="text-emerald-400" />}
              {kidMode ? "Kid Mode" : "Expert Mode"}
            </button>

            <button
              onClick={onShowNasaData}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-blue-300 transition-colors"
              title="About the NASA Data"
            >
              <Satellite size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column — subsystem health */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Info size={14} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {kidMode ? "Outpost Systems" : "System Health"}
            </span>
          </div>
          {subsystemIds.map((id) => {
            const sys =
              phase === "result" && lastResult
                ? lastResult.subsystems[id]
                : gameState.subsystems[id];
            const meta = SUBSYSTEM_META[id];
            return (
              <SubsystemCard
                key={id}
                label={sys.label}
                icon={meta.icon}
                health={sys.health}
                wearAccumulated={sys.wearAccumulated}
                powerDrawMW={sys.powerDrawMW}
                statusMessage={sys.statusMessage}
                kidFriendlyStatus={sys.kidFriendlyStatus}
                kidMode={kidMode}
                accentColor={meta.color}
              />
            );
          })}

          {/* Crew panel */}
          <CrewPanel
            crew={
              phase === "result" && lastResult
                ? lastResult.crew
                : gameState.crew
            }
            kidMode={kidMode}
          />
        </div>

        {/* Centre column — power allocation + event */}
        <div className="flex flex-col gap-4">
          {/* Current event */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`event-${currentTurn}-${phase}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-panel p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                    Turn {phase === "result" && lastResult ? lastResult.turn : currentTurn} of {TOTAL_TURNS}
                  </p>
                  <h2 className="text-base font-black text-white">
                    {currentEvent.label}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {kidMode
                      ? currentEvent.kidFriendlyDescription
                      : currentEvent.description}
                  </p>
                </div>
              </div>

              {/* Event impact badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {currentEvent.powerDeltaMW !== 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      currentEvent.powerDeltaMW < 0
                        ? "bg-red-500/20 text-red-300"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    ⚡ Power: {currentEvent.powerDeltaMW > 0 ? "+" : ""}
                    {currentEvent.powerDeltaMW} MW
                  </span>
                )}
                {currentEvent.radiationSpikeMultiplier !== 1 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      currentEvent.radiationSpikeMultiplier > 1
                        ? "bg-orange-500/20 text-orange-300"
                        : "bg-green-500/20 text-green-300"
                    }`}
                  >
                    ☢ Radiation: ×{currentEvent.radiationSpikeMultiplier}
                  </span>
                )}
                {currentEvent.lifeSupportStressFactor !== 1 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      currentEvent.lifeSupportStressFactor > 1
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-sky-500/20 text-sky-300"
                    }`}
                  >
                    🌱 LS Stress: ×{currentEvent.lifeSupportStressFactor}
                  </span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Budget indicator */}
          <div className="glass-panel p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">
                {kidMode ? "Available Power This Turn" : "Effective Power Budget"}
              </p>
              <p className="text-2xl font-mono font-black text-white">
                {effectiveBudget}{" "}
                <span className="text-sm text-slate-400 font-normal">MW</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Unallocated</p>
              <p
                className={`text-xl font-mono font-bold ${
                  budgetRemaining < 0
                    ? "text-red-400"
                    : budgetRemaining < 5
                    ? "text-yellow-400"
                    : "text-emerald-400"
                }`}
              >
                {budgetRemaining} MW
              </p>
            </div>
          </div>

          {/* Power sliders — only during allocation phase */}
          <AnimatePresence>
            {phase === "allocate" && (
              <motion.div
                className="flex flex-col gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {subsystemIds.map((id) => {
                  const meta = SUBSYSTEM_META[id];
                  return (
                    <PowerSlider
                      key={id}
                      subsystemId={id}
                      label={gameState.subsystems[id].label}
                      icon={meta.icon}
                      description={kidMode ? undefined as unknown as string : meta.description}
                      allocated={allocation[id]}
                      baseline={SUBSYSTEM_BASELINE[id]}
                      maxMW={effectiveBudget}
                      color={meta.color}
                      onChange={(v) => handleSliderChange(id, v)}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirm button */}
          {phase === "allocate" && (
            <motion.button
              onClick={handleConfirmTurn}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-base py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/40"
              whileTap={{ scale: 0.97 }}
            >
              <ChevronRight size={18} />
              {kidMode ? "Send Power & Advance!" : `Confirm Turn ${currentTurn} Allocation`}
            </motion.button>
          )}

          {/* Next turn button (after result phase) */}
          {phase === "result" && lastResult && lastResult.outcome === "ongoing" && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleNextTurn}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-base py-3.5 rounded-xl transition-all"
            >
              <ChevronRight size={18} />
              {kidMode ? `Start Turn ${(lastResult?.turn ?? 0) + 1}!` : `Proceed to Turn ${(lastResult?.turn ?? 0) + 1}`}
            </motion.button>
          )}
        </div>

        {/* Right column — alerts + trade-off hints */}
        <div className="flex flex-col gap-4">
          {/* Trade-off hints (allocation phase) */}
          {phase === "allocate" && (
            <div className="glass-panel p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
                {kidMode ? "⚖️ Engineering Hints" : "⚖️ Trade-Off Analysis"}
              </p>
              <div className="flex flex-col gap-2">
                {hints.map((hint, i) => (
                  <div key={i} className="bg-white/5 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-300 leading-relaxed">{hint}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          {phase === "result" && lastResult && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
              >
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  {kidMode ? "🚨 Mission Alerts" : "Mission Alerts"}
                </p>
                <AlertBanner alerts={lastResult.alerts} kidMode={kidMode} />

                {/* Turn summary */}
                <div className="glass-panel p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                    Turn Summary
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {kidMode
                      ? lastResult.kidNarrativeSummary
                      : lastResult.turnNarrativeSummary}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                    <span className="text-xs text-slate-400">Mission Score</span>
                    <span
                      className={`text-lg font-mono font-black ${
                        lastResult.missionScorePercent >= 70
                          ? "text-emerald-400"
                          : lastResult.missionScorePercent >= 45
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {lastResult.missionScorePercent} / 100
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Mission history (mini) */}
          {gameState.history.length > 0 && (
            <div className="glass-panel p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
                {kidMode ? "Past Turns" : "Turn History"}
              </p>
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {[...gameState.history].reverse().map((r) => (
                  <div
                    key={r.turn}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0"
                  >
                    <span className="text-slate-500 font-mono">T{r.turn}</span>
                    <span className="flex-1 text-slate-400 mx-2 truncate">{r.event.label}</span>
                    <span
                      className={`font-mono font-bold ${
                        r.missionScorePercent >= 70
                          ? "text-emerald-400"
                          : r.missionScorePercent >= 45
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {r.missionScorePercent}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
