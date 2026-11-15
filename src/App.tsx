// ============================================================
// App.tsx — root state machine: menu → game → results
// ============================================================
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import MissionBriefingScreen from "./components/MissionBriefingScreen";
import GameScreen from "./components/GameScreen";
import MissionEndScreen from "./components/MissionEndScreen";
import NasaDataModal from "./components/NasaDataModal";
import PwaStatusBanner from "./components/PwaStatusBanner";
import JudgeDemoBar from "./components/JudgeDemoBar";
import CrisisMinigameModal from "./components/CrisisMinigameModal";
import MissionDebriefModal from "./components/MissionDebriefModal";
import StemDebriefWorksheet from "./components/StemDebriefWorksheet";
import {
  createSol9CrisisGameState,
  createCompletedMissionGameState,
} from "./utils/judgeDemoData";

import type { MissionEnvironment } from "./data/nasaConstants";
import {
  LUNAR_SOUTH_POLE,
  MARS_GALE_CRATER,
  EUROPA_UNDER_ICE,
  TITAN_HYDROCARBON,
} from "./data/nasaConstants";
import type { GameState, DifficultyTier } from "./engine/simulationEngine";
import type { HistoricScenario } from "./data/scenarioData";
import {
  parseMissionParamsFromUrl,
  generateMissionSeed,
  normalizeSeed,
} from "./utils/seededRandom";
import { soundEffects } from "./utils/soundEffects";

type AppPhase = "menu" | "game" | "end";

const ALL_ENVIRONMENTS: MissionEnvironment[] = [
  LUNAR_SOUTH_POLE,
  MARS_GALE_CRATER,
  EUROPA_UNDER_ICE,
  TITAN_HYDROCARBON,
];

