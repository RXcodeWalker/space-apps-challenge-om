// ============================================================
// App.tsx — root state machine: menu → game → results
// ============================================================
import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import LandingPage from "./pages/LandingPage";
import MissionDataPage from "./pages/MissionDataPage";
import TeacherPage from "./pages/TeacherPage";
import SettingsPage from "./pages/SettingsPage";
import DesignSystemPage from "./pages/DesignSystemPage";
import { AppNav, MissionLogDrawer } from "./ui";
import GameScreen from "./components/GameScreen";
import MissionEndScreen from "./components/MissionEndScreen";
import NasaDataModal from "./components/NasaDataModal";
import PwaStatusBanner from "./components/PwaStatusBanner";
import JudgeDemoBar from "./components/JudgeDemoBar";
import CrisisMinigameModal from "./components/CrisisMinigameModal";
import MissionDebriefModal from "./components/MissionDebriefModal";
import StemDebriefWorksheet from "./components/StemDebriefWorksheet";
import SolarElevationTracker from "./components/SolarElevationTracker";
import MissionPatchDesigner from "./components/MissionPatchDesigner";
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
type MenuPage = "play" | "data" | "teachers" | "settings" | "design";
const MENU_PAGES = [
  { id: "play", label: "Mission" },
  { id: "data", label: "Data" },
  { id: "teachers", label: "Teachers" },
  { id: "settings", label: "Settings" },
  { id: "design", label: "Design" },
] as const;

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
  const [isSolarTrackerOpen, setIsSolarTrackerOpen] = useState<boolean>(false);
  const [isPatchDesignerOpen, setIsPatchDesignerOpen] = useState<boolean>(false);
  const [menuPage, setMenuPage] = useState<MenuPage>("play");
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [preview, setPreview] = useState("");
  const closeLog = useCallback(() => setIsLogOpen(false), []);

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
        onOpenSolarTracker={() => setIsSolarTrackerOpen(true)}
        onOpenPatchDesigner={() => setIsPatchDesignerOpen(true)}
      />

      {/* Standalone Interactive NASA Expedition Mission Patch Designer Modal */}
      <MissionPatchDesigner
        isOpen={isPatchDesignerOpen}
        onClose={() => setIsPatchDesignerOpen(false)}
      />

      {/* Standalone Solar Elevation & Shadow Tracker Modal */}
      {isSolarTrackerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <SolarElevationTracker
            initialBody={selectedEnvironment?.id === "mars_gale_crater" ? "mars" : "moon"}
            onClose={() => setIsSolarTrackerOpen(false)}
          />
        </div>
      )}

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

      <MissionLogDrawer open={isLogOpen} onClose={closeLog} />

      <AnimatePresence mode="wait">
        {phase === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="oc-shell flex min-h-screen flex-col bg-oc-void text-oc-text-1 font-oc-ui">
              <AppNav
                pages={MENU_PAGES}
                current={menuPage}
                onNavigate={(id) => setMenuPage(id as MenuPage)}
                onOpenLog={() => setIsLogOpen(true)}
                subtitle="Junior astronaut mission trainer"
                ticker={preview ? [preview] : []}
                cta={menuPage === "play" ? undefined : { label: "Begin mission", onClick: () => setMenuPage("play") }}
              />
              {menuPage === "play" && (
                <LandingPage
                  onStart={handleStartMission}
                  seed={selectedSeed}
                  onSeedChange={setSelectedSeed}
                  initialEnvironmentId={selectedEnvironment?.id}
                  initialScenarioId={selectedScenario?.id}
                  initialDifficulty={selectedDifficulty}
                  onPreview={setPreview}
                />
              )}
              {menuPage === "data" && (
                <MissionDataPage initialEnvironmentId={selectedEnvironment?.id} onOpenExplorer={(env) => handleOpenNasaData(env)} />
              )}
              {menuPage === "teachers" && (
                <TeacherPage seed={selectedSeed} onUseSeed={(seed) => setSelectedSeed(normalizeSeed(seed))} onGoPlay={() => setMenuPage("play")} />
              )}
              {menuPage === "settings" && <SettingsPage />}
              {menuPage === "design" && <DesignSystemPage />}
            </div>
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
              onOpenPatchDesigner={() => setIsPatchDesignerOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
