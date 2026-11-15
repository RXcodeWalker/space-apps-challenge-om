// ============================================================
// FlightRecorderReplay.tsx — Interactive Sol-by-Sol Mission Replay
// Features:
// 1. Dual-mode / Multi-tab SVG Telemetry Graphs:
//    - Power Distribution across all 10 Sols (Grid, Life Support, Shielding MW + Budget)
//    - Crew Telemetry (Morale %, Oxygen %, Food Days, Radiation mSv)
//    - Subsystem Health Integrity (%)
//    - Dual Synced Telemetry Deck (Side-by-side / Stacked)
// 2. Milestone Annotations pinned on chart (e.g., "Sol 4: Major Solar Flare weathered with 45 MW shields")
// 3. Automated Replay Engine (Play/Pause, Sol Scrubber, 1x/2x speed)
// 4. Sol Milestone Flight Log Tape with interactive seek
// ============================================================

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Users,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Shield,
  Sun,
  Flame,
  CloudLightning,
  Sparkles,
  Info,
} from "lucide-react";

import type { GameState } from "../engine/simulationEngine";
import type { MissionEnvironment } from "../data/nasaConstants";
import {
  buildFlightRecorderData,
  type SolMilestone,
  type FlightRecorderSummary,
} from "../utils/flightRecorder";
import { soundEffects } from "../utils/soundEffects";

interface FlightRecorderReplayProps {
  gameState: GameState;
  environment: MissionEnvironment;
}

type GraphTab = "power" | "crew" | "subsystems" | "dual";

