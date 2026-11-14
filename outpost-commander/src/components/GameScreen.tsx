// ============================================================
// GameScreen — the main 10-turn mission gameplay view
// Powered by OutpostVisualizer & ControlDeck
// ============================================================
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Award, History } from "lucide-react";

import OutpostVisualizer from "./OutpostVisualizer";
import ControlDeck from "./ControlDeck";
import AlertBanner from "./AlertBanner";

import type { MissionEnvironment } from "../data/nasaConstants";
import { TOTAL_TURNS } from "../data/nasaConstants";
import {
  createInitialGameState,
  processTurn,
  getDefaultAllocation,
  getEffectivePowerBudget,
  type GameState,
  type PowerAllocation,
} from "../engine/simulationEngine";

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
  const [phase, setPhase] = useState<"allocate" | "result">("allocate");
  const [lastResult, setLastResult] = useState<
    ReturnType<typeof processTurn>["result"] | null
  >(null);

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

  const handleAllocationChange = useCallback((next: PowerAllocation) => {
    setAllocation(next);
  }, []);

  const handleConfirmTurn = useCallback(() => {
    const { nextState, result } = processTurn(gameState, allocation);
    setGameState(nextState);
    setLastResult(result);
    setPhase("result");

    if (result.outcome !== "ongoing") {
      setTimeout(() => onMissionEnd(nextState), 2800);
    }
  }, [gameState, allocation, onMissionEnd]);

  const handleNextTurn = useCallback(() => {
    setPhase("allocate");
    setLastResult(null);
  }, []);

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${environment.backgroundGradient} text-slate-100 flex flex-col justify-between`}
    >
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-5">
        <AnimatePresence mode="wait">
          {phase === "allocate" && (
            <motion.div
              key={`allocate-${currentTurn}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              <ControlDeck
                environment={environment}
                currentTurn={currentTurn}
                totalTurns={TOTAL_TURNS}
                effectiveBudgetMW={effectiveBudget}
                subsystems={gameState.subsystems}
                crew={gameState.crew}
                allocation={allocation}
                onAllocationChange={handleAllocationChange}
                onCommitTurn={handleConfirmTurn}
                onShowNasaData={onShowNasaData}
                currentEvent={currentEvent}
              >
                {/* Live Responsive Habitat Cross-Section Visualizer */}
                <OutpostVisualizer
                  environment={environment}
                  subsystems={gameState.subsystems}
                  allocation={allocation}
                  effectiveBudgetMW={effectiveBudget}
                  currentEvent={currentEvent}
                  crew={gameState.crew}
                />
              </ControlDeck>
            </motion.div>
          )}

          {phase === "result" && lastResult && (
            <motion.div
              key={`result-${lastResult.turn}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-5"
            >
              {/* Habitat Cross-Section after Sol Events */}
              <OutpostVisualizer
                environment={environment}
                subsystems={lastResult.subsystems}
                allocation={lastResult.allocation}
                effectiveBudgetMW={lastResult.powerBudgetMW}
                currentEvent={lastResult.event}
                crew={lastResult.crew}
              />

              {/* Turn Outcome & Mission Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Sol Summary & Score */}
                <div className="lg:col-span-2 rounded-2xl bg-[#0B1120] border-2 border-cyan-800/40 p-5 shadow-2xl flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#06B6D4]">
                        SOL {lastResult.turn} DEBRIEF
                      </span>
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-600/40 text-blue-300 text-xs font-mono font-bold">
                        <Award className="w-3.5 h-3.5 text-yellow-400" />
                        Score: {lastResult.missionScorePercent}/100
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {lastResult.event.label}
                    </h2>
                    <p className="text-sm text-slate-200 mt-2 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                      {lastResult.kidNarrativeSummary}
                    </p>
                  </div>

                  {/* Sol Outcome Subsystem Metrics */}
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <p className="text-[10px] font-mono text-slate-400 uppercase">
                        Life Support
                      </p>
                      <p className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                        {lastResult.subsystems.lifeSupport.health.toFixed(0)}%
                      </p>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <p className="text-[10px] font-mono text-slate-400 uppercase">
                        Shield Integrity
                      </p>
                      <p className="text-base sm:text-lg font-black text-cyan-400 font-mono">
                        {lastResult.subsystems.radiationShielding.health.toFixed(0)}%
                      </p>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <p className="text-[10px] font-mono text-slate-400 uppercase">
                        Power Reserves
                      </p>
                      <p className="text-base sm:text-lg font-black text-blue-400 font-mono">
                        {lastResult.subsystems.powerGrid.health.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Proceed Button */}
                  {lastResult.outcome === "ongoing" && (
                    <div className="pt-2">
                      <motion.button
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={handleNextTurn}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50"
                      >
                        <span>Start Sol {lastResult.turn + 1} Operations</span>
                        <ChevronRight className="w-5 h-5" />
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Alerts Column */}
                <div className="rounded-2xl bg-[#0B1120] border-2 border-slate-800 p-5 shadow-2xl flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                      Active Telemetry Alerts
                    </span>
                  </div>
                  <AlertBanner alerts={lastResult.alerts} kidMode={true} />

                  {/* Mini History */}
                  {gameState.history.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                        <History className="w-3.5 h-3.5" />
                        <span>Previous Sols</span>
                      </div>
                      <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                        {[...gameState.history].reverse().slice(1).map((h) => (
                          <div
                            key={h.turn}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-900/60"
                          >
                            <span className="font-mono text-cyan-400 font-bold">
                              Sol {h.turn}
                            </span>
                            <span className="text-slate-300 truncate max-w-[120px]">
                              {h.event.label}
                            </span>
                            <span className="font-mono text-emerald-400 font-bold">
                              {h.missionScorePercent}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
