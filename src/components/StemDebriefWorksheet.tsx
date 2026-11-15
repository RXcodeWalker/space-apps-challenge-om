// ============================================================
// StemDebriefWorksheet.tsx — STEM Flight Director Worksheet
// Official NASA Junior Flight Director Mission Flight Log & Lab Report
// Features:
// 1. Print-optimized, black-and-white ink friendly, crisp borders
// 2. Official NASA Flight Log Header with Commander Name, Seed, Location, Score/Rank
// 3. Section 1: Executive Telemetry Summary (Survival, O2, Food, Radiation vs 500 mSv limit)
// 4. Section 2: Pure-SVG 10-Sol Telemetry Chart (Power allocation & Subsystem health trends)
// 5. Section 3: Guided Scientific Reflection Prompts with dotted handwriting lines
// 6. Section 4: Teacher Grading Rubric (Systems Engineering, Scientific Reasoning, Resource Efficiency)
// 7. One-click "Print / Save as PDF" via window.print() and custom print CSS
// ============================================================

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Printer,
  X,
  Edit3,
} from "lucide-react";

import type { GameState } from "../engine/simulationEngine";
import type { MissionEnvironment } from "../data/nasaConstants";
import { calculateOutcomeRank } from "../utils/flightRecorder";
import { DIFFICULTY_PRESETS } from "../data/difficultyTiers";

interface StemDebriefWorksheetProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  environment: MissionEnvironment;
  initialCommanderName?: string;
  autoPrint?: boolean;
}

