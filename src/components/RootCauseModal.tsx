// ============================================================
// RootCauseModal.tsx — Interactive "Why Did This Happen?" Drill-Down
// Calibrated against Apollo 13, Skylab 1, MER Opportunity, and ISS ECLSS.
// Provides:
//  1. Causality Fault Tree (5-step interactive causality chain)
//  2. Fundamental Aerospace Physics & Engineering Principles (KaTeX math)
//  3. Real NASA Mission Flight Logs, Telemetry Quotes, & Official Document Links
//  4. Interactive "What If?" Counterfactual Remediation Profiles
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertTriangle,
  Zap,
  Leaf,
  ShieldAlert,
  Activity,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Award,
  Radio,
} from "lucide-react";
import type {
  RootCauseProfile,
  RootCauseEvaluationContext,
  CounterfactualOption,
} from "../data/rootCauseData";
import { soundEffects } from "../utils/soundEffects";
import type { PowerAllocation } from "../engine/simulationEngine";

interface RootCauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: RootCauseProfile;
  context: RootCauseEvaluationContext;
  onApplyAllocation?: (allocation: PowerAllocation) => void;
  canApplyAllocation?: boolean;
}

type TabMode = "causality" | "principles" | "mission_logs" | "counterfactual";

export default function RootCauseModal({
  isOpen,
  onClose,
  profile,
  context,
  onApplyAllocation,
  canApplyAllocation = false,
}: RootCauseModalProps) {
  const [activeTab, setActiveTab] = useState<TabMode>("causality");
  const [selectedStep, setSelectedStep] = useState<number>(1);
  const [isCadetView, setIsCadetView] = useState<boolean>(true);
  const [selectedLogIndex, setSelectedLogIndex] = useState<number>(0);
  const [selectedCounterfactualIndex, setSelectedCounterfactualIndex] = useState<number>(0);

  if (!isOpen) return null;

  const liveTelemetry = profile.generateDynamicTelemetry(context);
  const currentStepData =
    profile.causalityChain.find((n) => n.step === selectedStep) ?? profile.causalityChain[0];
  const activeLog = profile.missionLogs[selectedLogIndex] ?? profile.missionLogs[0];
  const activeCounterfactual =
    profile.counterfactualOptions[selectedCounterfactualIndex] ?? profile.counterfactualOptions[0];

  const handleTabChange = (tab: TabMode) => {
    soundEffects.playButtonClick();
    setActiveTab(tab);
  };

  const handleStepSelect = (step: number) => {
    soundEffects.playButtonClick();
    setSelectedStep(step);
  };

  const handleApply = (option: CounterfactualOption) => {
    if (onApplyAllocation) {
      soundEffects.playVictoryChord();
      onApplyAllocation(option.allocationPreset);
      onClose();
    }
  };

  const categoryIcon = {
    brownout: <Zap className="w-5 h-5 text-amber-400" />,
    life_support: <Leaf className="w-5 h-5 text-emerald-400" />,
    radiation_shield: <ShieldAlert className="w-5 h-5 text-cyan-400" />,
  }[profile.type];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 18 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="relative w-full max-w-4xl rounded-3xl bg-[#080E1C] border-2 border-red-500/40 shadow-2xl shadow-red-950/60 overflow-hidden flex flex-col max-h-[92vh] my-auto text-slate-100"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-red-950/80 via-slate-950 to-slate-950 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 shrink-0 shadow-lg shadow-red-950/50">
                  {categoryIcon}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-900/60 text-red-300 border border-red-500/40 font-bold uppercase tracking-wider">
                      {profile.badgeLabel}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                      SOL {context.currentTurn} · {context.environment.name}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                    {profile.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Cadet / Flight Director Mode Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setIsCadetView((p) => !p);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                    isCadetView
                      ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                      : "bg-blue-950/60 border-blue-500/50 text-blue-300"
                  }`}
                  title="Toggle Cadet (Simple) vs Flight Director (Technical) explanations"
                >
                  <span>{isCadetView ? "🌟 Cadet Mode" : "🔬 Flight Director"}</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                  title="Close Inspector"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Live Telemetry Banner */}
            <div className="p-3 rounded-2xl bg-black/40 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-red-300 font-mono font-bold">
                <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
                <span>{liveTelemetry.headline}</span>
              </div>
              <p className="text-slate-300 text-xs sm:text-right">
                {liveTelemetry.telemetrySummary}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 border-b border-white/10 bg-slate-900/60 overflow-x-auto text-xs font-mono font-bold">
            <button
              onClick={() => handleTabChange("causality")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                activeTab === "causality"
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30 font-black"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span>🔍 1. Causality Fault Tree</span>
            </button>
            <button
              onClick={() => handleTabChange("principles")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                activeTab === "principles"
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30 font-black"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span>⚛️ 2. Physics & Engineering Principles</span>
            </button>
            <button
              onClick={() => handleTabChange("mission_logs")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                activeTab === "mission_logs"
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30 font-black"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span>📜 3. Real NASA Mission Logs</span>
            </button>
            <button
              onClick={() => handleTabChange("counterfactual")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                activeTab === "counterfactual"
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30 font-black"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span>🛠️ 4. "What If?" Remediation</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto p-4 sm:p-6 flex-1 flex flex-col gap-5">
            {/* ========================================================= */}
            {/* TAB 1: CAUSALITY FAULT TREE */}
            {/* ========================================================= */}
            {activeTab === "causality" && (
              <div className="flex flex-col gap-5">
                {/* High-level kid-friendly or technical overview */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isCadetView
                      ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-100"
                      : "bg-slate-900/60 border-cyan-500/40 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5 font-bold font-mono text-xs">
                    {isCadetView ? (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300 uppercase tracking-wider">
                          Cadet Simple Explanation: Why Did This Happen?
                        </span>
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span className="text-cyan-300 uppercase tracking-wider">
                          Flight Director Telemetry & Systems Diagnosis
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">
                    {isCadetView ? profile.kidFriendlyWhy : profile.shortDiagnosis}
                  </p>
                </div>

                {/* 5-Step Fault Tree Stepper */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                      Step-by-Step Chain of Events (Click Any Step to Inspect)
                    </span>
                    <span className="text-xs font-mono text-cyan-400">
                      Step {selectedStep} of {profile.causalityChain.length}
                    </span>
                  </div>

                  {/* Horizontal visual stepper */}
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {profile.causalityChain.map((node) => {
                      const isCurrent = node.step === selectedStep;
                      const isPast = node.step < selectedStep;
                      return (
                        <button
                          key={node.step}
                          type="button"
                          onClick={() => handleStepSelect(node.step)}
                          className={`p-2 sm:p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                            isCurrent
                              ? "bg-red-500/20 border-red-500 text-white ring-2 ring-red-500/30 shadow-lg"
                              : isPast
                              ? "bg-slate-900/90 border-slate-700 text-slate-300 hover:border-slate-500"
                              : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span
                              className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                                isCurrent
                                  ? "bg-red-500 text-white"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              0{node.step}
                            </span>
                            <span className="text-[10px] hidden sm:inline text-slate-400 font-mono">
                              {node.phase}
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs font-bold truncate mt-1">
                            {node.title}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Node Inspector Card */}
                <div className="p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-red-950 border border-red-700/60 text-red-300">
                          STEP {currentStepData.step}: {currentStepData.phase.toUpperCase()}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Telemetry Check
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white mt-1">
                        {currentStepData.title}
                      </h3>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl text-right shrink-0">
                      <p className="text-[10px] font-mono text-slate-400 uppercase">
                        {currentStepData.telemetryMetric.label}
                      </p>
                      <p
                        className={`text-xs sm:text-sm font-mono font-black ${
                          currentStepData.telemetryMetric.status === "critical"
                            ? "text-red-400"
                            : currentStepData.telemetryMetric.status === "warning"
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {currentStepData.telemetryMetric.value}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed">
                    {currentStepData.summary}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex flex-col gap-1">
                    <span className="font-mono font-bold text-cyan-300 uppercase tracking-wide">
                      🔬 Technical Engineering Breakdown:
                    </span>
                    <p className="leading-relaxed font-mono text-[11px] sm:text-xs text-slate-300">
                      {currentStepData.technicalDetail}
                    </p>
                  </div>

                  {/* Forward/back stepper controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <button
                      type="button"
                      disabled={selectedStep <= 1}
                      onClick={() => handleStepSelect(selectedStep - 1)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-xs font-mono font-bold text-slate-200"
                    >
                      ← Previous Step
                    </button>
                    <span className="text-xs font-mono text-slate-400">
                      Step {selectedStep} of {profile.causalityChain.length}
                    </span>
                    <button
                      type="button"
                      disabled={selectedStep >= profile.causalityChain.length}
                      onClick={() => handleStepSelect(selectedStep + 1)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-xs font-mono font-bold text-slate-200 flex items-center gap-1"
                    >
                      <span>Next Step</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: PHYSICS & ENGINEERING PRINCIPLES */}
            {/* ========================================================= */}
            {activeTab === "principles" && (
              <div className="flex flex-col gap-5">
                <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30">
                  <h3 className="text-sm font-bold text-cyan-200 flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>Fundamental Aerospace Physics Governing This System</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Outpost Commander is grounded in the laws of thermodynamics, electrical circuit
                    conservation, and environmental stoichiometry. Here are the exact physical equations:
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  {profile.engineeringPrinciples.map((principle) => (
                    <div
                      key={principle.id}
                      className="p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-3 hover:border-cyan-500/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700/50 uppercase font-bold">
                            {principle.discipline}
                          </span>
                          <h4 className="text-base font-black text-white mt-1">
                            {principle.name}
                          </h4>
                        </div>
                      </div>

                      {/* Formula Display Box */}
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-900/60 font-mono text-center overflow-x-auto">
                        <div className="text-sm sm:text-base font-black text-cyan-300 tracking-wider">
                          {principle.formula}
                        </div>
                      </div>

                      {/* Variables breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {principle.formulaVariables.map((v, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-slate-900/60 border border-white/5 flex items-start gap-2"
                          >
                            <span className="font-mono font-bold text-amber-300 shrink-0">
                              {v.symbol}:
                            </span>
                            <span className="text-slate-300">{v.description}</span>
                          </div>
                        ))}
                      </div>

                      {/* Core Concept & Space Application */}
                      <div className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-white font-mono">Core Physics: </strong>
                        {principle.coreConcept}
                      </div>

                      <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-slate-200">
                        <strong className="text-cyan-300 font-mono">
                          🚀 Real NASA Habitat Application:{" "}
                        </strong>
                        {principle.habitatApplication}
                      </div>

                      {/* Kid Friendly Analogy */}
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-100 flex items-start gap-2">
                        <span className="text-base shrink-0">💡</span>
                        <div>
                          <strong className="text-emerald-300 font-mono">
                            Everyday Analogy:{" "}
                          </strong>
                          {principle.kidFriendlyAnalogy}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: REAL NASA MISSION LOGS */}
            {/* ========================================================= */}
            {activeTab === "mission_logs" && (
              <div className="flex flex-col gap-5">
                {/* Mission Picker Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {profile.missionLogs.map((log, index) => (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => {
                        soundEffects.playButtonClick();
                        setSelectedLogIndex(index);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-2 ${
                        selectedLogIndex === index
                          ? "bg-cyan-500 text-slate-950 shadow-md font-black"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      <span>{log.missionBadge}</span>
                      <span>({log.flightDate.split(" ")[0]})</span>
                    </button>
                  ))}
                </div>

                {/* Selected Mission Card */}
                <div className="p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {activeLog.spacecraft}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="text-xs font-mono text-slate-400">
                          {activeLog.flightDate}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white mt-0.5">
                        {activeLog.missionName}
                      </h3>
                    </div>

                    <a
                      href={activeLog.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-cyan-300 border border-blue-500/40 text-xs font-mono font-bold transition-colors shrink-0"
                      title="Open Official NASA Archive Report in new tab"
                    >
                      <span>Read NASA Log</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>

                  {/* Astronaut / Controller Quote Box */}
                  <div className="p-4 rounded-xl bg-slate-950 border-l-4 border-cyan-400 text-xs italic text-slate-200">
                    <p className="text-sm font-medium leading-relaxed">
                      {activeLog.telemetryQuote}
                    </p>
                    <p className="text-[11px] font-mono text-cyan-400 font-bold mt-2 not-italic">
                      — {activeLog.speaker}
                    </p>
                  </div>

                  {/* Summary & Technical Root Cause */}
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <strong className="text-white font-mono block mb-1">
                        📋 Mission Incident Narrative:
                      </strong>
                      <p className="text-slate-300 leading-relaxed">
                        {activeLog.incidentSummary}
                      </p>
                    </div>

                    <div className="bg-red-950/20 border border-red-500/30 p-3 rounded-xl">
                      <strong className="text-red-300 font-mono block mb-1">
                        ⚙️ Technical Root Cause:
                      </strong>
                      <p className="text-slate-200 leading-relaxed font-mono text-[11px] sm:text-xs">
                        {activeLog.technicalRootCause}
                      </p>
                    </div>

                    <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl">
                      <strong className="text-emerald-300 font-mono block mb-1">
                        🛠️ Flight Crew Remediation Protocol:
                      </strong>
                      <p className="text-slate-200 leading-relaxed">
                        {activeLog.crewRemediation}
                      </p>
                    </div>

                    <div className="bg-cyan-950/30 border border-cyan-500/40 p-3.5 rounded-xl">
                      <div className="flex items-center gap-1.5 text-cyan-300 font-mono font-bold text-xs mb-1">
                        <Award className="w-4 h-4 text-cyan-400" />
                        <span>Artemis Base Camp Engineering Lesson Learned:</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">
                        {activeLog.artemisLessonLearned}
                      </p>
                    </div>
                  </div>

                  {/* Citation Footer */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>
                      NASA Archival Source: <strong>{activeLog.documentId}</strong> ({activeLog.documentTitle})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: "WHAT IF?" COUNTERFACTUAL REMEDIATION */}
            {/* ========================================================= */}
            {activeTab === "counterfactual" && (
              <div className="flex flex-col gap-5">
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40">
                  <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Interactive Engineering Counterfactual: What Would Have Prevented This?</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Engineering is the science of trade-offs. Test alternative allocation profiles below to
                    see how adjusting the megawatt flow between Life Support, Shielding, and Grid prevents
                    brownouts and keeps the crew safe.
                  </p>
                </div>

                {/* Options selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profile.counterfactualOptions.map((opt, idx) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        soundEffects.playButtonClick();
                        setSelectedCounterfactualIndex(idx);
                      }}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all ${
                        selectedCounterfactualIndex === idx
                          ? "bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/30 shadow-xl"
                          : "bg-black/30 border-white/10 hover:border-slate-600 text-slate-300"
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50 uppercase font-bold">
                          PROFILE #{idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1.5">
                          {opt.actionTitle}
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {opt.description}
                        </p>
                      </div>

                      {/* Mini allocation breakdown */}
                      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/10 text-center font-mono text-[11px]">
                        <div className="bg-slate-950 p-1.5 rounded-lg border border-white/5">
                          <span className="text-slate-400 block text-[9px]">LIFE SUP</span>
                          <span className="text-emerald-400 font-bold">{opt.allocationPreset.lifeSupport} MW</span>
                        </div>
                        <div className="bg-slate-950 p-1.5 rounded-lg border border-white/5">
                          <span className="text-slate-400 block text-[9px]">SHIELD</span>
                          <span className="text-cyan-400 font-bold">{opt.allocationPreset.radiationShielding} MW</span>
                        </div>
                        <div className="bg-slate-950 p-1.5 rounded-lg border border-white/5">
                          <span className="text-slate-400 block text-[9px]">GRID</span>
                          <span className="text-amber-400 font-bold">{opt.allocationPreset.powerGrid} MW</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Consequence of Selected Profile */}
                <div className="p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                      Simulated Consequence of {activeCounterfactual.actionTitle}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>Validated Flight Profile</span>
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-100">
                    <strong className="text-emerald-300 font-mono block mb-1">
                      📈 Projected Outcome:
                    </strong>
                    <p className="leading-relaxed">
                      {activeCounterfactual.outcomeProjection}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-100">
                    <strong className="text-amber-300 font-mono block mb-1">
                      ⚖️ Engineering Trade-Off to Accept:
                    </strong>
                    <p className="leading-relaxed">
                      {activeCounterfactual.tradeOffConsideration}
                    </p>
                  </div>

                  {/* Apply Allocation Button if currently in allocate phase */}
                  {canApplyAllocation && onApplyAllocation && (
                    <div className="pt-2">
                      <motion.button
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.985 }}
                        type="button"
                        onClick={() => handleApply(activeCounterfactual)}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all border border-emerald-300/40"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          Apply This Safe Allocation Now ({activeCounterfactual.allocationPreset.lifeSupport} LS / {activeCounterfactual.allocationPreset.radiationShielding} SH / {activeCounterfactual.allocationPreset.powerGrid} PG)
                        </span>
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>NASA Flight Anomaly Investigation Suite · Artemis Basecamp</span>
            </span>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
            >
              Close Investigation
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
