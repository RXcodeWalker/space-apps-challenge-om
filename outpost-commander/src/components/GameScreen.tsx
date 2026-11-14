// ============================================================
// GameScreen — Outpost Commander 10-Sol Mission Gameplay
// Features:
// 1. Dynamic NASA-Grounded Incident Triggering & IncidentModal
// 2. OutpostVisualizer & Tactile ControlDeck
// 3. Sol Debrief View with Active Telemetry & Alerts
// 4. End-of-Mission Engineering Debrief Modal (Rank, SVG Chart, Personalized Insights)
// 5. NASA Data Modal accessible from the header at any time
// ============================================================
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Award,
  History,
  Database,
  Radio,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
} from "lucide-react";

import OutpostVisualizer from "./OutpostVisualizer";
import ControlDeck from "./ControlDeck";
import AlertBanner from "./AlertBanner";
import IncidentModal from "./IncidentModal";
import MissionDebriefModal from "./MissionDebriefModal";
import QuickTutorialOverlay, { TUTORIAL_STORAGE_KEY } from "./QuickTutorialOverlay";
import { soundEffects, useSoundMuted } from "../utils/soundEffects";

import type { MissionEnvironment } from "../data/nasaConstants";
import { TOTAL_TURNS } from "../data/nasaConstants";
import {
  createInitialGameState,
  processTurn,
  getDefaultAllocation,
  getEffectivePowerBudget,
  applyIncidentChoice,
  type GameState,
  type PowerAllocation,
} from "../engine/simulationEngine";
import {
  getIncidentForSol,
  type IncidentCard,
  type IncidentChoice,
} from "../data/incidentCards";

interface GameScreenProps {
  environment: MissionEnvironment;
  onMissionEnd: (finalState: GameState) => void;
  onShowNasaData: () => void;
  onSwitchPlanet?: () => void;
}