export default function StemDebriefWorksheet({
  isOpen,
  onClose,
  gameState,
  environment,
  initialCommanderName = "Commander Alex",
  autoPrint = false,
}: StemDebriefWorksheetProps) {
  const [commanderName, setCommanderName] = useState<string>(initialCommanderName);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const worksheetRef = useRef<HTMLDivElement>(null);

  const { cumulativeScore, difficulty = "commander", crew, subsystems, history = [] } = gameState;
  const outcomeRank = calculateOutcomeRank(gameState);

  // Formatted date and deterministic mission seed
  const currentDateFormatted = "November 14, 2026";
  const envCode =
    environment.id === "lunar_south_pole"
      ? "LUN"
      : environment.id === "mars_gale_crater"
      ? "MAR"
      : environment.id === "europa_under_ice"
      ? "EUR"
      : "TTN";

  const missionSeedNumber = (
    (history.length * 7919 + Math.round(cumulativeScore * 313) + (crew.morale || 70) * 17) % 8999
  ) + 1000;
  const missionSeed = `NASA-JFD-2026-${envCode}-${missionSeedNumber}`;

  const destinationName =
    environment.id === "lunar_south_pole"
      ? "Shackleton Crater, Lunar South Pole (89.9°S)"
      : environment.id === "mars_gale_crater"
      ? "Gale Crater, Mars (5.4°S, 137.8°E)"
      : environment.name;

  const difficultyConfig = DIFFICULTY_PRESETS[difficulty] || DIFFICULTY_PRESETS.commander;

  // Radiation career percentage
  const careerLimit = 500.0;
  const missionRad = Math.max(0, crew.radiationExposureMSv || 0);
  const careerRadPct = ((missionRad / careerLimit) * 100).toFixed(2);

  // Trigger print with body print class
  const handlePrint = () => {
    document.body.classList.add("printing-worksheet");
    window.print();
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove("printing-worksheet");
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      document.body.classList.remove("printing-worksheet");
    };
  }, []);

  // Handle autoPrint if requested
  useEffect(() => {
    if (isOpen && autoPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // Section 2: Telemetry Data Processing for Pure-SVG Chart
  // -------------------------------------------------------------
  const turnsCount = 10;
  const chartWidth = 780;
  const chartHeight = 220;
  const padding = { left: 45, right: 25, top: 25, bottom: 35 };
  const subChartWidth = (chartWidth - padding.left - padding.right - 40) / 2; // two side-by-side charts

  // Extract history data or fallback
  const solPoints = Array.from({ length: turnsCount }).map((_, idx) => {
    const solNumber = idx + 1;
    const item = history[idx];
    if (item) {
      return {
        sol: solNumber,
        eclssHealth: Math.round(item.subsystems.lifeSupport.health),
        shieldHealth: Math.round(item.subsystems.radiationShielding.health),
        gridHealth: Math.round(item.subsystems.powerGrid.health),
        foodHealth: Math.round(item.subsystems.foodProduction.health),
        eclssMW: Math.round(item.allocation.lifeSupport),
        shieldMW: Math.round(item.allocation.radiationShielding),
        gridMW: Math.round(item.allocation.powerGrid),
        foodMW: Math.round(item.allocation.foodProduction),
        budgetMW: Math.round(item.powerBudgetMW),
        eventLabel: item.event?.label || "",
      };
    }
    // If fewer than 10 turns completed, pad with last known or baseline
    const lastItem = history[history.length - 1];
    return {
      sol: solNumber,
      eclssHealth: lastItem ? Math.round(lastItem.subsystems.lifeSupport.health) : 85,
      shieldHealth: lastItem ? Math.round(lastItem.subsystems.radiationShielding.health) : 85,
      gridHealth: lastItem ? Math.round(lastItem.subsystems.powerGrid.health) : 85,
      foodHealth: lastItem ? Math.round(lastItem.subsystems.foodProduction.health) : 85,
      eclssMW: lastItem ? Math.round(lastItem.allocation.lifeSupport) : 30,
      shieldMW: lastItem ? Math.round(lastItem.allocation.radiationShielding) : 25,
      gridMW: lastItem ? Math.round(lastItem.allocation.powerGrid) : 25,
      foodMW: lastItem ? Math.round(lastItem.allocation.foodProduction) : 20,
      budgetMW: lastItem ? Math.round(lastItem.powerBudgetMW) : 100,
      eventLabel: "",
    };
  });

  // Scale helpers for Chart 1: Health (0 - 100%)
  const c1Left = padding.left;
  const c1Right = c1Left + subChartWidth;
  const getC1X = (solIdx: number) => c1Left + (solIdx / (turnsCount - 1)) * subChartWidth;
  const getC1Y = (healthVal: number) =>
    padding.top + (1 - Math.max(0, Math.min(100, healthVal)) / 100) * (chartHeight - padding.top - padding.bottom);

  // Scale helpers for Chart 2: Power Allocation (0 - 60 MW)
  const maxMW = 60;
  const c2Left = c1Right + 40;
  const c2Right = c2Left + subChartWidth;
  const getC2X = (solIdx: number) => c2Left + (solIdx / (turnsCount - 1)) * subChartWidth;
  const getC2Y = (mwVal: number) =>
    padding.top + (1 - Math.max(0, Math.min(maxMW, mwVal)) / maxMW) * (chartHeight - padding.top - padding.bottom);

  // Build SVG path strings
  const c1EclssPath = solPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${getC1X(i)} ${getC1Y(p.eclssHealth)}`).join(" ");
  const c1ShieldPath = solPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${getC1X(i)} ${getC1Y(p.shieldHealth)}`).join(" ");
  const c1GridPath = solPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${getC1X(i)} ${getC1Y(p.gridHealth)}`).join(" ");
  const c1FoodPath = solPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${getC1X(i)} ${getC1Y(p.foodHealth)}`).join(" ");

  const c2EclssPath = solPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${getC2X(i)} ${getC2Y(p.eclssMW)}`).join(" ");
  const c2ShieldPath = solPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${getC2X(i)} ${getC2Y(p.shieldMW)}`).join(" ");
  const c2GridPath = solPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${getC2X(i)} ${getC2Y(p.gridMW)}`).join(" ");
  const c2FoodPath = solPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${getC2X(i)} ${getC2Y(p.foodMW)}`).join(" ");

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Scoped print styling */}
        <style>{`
          @media print {
            @page {
              size: portrait;
              margin: 8mm;
            }
            body {
              background: #ffffff !important;
              color: #0f172a !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            .stem-worksheet-printable {
              display: block !important;
              background: #ffffff !important;
              color: #0f172a !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
            .page-break-inside-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        `}</style>

        {/* Modal Backdrop (hidden during print) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[var(--oc-scrim)] no-print"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="relative w-full max-w-4xl bg-oc-panel border border-oc-line-strong rounded-oc-2 flex flex-col max-h-[calc(100dvh-16px)] my-auto"
        >
          {/* Top Control Bar (Screen Only - Hidden during print) */}
          <div className="w-full py-3 px-5 bg-oc-inset border-b border-oc-line rounded-t-[3px] flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-oc-1 bg-oc-raised text-oc-accent flex items-center justify-center font-bold text-sm">
                📄
              </div>
              <div>
                <h2 className="oc-type-label text-oc-text-1 m-0 flex flex-wrap items-center gap-2">
                  STEM Flight Director Worksheet
                  <span className="oc-chip oc-chip--plain">
                    Print / PDF Ready
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Black-and-white ink friendly · Classroom Science Lab Activity
                </p>
              </div>
            </div>

            {/* Actions: Commander Name Edit, Print, Close */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Editable Name Field */}
              <div className="flex items-center gap-1.5 bg-oc-panel border border-oc-line px-3 py-1 rounded-oc-1 text-xs font-mono">
                <span className="text-slate-400">Student:</span>
                {isEditingName ? (
                  <input
                    type="text"
                    value={commanderName}
                    onChange={(e) => setCommanderName(e.target.value)}
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
                    autoFocus
                    className="bg-oc-raised text-oc-text-1 px-1.5 py-0.5 rounded-oc-1 border border-oc-accent outline-none w-32 font-bold"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="flex items-center gap-1 text-oc-text-1 hover:underline font-bold cursor-pointer min-h-8"
                    title="Click to edit student/commander name"
                  >
                    <span>{commanderName}</span>
                    <Edit3 className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>

              {/* 1-Click Print / Save PDF Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="oc-btn oc-btn--sm oc-btn--primary"
                title="Print or Save as PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF Lab Report</span>
              </button>

              {/* Close Modal Button */}
              <button
                type="button"
                onClick={onClose}
                className="oc-modal__close"
                style={{ margin: 0, width: 32, height: 32 }}
                aria-label="Close worksheet"
                title="Close Worksheet"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Worksheet Viewable Area */}
          <div className="overflow-y-auto p-3 sm:p-6 bg-oc-void">
            {/* The Actual Printable Worksheet Container */}
            <div
              ref={worksheetRef}
              id="printable-stem-debrief-worksheet"
              className="stem-worksheet-printable bg-white text-slate-900 rounded-xl border-2 border-slate-900 p-6 sm:p-8 md:p-10 shadow-2xl mx-auto max-w-[850px] font-sans text-xs leading-normal"
            >
              {/* ============================================================ */}
              {/* HEADER: Official NASA Junior Flight Director Mission Log     */}
              {/* ============================================================ */}
              <header className="border-b-2 border-slate-900 pb-4 mb-5">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  {/* Left: Official NASA Typography & Meatball Logo */}
                  <div className="flex items-center gap-3.5">
                    {/* High-Contrast Vector NASA Meatball / Artemis Vector Emblem */}
                    <div className="w-14 h-14 rounded-full bg-slate-950 text-white flex flex-col items-center justify-center p-1 border-2 border-slate-900 shrink-0">
                      <div className="font-mono font-black text-[9px] tracking-wider text-cyan-300">
                        OUTPOST
                      </div>
                      <div className="text-[7px] font-mono tracking-tighter text-amber-400 uppercase">
                        CMDR
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-slate-700 uppercase">
                        Outpost Commander · Inspired by NASA Data
                      </div>
                      <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-slate-950 uppercase font-mono">
                        Junior Flight Director Mission Flight Log
                      </h1>
                      <div className="text-[10px] font-mono text-slate-600 font-semibold uppercase tracking-wider">
                        STEM Classroom Laboratory Report · Space Systems Engineering
                      </div>
                    </div>
                  </div>

                  {/* Right: Sol Completion & Grade Badge */}
                  <div className="text-left sm:text-right shrink-0 sm:border-l-2 border-slate-900 sm:pl-4">
                    <div className="text-[9px] font-mono font-bold text-slate-600 uppercase">
                      MISSION SCORE
                    </div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-slate-950">
                      {cumulativeScore}
                      <span className="text-xs text-slate-600 font-normal"> / 100</span>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-slate-800 uppercase">
                      {outcomeRank.badge}
                    </div>
                  </div>
                </div>

                {/* Metadata Table Grid */}
                <div className="mt-4 pt-3 border-t border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-100 p-2 rounded border border-slate-300">
                    <span className="text-[9px] text-slate-500 uppercase block">Commander / Student</span>
                    <strong className="text-slate-900 truncate block text-xs">{commanderName}</strong>
                  </div>
                  <div className="bg-slate-100 p-2 rounded border border-slate-300">
                    <span className="text-[9px] text-slate-500 uppercase block">Mission Seed / Serial</span>
                    <strong className="text-slate-900 truncate block text-xs">{missionSeed}</strong>
                  </div>
                  <div className="bg-slate-100 p-2 rounded border border-slate-300">
                    <span className="text-[9px] text-slate-500 uppercase block">Operational Location</span>
                    <strong className="text-slate-900 truncate block text-xs">
                      {environment.id === "lunar_south_pole" ? "Shackleton Crater" : "Gale Crater"}
                    </strong>
                  </div>
                  <div className="bg-slate-100 p-2 rounded border border-slate-300">
                    <span className="text-[9px] text-slate-500 uppercase block">Rank / Difficulty</span>
                    <strong className="text-slate-900 truncate block text-xs">
                      {outcomeRank.rankTitle.split(" ")[0]} ({difficultyConfig.commanderRank})
                    </strong>
                  </div>
                </div>

                {/* Sub-meta details bar */}
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-600 px-1">
                  <span>DEPLOYMENT: {destinationName}</span>
                  <span>EVALUATION DATE: {currentDateFormatted} · 10 SOLS EVALUATED</span>
                </div>
              </header>

              {/* ============================================================ */}
              {/* SECTION 1: Executive Telemetry Summary                       */}
              {/* ============================================================ */}
              <section className="mb-6 page-break-inside-avoid">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1 mb-3">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      1
                    </span>
                    Executive Telemetry Summary & Human Survival Metrics
                  </h2>
                  <span className="text-[10px] font-mono text-slate-500">
                    NASA STD-3001 & BVAD Bioastronautics Benchmark
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  {/* Metric 1: Survival Status */}
                  <div className="p-3 bg-slate-50 border-2 border-slate-900 rounded-lg flex flex-col justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase text-slate-600">
                      Survival Status
                    </span>
                    <div className="my-1">
                      <span className="text-base sm:text-lg font-black font-mono text-slate-950 uppercase">
                        {gameState.finalOutcome === "critical_alert"
                          ? "CRITICAL ABORT"
                          : "10 SOLS SURVIVED"}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-600">
                      Crew Morale: <strong>{crew.morale}%</strong>
                    </span>
                  </div>

                  {/* Metric 2: Final O2 % */}
                  <div className="p-3 bg-slate-50 border-2 border-slate-900 rounded-lg flex flex-col justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase text-slate-600">
                      Final O₂ Buffer %
                    </span>
                    <div className="my-1">
                      <span className="text-xl sm:text-2xl font-black font-mono text-slate-950">
                        {crew.oxygenBufferPercent.toFixed(0)}%
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-600">
                      NASA Threshold: <strong>&ge; 20% safe</strong>
                    </span>
                  </div>

                  {/* Metric 3: Food Remaining */}
                  <div className="p-3 bg-slate-50 border-2 border-slate-900 rounded-lg flex flex-col justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase text-slate-600">
                      Food Reserves Left
                    </span>
                    <div className="my-1">
                      <span className="text-xl sm:text-2xl font-black font-mono text-slate-950">
                        {crew.foodReserveDays.toFixed(1)}{" "}
                        <span className="text-xs font-normal">Sols</span>
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-600">
                      Yield: <strong>{(crew.harvestYieldKg || 0).toFixed(1)} kg</strong>
                    </span>
                  </div>

                  {/* Metric 4: Cumulative Radiation vs Career Ceiling */}
                  <div className="p-3 bg-slate-50 border-2 border-slate-900 rounded-lg flex flex-col justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase text-slate-600">
                      Cumulative Radiation
                    </span>
                    <div className="my-1">
                      <span className="text-xl sm:text-2xl font-black font-mono text-slate-950">
                        {missionRad.toFixed(2)}{" "}
                        <span className="text-xs font-normal">mSv</span>
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-600">
                      vs <strong>500 mSv</strong> limit ({careerRadPct}%)
                    </span>
                  </div>
                </div>

                {/* Subsystem Health Status Bar Table */}
                <div className="mt-3 border border-slate-300 rounded overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1 font-mono text-[9px] font-bold uppercase text-slate-700 flex justify-between border-b border-slate-300">
                    <span>Subsystem Final Integrity Ledger</span>
                    <span>Nominal Threshold: &ge; 40%</span>
                  </div>
                  <div className="grid grid-cols-4 divide-x divide-slate-300 text-center py-1.5 bg-white text-[10px] font-mono">
                    <div>
                      <span className="text-slate-500 block text-[9px]">Life Support (ECLSS)</span>
                      <strong className="text-slate-900 text-xs">
                        {subsystems.lifeSupport.health.toFixed(0)}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Radiation Shield</span>
                      <strong className="text-slate-900 text-xs">
                        {subsystems.radiationShielding.health.toFixed(0)}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Power Grid & Batt</span>
                      <strong className="text-slate-900 text-xs">
                        {subsystems.powerGrid.health.toFixed(0)}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Food Hydroponics</span>
                      <strong className="text-slate-900 text-xs">
                        {subsystems.foodProduction.health.toFixed(0)}%
                      </strong>
                    </div>
                  </div>
                </div>
              </section>

              {/* ============================================================ */}
              {/* SECTION 2: Pure-SVG 10-Sol Telemetry Chart                   */}
              {/* ============================================================ */}
              <section className="mb-6 page-break-inside-avoid">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1 mb-2">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      2
                    </span>
                    Pure-SVG 10-Sol Subsystem Health & Power Allocation Trends
                  </h2>
                  <span className="text-[10px] font-mono text-slate-500">
                    Multi-Series Vector Telemetry (Sols 1–10)
                  </span>
                </div>

                {/* Pure-SVG Multi-Series Telemetry Chart Canvas */}
                <div className="border-2 border-slate-900 rounded-lg p-2 bg-white">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-auto"
                    style={{ maxHeight: "240px" }}
                  >
                    {/* Definitions for Markers and Line Patterns */}
                    <defs>
                      <marker
                        id="circleMarker"
                        markerWidth="6"
                        markerHeight="6"
                        refX="3"
                        refY="3"
                      >
                        <circle cx="3" cy="3" r="2.5" fill="#0284c7" stroke="#000" strokeWidth="0.5" />
                      </marker>
                      <marker
                        id="squareMarker"
                        markerWidth="6"
                        markerHeight="6"
                        refX="3"
                        refY="3"
                      >
                        <rect x="0.5" y="0.5" width="5" height="5" fill="#d97706" stroke="#000" strokeWidth="0.5" />
                      </marker>
                      <marker
                        id="triangleMarker"
                        markerWidth="6"
                        markerHeight="6"
                        refX="3"
                        refY="3"
                      >
                        <polygon points="3,0 6,5 0,5" fill="#7c3aed" stroke="#000" strokeWidth="0.5" />
                      </marker>
                      <marker
                        id="diamondMarker"
                        markerWidth="6"
                        markerHeight="6"
                        refX="3"
                        refY="3"
                      >
                        <polygon points="3,0 6,3 3,6 0,3" fill="#16a34a" stroke="#000" strokeWidth="0.5" />
                      </marker>
                    </defs>

                    {/* ----------------- SUB-CHART 1: HEALTH (%) ----------------- */}
                    <g id="chart-subsystem-health">
                      {/* Chart Title */}
                      <text
                        x={c1Left + subChartWidth / 2}
                        y={14}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                        fill="#0f172a"
                      >
                        A. SUBSYSTEM HEALTH TRENDS (%)
                      </text>

                      {/* Horizontal Grid Lines: 0, 25, 50, 75, 100% */}
                      {[0, 25, 50, 75, 100].map((val) => {
                        const y = getC1Y(val);
                        return (
                          <g key={`c1-grid-${val}`}>
                            <line
                              x1={c1Left}
                              y1={y}
                              x2={c1Right}
                              y2={y}
                              stroke="#cbd5e1"
                              strokeWidth={val === 50 ? "1" : "0.5"}
                              strokeDasharray={val === 50 ? "3,3" : undefined}
                            />
                            <text
                              x={c1Left - 5}
                              y={y + 3}
                              textAnchor="end"
                              fontSize="8"
                              fontFamily="monospace"
                              fill="#64748b"
                            >
                              {val}%
                            </text>
                          </g>
                        );
                      })}

                      {/* Critical Failure Baseline line (20%) */}
                      <line
                        x1={c1Left}
                        y1={getC1Y(20)}
                        x2={c1Right}
                        y2={getC1Y(20)}
                        stroke="#dc2626"
                        strokeWidth="0.8"
                        strokeDasharray="2,2"
                      />

                      {/* X Axis & Ticks */}
                      <line
                        x1={c1Left}
                        y1={chartHeight - padding.bottom}
                        x2={c1Right}
                        y2={chartHeight - padding.bottom}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      {solPoints.map((_, i) => {
                        const x = getC1X(i);
                        return (
                          <g key={`c1-tick-${i}`}>
                            <line
                              x1={x}
                              y1={chartHeight - padding.bottom}
                              x2={x}
                              y2={chartHeight - padding.bottom + 4}
                              stroke="#0f172a"
                              strokeWidth="1"
                            />
                            <text
                              x={x}
                              y={chartHeight - padding.bottom + 14}
                              textAnchor="middle"
                              fontSize="8"
                              fontFamily="monospace"
                              fill="#334155"
                            >
                              S{i + 1}
                            </text>
                          </g>
                        );
                      })}

                      {/* Health Lines */}
                      <path
                        d={c1EclssPath}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="2"
                        markerStart="url(#circleMarker)"
                        markerMid="url(#circleMarker)"
                        markerEnd="url(#circleMarker)"
                      />
                      <path
                        d={c1ShieldPath}
                        fill="none"
                        stroke="#d97706"
                        strokeWidth="2"
                        strokeDasharray="5,3"
                        markerStart="url(#squareMarker)"
                        markerMid="url(#squareMarker)"
                        markerEnd="url(#squareMarker)"
                      />
                      <path
                        d={c1GridPath}
                        fill="none"
                        stroke="#7c3aed"
                        strokeWidth="2"
                        strokeDasharray="2,2"
                        markerStart="url(#triangleMarker)"
                        markerMid="url(#triangleMarker)"
                        markerEnd="url(#triangleMarker)"
                      />
                      <path
                        d={c1FoodPath}
                        fill="none"
                        stroke="#16a34a"
                        strokeWidth="1.5"
                        strokeDasharray="6,2,2,2"
                        markerStart="url(#diamondMarker)"
                        markerMid="url(#diamondMarker)"
                        markerEnd="url(#diamondMarker)"
                      />
                    </g>

                    {/* ----------------- SUB-CHART 2: POWER ALLOCATION (MW) ----------------- */}
                    <g id="chart-power-allocation">
                      {/* Chart Title */}
                      <text
                        x={c2Left + subChartWidth / 2}
                        y={14}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                        fill="#0f172a"
                      >
                        B. POWER ALLOCATION TRENDS (MW)
                      </text>

                      {/* Horizontal Grid Lines: 0, 15, 30, 45, 60 MW */}
                      {[0, 15, 30, 45, 60].map((val) => {
                        const y = getC2Y(val);
                        return (
                          <g key={`c2-grid-${val}`}>
                            <line
                              x1={c2Left}
                              y1={y}
                              x2={c2Right}
                              y2={y}
                              stroke="#cbd5e1"
                              strokeWidth={val === 30 ? "1" : "0.5"}
                              strokeDasharray={val === 30 ? "3,3" : undefined}
                            />
                            <text
                              x={c2Left - 5}
                              y={y + 3}
                              textAnchor="end"
                              fontSize="8"
                              fontFamily="monospace"
                              fill="#64748b"
                            >
                              {val}M
                            </text>
                          </g>
                        );
                      })}

                      {/* X Axis & Ticks */}
                      <line
                        x1={c2Left}
                        y1={chartHeight - padding.bottom}
                        x2={c2Right}
                        y2={chartHeight - padding.bottom}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      {solPoints.map((_, i) => {
                        const x = getC2X(i);
                        return (
                          <g key={`c2-tick-${i}`}>
                            <line
                              x1={x}
                              y1={chartHeight - padding.bottom}
                              x2={x}
                              y2={chartHeight - padding.bottom + 4}
                              stroke="#0f172a"
                              strokeWidth="1"
                            />
                            <text
                              x={x}
                              y={chartHeight - padding.bottom + 14}
                              textAnchor="middle"
                              fontSize="8"
                              fontFamily="monospace"
                              fill="#334155"
                            >
                              S{i + 1}
                            </text>
                          </g>
                        );
                      })}

                      {/* Power Lines */}
                      <path
                        d={c2EclssPath}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="2"
                        markerStart="url(#circleMarker)"
                        markerMid="url(#circleMarker)"
                        markerEnd="url(#circleMarker)"
                      />
                      <path
                        d={c2ShieldPath}
                        fill="none"
                        stroke="#d97706"
                        strokeWidth="2"
                        strokeDasharray="5,3"
                        markerStart="url(#squareMarker)"
                        markerMid="url(#squareMarker)"
                        markerEnd="url(#squareMarker)"
                      />
                      <path
                        d={c2GridPath}
                        fill="none"
                        stroke="#7c3aed"
                        strokeWidth="2"
                        strokeDasharray="2,2"
                        markerStart="url(#triangleMarker)"
                        markerMid="url(#triangleMarker)"
                        markerEnd="url(#triangleMarker)"
                      />
                      <path
                        d={c2FoodPath}
                        fill="none"
                        stroke="#16a34a"
                        strokeWidth="1.5"
                        strokeDasharray="6,2,2,2"
                        markerStart="url(#diamondMarker)"
                        markerMid="url(#diamondMarker)"
                        markerEnd="url(#diamondMarker)"
                      />
                    </g>
                  </svg>

                  {/* High-Contrast Legend */}
                  <div className="pt-2 border-t border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-[#0284c7] inline-block font-black">━━</span>
                      <span>● ECLSS O₂ / Water</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 border-b-2 border-dashed border-[#d97706] inline-block">--</span>
                      <span>■ Radiation Shield</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 border-b-2 border-dotted border-[#7c3aed] inline-block">··</span>
                      <span>▲ Power Grid / Batt</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 border-b-2 border-dashed border-[#16a34a] inline-block">-·</span>
                      <span>◆ Food Hydroponics</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ============================================================ */}
              {/* SECTION 3: Guided Scientific Reflection Prompts              */}
              {/* ============================================================ */}
              <section className="mb-6 page-break-inside-avoid">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1 mb-3">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      3
                    </span>
                    Guided Scientific Reflection & Systems Analysis
                  </h2>
                  <span className="text-[10px] font-mono text-slate-500">
                    Student Written Response Section
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Prompt 1 */}
                  <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
                    <p className="font-bold text-slate-950 text-xs mb-1">
                      1. What was your primary power trade-off when the Solar Flare / Dust Storm struck?
                    </p>
                    <p className="text-[10px] text-slate-600 mb-2 italic">
                      (Telemetry Guide: Reference Sols where available generation dropped or radiation peaked. Which subsystem was starved, and what were the immediate consequences?)
                    </p>
                    <div className="space-y-3 pt-1">
                      <div className="border-b border-dotted border-slate-400 h-5 w-full" />
                      <div className="border-b border-dotted border-slate-400 h-5 w-full" />
                      <div className="border-b border-dotted border-slate-400 h-5 w-full" />
                    </div>
                  </div>

                  {/* Prompt 2 */}
                  <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
                    <p className="font-bold text-slate-950 text-xs mb-1">
                      2. Did your food reserves hold out? If not, what adjustments will you make to greenhouse power next time?
                    </p>
                    <p className="text-[10px] text-slate-600 mb-2 italic">
                      (Telemetry Guide: Mission ended with {crew.foodReserveDays.toFixed(1)} Sols of reserves. NASA BVAD requires 2,500 kcal/astronaut/day. How did aeroponic LEDs and heat cycling affect your harvest?)
                    </p>
                    <div className="space-y-3 pt-1">
                      <div className="border-b border-dotted border-slate-400 h-5 w-full" />
                      <div className="border-b border-dotted border-slate-400 h-5 w-full" />
                      <div className="border-b border-dotted border-slate-400 h-5 w-full" />
                    </div>
                  </div>

                  {/* Prompt 3 */}
                  <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
                    <p className="font-bold text-slate-950 text-xs mb-1">
                      3. Compare your final radiation exposure (mSv) to the NASA annual limit (50 mSv). Did your crew stay safe?
                    </p>
                    <p className="text-[10px] text-slate-600 mb-2 italic">
                      (Telemetry Guide: Total mission dose = {missionRad.toFixed(2)} mSv. NASA Astronaut Annual Limit = 50 mSv. NASA Career Ceiling = 500 mSv. Calculate your % of the annual threshold.)
                    </p>
                    <div className="space-y-3 pt-1">
                      <div className="border-b border-dotted border-slate-400 h-5 w-full" />
                      <div className="border-b border-dotted border-slate-400 h-5 w-full" />
                      <div className="border-b border-dotted border-slate-400 h-5 w-full" />
                    </div>
                  </div>
                </div>
              </section>

              {/* ============================================================ */}
              {/* SECTION 4: Teacher Grading Rubric                            */}
              {/* ============================================================ */}
              <section className="page-break-inside-avoid">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1 mb-2">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      4
                    </span>
                    Teacher Grading Rubric & Engineering Assessment
                  </h2>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    Max: 12 Points
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-900 text-[10px]">
                    <thead>
                      <tr className="bg-slate-900 text-white font-mono">
                        <th className="border border-slate-900 p-1.5 text-left w-28">Criterion</th>
                        <th className="border border-slate-900 p-1.5 text-left">Exemplary (4 pts)</th>
                        <th className="border border-slate-900 p-1.5 text-left">Proficient (3 pts)</th>
                        <th className="border border-slate-900 p-1.5 text-left">Developing (2 pts)</th>
                        <th className="border border-slate-900 p-1.5 text-left">Beginning (1 pt)</th>
                        <th className="border border-slate-900 p-1.5 text-center w-12">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {/* Row 1: Systems Engineering */}
                      <tr className="hover:bg-slate-50">
                        <td className="border border-slate-300 p-2 font-bold font-mono bg-slate-100">
                          Systems Engineering
                        </td>
                        <td className="border border-slate-300 p-1.5 text-slate-700">
                          Maintained all 4 subsystems &gt; 70% health; balanced power without grid brownouts or transformer overload.
                        </td>
                        <td className="border border-slate-300 p-1.5 text-slate-700">
                          Managed power with minor deficits; no subsystem fell below critical 30% baseline.
                        </td>
                        <td className="border border-slate-300 p-1.5 text-slate-700">
                          Sustained severe brownouts or multiple subsystem degradation events.
                        </td>
                        <td className="border border-slate-300 p-1.5 text-slate-700">
                          Catastrophic subsystem blackout; over-budget allocation caused cascading grid collapse.
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono font-bold">
                          [ &nbsp; / 4 ]
                        </td>
                      </tr>

                      {/* Row 2: Scientific Reasoning */}
                      <tr className="hover:bg-slate-50">
                        <td className="border border-slate-300 p-2 font-bold font-mono bg-slate-100">
                          Scientific Reasoning
                        </td>
                        <td className="border border-slate-300 p-1.5 text-slate-700">
                          Articulated planetary hazard physics (SPE vs dust storm); justified trade-offs using NASA data and chart evidence.
                        </td>
                        <td className="border border-slate-300 p-1.5 text-slate-700">
                          Correctly explained hazard countermeasures with logical supporting evidence.
                        </td>
                        <td className="border border-slate-300 p-1.5 text-slate-700">
                          Incomplete explanation of hazard dynamics; trade-offs lacked quantitative justification.
                        </td>
                        <td className="border border-slate-300 p-1.5 text-slate-700">
                          Unable to correlate planetary events with habitat subsystem impacts.
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono font-bold">
                          [ &nbsp; / 4 ]
                        </td>
                      </tr>

                      {/* Row 3: Resource Efficiency */}
                      <tr className="hover:bg-slate-50">
                        <td className="border border-slate-300 p-2 font-bold font-mono bg-slate-100">
                          Resource Efficiency
                        </td>
                        <td className="border border-slate-300 p-1.5 text-slate-700">
                          Conserved O₂ (&gt;80%), preserved food reserves (&gt;5 Sols), and restricted radiation dose &lt; 5 mSv.
                        </td>
                        <td className="border border-slate-300 p-1.5 text-slate-700">
                          Crew safe with positive consumable buffers (Food &gt; 2 Sols, O₂ &gt; 50%, Dose &lt; 15 mSv).
                        </td>
                        <td className="border border-slate-300 p-1.5 text-slate-700">
                          Consumables depleted near emergency floors (&lt;20% O₂ or near starvation).
                        </td>
                        <td className="border border-slate-300 p-1.5 text-slate-700">
                          Oxygen depletion, severe malnutrition, or breach of biological safety limits.
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono font-bold">
                          [ &nbsp; / 4 ]
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Score Summary & Signatures */}
                <div className="mt-4 pt-3 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Total Rubric Score:</span>
                    <span className="border-b-2 border-slate-900 px-3 py-0.5 font-black text-sm">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / 12
                    </span>
                  </div>

                  <div className="sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="w-full sm:w-1/2">
                      <span className="text-[9px] text-slate-500 uppercase block">Evaluator Signature</span>
                      <div className="border-b border-slate-900 h-6 w-full" />
                    </div>
                    <div className="w-full sm:w-1/2">
                      <span className="text-[9px] text-slate-500 uppercase block">Date & Verification</span>
                      <div className="border-b border-slate-900 h-6 w-full" />
                    </div>
                  </div>
                </div>

                {/* Bottom Verification Footer */}
                <div className="mt-3 text-[9px] font-mono text-slate-500 flex items-center justify-between">
                  <span>OUTPOST COMMANDER · NASA SPACE APPS CHALLENGE STEM EDITION</span>
                  <span>VERIFICATION: {missionSeed}</span>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
