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

import type { MissionEnvironment } from "./data/nasaConstants";
import {
  LUNAR_SOUTH_POLE,
  MARS_GALE_CRATER,
  EUROPA_UNDER_ICE,
  TITAN_HYDROCARBON,
} from "./data/nasaConstants";
import type { GameState, DifficultyTier } from "./engine/simulationEngine";
import {
  parseMissionParamsFromUrl,
  generateMissionSeed,
  normalizeSeed,
} from "./utils/seededRandom";

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
  const [finalGameState, setFinalGameState] = useState<GameState | null>(null);
  const [isNasaModalOpen, setIsNasaModalOpen] = useState(false);
  const [nasaModalEnv, setNasaModalEnv] = useState<MissionEnvironment | null>(null);

  function handleOpenNasaData(env?: MissionEnvironment | null) {
    if (env) {
      setNasaModalEnv(env);
    }
    setIsNasaModalOpen(true);
  }

  function handleStartMission(
    env: MissionEnvironment,
    difficulty: DifficultyTier = "commander",
    seed?: string
  ) {
    setSelectedEnvironment(env);
    setSelectedDifficulty(difficulty);
    if (seed) {
      setSelectedSeed(normalizeSeed(seed));
    }
    setFinalGameState(null);
    setPhase("game");
  }

  function handleMissionEnd(state: GameState) {
    setFinalGameState(state);
    setPhase("end");
  }

  function handleRetry() {
    if (selectedEnvironment) {
      setFinalGameState(null);
      setPhase("game");
    }
  }

  function handleNewMission() {
    setSelectedEnvironment(null);
    setFinalGameState(null);
    setPhase("menu");
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
            />
          </motion.div>
        )}

        {phase === "game" && selectedEnvironment && (
          <motion.div
            key={`game-${selectedEnvironment.id}-${selectedSeed}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GameScreen
              environment={selectedEnvironment}
              difficulty={selectedDifficulty}
              missionSeed={selectedSeed}
              onMissionEnd={handleMissionEnd}
              onShowNasaData={() => handleOpenNasaData(selectedEnvironment)}
              onSwitchPlanet={handleNewMission}
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
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
