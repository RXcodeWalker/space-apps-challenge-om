// ============================================================
// GameScreen — Outpost Commander 10-Sol Mission Gameplay
// Features:
// 1. Dynamic NASA-Grounded Incident Triggering & IncidentModal
// 2. OutpostVisualizer & Tactile ControlDeck
// 3. Sol Debrief View with Active Telemetry & Alerts
// 4. End-of-Mission Engineering Debrief Modal (Rank, SVG Chart, Personalized Insights)
// 5. NASA Data Modal accessible from the header at any time
// ============================================================
import { useState, useCallback, useEffect, useRef } from "react";
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
  Sliders,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Search,
  Eye,
} from "lucide-react";

import { useAccessibility } from "../utils/AccessibilityContext";

import OutpostVisualizer from "./OutpostVisualizer";
import ControlDeck from "./ControlDeck";
import AlertBanner from "./AlertBanner";
import IncidentModal from "./IncidentModal";
import CrewPanel from "./CrewPanel";
import MissionDebriefModal from "./MissionDebriefModal";
import RootCauseModal from "./RootCauseModal";
import {
  type RootCauseProfile,
  type RootCauseFailureType,
  type RootCauseEvaluationContext,
  resolveRootCauseForAlert,
  BROWNOUT_OVERBUDGET,
  LIFE_SUPPORT_FAILURE,
  RADIATION_SHIELD_FAILURE,
  BROWNOUT_BATTERY_DEPLETION,
} from "../data/rootCauseData";
import QuickTutorialOverlay, { TUTORIAL_STORAGE_KEY } from "./QuickTutorialOverlay";
import LanguageSelector from "./LanguageSelector";
import AmbientAudioModal from "./AmbientAudioModal";
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
  processTurn,
  getDefaultAllocation,
  getEffectivePowerBudget,
  applyIncidentChoice,
  type GameState,
  type PowerAllocation,
  type DifficultyTier,
} from "../engine/simulationEngine";
import { DIFFICULTY_PRESETS } from "../data/difficultyTiers";
import {
  getIncidentForSol,
  type IncidentCard,
  type IncidentChoice,
} from "../data/incidentCards";
import {
  createSol9CrisisGameState,
  getSpeIncidentForEnvironment,
} from "../utils/judgeDemoData";

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
  const { t } = useTranslation();
  const [gameState, setGameState] = useState<GameState>(() =>
    initialGameStateOverride || createInitialGameState(environment, difficulty, missionSeed, scenario)
  );
  const [phase, setPhase] = useState<"allocate" | "result">("allocate");
  const [lastResult, setLastResult] = useState<
    ReturnType<typeof processTurn>["result"] | null
  >(null);

  // Dynamic Incident State
  const [activeIncident, setActiveIncident] = useState<IncidentCard | null>(() => {
    if (initialGameStateOverride && initialGameStateOverride.currentTurn === 8) {
      return getSpeIncidentForEnvironment(environment);
    }
    return null;
  });
  const [dismissedIncidents, setDismissedIncidents] = useState<Record<number, boolean>>({});

  // End-of-Mission Engineering Debrief State
  const [showDebriefModal, setShowDebriefModal] = useState<boolean>(false);

  // Audio mute state and Tutorial state
  const [isMuted, toggleMute] = useSoundMuted();
  const { colorblindMode, toggleColorblindMode, shapes } = useAccessibility();
  const [isAudioModalOpen, setIsAudioModalOpen] = useState<boolean>(false);
  const [isCrewModalOpen, setIsCrewModalOpen] = useState<boolean>(false);
  const [selectedRootCauseProfile, setSelectedRootCauseProfile] = useState<RootCauseProfile | null>(null);

  // Rapid Jump to Sol 9 Crisis handler for Hackathon Judges
  const handleJumpToSol9Crisis = useCallback(() => {
    soundEffects.playIncidentAlert();
    ambientAudio.triggerGeigerBurst(4.0, 95);

    const crisisState = createSol9CrisisGameState(
      environment,
      gameState.difficulty,
      gameState.missionSeed,
      gameState.scenario
    );

    setGameState(crisisState);
    setPhase("allocate");
    setDismissedIncidents((prev) => {
      const copy = { ...prev };
      delete copy[9];
      return copy;
    });

    const speIncident = getSpeIncidentForEnvironment(environment);
    setActiveIncident(speIncident);

    // Calculate budget for Sol 9 with brownout modifier
    const modPower = (crisisState.activeModifiers || []).reduce(
      (sum, m) => sum + (m.powerDeltaMW || 0),
      0
    );
    const budget = getEffectivePowerBudget(
      environment,
      9,
      modPower,
      crisisState.difficulty,
      crisisState.missionSeed,
      crisisState.scenario
    );
    setAllocation(getDefaultAllocation(budget, crisisState.difficulty));
  }, [environment, gameState.difficulty, gameState.missionSeed, gameState.scenario]);

  useEffect(() => {
    if (sol9CrisisTrigger && sol9CrisisTrigger > 0) {
      handleJumpToSol9Crisis();
    }
  }, [sol9CrisisTrigger, handleJumpToSol9Crisis]);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(TUTORIAL_STORAGE_KEY) !== "true";
    } catch {
      return false;
    }
  });

  const lastAnnouncedSolRef = useRef<number>(0);

  // Cleanup speech synthesis on component unmount
  useEffect(() => {
    return () => {
      cancelCapComSpeech();
    };
  }, []);

  // Cancel speech immediately when user mutes
  useEffect(() => {
    if (isMuted) {
      cancelCapComSpeech();
    }
  }, [isMuted]);

  const currentTurn = gameState.currentTurn + 1;

  // Active power modifiers from incidents
  const modifierPowerDelta = (gameState.activeModifiers || []).reduce(
    (sum, m) => sum + (m.powerDeltaMW || 0),
    0
  );
  const effectiveBudget = getEffectivePowerBudget(
    environment,
    currentTurn,
    modifierPowerDelta,
    gameState.difficulty,
    gameState.missionSeed,
    gameState.scenario
  );
  const currentEvent =
    gameState.scenario?.turnEvents
      ? gameState.scenario.turnEvents[currentTurn - 1]
      : environment.turnEvents[currentTurn - 1];

  const [allocation, setAllocation] = useState<PowerAllocation>(() =>
    getDefaultAllocation(effectiveBudget, gameState.difficulty)
  );

  // Check for dynamic incidents on Sol start (governed deterministically by missionSeed)
  useEffect(() => {
    if (phase === "allocate" && currentTurn <= TOTAL_TURNS) {
      const incident = getIncidentForSol(
        environment.id,
        currentTurn,
        gameState.missionSeed
      );
      const alreadyHandled = gameState.incidentHistory?.some(
        (h) => h.sol === currentTurn && h.incidentId === incident?.id
      );

      if (incident && !alreadyHandled && !dismissedIncidents[currentTurn]) {
        setActiveIncident(incident);
        soundEffects.playIncidentAlert();

        // Announce hazardous anomaly over CapCom radio
        announceHazard(incident.title);

        // Trigger procedural audio reactions based on incident nature
        const lowerId = incident.id.toLowerCase();
        const lowerTitle = incident.title.toLowerCase();
        if (
          lowerId.includes("solar") ||
          lowerId.includes("radiation") ||
          lowerId.includes("flare") ||
          lowerTitle.includes("solar") ||
          lowerTitle.includes("radiation")
        ) {
          ambientAudio.triggerGeigerBurst(3.5, 95);
        } else {
          ambientAudio.triggerAirlock(0.75);
        }
      }
    }
  }, [currentTurn, environment.id, phase, gameState.incidentHistory, dismissedIncidents, gameState.missionSeed]);

  // Announce Sol start once incident (if any) is cleared or if no incident occurs
  useEffect(() => {
    if (phase === "allocate" && currentTurn <= TOTAL_TURNS && !activeIncident) {
      const incident = getIncidentForSol(
        environment.id,
        currentTurn,
        gameState.missionSeed
      );
      const alreadyHandled = gameState.incidentHistory?.some(
        (h) => h.sol === currentTurn && h.incidentId === incident?.id
      );
      const isIncidentPending =
        incident && !alreadyHandled && !dismissedIncidents[currentTurn];

      // If an incident is waiting to pop up, let the hazard announcement take priority
      if (isIncidentPending) return;

      if (lastAnnouncedSolRef.current !== currentTurn) {
        lastAnnouncedSolRef.current = currentTurn;
        const weatherDesc = currentEvent?.label
          ? `${currentEvent.label}. Solar array operating at ${Math.round(effectiveBudget)} megawatts.`
          : `Solar array operating at ${Math.round(effectiveBudget)} megawatts.`;
        announceSolStart(currentTurn, weatherDesc);
      }
    }
  }, [
    phase,
    currentTurn,
    activeIncident,
    environment.id,
    gameState.missionSeed,
    gameState.incidentHistory,
    dismissedIncidents,
    currentEvent?.label,
    effectiveBudget,
  ]);

  // Synchronize ambient procedural audio with real-time habitat telemetry
  useEffect(() => {
    const radMultiplier = currentEvent?.radiationSpikeMultiplier ?? 1.0;
    const baselineLS = gameState.difficulty === "cadet" ? 25 : 35;
    const baselineRad = gameState.difficulty === "cadet" ? 20 : 30;

    ambientAudio.updateTelemetry({
      environmentId: environment.id,
      radiationMultiplier: radMultiplier,
      lifeSupportHealth: gameState.subsystems.lifeSupport.health,
      lifeSupportPowerRatio: allocation.lifeSupport / baselineLS,
      shieldingHealth: gameState.subsystems.radiationShielding.health,
      shieldingPowerRatio: allocation.radiationShielding / baselineRad,
    });
  }, [
    environment.id,
    currentEvent?.radiationSpikeMultiplier,
    gameState.subsystems.lifeSupport.health,
    gameState.subsystems.radiationShielding.health,
    allocation.lifeSupport,
    allocation.radiationShielding,
    gameState.difficulty,
  ]);

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
        modPower,
        gameState.difficulty,
        gameState.missionSeed,
        gameState.scenario
      );
      setAllocation(getDefaultAllocation(budget, gameState.difficulty));
    }
  }, [gameState.currentTurn, phase, environment, gameState.activeModifiers, gameState.difficulty, gameState.missionSeed, gameState.scenario]);

  const handleAllocationChange = useCallback((next: PowerAllocation) => {
    setAllocation(next);
  }, []);

  // Handle Incident Directive Choice & Optional Crew Specialist Deployment
  const handleSelectIncidentChoice = useCallback(
    (choice: IncidentChoice, specialistRepair?: SpecialistRepairOption) => {
      if (!activeIncident) return;
      cancelCapComSpeech();
      soundEffects.playButtonClick();
      ambientAudio.triggerAirlock(0.8);
      const updatedState = applyIncidentChoice(
        gameState,
        activeIncident,
        choice,
        specialistRepair
      );
      setGameState(updatedState);
      setDismissedIncidents((prev) => ({ ...prev, [currentTurn]: true }));
      setActiveIncident(null);

      // Re-evaluate budget immediately with new choice
      const modPower = (updatedState.activeModifiers || []).reduce(
        (sum, m) => sum + (m.powerDeltaMW || 0),
        0
      );
      const newBudget = getEffectivePowerBudget(
        environment,
        currentTurn,
        modPower,
        updatedState.difficulty,
        updatedState.missionSeed,
        updatedState.scenario
      );
      setAllocation(getDefaultAllocation(newBudget, updatedState.difficulty));
    },
    [activeIncident, gameState, environment, currentTurn]
  );

  // Advance Sol Turn
  const handleConfirmTurn = useCallback(() => {
    cancelCapComSpeech();
    soundEffects.playTurnChime();
    ambientAudio.triggerAirlock(0.7);
    const { nextState, result } = processTurn(gameState, allocation);

    // If radiation spike occurred, surge Geiger clicks
    if (result.event.radiationSpikeMultiplier > 1.6) {
      ambientAudio.triggerGeigerBurst(3.2, 85);
    }

    setGameState(nextState);
    setLastResult(result);
    setPhase("result");

    // Check for critical brownout or hydroponics harvest alerts
    const totalAlloc =
      allocation.powerGrid +
      allocation.lifeSupport +
      allocation.radiationShielding +
      allocation.foodProduction;
    const isBrownout =
      totalAlloc > result.powerBudgetMW ||
      result.subsystems.powerGrid.health < 35 ||
      result.alerts.some(
        (a) =>
          a.subsystem === "power" ||
          a.headline.toLowerCase().includes("over-budget") ||
          a.headline.toLowerCase().includes("brownout")
      );

    const isHarvest =
      nextState.crew.harvestYieldKg > gameState.crew.harvestYieldKg ||
      result.crew.recentMoraleEvents?.some(
        (e) => e.sol === result.turn && e.id.startsWith("harvest-")
      );

    if (isBrownout) {
      announceBrownout();
    } else if (isHarvest) {
      announceHarvest();
    }

    // Check for mission completion or early critical threshold
    if (result.outcome !== "ongoing") {
      soundEffects.playVictoryChord();
      setTimeout(() => {
        setShowDebriefModal(true);
      }, 1400);
    }
  }, [gameState, allocation]);

  const handleNextTurn = useCallback(() => {
    cancelCapComSpeech();
    soundEffects.playTurnChime();
    setPhase("allocate");
    setLastResult(null);
  }, []);

  // One-Click Play Again Handler
  const handlePlayAgain = useCallback(() => {
    cancelCapComSpeech();
    lastAnnouncedSolRef.current = 0;
    const freshState = createInitialGameState(
      environment,
      gameState.difficulty,
      gameState.missionSeed,
      gameState.scenario
    );
    setGameState(freshState);
    setPhase("allocate");
    setLastResult(null);
    setActiveIncident(null);
    setDismissedIncidents({});
    setShowDebriefModal(false);
    const initialBudget = getEffectivePowerBudget(
      environment,
      1,
      0,
      gameState.difficulty,
      gameState.missionSeed,
      gameState.scenario
    );
    setAllocation(getDefaultAllocation(initialBudget, gameState.difficulty));
  }, [environment, gameState.difficulty, gameState.missionSeed, gameState.scenario]);

  // Switch Planet Handler
  const handleSwitchPlanetAction = useCallback(() => {
    cancelCapComSpeech();
    setShowDebriefModal(false);
    if (onSwitchPlanet) {
      onSwitchPlanet();
    } else {
      onMissionEnd(gameState);
    }
  }, [onSwitchPlanet, onMissionEnd, gameState]);

  // Root Cause Anomaly Drill-Down Handlers
  const handleInspectAlertRootCause = useCallback(
    (alert: Parameters<typeof resolveRootCauseForAlert>[0]) => {
      soundEffects.playButtonClick();
      const evalCtx: RootCauseEvaluationContext = {
        environment,
        currentTurn: lastResult ? lastResult.turn : currentTurn,
        allocation: lastResult ? lastResult.allocation : allocation,
        effectiveBudgetMW: lastResult ? lastResult.powerBudgetMW : effectiveBudget,
        subsystems: lastResult ? lastResult.subsystems : gameState.subsystems,
        crew: lastResult ? lastResult.crew : gameState.crew,
        currentEvent: lastResult ? lastResult.event : currentEvent,
        alerts: lastResult ? lastResult.alerts : [],
      };
      const profile = resolveRootCauseForAlert(alert, evalCtx);
      setSelectedRootCauseProfile(profile);
    },
    [environment, lastResult, currentTurn, allocation, effectiveBudget, gameState, currentEvent]
  );

  const handleInspectTypeRootCause = useCallback(
    (type: RootCauseFailureType) => {
      soundEffects.playButtonClick();
      const evalCtx: RootCauseEvaluationContext = {
        environment,
        currentTurn: lastResult ? lastResult.turn : currentTurn,
        allocation: lastResult ? lastResult.allocation : allocation,
        effectiveBudgetMW: lastResult ? lastResult.powerBudgetMW : effectiveBudget,
        subsystems: lastResult ? lastResult.subsystems : gameState.subsystems,
        crew: lastResult ? lastResult.crew : gameState.crew,
        currentEvent: lastResult ? lastResult.event : currentEvent,
        alerts: lastResult ? lastResult.alerts : [],
      };
      let profile = BROWNOUT_OVERBUDGET;
      if (type === "brownout") {
        const total =
          evalCtx.allocation.powerGrid +
          evalCtx.allocation.lifeSupport +
          evalCtx.allocation.radiationShielding;
        profile =
          total > evalCtx.effectiveBudgetMW
            ? BROWNOUT_OVERBUDGET
            : BROWNOUT_BATTERY_DEPLETION;
      } else if (type === "life_support") {
        profile = LIFE_SUPPORT_FAILURE;
      } else {
        profile = RADIATION_SHIELD_FAILURE;
      }
      setSelectedRootCauseProfile(profile);
    },
    [environment, lastResult, currentTurn, allocation, effectiveBudget, gameState, currentEvent]
  );

  const handleApplyCounterfactualAllocation = useCallback((newAlloc: PowerAllocation) => {
    soundEffects.playVictoryChord();
    setAllocation(newAlloc);
    setSelectedRootCauseProfile(null);
  }, []);

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
          crewMembers={gameState.crew.members}
          onSelectChoice={handleSelectIncidentChoice}
        />
      )}

      {/* Crew Dossier & Morale Center Modal */}
      {isCrewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl my-auto">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setIsCrewModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-mono text-xs font-bold border border-slate-700 transition-colors"
              >
                ✕ Close Crew Dossier
              </button>
            </div>
            <CrewPanel
              crew={phase === "result" && lastResult ? lastResult.crew : gameState.crew}
            />
          </div>
        </div>
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

      {/* Procedural Space Audio & Telemetry Deck Modal */}
      <AmbientAudioModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        environmentName={environment.name}
      />

      {/* Interactive "Why Did This Happen?" Root Cause Drill-down Modal */}
      {selectedRootCauseProfile && (
        <RootCauseModal
          isOpen={selectedRootCauseProfile !== null}
          onClose={() => setSelectedRootCauseProfile(null)}
          profile={selectedRootCauseProfile}
          context={{
            environment,
            currentTurn: lastResult ? lastResult.turn : currentTurn,
            allocation: lastResult ? lastResult.allocation : allocation,
            effectiveBudgetMW: lastResult ? lastResult.powerBudgetMW : effectiveBudget,
            subsystems: lastResult ? lastResult.subsystems : gameState.subsystems,
            crew: lastResult ? lastResult.crew : gameState.crew,
            currentEvent: lastResult ? lastResult.event : currentEvent,
            alerts: lastResult ? lastResult.alerts : [],
          }}
          onApplyAllocation={handleApplyCounterfactualAllocation}
          canApplyAllocation={phase === "allocate"}
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

              {/* CADET ASSISTANT BANNER: Gentle Automated Hints when Life Support drops */}
              {gameState.difficulty === "cadet" && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl ${allocation.lifeSupport < 28 ||
                    gameState.crew.oxygenBufferPercent < 70 ||
                    gameState.subsystems.lifeSupport.health < 70
                    ? "bg-emerald-950/80 border-emerald-400/70 text-emerald-100 shadow-emerald-950/50 ring-2 ring-emerald-500/30"
                    : "bg-slate-900/80 border-slate-800 text-slate-300"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center text-xl shrink-0">
                      🌟
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                          CAPCOM Cadet Flight Assistant
                        </span>
                        <span className="text-[10px] bg-emerald-900/60 border border-emerald-600/40 px-2 py-0.5 rounded-full text-emerald-300 font-semibold">
                          Automated Coaching Active
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium mt-0.5">
                        {allocation.lifeSupport < 28 ? (
                          <span>
                            Hey Cadet Commander! Life Support is currently set to{" "}
                            <strong>{allocation.lifeSupport} MW</strong>. Your astronauts need at
                            least <strong>28 MW</strong> to stay healthy and keep fresh O₂ pumping!
                          </span>
                        ) : gameState.crew.oxygenBufferPercent < 70 ? (
                          <span>
                            The crew's oxygen buffer is at{" "}
                            <strong>{gameState.crew.oxygenBufferPercent}%</strong>. Slide a little
                            extra power into Life Support so they have plenty of fresh air!
                          </span>
                        ) : (
                          <span>
                            Super job, Cadet! All life support systems are running nominal. Clean
                            air and fresh hydroponic crops are in great shape.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {allocation.lifeSupport < 28 && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playTurnChime();
                        const neededLs = 28;
                        const rem = Math.max(0, effectiveBudget - neededLs);
                        const fp = Math.min(allocation.foodProduction || 20, Math.round(rem * 0.28));
                        const sh = Math.min(allocation.radiationShielding || 25, Math.round((rem - fp) * 0.5));
                        const pg = Math.max(0, rem - fp - sh);
                        setAllocation({
                          lifeSupport: neededLs,
                          radiationShielding: sh,
                          powerGrid: pg,
                          foodProduction: fp,
                        });
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 active:scale-95 text-white font-black text-xs flex items-center gap-2 shrink-0 shadow-lg shadow-emerald-900/50 transition-all border border-emerald-300/40"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Auto-Fix Life Support (28 MW)</span>
                    </button>
                  )}
                </motion.div>
              )}

              {/* FLIGHT DIRECTOR: Hardcore Telemetry HUD */}
              {gameState.difficulty === "flight_director" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* 1. MMOD Risk / Strikes */}
                  <div className="p-3.5 rounded-2xl bg-[#090E1A] border border-amber-600/50 flex items-center gap-3 shadow-lg">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-amber-400">
                          MMOD Puncture Risk
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {gameState.micrometeoroidHistory.length} Strikes
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white truncate mt-0.5">
                        {gameState.micrometeoroidHistory.length > 0
                          ? `Last: ${gameState.micrometeoroidHistory[
                            gameState.micrometeoroidHistory.length - 1
                          ].telemetryHeadline
                          }`
                          : "Hypervelocity Bumper: Active (32% Sol Hazard)"}
                      </p>
                    </div>
                  </div>

                  {/* 2. Thermal Fatigue Curve Monitor */}
                  <div className="p-3.5 rounded-2xl bg-[#090E1A] border border-cyan-600/50 flex items-center gap-3 shadow-lg">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/40">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">
                          Thermal Fatigue (ΔT{" "}
                          {environment.id === "lunar_south_pole"
                            ? "227°C"
                            : environment.id === "europa_under_ice"
                              ? "160°C"
                              : environment.id === "titan_hydrocarbon"
                                ? "200°C"
                                : "100°C"})
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          +{((gameState.cumulativeThermalFatigueWear || 0) * 100).toFixed(1)}% Wear
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white truncate mt-0.5">
                        Coffin-Manson Curve: Active cooling required
                      </p>
                    </div>
                  </div>

                  {/* 3. Strict 500 mSv NASA Career Limit */}
                  <div className="p-3.5 rounded-2xl bg-[#090E1A] border border-rose-600/50 flex items-center gap-3 shadow-lg">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-rose-400">
                          NASA Career Limit (500 mSv)
                        </span>
                        <span className="text-[10px] font-mono font-bold text-white">
                          {gameState.crew.careerRadiationExposureMSv.toFixed(1)} / 500
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                        {gameState.crew.careerRadiationExposureMSv > 500
                          ? "CRITICAL: Grounding Limit Exceeded"
                          : gameState.crew.careerRadiationExposureMSv > 400
                            ? "Warning: Approaching 3% REID Cap"
                            : "Status: NCRP Compliant (<500 mSv)"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Historic Scenario Alert & Telemetry Banner */}
              {gameState.scenario && (
                <div
                  className="rounded-2xl p-4 sm:p-4.5 border-2 shadow-xl backdrop-blur-md relative overflow-hidden"
                  style={{
                    backgroundColor: "rgba(11, 17, 32, 0.95)",
                    borderColor: `${gameState.scenario.accentColor}70`,
                    boxShadow: `0 0 25px ${gameState.scenario.glowColor}`,
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl shrink-0 drop-shadow">
                        {gameState.scenario.emoji}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${gameState.scenario.accentColor}25`,
                              color: gameState.scenario.accentColor,
                              border: `1px solid ${gameState.scenario.accentColor}50`,
                            }}
                          >
                            {gameState.scenario.badge}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40">
                            {gameState.scenario.difficultyBadge}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            {gameState.scenario.location} · {gameState.scenario.yearOrEra}
                          </span>
                        </div>
                        <h2 className="text-base sm:text-lg font-black text-white mt-1">
                          {gameState.scenario.title}
                        </h2>
                        <p className="text-xs text-slate-300 font-medium mt-0.5 leading-relaxed">
                          <strong className="text-cyan-300">Survival Challenge:</strong>{" "}
                          {gameState.scenario.survivalChallenge}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center sm:self-center">
                      <span
                        className="text-[11px] font-mono font-bold px-3 py-1.5 rounded-xl border text-center shadow-inner"
                        style={{
                          backgroundColor: `${gameState.scenario.accentColor}15`,
                          color: gameState.scenario.accentColor,
                          borderColor: `${gameState.scenario.accentColor}40`,
                        }}
                      >
                        {gameState.scenario.initialConditions.statusBadge}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <ControlDeck
                environment={environment}
                difficulty={gameState.difficulty}
                missionSeed={gameState.missionSeed}
                scenario={gameState.scenario}
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
                onOpenCrewRoster={() => setIsCrewModalOpen(true)}
                onInspectRootCause={handleInspectTypeRootCause}
                onToggleDemoBar={onToggleDemoBar}
                isDemoBarOpen={isDemoBarOpen}
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
                  onInspectRootCause={handleInspectTypeRootCause}
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
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#090E1A] border border-cyan-900/40 shadow-lg relative z-30">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold tracking-wider text-[#06B6D4] uppercase">
                    {t("game.solIndicator", { current: lastResult.turn, total: TOTAL_TURNS })}
                  </span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono flex items-center gap-1"
                    style={{
                      backgroundColor: `${DIFFICULTY_PRESETS[gameState.difficulty].accentColor}25`,
                      color: DIFFICULTY_PRESETS[gameState.difficulty].accentColor,
                      border: `1px solid ${DIFFICULTY_PRESETS[gameState.difficulty].accentColor}50`,
                    }}
                  >
                    <span>{DIFFICULTY_PRESETS[gameState.difficulty].emoji}</span>
                    <span>{t(`difficulties.${gameState.difficulty}.title`)}</span>
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    {environment.id === "lunar_south_pole"
                      ? t("destinations.moon.name")
                      : environment.id === "mars_gale_crater"
                        ? t("destinations.mars.name")
                        : environment.name}
                  </span>
                  {gameState.missionSeed && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 font-mono font-bold"
                      title="Classroom Mission Seed"
                    >
                      #{gameState.missionSeed}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Multi-Language Selector */}
                  <LanguageSelector compact />

                  {/* Mute/Unmute Toggle */}
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono transition-colors ${isMuted
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
                    <span className="hidden sm:inline">{isMuted ? t("common.muted") : t("common.sound")}</span>
                  </button>

                  {/* Procedural Space Audio Synthesizer Deck Modal Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setIsAudioModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-cyan-700/50 hover:border-cyan-400 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 text-xs font-mono font-bold transition-all shadow-sm shadow-cyan-950/50"
                    title="Acoustic Telemetry & Procedural Audio Deck"
                  >
                    <Sliders className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span className="hidden md:inline">{t("common.ambientAudio") || "Ambient Audio"}</span>
                  </button>

                  {/* Tutorial Help Button */}
                  <button
                    type="button"
                    onClick={() => setIsTutorialOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-bold font-mono transition-colors"
                    title="Review 3-Step Mission Tutorial"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span className="hidden sm:inline">{t("common.howToPlay")}</span>
                  </button>

                  {/* NASA Data Header Button */}
                  <button
                    type="button"
                    onClick={onShowNasaData}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-bold font-mono transition-colors"
                  >
                    <Database className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>{t("common.nasaData")}</span>
                  </button>

                  {/* Astronaut Specialists & Crew Morale Button */}
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setIsCrewModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-300 text-xs font-bold font-mono transition-colors"
                    title="Inspect 4 Astronaut Specialists, Roles & Morale Vitals"
                  >
                    <span>👨‍🚀</span>
                    <span className="hidden sm:inline">Crew Roster (4)</span>
                  </button>

                  {/* View Full Debrief if mission finished */}
                  {lastResult.outcome !== "ongoing" && (
                    <button
                      type="button"
                      onClick={() => setShowDebriefModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold font-mono shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t("debrief.title")}</span>
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
                onInspectRootCause={handleInspectTypeRootCause}
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

                    {/* Interactive Anomaly Root Cause Investigation Card */}
                    {(() => {
                      const totalAlloc =
                        lastResult.allocation.powerGrid +
                        lastResult.allocation.lifeSupport +
                        lastResult.allocation.radiationShielding +
                        lastResult.allocation.foodProduction;
                      const hasBrownout =
                        totalAlloc > lastResult.powerBudgetMW ||
                        lastResult.subsystems.powerGrid.health < 35 ||
                        lastResult.alerts.some(
                          (a) =>
                            a.subsystem === "power" ||
                            a.headline.toLowerCase().includes("over-budget") ||
                            a.headline.toLowerCase().includes("brownout")
                        );
                      const hasLifeSupportFailure =
                        lastResult.subsystems.lifeSupport.health < 40 ||
                        lastResult.crew.oxygenBufferPercent < 45 ||
                        lastResult.alerts.some(
                          (a) =>
                            a.subsystem === "lifeSupport" ||
                            a.subsystem === "crew" ||
                            a.headline.toLowerCase().includes("life support") ||
                            a.headline.toLowerCase().includes("oxygen") ||
                            a.headline.toLowerCase().includes("o₂")
                        );

                      if (!hasBrownout && !hasLifeSupportFailure) return null;

                      return (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-red-950/90 via-rose-950/70 to-slate-900 border-2 border-red-500/80 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-red-950/50">
                              <AlertTriangle className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-black text-red-300 uppercase tracking-wider">
                                  CRITICAL MISSION ANOMALY DETECTED
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-900/60 text-red-200 border border-red-500/40 font-bold uppercase">
                                  {hasBrownout ? "Bus Undervoltage Brownout" : "Life Support Failure"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-200 mt-0.5">
                                {hasBrownout
                                  ? "Main distribution bus overloaded! Protective relays tripped across habitat modules."
                                  : "Life support systems experienced severe starvation. Crew oxygen buffer depleted."}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleInspectTypeRootCause(hasBrownout ? "brownout" : "life_support")
                            }
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 active:scale-95 text-white font-mono font-black text-xs flex items-center gap-2 shrink-0 shadow-lg shadow-red-950/80 border border-red-300/40 transition-all"
                          >
                            <Search className="w-4 h-4" />
                            <span>Inspect Root Cause</span>
                          </button>
                        </motion.div>
                      );
                    })()}

                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {lastResult.event.label}
                    </h2>
                    <p className="text-sm text-slate-200 mt-2 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                      {lastResult.kidNarrativeSummary}
                    </p>
                  </div>

                  {/* Sol Outcome Subsystem Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <p className="text-[10px] font-mono text-slate-400 uppercase">
                        Power Grid
                      </p>
                      <p className="text-base sm:text-lg font-black text-blue-400 font-mono">
                        {lastResult.subsystems.powerGrid.health.toFixed(0)}%
                      </p>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <p className="text-[10px] font-mono text-slate-400 uppercase">
                        Life Support (ECLSS)
                      </p>
                      <p className="text-base sm:text-lg font-black text-cyan-400 font-mono">
                        {lastResult.subsystems.lifeSupport.health.toFixed(0)}%
                      </p>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <p className="text-[10px] font-mono text-slate-400 uppercase">
                        Shield Integrity
                      </p>
                      <p className="text-base sm:text-lg font-black text-indigo-400 font-mono">
                        {lastResult.subsystems.radiationShielding.health.toFixed(0)}%
                      </p>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <p className="text-[10px] font-mono text-slate-400 uppercase">
                        Hydroponic Bay
                      </p>
                      <p className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                        {lastResult.subsystems.foodProduction.health.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Micro-Meteoroid Puncture Telemetry Report (Flight Director) */}
                  {lastResult.micrometeoroidStrike && (
                    <div className="p-4 rounded-xl bg-amber-950/70 border-2 border-amber-500/60 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-300 uppercase flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                          MMOD Hypervelocity Strike Recorded
                        </span>
                        <span className="text-[10px] font-mono bg-amber-900/80 px-2 py-0.5 rounded text-amber-200">
                          Velocity: {lastResult.micrometeoroidStrike.impactVelocityKmh.toLocaleString()} km/h
                        </span>
                      </div>
                      <p className="text-xs text-slate-200">
                        {lastResult.micrometeoroidStrike.technicalDetails}
                      </p>
                      <div className="text-[11px] font-mono text-amber-300/90 pt-1 border-t border-amber-800/60">
                        <strong>Flight Directive:</strong> {lastResult.micrometeoroidStrike.mitigationProtocol}
                      </div>
                    </div>
                  )}

                  {/* Thermal Fatigue Curve Analysis (Flight Director) */}
                  {lastResult.thermalFatigue && (
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-800/60 flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase">
                          <Flame className="w-3.5 h-3.5 text-cyan-400" />
                          Thermal Fatigue Report (Coffin-Manson)
                        </span>
                        <span className="font-mono text-slate-400 text-[11px]">
                          Loop Efficiency: {Math.round(lastResult.thermalFatigue.thermalProtectionEfficiency * 100)}%
                        </span>
                      </div>
                      <p className="text-slate-300">
                        {lastResult.thermalFatigue.technicalDiagnosis}
                      </p>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                        <span>Sol ΔT: {lastResult.thermalFatigue.solDeltaT}°C</span>
                        <span className="text-cyan-300">
                          Fatigue Added: +{(lastResult.thermalFatigue.fatigueWearAdded * 100).toFixed(1)}%
                        </span>
                        <span className="text-amber-300">
                          Total Fatigue: +{(lastResult.thermalFatigue.totalCumulativeFatigueWear * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Cadet Gentle Automated Hints (Cadet Mode) */}
                  {lastResult.cadetHints && lastResult.cadetHints.length > 0 && (
                    <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-emerald-300 font-mono font-bold text-xs">
                        <span className="text-base">🌟</span>
                        <span>CAPCOM Cadet Assistant debrief</span>
                      </div>
                      {lastResult.cadetHints.map((hint) => (
                        <p key={hint.id} className="text-xs text-slate-200 leading-relaxed">
                          {hint.kidFriendlyMessage}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Specialist Emergency Repair Debrief Card (if crew member was deployed this Sol) */}
                  {gameState.incidentHistory?.find((h) => h.sol === lastResult.turn)?.specialistAction && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 via-teal-950/50 to-slate-900 border-2 border-emerald-500/50 flex flex-col gap-2 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-emerald-300 uppercase flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <span>Specialist Emergency Repair Debrief</span>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-200 border border-emerald-500/40 font-bold uppercase">
                          {gameState.incidentHistory.find((h) => h.sol === lastResult.turn)?.specialistRole}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white">
                        {gameState.incidentHistory.find((h) => h.sol === lastResult.turn)?.specialistName}:{" "}
                        {gameState.incidentHistory.find((h) => h.sol === lastResult.turn)?.specialistAction}
                      </h4>
                      <p className="text-xs text-slate-200 font-mono">
                        {gameState.incidentHistory.find((h) => h.sol === lastResult.turn)?.specialistRiskRewardSummary}
                      </p>
                    </div>
                  )}

                  {/* 4 Astronaut Specialists Vitals & Morale Center */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span>👨‍🚀</span>
                        <span>4 Astronaut Specialists & Morale Telemetry</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCrewModalOpen(true)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono font-bold"
                      >
                        View Full Dossiers →
                      </button>
                    </div>
                    <CrewPanel crew={lastResult.crew} />
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
                        <span>{t("game.proceedNextSol", { nextSol: lastResult.turn + 1 })}</span>
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
                        <span>{t("game.finishMission")}</span>
                      </motion.button>

                      <button
                        type="button"
                        onClick={handlePlayAgain}
                        className="px-5 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>{t("common.playAgain")}</span>
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
                  <AlertBanner
                    alerts={lastResult.alerts}
                    kidMode={true}
                    onInspectRootCause={handleInspectAlertRootCause}
                  />

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
