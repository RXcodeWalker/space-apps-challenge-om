// ============================================================
// MissionDebriefModal.tsx — End-of-Mission Engineering Debrief
// Features:
// 1. Mission Outcome Rank (Artemis Master Engineer, Outpost Survivor, etc.)
// 2. Pure SVG/CSS Turn-by-Turn Line/Bar Interactive Subsystem Telemetry Chart
// 3. 2 Specific Personalized Engineering Insights synthesized from run history
// 4. One-click "Play Again" and "Switch Planet" buttons
// ============================================================
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  RotateCcw,
  Globe,
  Database,
  Sparkles,
  ShieldAlert,
  Printer,
  X,
} from "lucide-react";

import type { GameState } from "../engine/simulationEngine";
import type { MissionEnvironment } from "../data/nasaConstants";
import FlightRecorderReplay from "./FlightRecorderReplay";
import JuniorAstronautCertificate from "./JuniorAstronautCertificate";
import StemDebriefWorksheet from "./StemDebriefWorksheet";
import { calculateOutcomeRank } from "../utils/flightRecorder";
import { DIFFICULTY_PRESETS } from "../data/difficultyTiers";
import { useTranslation } from "../i18n/LanguageContext";
import LanguageSelector from "./LanguageSelector";

interface MissionDebriefModalProps {
  isOpen: boolean;
  gameState: GameState;
  environment: MissionEnvironment;
  onPlayAgain: () => void;
  onSwitchPlanet: () => void;
  onShowNasaData?: () => void;
  onClose?: () => void;
}

