// ============================================================
// App.tsx — root state machine: menu → game → results
// ============================================================
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import MissionBriefingScreen from "./components/MissionBriefingScreen";
import GameScreen from "./components/GameScreen";
import MissionEndScreen from "./components/MissionEndScreen";
import NasaDataModal from "./components/NasaDataModal";

import type { MissionEnvironment } from "./data/nasaConstants";
import type { GameState } from "./engine/simulationEngine";

type AppPhase = "menu" | "game" | "end";

export default function App() {
  const [phase, setPhase] = useState<AppPhase>("menu");
  const [selectedEnvironment, setSelectedEnvironment] = useState<MissionEnvironment | null>(null);
  const [finalGameState, setFinalGameState] = useState<GameState | null>(null);
  const [isNasaModalOpen, setIsNasaModalOpen] = useState(false);
  const [nasaModalEnv, setNasaModalEnv] = useState<MissionEnvironment | null>(null);
  const [kidMode] = useState(true);

  function handleOpenNasaData(env?: MissionEnvironment | null) {
    if (env) {
      setNasaModalEnv(env);
    }
    setIsNasaModalOpen(true);
  }

  function handleStartMission(env: MissionEnvironment) {
    setSelectedEnvironment(env);
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
    <div className="min-h-screen bg-slate-950">
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
            />
          </motion.div>
        )}

        {phase === "game" && selectedEnvironment && (
          <motion.div
            key={`game-${selectedEnvironment.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GameScreen
              environment={selectedEnvironment}
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
              kidMode={kidMode}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