export default function GameScreen({
  environment,
  onMissionEnd,
  onShowNasaData,
  onSwitchPlanet,
}: GameScreenProps) {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(environment)
  );
  const [phase, setPhase] = useState<"allocate" | "result">("allocate");
  const [lastResult, setLastResult] = useState<
    ReturnType<typeof processTurn>["result"] | null
  >(null);

  // Dynamic Incident State
  const [activeIncident, setActiveIncident] = useState<IncidentCard | null>(null);
  const [dismissedIncidents, setDismissedIncidents] = useState<Record<number, boolean>>({});

  // End-of-Mission Engineering Debrief State
  const [showDebriefModal, setShowDebriefModal] = useState<boolean>(false);

  // Audio mute state and Tutorial state
  const [isMuted, toggleMute] = useSoundMuted();
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(TUTORIAL_STORAGE_KEY) !== "true";
    } catch {
      return false;
    }
  });

  const currentTurn = gameState.currentTurn + 1;

  // Active power modifiers from incidents
  const modifierPowerDelta = (gameState.activeModifiers || []).reduce(
    (sum, m) => sum + (m.powerDeltaMW || 0),
    0
  );
  const effectiveBudget = getEffectivePowerBudget(
    environment,
    currentTurn,
    modifierPowerDelta
  );
  const currentEvent = environment.turnEvents[currentTurn - 1];

  const [allocation, setAllocation] = useState<PowerAllocation>(() =>
    getDefaultAllocation(effectiveBudget)
  );

  // Check for dynamic incidents on Sol start
  useEffect(() => {
    if (phase === "allocate" && currentTurn <= TOTAL_TURNS) {
      const incident = getIncidentForSol(environment.id, currentTurn);
      const alreadyHandled = gameState.incidentHistory?.some(
        (h) => h.sol === currentTurn && h.incidentId === incident?.id
      );

      if (incident && !alreadyHandled && !dismissedIncidents[currentTurn]) {
        setActiveIncident(incident);
        soundEffects.playIncidentAlert();
      }
    }
  }, [currentTurn, environment.id, phase, gameState.incidentHistory, dismissedIncidents]);

  // Recalculate budget when turn or modifiers change
  useEffect(() => {
    if (phase === "allocate") {
      const modPower = (gameState.activeModifiers || []).reduce(
        (sum, m) => sum + (m.powerDeltaMW || 0),
        0
      );
      const budget = getEffectivePowerBudget(
        environment,
        gameState.currentTurn + 1,
        modPower
      );
      setAllocation(getDefaultAllocation(budget));
    }
  }, [gameState.currentTurn, phase, environment, gameState.activeModifiers]);

  const handleAllocationChange = useCallback((next: PowerAllocation) => {
    setAllocation(next);
  }, []);

  // Handle Incident Directive Choice
  const handleSelectIncidentChoice = useCallback(
    (choice: IncidentChoice) => {
      if (!activeIncident) return;
      soundEffects.playButtonClick();
      const updatedState = applyIncidentChoice(gameState, activeIncident, choice);
      setGameState(updatedState);
      setDismissedIncidents((prev) => ({ ...prev, [currentTurn]: true }));
      setActiveIncident(null);

      // Re-evaluate budget immediately with new choice
      const modPower = (updatedState.activeModifiers || []).reduce(
        (sum, m) => sum + (m.powerDeltaMW || 0),
        0
      );
      const newBudget = getEffectivePowerBudget(environment, currentTurn, modPower);
      setAllocation(getDefaultAllocation(newBudget));
    },
    [activeIncident, gameState, environment, currentTurn]
  );

  // Advance Sol Turn
  const handleConfirmTurn = useCallback(() => {
    soundEffects.playTurnChime();
    const { nextState, result } = processTurn(gameState, allocation);
    setGameState(nextState);
    setLastResult(result);
    setPhase("result");

    // Check for mission completion or early critical threshold
    if (result.outcome !== "ongoing") {
      soundEffects.playVictoryChord();
      setTimeout(() => {
        setShowDebriefModal(true);
      }, 1400);
    }
  }, [gameState, allocation]);

  const handleNextTurn = useCallback(() => {
    soundEffects.playTurnChime();
    setPhase("allocate");
    setLastResult(null);
  }, []);

  // One-Click Play Again Handler
  const handlePlayAgain = useCallback(() => {
    const freshState = createInitialGameState(environment);
    setGameState(freshState);
    setPhase("allocate");
    setLastResult(null);
    setActiveIncident(null);
    setDismissedIncidents({});
    setShowDebriefModal(false);
    const initialBudget = getEffectivePowerBudget(environment, 1);
    setAllocation(getDefaultAllocation(initialBudget));
  }, [environment]);

  // Switch Planet Handler
  const handleSwitchPlanetAction = useCallback(() => {
    setShowDebriefModal(false);
    if (onSwitchPlanet) {
      onSwitchPlanet();
    } else {
      onMissionEnd(gameState);
    }
  }, [onSwitchPlanet, onMissionEnd, gameState]);

  // Last incident chosen this sol (if any)
  const currentSolIncidentChoice = gameState.incidentHistory?.find(
    (h) => h.sol === currentTurn
  );

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${environment.backgroundGradient} text-slate-100 flex flex-col justify-between`}
    >
      {/* Dynamic Mid-Mission Incident Modal */}
      {activeIncident && (
        <IncidentModal
          incident={activeIncident}
          isOpen={activeIncident !== null}
          onSelectChoice={handleSelectIncidentChoice}
        />
      )}

      {/* 3-Step Spotlight Quick Tutorial */}
      <QuickTutorialOverlay
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {/* End-of-Mission Engineering Debrief Modal */}
      {showDebriefModal && (
        <MissionDebriefModal
          isOpen={showDebriefModal}
          gameState={gameState}
          environment={environment}
          onPlayAgain={handlePlayAgain}
          onSwitchPlanet={handleSwitchPlanetAction}
          onShowNasaData={onShowNasaData}
        />
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-5">
        <AnimatePresence mode="wait">
          {/* ========================================================= */}
          {/* 1. ALLOCATION PHASE: CONTROL DECK & VISUALIZER */}
          {/* ========================================================= */}
          {phase === "allocate" && (
            <motion.div
              key={`allocate-${currentTurn}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              {/* Active Incident Notification Banner if resolved this Sol */}
              {currentSolIncidentChoice && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="text-cyan-300 font-bold">
                      ACTIVE DIRECTIVE (SOL {currentTurn}):
                    </span>
                    <span className="text-white font-medium">
                      {currentSolIncidentChoice.choiceLabel}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    {currentSolIncidentChoice.tradeOffSummary}
                  </span>
                </div>
              )}

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
                onOpenTutorial={() => setIsTutorialOpen(true)}
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

          {/* ========================================================= */}
          {/* 2. RESULT PHASE: SOL DEBRIEF & TELEMETRY */}
          {/* ========================================================= */}
          {phase === "result" && lastResult && (
            <motion.div
              key={`result-${lastResult.turn}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              {/* Header Telemetry Bar (accessible NASA Data anytime) */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#090E1A] border border-cyan-900/40 shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold tracking-wider text-[#06B6D4] uppercase">
                    MISSION SOL {lastResult.turn} OF {TOTAL_TURNS}
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    {environment.name} · {environment.subtitle}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mute/Unmute Toggle */}
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono transition-colors ${
                      isMuted
                        ? "bg-rose-950/40 border-rose-600/40 text-rose-300 hover:bg-rose-900/40"
                        : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-300"
                    }`}
                    title={isMuted ? "Audio Muted (Click to Unmute)" : "Audio Active (Click to Mute)"}
                  >
                    {isMuted ? (
                      <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span className="hidden sm:inline">{isMuted ? "Muted" : "Sound"}</span>
                  </button>

                  {/* Tutorial Help Button */}
                  <button
                    type="button"
                    onClick={() => setIsTutorialOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-bold font-mono transition-colors"
                    title="Review 3-Step Mission Tutorial"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span className="hidden sm:inline">Tutorial</span>
                  </button>

                  {/* NASA Data Header Button */}
                  <button
                    type="button"
                    onClick={onShowNasaData}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-bold font-mono transition-colors"
                  >
                    <Database className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>NASA Data</span>
                  </button>

                  {/* View Full Debrief if mission finished */}
                  {lastResult.outcome !== "ongoing" && (
                    <button
                      type="button"
                      onClick={() => setShowDebriefModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold font-mono shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Engineering Debrief</span>
                    </button>
                  )}
                </div>
              </div>

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

                  {/* Proceed Button or Debrief Trigger */}
                  {lastResult.outcome === "ongoing" ? (
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
                  ) : (
                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <motion.button
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => setShowDebriefModal(true)}
                        className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/50"
                      >
                        <Sparkles className="w-5 h-5" />
                        <span>Open NASA Engineering Debrief</span>
                      </motion.button>

                      <button
                        type="button"
                        onClick={handlePlayAgain}
                        className="px-5 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Play Again</span>
                      </button>
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