export default function FlightRecorderReplay({
  gameState,
  environment,
}: FlightRecorderReplayProps) {
  const flightData: FlightRecorderSummary = useMemo(
    () => buildFlightRecorderData(gameState, environment),
    [gameState, environment]
  );

  const { milestones } = flightData;
  const totalSols = milestones.length || 10;

  const [activeTab, setActiveTab] = useState<GraphTab>("power");
  const [selectedSolIndex, setSelectedSolIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x or 2x
  const [hoveredSolIndex, setHoveredSolIndex] = useState<number | null>(null);

  const activeIndex = hoveredSolIndex !== null ? hoveredSolIndex : selectedSolIndex;
  const activeMilestone: SolMilestone | undefined = milestones[activeIndex];

  // Automated Replay Timer
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = playbackSpeed === 1 ? 1200 : 600;
      timerRef.current = window.setInterval(() => {
        setSelectedSolIndex((prev) => {
          if (prev >= totalSols - 1) {
            setIsPlaying(false);
            return totalSols - 1;
          }
          const next = prev + 1;
          soundEffects.playSliderClick(next * 20);
          return next;
        });
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, totalSols]);

  function handleTogglePlay() {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (selectedSolIndex >= totalSols - 1) {
        setSelectedSolIndex(0);
      }
      setIsPlaying(true);
    }
  }

  function handleSelectSol(index: number) {
    setIsPlaying(false);
    setSelectedSolIndex(index);
    soundEffects.playSliderClick(index * 25);
  }

  function handlePrev() {
    setIsPlaying(false);
    setSelectedSolIndex((prev) => Math.max(0, prev - 1));
    soundEffects.playSliderClick();
  }

  function handleNext() {
    setIsPlaying(false);
    setSelectedSolIndex((prev) => Math.min(totalSols - 1, prev + 1));
    soundEffects.playSliderClick();
  }

  return (
    <div className="w-full flex flex-col gap-4 bg-oc-inset rounded-oc-2 border border-oc-line p-4 sm:p-6 relative">
      {/* Top Header & View Controls */}
      <div className="flex flex-col gap-3 relative z-10 border-b border-oc-line pb-4">
        <div className="flex items-start gap-3 min-w-0">
          <Activity className="w-5 h-5 text-oc-accent shrink-0 mt-1" aria-hidden="true" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="oc-type-label text-oc-text-1 m-0">
                Sol-by-Sol Mission Replay &amp; Flight Recorder
              </h2>
              <span className="oc-chip oc-chip--plain">10-sol telemetry</span>
            </div>
            <p className="text-sm text-oc-text-2 mt-1 mb-0">
              Multi-subsystem power distribution, crew biometrics, and verified hazard milestone logs.
            </p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="oc-seg oc-seg--solid" role="radiogroup" aria-label="Flight recorder view">
          {(
            [
              { id: "power", label: "Power (MW)", Icon: Zap },
              { id: "crew", label: "Crew Vitals", Icon: Users },
              { id: "dual", label: "Dual Sync Deck", Icon: Layers },
              { id: "subsystems", label: "Integrity (%)", Icon: Shield },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={activeTab === id}
              onClick={() => setActiveTab(id)}
              className="oc-seg__opt"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Milestone Highlight Banner (Callout) */}
      {activeMilestone && (
        <motion.div
          key={activeMilestone.sol}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 oc-note"
          data-tone={
            activeMilestone.severity === "critical"
              ? "critical"
              : activeMilestone.severity === "warning"
              ? "caution"
              : activeMilestone.severity === "bonus"
              ? "accent"
              : "neutral"
          }
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2.5">
              <span className="shrink-0 text-oc-text-1">
                {activeMilestone.iconType === "flare" && <Flame className="w-4 h-4" />}
                {activeMilestone.iconType === "storm" && <CloudLightning className="w-4 h-4" />}
                {activeMilestone.iconType === "harvest" && <Sparkles className="w-4 h-4" />}
                {activeMilestone.iconType === "eclipse" && <Sun className="w-4 h-4" />}
                {activeMilestone.iconType === "strike" && <Flame className="w-4 h-4" />}
                {activeMilestone.iconType === "thermal" && <CloudLightning className="w-4 h-4" />}
                {activeMilestone.iconType === "nominal" && <Shield className="w-4 h-4" />}
                {activeMilestone.iconType === "eval" && <Activity className="w-4 h-4" />}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="oc-type-label">
                    {activeMilestone.headline}
                  </span>
                  <span className="oc-chip oc-chip--plain">
                    {activeMilestone.tag}
                  </span>
                </div>
                <p className="text-sm font-medium text-oc-text-1 mt-0.5 mb-0">
                  "{activeMilestone.milestoneAnnotation}"
                </p>
              </div>
            </div>

            {/* Quick Sol Metrics Pills */}
            <div className="oc-kv shrink-0">
              <span className="text-oc-text-2">
                Grid: <strong>{activeMilestone.powerAllocation.powerGrid} MW</strong>
              </span>
              <span className="text-oc-text-2">
                ECLSS: <strong>{activeMilestone.powerAllocation.lifeSupport} MW</strong>
              </span>
              <span className="text-oc-text-2">
                Shields: <strong>{activeMilestone.powerAllocation.radiationShielding} MW</strong>
              </span>
              <span className="text-oc-text-2">
                Food: <strong>{activeMilestone.powerAllocation.foodProduction} MW</strong>
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Primary SVG Graph Area */}
      <div className="relative z-10 w-full flex flex-col gap-3">
        {activeTab === "power" && (
          <PowerDistributionChart
            milestones={milestones}
            activeSolIndex={activeIndex}
            onHover={setHoveredSolIndex}
            onClickSol={handleSelectSol}
          />
        )}

        {activeTab === "crew" && (
          <CrewTelemetryChart
            milestones={milestones}
            activeSolIndex={activeIndex}
            onHover={setHoveredSolIndex}
            onClickSol={handleSelectSol}
          />
        )}

        {activeTab === "subsystems" && (
          <SubsystemHealthChart
            milestones={milestones}
            activeSolIndex={activeIndex}
            onHover={setHoveredSolIndex}
            onClickSol={handleSelectSol}
          />
        )}

        {activeTab === "dual" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 px-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>POWER ALLOCATION (MW)</span>
              </div>
              <PowerDistributionChart
                milestones={milestones}
                activeSolIndex={activeIndex}
                onHover={setHoveredSolIndex}
                onClickSol={handleSelectSol}
                isCompact
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-pink-300 px-1">
                <Users className="w-3.5 h-3.5 text-pink-400" />
                <span>CREW BIOMETRICS & TELEMETRY</span>
              </div>
              <CrewTelemetryChart
                milestones={milestones}
                activeSolIndex={activeIndex}
                onHover={setHoveredSolIndex}
                onClickSol={handleSelectSol}
                isCompact
              />
            </div>
          </div>
        )}
      </div>

      {/* Flight Recorder Controls & Sol Scrubber */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
        {/* Play / Step Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-black transition-all ${
              isPlaying
                ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-900/50"
                : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-900/50"
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? "PAUSE REPLAY" : "PLAY MISSION REPLAY"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrev}
            disabled={selectedSolIndex === 0}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800"
            title="Previous Sol"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={selectedSolIndex >= totalSols - 1}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800"
            title="Next Sol"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Speed Toggle */}
          <button
            type="button"
            onClick={() => setPlaybackSpeed((s) => (s === 1 ? 2 : 1))}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono font-bold text-slate-300"
          >
            {playbackSpeed}x SPEED
          </button>

          <button
            type="button"
            onClick={() => handleSelectSol(0)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            title="Reset to Sol 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sol 1 to 10 Pills Scrubber */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {milestones.map((m, idx) => {
            const isSelected = selectedSolIndex === idx;
            const isHovered = hoveredSolIndex === idx;
            const isMilestone = m.isMajor;

            return (
              <button
                key={m.sol}
                type="button"
                onClick={() => handleSelectSol(idx)}
                onMouseEnter={() => setHoveredSolIndex(idx)}
                onMouseLeave={() => setHoveredSolIndex(null)}
                className={`relative px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                  isSelected
                    ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/40 scale-105"
                    : isHovered
                    ? "bg-slate-700 text-white"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>S{m.sol}</span>
                {isMilestone && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected
                        ? "bg-black"
                        : m.severity === "critical"
                        ? "bg-red-400"
                        : m.severity === "bonus"
                        ? "bg-emerald-400"
                        : "bg-amber-400"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sol Milestone Flight Log Tape (Cards List) */}
      <div className="relative z-10 flex flex-col gap-2 mt-1">
        <div className="flex items-center justify-between text-xs font-mono px-1">
          <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Flight Log Milestones Across All 10 Sols</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Click any milestone to inspect that Sol
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {milestones.map((m, idx) => {
            const isSelected = activeIndex === idx;
            return (
              <div
                key={m.sol}
                onClick={() => handleSelectSol(idx)}
                className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                  isSelected
                    ? "bg-cyan-950/40 border-cyan-400/80 shadow-md shadow-cyan-950/50"
                    : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/60 text-slate-300"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                    m.severity === "critical"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : m.severity === "warning"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : m.severity === "bonus"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  }`}
                >
                  S{m.sol}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-mono font-bold text-white truncate">
                      {m.headline}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 shrink-0">
                      {m.totalAllocatedMW} MW
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    {m.milestoneAnnotation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Power Distribution Graph (MW allocated to Grid, ECLSS, Shielding + Budget)
// ---------------------------------------------------------------------------

function PowerDistributionChart({
  milestones,
  activeSolIndex,
  onHover,
  onClickSol,
  isCompact = false,
}: {
  milestones: SolMilestone[];
  activeSolIndex: number;
  onHover: (index: number | null) => void;
  onClickSol: (index: number) => void;
  isCompact?: boolean;
}) {
  const chartWidth = isCompact ? 520 : 700;
  const chartHeight = isCompact ? 190 : 230;
  const padding = { top: 32, right: 35, bottom: 28, left: 45 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const totalPoints = Math.max(10, milestones.length);
  const maxMW = 110;

  const getX = (i: number) =>
    padding.left + (i / (totalPoints - 1)) * graphWidth;
  const getY = (val: number) =>
    padding.top + graphHeight - (Math.max(0, Math.min(maxMW, val)) / maxMW) * graphHeight;

  // Build Polyline points
  const gridPoints = milestones.map((m, i) => `${getX(i)},${getY(m.powerAllocation.powerGrid)}`).join(" ");
  const lsPoints = milestones.map((m, i) => `${getX(i)},${getY(m.powerAllocation.lifeSupport)}`).join(" ");
  const shieldPoints = milestones.map((m, i) => `${getX(i)},${getY(m.powerAllocation.radiationShielding)}`).join(" ");
  const foodPoints = milestones.map((m, i) => `${getX(i)},${getY(m.powerAllocation.foodProduction)}`).join(" ");
  const budgetPoints = milestones.map((m, i) => `${getX(i)},${getY(m.effectiveBudgetMW)}`).join(" ");

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono px-1">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span className="text-slate-300">Power Grid (MW)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Life Support ECLSS (MW)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <span className="text-slate-300">Radiation Shields (MW)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Food Production (MW)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-amber-400" />
            <span className="text-amber-400/80">Available Budget</span>
          </div>
        </div>
        <span className="text-slate-500 hidden sm:inline">
          Y-Axis: Megawatts (MW)
        </span>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto bg-[#040814] rounded-2xl border border-slate-800/80 p-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[480px]"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="shieldGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (0, 25, 50, 75, 100 MW) */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
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
                  {val}MW
                </text>
              </g>
            );
          })}

          {/* Baseline Safe Demands Reference (35MW ECLSS, 30MW Shields, 25MW Grid) */}
          <line
            x1={padding.left}
            y1={getY(35)}
            x2={chartWidth - padding.right}
            y2={getY(35)}
            stroke="#10B981"
            strokeWidth="0.7"
            strokeDasharray="2 4"
            opacity="0.3"
          />

          {/* X-axis labels (Sol 1 to 10) */}
          {Array.from({ length: 10 }).map((_, i) => {
            const x = getX(i);
            const isCurrent = activeSolIndex === i;
            return (
              <text
                key={i}
                x={x}
                y={chartHeight - 8}
                textAnchor="middle"
                fill={isCurrent ? "#06B6D4" : "rgba(148, 163, 184, 0.7)"}
                fontSize="10"
                fontFamily="monospace"
                fontWeight={isCurrent ? "bold" : "normal"}
              >
                Sol {i + 1}
              </text>
            );
          })}

          {/* Budget Line (Dashed Amber) */}
          <polyline
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.8"
            points={budgetPoints}
          />

          {/* Power Grid (Blue) */}
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={gridPoints}
          />

          {/* Life Support (Cyan) */}
          <polyline
            fill="none"
            stroke="#06B6D4"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={lsPoints}
          />

          {/* Radiation Shielding (Indigo) */}
          <polyline
            fill="none"
            stroke="#6366F1"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={shieldPoints}
          />

          {/* Food Production (Emerald) */}
          <polyline
            fill="none"
            stroke="#10B981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={foodPoints}
          />

          {/* Active Sol Scanning Vertical Guide Line */}
          {activeSolIndex !== null && (
            <line
              x1={getX(activeSolIndex)}
              y1={padding.top - 12}
              x2={getX(activeSolIndex)}
              y2={padding.top + graphHeight}
              stroke="#06B6D4"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              opacity="0.9"
            />
          )}

          {/* Milestone Annotations / Flag Pins along the top */}
          {milestones.map((m, i) => {
            const x = getX(i);
            const isHovered = activeSolIndex === i;
            const isMajor = m.isMajor;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => onHover(i)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onClickSol(i)}
              >
                {/* Milestone Flag at Top */}
                {isMajor && (
                  <g transform={`translate(${x}, ${padding.top - 14})`}>
                    <circle
                      r={isHovered ? 7 : 5}
                      fill={
                        m.severity === "critical"
                          ? "#EF4444"
                          : m.severity === "bonus"
                          ? "#10B981"
                          : "#F59E0B"
                      }
                      stroke="#0B1120"
                      strokeWidth="1.5"
                    />
                    <text
                      y={-10}
                      textAnchor="middle"
                      fill={
                        m.severity === "critical"
                          ? "#FCA5A5"
                          : m.severity === "bonus"
                          ? "#6EE7B7"
                          : "#FDE68A"
                      }
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {m.iconType === "flare"
                        ? "FLARE"
                        : m.iconType === "storm"
                        ? "STORM"
                        : m.iconType === "harvest"
                        ? "HARVEST"
                        : m.iconType === "eclipse"
                        ? "ECLIPSE"
                        : m.iconType === "strike"
                        ? "IMPACT"
                        : "MILESTONE"}
                    </text>
                  </g>
                )}

                {/* Point nodes for Shielding */}
                <circle
                  cx={x}
                  cy={getY(m.powerAllocation.radiationShielding)}
                  r={isHovered ? 5 : 3}
                  fill="#6366F1"
                  stroke="#312E81"
                  strokeWidth="1.5"
                />

                {/* Point nodes for Life Support */}
                <circle
                  cx={x}
                  cy={getY(m.powerAllocation.lifeSupport)}
                  r={isHovered ? 5 : 3}
                  fill="#06B6D4"
                  stroke="#083344"
                  strokeWidth="1.5"
                />

                {/* Point nodes for Food */}
                <circle
                  cx={x}
                  cy={getY(m.powerAllocation.foodProduction)}
                  r={isHovered ? 5 : 3}
                  fill="#10B981"
                  stroke="#064E3B"
                  strokeWidth="1.5"
                />

                {/* Point nodes for Grid */}
                <circle
                  cx={x}
                  cy={getY(m.powerAllocation.powerGrid)}
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
// 2. Crew Telemetry Graph (Morale %, Oxygen %, Food Days, Radiation mSv)
// ---------------------------------------------------------------------------

function CrewTelemetryChart({
  milestones,
  activeSolIndex,
  onHover,
  onClickSol,
  isCompact = false,
}: {
  milestones: SolMilestone[];
  activeSolIndex: number;
  onHover: (index: number | null) => void;
  onClickSol: (index: number) => void;
  isCompact?: boolean;
}) {
  const chartWidth = isCompact ? 520 : 700;
  const chartHeight = isCompact ? 190 : 230;
  const padding = { top: 32, right: 35, bottom: 28, left: 45 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const totalPoints = Math.max(10, milestones.length);
  const getX = (i: number) =>
    padding.left + (i / (totalPoints - 1)) * graphWidth;
  const getYPct = (val: number) =>
    padding.top + graphHeight - (Math.max(0, Math.min(100, val)) / 100) * graphHeight;

  // Radiation normalized to 0-50 mSv safe threshold
  const getYRad = (mSv: number) =>
    padding.top + graphHeight - (Math.max(0, Math.min(50, mSv)) / 50) * graphHeight;

  const moralePoints = milestones.map((m, i) => `${getX(i)},${getYPct(m.crewVitals.morale)}`).join(" ");
  const o2Points = milestones.map((m, i) => `${getX(i)},${getYPct(m.crewVitals.oxygenBufferPercent)}`).join(" ");
  const foodPoints = milestones.map((m, i) => `${getX(i)},${getYPct((m.crewVitals.foodReserveDays / 20) * 100)}`).join(" ");
  const radPoints = milestones.map((m, i) => `${getX(i)},${getYRad(m.crewVitals.radiationExposureMSv)}`).join(" ");

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-400" />
            <span className="text-slate-300">Morale (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span className="text-slate-300">O₂ Buffer (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Food (Days, scaled)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            <span className="text-slate-300">Cumulative Rad (mSv / 50)</span>
          </div>
        </div>
        <span className="text-slate-500 hidden sm:inline">
          Y-Axis: Normalized %
        </span>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto bg-[#040814] rounded-2xl border border-slate-800/80 p-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[480px]"
        >
          {/* Grid lines (0, 25, 50, 75, 100%) */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = getYPct(val);
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
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

          {/* Safe Radiation Alert Threshold Line at 35 mSv (70%) */}
          <line
            x1={padding.left}
            y1={getYPct(70)}
            x2={chartWidth - padding.right}
            y2={getYPct(70)}
            stroke="#EF4444"
            strokeWidth="0.8"
            strokeDasharray="3 4"
            opacity="0.4"
          />

          {/* X-axis labels */}
          {Array.from({ length: 10 }).map((_, i) => {
            const x = getX(i);
            const isCurrent = activeSolIndex === i;
            return (
              <text
                key={i}
                x={x}
                y={chartHeight - 8}
                textAnchor="middle"
                fill={isCurrent ? "#EC4899" : "rgba(148, 163, 184, 0.7)"}
                fontSize="10"
                fontFamily="monospace"
                fontWeight={isCurrent ? "bold" : "normal"}
              >
                Sol {i + 1}
              </text>
            );
          })}

          {/* Lines */}
          <polyline
            fill="none"
            stroke="#FB923C"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={radPoints}
          />
          <polyline
            fill="none"
            stroke="#34D399"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={foodPoints}
          />
          <polyline
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={o2Points}
          />
          <polyline
            fill="none"
            stroke="#EC4899"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={moralePoints}
          />

          {/* Active Guide Line */}
          {activeSolIndex !== null && (
            <line
              x1={getX(activeSolIndex)}
              y1={padding.top - 12}
              x2={getX(activeSolIndex)}
              y2={padding.top + graphHeight}
              stroke="#EC4899"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              opacity="0.9"
            />
          )}

          {/* Nodes */}
          {milestones.map((m, i) => {
            const x = getX(i);
            const isHovered = activeSolIndex === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => onHover(i)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onClickSol(i)}
              >
                <circle
                  cx={x}
                  cy={getYPct(m.crewVitals.morale)}
                  r={isHovered ? 5 : 3}
                  fill="#EC4899"
                  stroke="#831843"
                  strokeWidth="1.5"
                />
                <circle
                  cx={x}
                  cy={getYPct(m.crewVitals.oxygenBufferPercent)}
                  r={isHovered ? 5 : 3}
                  fill="#38BDF8"
                  stroke="#075985"
                  strokeWidth="1.5"
                />
                <circle
                  cx={x}
                  cy={getYRad(m.crewVitals.radiationExposureMSv)}
                  r={isHovered ? 5 : 3}
                  fill="#FB923C"
                  stroke="#7C2D12"
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
// 3. Subsystem Health Integrity Graph (%)
// ---------------------------------------------------------------------------

function SubsystemHealthChart({
  milestones,
  activeSolIndex,
  onHover,
  onClickSol,
}: {
  milestones: SolMilestone[];
  activeSolIndex: number;
  onHover: (index: number | null) => void;
  onClickSol: (index: number) => void;
}) {
  const chartWidth = 700;
  const chartHeight = 230;
  const padding = { top: 32, right: 35, bottom: 28, left: 45 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const totalPoints = Math.max(10, milestones.length);
  const getX = (i: number) =>
    padding.left + (i / (totalPoints - 1)) * graphWidth;
  const getY = (val: number) =>
    padding.top + graphHeight - (Math.max(0, Math.min(100, val)) / 100) * graphHeight;

  const pgPoints = milestones.map((m, i) => `${getX(i)},${getY(m.subsystemHealth.powerGrid)}`).join(" ");
  const lsPoints = milestones.map((m, i) => `${getX(i)},${getY(m.subsystemHealth.lifeSupport)}`).join(" ");
  const rsPoints = milestones.map((m, i) => `${getX(i)},${getY(m.subsystemHealth.radiationShielding)}`).join(" ");
  const fpPoints = milestones.map((m, i) => `${getX(i)},${getY(m.subsystemHealth.foodProduction)}`).join(" ");

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono px-1">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span className="text-slate-300">Power Grid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Life Support</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <span className="text-slate-300">Shielding</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Food Production</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto bg-[#040814] rounded-2xl border border-slate-800/80 p-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[480px]"
        >
          {[0, 25, 50, 75, 100].map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
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

          {Array.from({ length: 10 }).map((_, i) => (
            <text
              key={i}
              x={getX(i)}
              y={chartHeight - 8}
              textAnchor="middle"
              fill={activeSolIndex === i ? "#10B981" : "rgba(148, 163, 184, 0.7)"}
              fontSize="10"
              fontFamily="monospace"
              fontWeight={activeSolIndex === i ? "bold" : "normal"}
            >
              Sol {i + 1}
            </text>
          ))}

          <polyline fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" points={pgPoints} />
          <polyline fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" points={lsPoints} />
          <polyline fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" points={rsPoints} />
          <polyline fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" points={fpPoints} />

          {milestones.map((m, i) => {
            const x = getX(i);
            const isHovered = activeSolIndex === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => onHover(i)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onClickSol(i)}
              >
                <circle cx={x} cy={getY(m.subsystemHealth.foodProduction)} r={isHovered ? 5 : 3} fill="#10B981" />
                <circle cx={x} cy={getY(m.subsystemHealth.lifeSupport)} r={isHovered ? 5 : 3} fill="#06B6D4" />
                <circle cx={x} cy={getY(m.subsystemHealth.radiationShielding)} r={isHovered ? 5 : 3} fill="#6366F1" />
                <circle cx={x} cy={getY(m.subsystemHealth.powerGrid)} r={isHovered ? 5 : 3} fill="#3B82F6" />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