function generatePersonalizedInsights(
  gameState: GameState,
  environment: MissionEnvironment
): [string, string] {
  const insights: string[] = [];
  const incidents = gameState.incidentHistory || [];
  const history = gameState.history || [];

  // Insight 1: Based on specific incident choices
  const speChoice = incidents.find((i) =>
    i.incidentId.includes("spe") || i.incidentTitle.includes("Solar Particle")
  );
  const dustStormChoice = incidents.find((i) =>
    i.incidentId.includes("dust_storm") || i.incidentTitle.includes("Dust Storm")
  );
  const iceDrillChoice = incidents.find((i) =>
    i.incidentId.includes("ice_drill") || i.incidentTitle.includes("Ice Drill")
  );
  const thermalPunctureChoice = incidents.find((i) =>
    i.incidentId.includes("puncture") || i.incidentTitle.includes("Thermal Blanket")
  );
  const dustDevilChoice = incidents.find((i) =>
    i.incidentId.includes("dust_devil") || i.incidentTitle.includes("Dust Devil")
  );
  const perchlorateChoice = incidents.find((i) =>
    i.incidentId.includes("perchlorate") || i.incidentTitle.includes("Perchlorate")
  );
  const co2FreezingChoice = incidents.find((i) =>
    i.incidentId.includes("compressor") || i.incidentTitle.includes("Compressor Freezing")
  );

  if (speChoice) {
    if (speChoice.choiceId === "divert_water_wall") {
      insights.push(
        "You prioritized shielding during the X-class solar flare by energizing the active water-wall; this completely neutralized crew radiation dose, though life support hydroponics dipped temporarily under the diverted megawatts."
      );
    } else if (speChoice.choiceId === "retreat_storm_shelter") {
      insights.push(
        "During the solar storm, you ordered the crew into the regolith bunker; this kept astronauts safe without draining electrical megawatts, though routine maintenance was halted."
      );
    } else {
      insights.push(
        "You accepted an elevated radiation dose (+3.8 mSv) during the solar storm to preserve continuous grid output — a high-risk trade-off that tested astronaut biological limits."
      );
    }
  } else if (dustStormChoice) {
    if (dustStormChoice.choiceId === "ration_life_support") {
      insights.push(
        "During Sol 2's Martian dust storm, you conservatively rationed life support air scrubbers; this preserved your battery pool through a 55% solar collapse while keeping O₂ buffers above critical threshold."
      );
    } else {
      insights.push(
        "You fully discharged battery reserves during the Martian dust storm to keep habitat life support at 100%, taking severe storage battery wear to avoid crew discomfort."
      );
    }
  } else if (iceDrillChoice && iceDrillChoice.choiceId === "overclock_drill_harvest") {
    insights.push(
      "You over-clocked the TRIDENT cryo-drill in Shackleton Crater; absorbing the 25 MW grid surge rewarded your outpost with a permanent +15% water and oxygen recycling buffer."
    );
  } else if (thermalPunctureChoice && thermalPunctureChoice.choiceId === "divert_thermal_power") {
    insights.push(
      "Following the micrometeorite puncture, you utilized resistive MLI heating to counteract −173°C thermal bleed, preventing habitat freezing at the cost of 18 MW of grid reserve."
    );
  } else if (dustDevilChoice && dustDevilChoice.choiceId === "risk_vortex_cleaning") {
    insights.push(
      "You gambled on the Gale Crater dust devil path; catching the natural aerodynamic wind scour cleaned your solar arrays for a massive +20 MW generation boost identical to Spirit's 2005 breakthrough."
    );
  } else if (perchlorateChoice && perchlorateChoice.choiceId === "catalytic_purification") {
    insights.push(
      "You deployed multi-stage catalytic dechlorination when toxic perchlorate salts infiltrated the well, spending 14 MW to preserve long-term crop safety."
    );
  } else if (co2FreezingChoice) {
    insights.push(
      "When Gale Crater temperatures plummeted to −95°C, your thermal defrost pulse cleared dry-ice frost from the MOXIE intake scroll, preserving continuous oxygen production."
    );
  }

  // Insight 2: Based on system interaction trends
  if (history.length > 0) {
    const avgLifeSupport =
      history.reduce((acc, h) => acc + h.subsystems.lifeSupport.health, 0) /
      history.length;
    const avgShield =
      history.reduce(
        (acc, h) => acc + h.subsystems.radiationShielding.health,
        0
      ) / history.length;
    const avgGrid =
      history.reduce((acc, h) => acc + h.subsystems.powerGrid.health, 0) /
      history.length;

    if (gameState.crew.radiationExposureMSv < 2.0 && avgShield >= 75) {
      insights.push(
        `Your proactive radiation deflection kept total cumulative exposure to just ${gameState.crew.radiationExposureMSv.toFixed(
          2
        )} mSv, well within NASA's stringent deep-space health guidelines.`
      );
    } else if (gameState.crew.oxygenBufferPercent >= 80 && avgLifeSupport >= 75) {
      insights.push(
        `Consistent power feeding to ECLSS scrubbers maintained an exemplary ${gameState.crew.oxygenBufferPercent.toFixed(
          0
        )}% oxygen buffer, preventing the insidious CO₂ buildup that risks long-duration missions.`
      );
    } else if (avgGrid < 60) {
      insights.push(
        `Power grid wear accumulated to ${gameState.subsystems.powerGrid.wearAccumulated.toFixed(
          2
        )}, showing how sustained peak draws degrade transformer longevity over a 10-sol deployment.`
      );
    } else {
      insights.push(
        `Your balanced triple-subsystem allocation maintained an average grid stability of ${avgGrid.toFixed(
          0
        )}% across the ${history.length} completed sols.`
      );
    }
  }

  // Fallbacks if fewer than 2
  if (insights.length === 0) {
    insights.push(
      `Your mission achieved a final composite operational score of ${gameState.cumulativeScore}/100 in the ${environment.name} environment.`
    );
  }
  if (insights.length === 1) {
    insights.push(
      `The crew concluded operations with ${gameState.crew.morale}% morale and ${gameState.crew.foodReserveDays.toFixed(
        1
      )} days of remaining food reserves.`
    );
  }

  return [insights[0], insights[1]];
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MissionDebriefModal({
  isOpen,
  gameState,
  environment,
  onPlayAgain,
  onSwitchPlanet,
  onShowNasaData,
  onClose,
}: MissionDebriefModalProps) {
  const { t } = useTranslation();
  const [showCertificate, setShowCertificate] = useState(false);
  const [showWorksheet, setShowWorksheet] = useState(false);

  if (!isOpen || !gameState) return null;

  const outcomeRank = useMemo(
    () => calculateOutcomeRank(gameState),
    [gameState]
  );
  const [insight1, insight2] = useMemo(
    () => generatePersonalizedInsights(gameState, environment),
    [gameState, environment]
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl rounded-3xl bg-[#0B1120] border-2 border-cyan-500/40 shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col max-h-[92vh] my-auto"
        >
          {/* Header Banner */}
          <div className="w-full py-2 px-5 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-white/10 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-cyan-300">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="font-bold tracking-wider uppercase">
                {t("debrief.title")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 hidden sm:inline">
                {gameState.scenario
                  ? gameState.scenario.title
                  : environment.id === "lunar_south_pole"
                  ? t("destinations.moon.name")
                  : environment.id === "mars_gale_crater"
                    ? t("destinations.mars.name")
                    : environment.name}
              </span>
              <LanguageSelector compact />
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 ml-1"
                  title="Close Debrief Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto p-5 sm:p-7 flex flex-col gap-6 [&>*]:shrink-0">
            {/* 1. MISSION OUTCOME RANK CARD */}
            <div
              className={`rounded-3xl p-6 border-2 bg-gradient-to-br ${outcomeRank.bgGradient} ${outcomeRank.borderColor} shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6`}
            >
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-white/10 text-[11px] font-mono font-bold tracking-wider uppercase mb-2">
                  <span className={outcomeRank.color}>{outcomeRank.badge}</span>
                  <span className="text-slate-500">·</span>
                  <span
                    className="font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${DIFFICULTY_PRESETS[gameState.difficulty || "commander"].accentColor}25`,
                      color: DIFFICULTY_PRESETS[gameState.difficulty || "commander"].accentColor,
                    }}
                  >
                    {DIFFICULTY_PRESETS[gameState.difficulty || "commander"].emoji}{" "}
                    {DIFFICULTY_PRESETS[gameState.difficulty || "commander"].commanderRank}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-300">
                    Sol {gameState.currentTurn} of 10
                  </span>
                </div>

                <h1
                  className={`text-2xl sm:text-3xl font-black ${outcomeRank.color} tracking-tight`}
                >
                  {outcomeRank.rankTitle}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-xl">
                  {outcomeRank.evaluation}
                </p>

                {/* Action Pills */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCertificate(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-mono font-black text-xs shadow-lg shadow-amber-950/60 transition-all cursor-pointer transform hover:scale-[1.02]"
                  >
                    <Award className="w-4 h-4 text-black" />
                    <span>Astronaut Mission Certificate (PDF / PNG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowWorksheet(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-mono font-black text-xs shadow-lg shadow-teal-950/60 transition-all cursor-pointer transform hover:scale-[1.02]"
                  >
                    <Printer className="w-4 h-4" />
                    <span>📄 Print / Save PDF Lab Report</span>
                  </button>
                </div>
              </div>

              {/* Composite Score Ring */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/40 border border-white/10 shrink-0 min-w-[130px]">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  Mission Score
                </span>
                <span className="text-4xl font-black font-mono text-white mt-0.5">
                  {gameState.cumulativeScore}
                </span>
                <span className="text-[11px] font-mono text-cyan-400 font-bold">
                  out of 100
                </span>
              </div>
            </div>

            {/* Hardcore Simulation Realism Breakdown (Flight Director) */}
            {gameState.difficulty === "flight_director" && (
              <div className="rounded-2xl p-4 bg-amber-950/40 border border-amber-500/40 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-300 uppercase flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Hardcore Simulation Telemetry Ledger
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    NASA-STD-3001 & MMOD Calibration
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                    <p className="text-[10px] font-mono text-slate-400 uppercase">MMOD Micro-Punctures</p>
                    <p className="text-base font-black text-amber-400 font-mono mt-0.5">
                      {gameState.micrometeoroidHistory.length} Strikes Repelled
                    </p>
                  </div>
                  <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                    <p className="text-[10px] font-mono text-slate-400 uppercase">Thermal Fatigue Wear</p>
                    <p className="text-base font-black text-cyan-400 font-mono mt-0.5">
                      +{((gameState.cumulativeThermalFatigueWear || 0) * 100).toFixed(1)}% Cyclic Strain
                    </p>
                  </div>
                  <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                    <p className="text-[10px] font-mono text-slate-400 uppercase">Career Radiation Cap</p>
                    <p className="text-base font-black font-mono mt-0.5">
                      <span
                        className={
                          gameState.crew.careerRadiationExposureMSv > 500
                            ? "text-red-400"
                            : "text-emerald-400"
                        }
                      >
                        {gameState.crew.careerRadiationExposureMSv.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-400 font-normal"> / 500 mSv</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cadet Mission Achievement (Cadet Mode) */}
            {gameState.difficulty === "cadet" && (
              <div className="rounded-2xl p-4 bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0">
                  🌟
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-emerald-300">
                    Cadet Flight Assistant Summary
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Congratulations on completing your mission with automated coaching! You learned how NASA flight directors balance life support air, water, and power grids on distant worlds.
                  </p>
                </div>
              </div>
            )}

            {/* EXPEDITION CREW STATUS & FLIGHT SURGEON CITATION */}
            {gameState.crew.members && gameState.crew.members.length > 0 && (
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👨‍🚀</span>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                      Expedition Crew Roster & Final Vitals
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 border border-blue-500/40 text-blue-300">
                    4 Astronauts Deployed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {gameState.crew.members.map((member) => {
                    const statusColor =
                      member.status === "nominal"
                        ? "text-emerald-400 bg-emerald-950/80 border-emerald-500/40"
                        : member.status === "heroic"
                          ? "text-cyan-400 bg-cyan-950/80 border-cyan-500/40"
                          : member.status === "irradiated"
                            ? "text-purple-400 bg-purple-950/80 border-purple-500/40"
                            : member.status === "fatigued"
                              ? "text-amber-400 bg-amber-950/80 border-amber-500/40"
                              : "text-red-400 bg-red-950/80 border-red-500/40";

                    return (
                      <div
                        key={member.id}
                        className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{member.avatar}</span>
                            <div>
                              <p className="text-xs font-bold text-white truncate">{member.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">"{member.callsign}"</p>
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${statusColor}`}
                          >
                            {member.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-300 pt-1 border-t border-white/5">
                          <span>Health: <strong className="text-white">{member.health}%</strong></span>
                          <span>Morale: <strong className="text-white">{member.morale}%</strong></span>
                          <span>Dose: <strong className="text-amber-300">{member.radiationDoseMSv.toFixed(1)} mSv</strong></span>
                          <span>Repairs: <strong className="text-emerald-300">{member.repairsConducted}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. SOL-BY-SOL MISSION REPLAY & FLIGHT RECORDER */}
            <FlightRecorderReplay gameState={gameState} environment={environment} />

            {/* 3. TWO SPECIFIC PERSONALIZED ENGINEERING INSIGHTS */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Personalized Engineering Insights (Based on Your Actual Run)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Insight 1 */}
                <div className="rounded-2xl bg-blue-950/40 border border-blue-500/30 p-4 shadow-md flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold uppercase">
                        Hazard Decision Trade-Off
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                      {insight1}
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-blue-400/80">
                    Verified against mission incident logs
                  </div>
                </div>

                {/* Insight 2 */}
                <div className="rounded-2xl bg-cyan-950/40 border border-cyan-500/30 p-4 shadow-md flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold uppercase">
                        Resource Dynamic Takeaway
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                      {insight2}
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400/80">
                    Calibrated by NASA ECLSS & power models
                  </div>
                </div>
              </div>
            </div>

            {/* Final Crew & Consumable Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-2xl text-center">
                <p className="text-[10px] font-mono text-slate-400 uppercase">Crew Morale</p>
                <p className="text-lg font-black font-mono text-pink-400">
                  {gameState.crew.morale}%
                </p>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-2xl text-center">
                <p className="text-[10px] font-mono text-slate-400 uppercase">Oxygen Buffer</p>
                <p className="text-lg font-black font-mono text-sky-400">
                  {gameState.crew.oxygenBufferPercent.toFixed(0)}%
                </p>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-2xl text-center">
                <p className="text-[10px] font-mono text-slate-400 uppercase">Food Reserve</p>
                <p className="text-lg font-black font-mono text-emerald-400">
                  {gameState.crew.foodReserveDays.toFixed(1)} Sols
                </p>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-2xl text-center">
                <p className="text-[10px] font-mono text-slate-400 uppercase">Cumulative Radiation</p>
                <p className="text-lg font-black font-mono text-orange-400">
                  {gameState.crew.radiationExposureMSv.toFixed(2)} mSv
                </p>
              </div>
            </div>
          </div>

          {/* Modal Action Bar */}
          <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
            {onShowNasaData && (
              <button
                type="button"
                onClick={onShowNasaData}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-bold transition-colors"
              >
                <Database className="w-4 h-4 text-cyan-400" />
                <span>{t("common.nasaData")}</span>
              </button>
            )}

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* STEM Flight Director Lab Report Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowWorksheet(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-teal-950/60 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>📄 Print / Save PDF Lab Report</span>
              </motion.button>

              {/* Junior Astronaut Certificate Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCertificate(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs sm:text-sm shadow-lg shadow-amber-950/60"
              >
                <Award className="w-4 h-4 text-black" />
                <span>{t("debrief.viewCertificate")}</span>
              </motion.button>

              {/* Switch Planet Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSwitchPlanet}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition-colors border border-slate-600"
              >
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>{t("common.switchPlanet")}</span>
              </motion.button>

              {/* One-Click Play Again Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onPlayAgain}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs sm:text-sm shadow-lg shadow-cyan-900/50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t("common.playAgain")}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Junior Astronaut Mission Certificate Modal */}
      {showCertificate && (
        <JuniorAstronautCertificate
          isOpen={showCertificate}
          onClose={() => setShowCertificate(false)}
          gameState={gameState}
          environment={environment}
          rankTitle={outcomeRank.rankTitle}
          rankTier={outcomeRank.tier}
        />
      )}

      {/* STEM Flight Director Debrief Worksheet Modal */}
      {showWorksheet && (
        <StemDebriefWorksheet
          isOpen={showWorksheet}
          onClose={() => setShowWorksheet(false)}
          gameState={gameState}
          environment={environment}
        />
      )}
    </AnimatePresence>
  );
}