export default function App() {
  const [urlParams] = useState(() => parseMissionParamsFromUrl());
  const [phase, setPhase] = useState<AppPhase>("menu");
  const [selectedEnvironment, setSelectedEnvironment] = useState<MissionEnvironment | null>(() => {
    if (urlParams.env) {
      return ALL_ENVIRONMENTS.find((e) => e.id === urlParams.env) || null;
    }
    return null;
  });
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyTier>(() => {
    if (
      urlParams.difficulty === "cadet" ||
      urlParams.difficulty === "commander" ||
      urlParams.difficulty === "flight_director"
    ) {
      return urlParams.difficulty;
    }
    return "commander";
  });
  const [selectedSeed, setSelectedSeed] = useState<string>(() => {
    return urlParams.seed ? normalizeSeed(urlParams.seed) : generateMissionSeed();
  });
  const [selectedScenario, setSelectedScenario] = useState<HistoricScenario | null>(null);
  const [finalGameState, setFinalGameState] = useState<GameState | null>(null);
  const [isNasaModalOpen, setIsNasaModalOpen] = useState(false);
  const [nasaModalEnv, setNasaModalEnv] = useState<MissionEnvironment | null>(null);

  // Judge Express Demo Bar State
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState<boolean>(() => urlParams.demo);
  const [isCrisisMinigameModalOpen, setIsCrisisMinigameModalOpen] = useState<boolean>(false);
  const [isDebriefModalOpen, setIsDebriefModalOpen] = useState<boolean>(false);
  const [isPrintWorksheetOpen, setIsPrintWorksheetOpen] = useState<boolean>(false);
  const [demoCompletedGameState, setDemoCompletedGameState] = useState<GameState | null>(null);
  const [initialGameStateOverride, setInitialGameStateOverride] = useState<GameState | null>(null);
  const [sol9CrisisTrigger, setSol9CrisisTrigger] = useState<number>(0);

  function handleOpenNasaData(env?: MissionEnvironment | null) {
    soundEffects.playButtonClick();
    if (env) {
      setNasaModalEnv(env);
    }
    setIsNasaModalOpen(true);
  }

  function handleStartMission(
    env: MissionEnvironment,
    difficulty: DifficultyTier = "commander",
    seed?: string,
    scenario?: HistoricScenario
  ) {
    setSelectedEnvironment(env);
    setSelectedDifficulty(difficulty);
    if (seed) {
      setSelectedSeed(normalizeSeed(seed));
    }
    setSelectedScenario(scenario || null);
    setFinalGameState(null);
    setInitialGameStateOverride(null);
    setPhase("game");
  }

  function handleMissionEnd(state: GameState) {
    setFinalGameState(state);
    setPhase("end");
  }

  function handleRetry() {
    if (selectedEnvironment) {
      setFinalGameState(null);
      setInitialGameStateOverride(null);
      setPhase("game");
    }
  }

  function handleNewMission() {
    setSelectedEnvironment(null);
    setSelectedScenario(null);
    setFinalGameState(null);
    setInitialGameStateOverride(null);
    setPhase("menu");
  }

  // Judge Express Demo Bar Handlers
  function handleToggleDemoBar() {
    setIsDemoDrawerOpen((prev) => !prev);
  }

  function handleJumpToSol9Crisis() {
    soundEffects.playButtonClick();
    const env = selectedEnvironment || LUNAR_SOUTH_POLE;
    setSelectedEnvironment(env);
    const crisisState = createSol9CrisisGameState(
      env,
      selectedDifficulty,
      selectedSeed,
      selectedScenario || undefined
    );
    setInitialGameStateOverride(crisisState);
    setFinalGameState(null);
    setPhase("game");
    setSol9CrisisTrigger((prev) => prev + 1);
  }

  function handleTriggerMinigame() {
    soundEffects.playButtonClick();
    setIsCrisisMinigameModalOpen(true);
  }

  function handleViewMissionDebrief() {
    soundEffects.playButtonClick();
    const env = selectedEnvironment || LUNAR_SOUTH_POLE;
    const completedState = createCompletedMissionGameState(
      env,
      selectedDifficulty,
      selectedSeed,
      selectedScenario || undefined
    );
    setDemoCompletedGameState(completedState);
    setIsDebriefModalOpen(true);
  }

  function handlePreviewPrintableLabReport() {
    soundEffects.playButtonClick();
    const env = selectedEnvironment || LUNAR_SOUTH_POLE;
    const completedState = createCompletedMissionGameState(
      env,
      selectedDifficulty,
      selectedSeed,
      selectedScenario || undefined
    );
    setDemoCompletedGameState(completedState);
    setIsPrintWorksheetOpen(true);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* PWA Offline / Install / Update Banner */}
      <PwaStatusBanner />

      {/* NASA Data Modal (accessible from any phase) */}
      <NasaDataModal
        environment={nasaModalEnv || selectedEnvironment}
        isOpen={isNasaModalOpen}
        onClose={() => setIsNasaModalOpen(false)}
      />

      {/* Judge Express Demo Bar Floating Drawer & Collapsed Pill */}
      <JudgeDemoBar
        isOpen={isDemoDrawerOpen}
        onToggle={handleToggleDemoBar}
        onJumpToSol9={handleJumpToSol9Crisis}
        onTriggerMinigame={handleTriggerMinigame}
        onViewDebrief={handleViewMissionDebrief}
        onPreviewLabReport={handlePreviewPrintableLabReport}
      />

      {/* 15-Second Flight Director Crisis Minigame Sandbox Modal */}
      <CrisisMinigameModal
        isOpen={isCrisisMinigameModalOpen}
        onClose={() => setIsCrisisMinigameModalOpen(false)}
      />

      {/* End-of-Mission Engineering Debrief Modal (when triggered via Demo Bar) */}
      {isDebriefModalOpen && demoCompletedGameState && (
        <MissionDebriefModal
          isOpen={isDebriefModalOpen}
          gameState={demoCompletedGameState}
          environment={demoCompletedGameState.environment}
          onClose={() => setIsDebriefModalOpen(false)}
          onPlayAgain={() => {
            setIsDebriefModalOpen(false);
            handleRetry();
          }}
          onSwitchPlanet={() => {
            setIsDebriefModalOpen(false);
            handleNewMission();
          }}
          onShowNasaData={() => handleOpenNasaData(demoCompletedGameState.environment)}
        />
      )}

      {/* STEM Flight Director Lab Report Worksheet Modal (when triggered via Demo Bar) */}
      {isPrintWorksheetOpen && demoCompletedGameState && (
        <StemDebriefWorksheet
          isOpen={isPrintWorksheetOpen}
          onClose={() => setIsPrintWorksheetOpen(false)}
          gameState={demoCompletedGameState}
          environment={demoCompletedGameState.environment}
        />
      )}

      <AnimatePresence mode="wait">
        {phase === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MissionBriefingScreen
              onStart={handleStartMission}
              onShowNasaData={(env) => handleOpenNasaData(env)}
              initialSeed={selectedSeed}
              initialEnvironmentId={selectedEnvironment?.id}
              initialScenarioId={selectedScenario?.id}
              onToggleDemoBar={handleToggleDemoBar}
              isDemoBarOpen={isDemoDrawerOpen}
            />
          </motion.div>
        )}

        {phase === "game" && selectedEnvironment && (
          <motion.div
            key={`game-${selectedEnvironment.id}-${selectedSeed}${selectedScenario ? `-${selectedScenario.id}` : ""}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GameScreen
              environment={selectedEnvironment}
              difficulty={selectedDifficulty}
              missionSeed={selectedSeed}
              scenario={selectedScenario || undefined}
              onMissionEnd={handleMissionEnd}
              onShowNasaData={() => handleOpenNasaData(selectedEnvironment)}
              onSwitchPlanet={handleNewMission}
              onToggleDemoBar={handleToggleDemoBar}
              isDemoBarOpen={isDemoDrawerOpen}
              initialGameStateOverride={initialGameStateOverride}
              sol9CrisisTrigger={sol9CrisisTrigger}
            />
          </motion.div>
        )}

        {phase === "end" && finalGameState && selectedEnvironment && (
          <motion.div
            key="end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`min-h-screen bg-gradient-to-br ${selectedEnvironment.backgroundGradient}`}
          >
            <MissionEndScreen
              gameState={finalGameState}
              environment={selectedEnvironment}
              onRetry={handleRetry}
              onNewMission={handleNewMission}
              onShowNasaData={() => handleOpenNasaData(selectedEnvironment)}
              kidMode={selectedDifficulty === "cadet"}
              onToggleDemoBar={handleToggleDemoBar}
              isDemoBarOpen={isDemoDrawerOpen}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
