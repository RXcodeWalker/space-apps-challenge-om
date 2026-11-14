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
  TrendingUp,
  Sparkles,
} from "lucide-react";

import type { GameState, TurnResult } from "../engine/simulationEngine";
import type { MissionEnvironment } from "../data/nasaConstants";

interface MissionDebriefModalProps {
  isOpen: boolean;
  gameState: GameState;
  environment: MissionEnvironment;
  onPlayAgain: () => void;
  onSwitchPlanet: () => void;
  onShowNasaData?: () => void;
}

interface OutcomeRank {
  rankTitle: string;
  badge: string;
  evaluation: string;
  tier: "master" | "senior" | "survivor" | "junior" | "trainee";
  color: string;
  borderColor: string;
  bgGradient: string;
}

function calculateOutcomeRank(gameState: GameState): OutcomeRank {
  const { cumulativeScore, finalOutcome, crew, subsystems } = gameState;
  const isFailed =
    finalOutcome === "critical_alert" ||
    crew.oxygenBufferPercent < 10 ||
    crew.radiationExposureMSv > 50 ||
    Object.values(subsystems).some((s) => s.health < 15);

  if (isFailed) {
    return {
      rankTitle: "Systems Trainee",
      badge: "SIMULATION ABORT",
      evaluation:
        "Critical survival threshold breached. Subsystems suffered cascading brownouts or life support depletion. NASA post-flight analysis recommends tighter power rationing during environmental spikes.",
      tier: "trainee",
      color: "text-red-400",
      borderColor: "border-red-500/50",
      bgGradient: "from-red-950/60 via-slate-900 to-black",
    };
  }

  if (cumulativeScore >= 85) {
    return {
      rankTitle: "Artemis Master Architect",
      badge: "CHIEF FLIGHT ENGINEER",
      evaluation:
        "Flawless multi-variable execution. Maintained positive energy reserves while shielding the crew and keeping closed-loop ECLSS buffers above 80%. An exemplary model for NASA's Moon-to-Mars operational doctrine.",
      tier: "master",
      color: "text-amber-300",
      borderColor: "border-amber-400/60",
      bgGradient: "from-amber-950/60 via-slate-900 to-black",
    };
  }

  if (cumulativeScore >= 70) {
    return {
      rankTitle: "Artemis Master Engineer",
      badge: "EXPEDITION COMMANDER",
      evaluation:
        "Superb command under pressure. Successfully navigated extreme solar particle events and thermal anomalies while maintaining safe crew biological radiation thresholds.",
      tier: "senior",
      color: "text-cyan-300",
      borderColor: "border-cyan-400/60",
      bgGradient: "from-cyan-950/60 via-slate-900 to-black",
    };
  }

  if (cumulativeScore >= 52) {
    return {
      rankTitle: "Outpost Survivor",
      badge: "MISSION SURVIVOR",
      evaluation:
        "Mission completed and crew returned safely. However, several critical systems endured excessive wear or narrow O₂ margins. Optimization of power-divert protocols is recommended.",
      tier: "survivor",
      color: "text-emerald-300",
      borderColor: "border-emerald-500/50",
      bgGradient: "from-emerald-950/60 via-slate-900 to-black",
    };
  }

  return {
    rankTitle: "Junior Operations Officer",
    badge: "MISSION COMPLETED (MARGINAL)",
    evaluation:
      "Outpost survived the 10-turn window, but significant reserves were depleted. Heavy reliance on emergency buffers highlighted vulnerabilities in long-term infrastructure stability.",
    tier: "junior",
    color: "text-yellow-400",
    borderColor: "border-yellow-500/50",
    bgGradient: "from-yellow-950/60 via-slate-900 to-black",
  };
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
// Pure SVG Turn-by-Turn Subsystem Interaction Chart
// ---------------------------------------------------------------------------

function SubsystemTelemetryChart({ history }: { history: TurnResult[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!history || history.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-slate-500 font-mono text-xs">
        No telemetry logged yet.
      </div>
    );
  }

  const chartWidth = 620;
  const chartHeight = 200;
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const totalPoints = Math.max(10, history.length);
  const getX = (index: number) =>
    padding.left + (index / (totalPoints - 1)) * graphWidth;
  const getY = (value: number) =>
    padding.top + graphHeight - (Math.max(0, Math.min(100, value)) / 100) * graphHeight;

  // Generate SVG path strings
  const lsPoints = history.map((h, i) => `${getX(i)},${getY(h.subsystems.lifeSupport.health)}`).join(" ");
  const rsPoints = history.map((h, i) => `${getX(i)},${getY(h.subsystems.radiationShielding.health)}`).join(" ");
  const pgPoints = history.map((h, i) => `${getX(i)},${getY(h.subsystems.powerGrid.health)}`).join(" ");

  const hoveredTurn = hoveredIndex !== null ? history[hoveredIndex] : null;

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Legend & Hover Readout */}
      <div className="flex flex-wrap items-center justify-between text-xs font-mono gap-2 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Life Support</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Shielding</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span className="text-slate-300">Power Grid</span>
          </div>
        </div>

        {hoveredTurn ? (
          <div className="text-[11px] text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-cyan-500/30">
            Sol {hoveredTurn.turn}: LS {hoveredTurn.subsystems.lifeSupport.health.toFixed(0)}% · RS{" "}
            {hoveredTurn.subsystems.radiationShielding.health.toFixed(0)}% · Grid{" "}
            {hoveredTurn.subsystems.powerGrid.health.toFixed(0)}%
          </div>
        ) : (
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Hover points for exact Sol metrics
          </span>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto bg-slate-950/80 rounded-2xl border border-slate-800 p-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[500px]"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="rgba(148, 163, 184, 0.6)"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* X-axis labels (Sol 1 to 10) */}
          {Array.from({ length: 10 }).map((_, i) => {
            const x = getX(i);
            return (
              <text
                key={i}
                x={x}
                y={chartHeight - 10}
                textAnchor="middle"
                fill={
                  hoveredIndex === i
                    ? "#06B6D4"
                    : i < history.length
                    ? "rgba(148, 163, 184, 0.8)"
                    : "rgba(148, 163, 184, 0.3)"
                }
                fontSize="10"
                fontFamily="monospace"
                fontWeight={hoveredIndex === i ? "bold" : "normal"}
              >
                S{i + 1}
              </text>
            );
          })}

          {/* Polyline: Power Grid */}
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pgPoints}
          />

          {/* Polyline: Shielding */}
          <polyline
            fill="none"
            stroke="#06B6D4"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={rsPoints}
          />

          {/* Polyline: Life Support */}
          <polyline
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={lsPoints}
          />

          {/* Interactive Data Points */}
          {history.map((h, i) => {
            const x = getX(i);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Vertical guide line on hover */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + graphHeight}
                    stroke="#06B6D4"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.7"
                  />
                )}

                {/* Life Support Circle */}
                <circle
                  cx={x}
                  cy={getY(h.subsystems.lifeSupport.health)}
                  r={isHovered ? 5 : 3}
                  fill="#10B981"
                  stroke="#064E3B"
                  strokeWidth="1.5"
                />

                {/* Shielding Circle */}
                <circle
                  cx={x}
                  cy={getY(h.subsystems.radiationShielding.health)}
                  r={isHovered ? 5 : 3}
                  fill="#06B6D4"
                  stroke="#164E63"
                  strokeWidth="1.5"
                />

                {/* Power Grid Circle */}
                <circle
                  cx={x}
                  cy={getY(h.subsystems.powerGrid.health)}
                  r={isHovered ? 5 : 3}
                  fill="#3B82F6"
                  stroke="#1E3A8A"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
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
}: MissionDebriefModalProps) {
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
                NASA MISSION COMMAND · ENGINEERING DEBRIEF
              </span>
            </div>
            <span className="text-slate-400 hidden sm:inline">
              Destination: {environment.name} ({environment.subtitle})
            </span>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto p-5 sm:p-7 flex flex-col gap-6">
            {/* 1. MISSION OUTCOME RANK CARD */}
            <div
              className={`rounded-3xl p-6 border-2 bg-gradient-to-br ${outcomeRank.bgGradient} ${outcomeRank.borderColor} shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6`}
            >
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-white/10 text-[11px] font-mono font-bold tracking-wider uppercase mb-2">
                  <span className={outcomeRank.color}>{outcomeRank.badge}</span>
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

            {/* 2. TURN-BY-TURN SUB-SYSTEM INTERACTION CHART */}
            <div className="rounded-3xl bg-[#080D1A] border border-cyan-900/40 p-5 shadow-lg flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
                    Subsystem Telemetry Interaction Over Time
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Power · Life Support · Shielding
                </span>
              </div>

              <SubsystemTelemetryChart history={gameState.history} />
            </div>

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
                      "{insight1}"
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
                      "{insight2}"
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
                <span>View Real NASA Datasets</span>
              </button>
            )}

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Switch Planet Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSwitchPlanet}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition-colors border border-slate-600"
              >
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Switch Planet</span>
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
                <span>Play Again</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
