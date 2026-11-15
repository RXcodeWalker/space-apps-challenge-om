// ============================================================
// EducatorHubModal.tsx — Educator Hub & NGSS Curriculum
// Official NASA Space Apps STEM Education & Teacher Guide
// Features:
// 1. 📚 45-Minute Lesson Plan: Minute-by-minute classroom agenda
//    (Introduction & Energy Budgeting ➔ 20-min Mission with Seed #ARTEMIS-26 ➔ Debrief & Peer Analysis)
// 2. 🎯 Next Generation Science Standards (NGSS) Alignment:
//    - MS-ETS1-2: Competing engineering design trade-offs
//    - MS-ESS1-3: Solar system scale properties & environmental extremes
//    - MS-LS2-5: Ecosystem dynamics & closed-loop ECLSS life support
// 3. 💡 Teacher Discussion Prompts: 5 guided questions with model student answers & Socratic extensions
// 4. 📄 Printable Teacher Guide & Syllabus: Ink-friendly, print-optimized with window.print()
// 5. One-click classroom Seed #ARTEMIS-26 launcher & markdown curriculum exporter
// ============================================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  Target,
  MessageSquare,
  Printer,
  Copy,
  Check,
  Clock,
  Award,
  FileText,
  CheckCircle2,
  Rocket,
} from "lucide-react";
import { soundEffects } from "../utils/soundEffects";

export type EducatorTab = "lesson-plan" | "ngss" | "prompts" | "print-guide";

export interface EducatorHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSeed?: (seed: string) => void;
  initialTab?: EducatorTab;
}

const CLASSROOM_SEED = "ARTEMIS-26";

export default function EducatorHubModal({
  isOpen,
  onClose,
  onSelectSeed,
  initialTab = "lesson-plan",
}: EducatorHubModalProps) {
  const [activeTab, setActiveTab] = useState<EducatorTab>(initialTab);
  const [isCopiedSeed, setIsCopiedSeed] = useState(false);
  const [isCopiedMarkdown, setIsCopiedMarkdown] = useState(false);

  // Sync initial tab if passed
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Print handler with body print styling class
  const handlePrint = () => {
    soundEffects.playButtonClick();
    document.body.classList.add("printing-educator-guide");
    window.print();
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove("printing-educator-guide");
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      document.body.classList.remove("printing-educator-guide");
    };
  }, []);

  const handleCopySeed = async () => {
    soundEffects.playTurnChime();
    try {
      await navigator.clipboard.writeText(CLASSROOM_SEED);
      setIsCopiedSeed(true);
      setTimeout(() => setIsCopiedSeed(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyMarkdown = async () => {
    soundEffects.playTurnChime();
    const markdownContent = `# NASA Outpost Commander — STEM Educator & NGSS Curriculum Guide
**Classroom Mission Seed:** \`#${CLASSROOM_SEED}\`
**Target Grades:** 6–8 (Middle School Core) · 9–12 (High School Extension)
**Duration:** 45-Minute Lesson (or 90-Minute Block Period)

## 1. 45-Minute Classroom Agenda
- **00:00–10:00 | Introduction & Energy Budgeting:** Introduce the 100 MW closed micro-grid constraint. Discuss thermodynamics and baseloads across Life Support, Radiation Shielding, and Hydroponics.
- **10:00–30:00 | 10-Sol Mission Execution with Seed #${CLASSROOM_SEED}:** Students run deterministic seed #${CLASSROOM_SEED}. Sols 1–3 baselines, Sol 5 solar proton storm emergency, Sol 7 thermal night/MMOD strike, Sols 9–10 harvest push.
- **30:00–45:00 | Debrief & Peer Trade-Off Analysis:** Compare final survival scores, career radiation mSv doses against the 500 mSv NASA limit, and root causes of brownouts.

## 2. Next Generation Science Standards (NGSS) Alignment
- **MS-ETS1-2:** Evaluating competing engineering design trade-offs within a shared 100 MW power envelope under environmental crisis constraints.
- **MS-ESS1-3:** Scale properties and environmental extremes of the Solar System (comparing Lunar South Pole, Mars Gale Crater, Europa, and Titan).
- **MS-LS2-5:** Ecosystem dynamics and closed-loop ECLSS life support (bioregenerative hydroponics, thermal shock thresholds at <15 MW, and human caloric/O2 balance).

## 3. Post-Mission Discussion Prompts
1. Power Allocation Trade-offs & Priority Inversion
2. Radiation Exposure vs. Immediate Survival (NASA 500 mSv Limit)
3. Biological Inertia & Closed-Loop ECLSS Thermodynamics
4. Isolating the Independent Variable (#${CLASSROOM_SEED} Comparison)
5. Root Cause Analysis vs. Treating the Symptom
`;

    try {
      await navigator.clipboard.writeText(markdownContent);
      setIsCopiedMarkdown(true);
      setTimeout(() => setIsCopiedMarkdown(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleLaunchSeed = () => {
    soundEffects.playTurnChime();
    if (onSelectSeed) {
      onSelectSeed(CLASSROOM_SEED);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md no-print"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-5xl max-h-[92dvh] bg-[#0B1120] border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/80 flex flex-col overflow-hidden text-slate-100 z-10 no-print"
        >
          {/* Header */}
          <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-cyan-900/40 bg-gradient-to-r from-blue-950/60 via-slate-900/90 to-cyan-950/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="hidden sm:flex w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-950/50 border border-amber-300/40 shrink-0 text-xl">
                🍎
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-amber-400 px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-600/40">
                    NASA STEM Curriculum Hub
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300 font-semibold hidden sm:inline">
                    NGSS ALIGNED · GRADES 6–12
                  </span>
                </div>
                <h2 className="text-base sm:text-xl font-black text-white tracking-tight">
                  Educator Hub & NGSS Curriculum
                </h2>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-700/50 hover:border-cyan-400 text-cyan-300 text-xs font-mono font-bold transition-all shadow-sm cursor-pointer"
                title="Print Teacher Guide / Save as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print Guide</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 hover:border-slate-500 transition-all cursor-pointer"
                aria-label="Close Educator Hub"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-4 sm:px-6 pt-3 border-b border-slate-800 bg-slate-950/50 flex flex-nowrap gap-1.5 sm:gap-2 shrink-0 overflow-x-auto [&>button]:shrink-0 [&>button]:whitespace-nowrap">
            <button
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                setActiveTab("lesson-plan");
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === "lesson-plan"
                  ? "bg-slate-900 text-cyan-300 border-cyan-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
              }`}
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>📚 45-Min Lesson Plan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                setActiveTab("ngss");
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === "ngss"
                  ? "bg-slate-900 text-emerald-300 border-emerald-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
              }`}
            >
              <Target className="w-4 h-4 text-emerald-400" />
              <span>🎯 NGSS Alignment</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                setActiveTab("prompts");
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === "prompts"
                  ? "bg-slate-900 text-amber-300 border-amber-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
              }`}
            >
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>💡 5 Discussion Prompts</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                setActiveTab("print-guide");
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === "print-guide"
                  ? "bg-slate-900 text-rose-300 border-rose-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
              }`}
            >
              <FileText className="w-4 h-4 text-rose-400" />
              <span>📄 Print / Download Guide</span>
            </button>
          </div>

          {/* Modal Body: Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-sm">
            {/* ========================================================= */}
            {/* TAB 1: 45-MINUTE LESSON PLAN                              */}
            {/* ========================================================= */}
            {activeTab === "lesson-plan" && (
              <motion.div
                key="tab-lesson-plan"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Seed Banner & Quick Facts */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900/90 to-cyan-950/70 border border-cyan-500/40 shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-600/40">
                          Classroom Benchmark Mission
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          100% DETERMINISTIC LAB
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white">
                        Standard Class Seed: <span className="text-cyan-300 font-mono">#{CLASSROOM_SEED}</span>
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        By assigning Seed <strong className="text-white">#{CLASSROOM_SEED}</strong>, every student faces the exact same solar irradiance, dust storms, and micrometeoroid events. Their resource allocation is the true independent variable!
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopySeed}
                        className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                          isCopiedSeed
                            ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                            : "bg-slate-900 hover:bg-slate-800 border-cyan-700/60 text-cyan-300"
                        }`}
                      >
                        {isCopiedSeed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopiedSeed ? "Copied Seed!" : "Copy #ARTEMIS-26"}</span>
                      </button>

                      {onSelectSeed && (
                        <button
                          type="button"
                          onClick={handleLaunchSeed}
                          className="px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 active:scale-95 text-white shadow-md shadow-blue-900/50 border border-cyan-300/40 cursor-pointer"
                        >
                          <Rocket className="w-3.5 h-3.5" />
                          <span>Load Seed into Mission</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fast Facts Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Duration</span>
                      <strong className="text-white font-mono text-sm">45 Minutes</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Target Grades</span>
                      <strong className="text-white font-mono text-sm">6–8 & 9–12</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Grouping</span>
                      <strong className="text-white font-mono text-sm">Solo or Pairs</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Device Setup</span>
                      <strong className="text-emerald-400 font-mono text-sm">Chromebook / PWA</strong>
                    </div>
                  </div>
                </div>

                {/* Learning Objectives */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Learning Objectives (SWBAT)</span>
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Energy Conservation:</strong> Students will budget a rigid 100 MW electrical envelope across three interdependent habitat sectors (Life Support, Radiation Shielding, and Hydroponics) in accordance with the First Law of Thermodynamics.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Trade-Off Evaluation:</strong> Students will analyze real-time consequences when extreme environmental anomalies (solar flares, 227°C thermal swings, regolith storms) threaten life support and astronaut health.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Peer Telemetry Comparison:</strong> Students will defend their resource allocation decisions using quantitative flight log data (cumulative survival score, radiation absorbed vs. 500 mSv NASA limit, and crop yield).
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Step-by-Step Classroom Agenda */}
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Step-by-Step Classroom Agenda (45 Minutes)</span>
                  </h4>

                  <div className="space-y-4">
                    {/* Phase 1 */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#090E1A] border-l-4 border-cyan-400 border border-cyan-900/30">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-mono font-bold text-cyan-300 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-600/40">
                          PHASE 1: 00:00 – 10:00 (10 MIN)
                        </span>
                        <span className="text-xs font-mono text-slate-400">Class Introduction & Energy Budgeting</span>
                      </div>
                      <h5 className="text-sm font-bold text-white mb-1">
                        The 100 MW Closed-System Zero-Sum Dilemma
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <strong>Teacher Hook:</strong> Project the Outpost Commander interface on the front display. Explain that the lunar outpost operates as an isolated island system powered by vertical solar masts and Kilopower fission reactors totaling 100 MW.
                      </p>
                      <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                        <div className="font-semibold text-cyan-300 font-mono">Teacher Discussion Seed:</div>
                        <p className="italic">
                          "If an M-class solar proton flare erupts and requires 40 MW for active magnetic deflection, but Life Support needs 30 MW and Hydroponics needs 25 MW, where does the remaining power come from? What do you choose to starve?"
                        </p>
                        <p className="text-slate-400">
                          Students form pairs (Commander & Systems Specialist). Direct students to open the web app, select <strong>Lunar South Pole (Commander tier)</strong>, and enter Seed <code className="text-white font-mono bg-slate-900 px-1 py-0.5 rounded">#ARTEMIS-26</code>.
                        </p>
                      </div>
                    </div>

                    {/* Phase 2 */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#090E1A] border-l-4 border-emerald-400 border border-emerald-900/30">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-mono font-bold text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-600/40">
                          PHASE 2: 10:00 – 30:00 (20 MIN)
                        </span>
                        <span className="text-xs font-mono text-slate-400">Mission Execution with Seed #ARTEMIS-26</span>
                      </div>
                      <h5 className="text-sm font-bold text-white mb-1">
                        10-Sol Interactive Mission Simulation
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Students advance turn-by-turn through 10 Sols, responding to dynamic NASA-grounded space incidents:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                          <strong className="text-cyan-300 font-mono block">Sols 1–3: Nominal Baselines</strong>
                          <span className="text-slate-300">
                            Establish steady-state power: ~28 MW Life Support (O₂ scrubber), ~25 MW Shielding, ~25 MW Greenhouse, ~22 MW Battery Reserve.
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                          <strong className="text-amber-300 font-mono block">Sol 5: Solar Proton Event (SPE)</strong>
                          <span className="text-slate-300">
                            Radiation spikes 2.5×! Students must choose: boost shields to 45 MW or absorb dose tracking against the 500 mSv career limit.
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                          <strong className="text-teal-300 font-mono block">Sol 7: MMOD Micrometeoroid Puncture</strong>
                          <span className="text-slate-300">
                            Radiator punctured; heat bleeds rapidly. Watch out for "Thermal Shock" if hydroponics power drops below 15 MW!
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                          <strong className="text-emerald-300 font-mono block">Sols 9–10: Final Harvest & HLS Landing</strong>
                          <span className="text-slate-300">
                            Final push to synchronize crop harvest before the Artemis Human Landing System arrives to relieve the crew.
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-3 italic">
                        Teacher Proactive Check-in: Walk around the room. Alert students to watch the "Live Consequence Preview" arrows before committing their Sol turns!
                      </p>
                    </div>

                    {/* Phase 3 */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#090E1A] border-l-4 border-amber-400 border border-amber-900/30">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-mono font-bold text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/40">
                          PHASE 3: 30:00 – 45:00 (15 MIN)
                        </span>
                        <span className="text-xs font-mono text-slate-400">Debrief & Peer Trade-Off Analysis</span>
                      </div>
                      <h5 className="text-sm font-bold text-white mb-1">
                        Post-Mission Systems Evaluation & Evidence-Based Reflection
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Teams open the Mission Debrief modal or click "STEM Debrief Worksheet" to view the pure-SVG telemetry trend chart.
                      </p>
                      <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-2">
                        <p>
                          <strong>Peer Comparison Activity:</strong> Pair Team A and Team B together. Both ran Seed <code className="text-white font-mono bg-slate-900 px-1 py-0.5 rounded">#ARTEMIS-26</code>.
                        </p>
                        <p className="italic text-amber-200">
                          "Team A finished with 85% Morale but 340 mSv radiation. Team B kept radiation to 110 mSv but had a hydroponic crop freeze. Which team engineered a safer habitat, and why?"
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          <strong>Exit Ticket:</strong> Have students complete the 3 reflection prompts on their STEM Debrief Worksheet or submit their Junior Flight Director rank.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Differentiation Callout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-600/40">
                    <div className="flex items-center gap-2 mb-1.5 font-bold text-emerald-300">
                      <span>🌱</span>
                      <span>Support for Struggling Students (Cadet Mode)</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Select <strong>Cadet Tier</strong> (Ages 7–10). Activates CAPCOM automated assistant hints when life support drops, provides 1.5× error recovery, and includes friendly explanatory pop-ups.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-600/40">
                    <div className="flex items-center gap-2 mb-1.5 font-bold text-amber-300">
                      <span>🚀</span>
                      <span>Extension for Advanced Students (Flight Director Mode)</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Select <strong>Flight Director Tier</strong>. Enforces the strict 500 mSv NASA lifetime grounding limit, models MMOD micro-meteorite hull strikes, and features thermal degradation.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: NGSS ALIGNMENT MATRIX                              */}
            {/* ========================================================= */}
            {activeTab === "ngss" && (
              <motion.div
                key="tab-ngss"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* NGSS Introduction */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-600/40">
                      Three-Dimensional Learning
                    </span>
                    <span className="text-xs font-mono text-slate-400">Middle School & High School Standards</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Next Generation Science Standards (NGSS) Alignment
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                    Outpost Commander serves as a digital modeling laboratory integrating Science & Engineering Practices (SEPs), Disciplinary Core Ideas (DCIs), and Crosscutting Concepts (CCCs).
                  </p>
                </div>

                {/* The 3 Core Standards Cards */}
                <div className="space-y-4">
                  {/* Standard 1: MS-ETS1-2 */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#090E1A] border border-cyan-500/40 shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-cyan-300 px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-600/50">
                          MS-ETS1-2
                        </span>
                        <span className="text-xs font-bold text-white uppercase tracking-wide">
                          Engineering Design: Evaluating Competing Solutions
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-cyan-400">Core Engineering Practice</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs italic text-slate-300 mb-3">
                      "Evaluate competing design solutions using a systematic process to determine how well they meet the criteria and constraints of the problem."
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div>
                        <strong className="text-cyan-300 font-mono">Outpost Commander Application:</strong>
                        <p className="mt-0.5 leading-relaxed">
                          Students face a strict criteria-and-constraint matrix: keep 4 astronauts alive for 10 Sols within a non-negotiable 100 MW shared micro-grid power budget. Power is a conserved quantity (E_in = E_out). Overclocking radiation deflection coils steals power from life support O₂ scrubbers and crop heaters.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <strong className="text-slate-400 uppercase font-mono block">SEP</strong>
                          <span className="text-slate-200">Constructing Explanations & Designing Solutions; Arguing from Evidence</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <strong className="text-slate-400 uppercase font-mono block">DCI</strong>
                          <span className="text-slate-200">ETS1.B: Developing Possible Solutions</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <strong className="text-slate-400 uppercase font-mono block">CCC</strong>
                          <span className="text-slate-200">Systems and System Models; Energy and Matter</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Standard 2: MS-ESS1-3 */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#090E1A] border border-amber-500/40 shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-amber-300 px-2.5 py-1 rounded-lg bg-amber-950 border border-amber-600/50">
                          MS-ESS1-3
                        </span>
                        <span className="text-xs font-bold text-white uppercase tracking-wide">
                          Earth & Space Science: Solar System Scale & Environmental Extremes
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-amber-400">Planetary Science & Astronomy</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs italic text-slate-300 mb-3">
                      "Analyze and interpret data to determine scale properties of objects in the solar system."
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div>
                        <strong className="text-amber-300 font-mono">Outpost Commander Application:</strong>
                        <p className="mt-0.5 leading-relaxed">
                          Students analyze quantitative planetary data across distinct alien worlds calibrated from real NASA missions:
                        </p>
                        <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-300 pl-1">
                          <li>
                            <strong className="text-white">Moon (Shackleton Crater Rim):</strong> 227°C diurnal temperature swing (−173°C to +54°C), 0.30 mSv/day radiation, and 40 K permanently shadowed regions (NASA LRO Diviner & LOLA).
                          </li>
                          <li>
                            <strong className="text-white">Mars (Gale Crater):</strong> Thin 600 Pa CO₂ atmosphere, 0.64 mSv/day radiation flux, and atmospheric dust storm opacity (&tau; &gt; 8.0) reducing solar power by up to 70% (MSL Curiosity REMS & RAD).
                          </li>
                          <li>
                            <strong className="text-white">Europa & Titan:</strong> Deep cryo-oceans with zero solar flux, tidal geothermal heat, and dense hydrocarbon atmospheres acting as Carnot thermodynamic cold sinks (NASA Europa Clipper & Dragonfly).
                          </li>
                        </ul>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <strong className="text-slate-400 uppercase font-mono block">SEP</strong>
                          <span className="text-slate-200">Analyzing and Interpreting Data; Mathematical Thinking</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <strong className="text-slate-400 uppercase font-mono block">DCI</strong>
                          <span className="text-slate-200">ESS1.B: Earth and the Solar System</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <strong className="text-slate-400 uppercase font-mono block">CCC</strong>
                          <span className="text-slate-200">Scale, Proportion, and Quantity; Cause and Effect</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Standard 3: MS-LS2-5 */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#090E1A] border border-emerald-500/40 shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-600/50">
                          MS-LS2-5
                        </span>
                        <span className="text-xs font-bold text-white uppercase tracking-wide">
                          Life Science: Ecosystem Dynamics & Closed-Loop ECLSS
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400">Biological Systems & Ecology</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs italic text-slate-300 mb-3">
                      "Evaluate competing design solutions for maintaining biodiversity and ecosystem services [and matter/energy cycling in engineered bioregenerative systems]."
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div>
                        <strong className="text-emerald-300 font-mono">Outpost Commander Application:</strong>
                        <p className="mt-0.5 leading-relaxed">
                          Students manage an engineered closed-loop Environmental Control and Life Support System (ECLSS):
                        </p>
                        <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-300 pl-1">
                          <li>
                            <strong>Metabolic Mass Balance:</strong> 4 astronauts consume 0.84 kg O₂/day and 2,500 kcal/day each.
                          </li>
                          <li>
                            <strong>Thermal Shock Threshold:</strong> Bioregenerative hydroponic crops freeze if power drops below 15 MW, resetting crop cycles and causing caloric deficits.
                          </li>
                          <li>
                            <strong>Carbon-Oxygen Loop:</strong> Sabatier CO₂ reduction and water electrolysis require electrical energy, modeling biological energy transfer and matter conservation.
                          </li>
                        </ul>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <strong className="text-slate-400 uppercase font-mono block">SEP</strong>
                          <span className="text-slate-200">Developing and Using Models; Engaging in Argument from Evidence</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <strong className="text-slate-400 uppercase font-mono block">DCI</strong>
                          <span className="text-slate-200">LS2.C: Ecosystem Dynamics, Functioning, and Resilience</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <strong className="text-slate-400 uppercase font-mono block">CCC</strong>
                          <span className="text-slate-200">Energy and Matter: Flows, Cycles, and Conservation; Stability and Change</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Matrix Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-300 font-mono uppercase border-b border-slate-800">
                        <th className="p-3">NGSS Code</th>
                        <th className="p-3">In-Game Interactive Mechanic</th>
                        <th className="p-3">Real NASA Instrument Calibration</th>
                        <th className="p-3">Assessment Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-950/40 text-slate-300">
                      <tr>
                        <td className="p-3 font-mono font-bold text-cyan-300">MS-ETS1-2</td>
                        <td className="p-3">100 MW shared power slider pool; battery reserves; brownout consequence preview</td>
                        <td className="p-3">Kilopower Fission Surface Power (FSP) & Moon to Mars Architecture</td>
                        <td className="p-3">Telemetry efficiency score & trade-off rationale</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-amber-300">MS-ESS1-3</td>
                        <td className="p-3">Diurnal 227°C swings; dust storm tau drop; radiation flux (0.3 vs 0.64 mSv/day)</td>
                        <td className="p-3">LRO Diviner, MSL RAD & Curiosity REMS</td>
                        <td className="p-3">Survival under destination-specific environmental hazards</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-emerald-300">MS-LS2-5</td>
                        <td className="p-3">Hydroponic crop cycles; 15 MW thermal shock reset; calorie reserves & O₂ buffers</td>
                        <td className="p-3">NASA ISS Veggie, APH & MOXIE CO₂-to-O₂ electrolysis</td>
                        <td className="p-3">Food security & crew health stability over 10 Sols</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: 5 TEACHER DISCUSSION PROMPTS                       */}
            {/* ========================================================= */}
            {activeTab === "prompts" && (
              <motion.div
                key="tab-prompts"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Intro Callout */}
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/30 border border-amber-600/40 flex items-start gap-3">
                  <div className="text-2xl shrink-0">💡</div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      5 Guided Classroom Debrief Questions
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      Use these 5 structured prompts to facilitate whole-class or small-group Socratic discussions immediately following a mission run. Each prompt includes expected student answers and probing follow-ups.
                    </p>
                  </div>
                </div>

                {/* 5 Prompts Cards */}
                <div className="space-y-4">
                  {/* Prompt 1 */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#090E1A] border border-cyan-500/40 shadow-lg space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/50">
                        PROMPT 1 · SYSTEMS ENGINEERING (MS-ETS1-2)
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Energy Conservation</span>
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-white">
                      "When available power was limited to 100 MW, which subsystem did you choose to starve during an anomaly, and why?"
                    </h4>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                      <div>
                        <strong className="text-emerald-400 font-mono">Expected Student Reasoning:</strong>
                        <p className="text-slate-300 mt-0.5 leading-relaxed">
                          Students should explain that power cannot be created out of nothing (E_in = E_out). During a solar flare, diverting 20 MW to radiation shields required taking power from either crop heating or life support air scrubbers. Strong answers cite that oxygen buffers can sustain crew for 1–2 Sols without immediate injury, whereas acute radiation causes permanent organ damage.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80">
                        <strong className="text-amber-300 font-mono">Socratic Probing Follow-Up:</strong>
                        <p className="text-slate-400 italic mt-0.5">
                          "If your food reserves were down to 3 days instead of 15, would your decision have changed? What would be the risk of starving the hydroponics?"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Prompt 2 */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#090E1A] border border-rose-500/40 shadow-lg space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-rose-300 px-2 py-0.5 rounded bg-rose-950 border border-rose-700/50">
                        PROMPT 2 · RADIATION BIOLOGY (MS-ESS1-3 & MS-ETS1-2)
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Risk Management</span>
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-white">
                      "NASA sets a strict 500 mSv career limit for astronauts. Why can't a flight director simply leave active radiation shields at 100% all the time?"
                    </h4>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                      <div>
                        <strong className="text-emerald-400 font-mono">Expected Student Reasoning:</strong>
                        <p className="text-slate-300 mt-0.5 leading-relaxed">
                          Running active magnetic deflection coils at max capacity consumes 45–55 MW—over half the outpost's entire electrical supply. Doing so permanently causes brownouts in life support and freezes crops. Aerospace engineering requires dynamic risk management: keeping baseline shielding moderate during quiet space weather, and only surging power to shields during confirmed solar proton alerts.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80">
                        <strong className="text-amber-300 font-mono">Socratic Probing Follow-Up:</strong>
                        <p className="text-slate-400 italic mt-0.5">
                          "How do deep space monitoring satellites (like NOAA DSCOVR and NASA SOHO) provide the early warnings astronauts need to scramble into storm shelters?"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Prompt 3 */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#090E1A] border border-emerald-500/40 shadow-lg space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-300 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/50">
                        PROMPT 3 · CLOSED-LOOP ECLSS (MS-LS2-5)
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Thermodynamics & Biology</span>
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-white">
                      "Why does dropping hydroponics below 15 MW cause 'Thermal Shock' and reset growth, while mechanical air scrubbers can be turned off and on without permanent damage?"
                    </h4>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                      <div>
                        <strong className="text-emerald-400 font-mono">Expected Student Reasoning:</strong>
                        <p className="text-slate-300 mt-0.5 leading-relaxed">
                          Living organisms have biological vulnerability and thermal inertia. At −173°C lunar ambient, an unheated greenhouse freezes in minutes, rupturing plant cell walls and killing the crops. Mechanical air scrubbers (like fans and CO₂ filters) don't die when power is cut; they simply pause. Biological systems require continuous minimum baseline support.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80">
                        <strong className="text-amber-300 font-mono">Socratic Probing Follow-Up:</strong>
                        <p className="text-slate-400 italic mt-0.5">
                          "If growing crops is so fragile, why does NASA invest in hydroponics (like the Veggie experiment on the ISS) instead of only packing freeze-dried pouches?"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Prompt 4 */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#090E1A] border border-teal-500/40 shadow-lg space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-teal-300 px-2 py-0.5 rounded bg-teal-950 border border-teal-700/50">
                        PROMPT 4 · SCIENTIFIC METHODOLOGY (MS-ETS1-2 & MS-ETS1-4)
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Isolating Variables</span>
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-white">
                      "Every team in class commanded with Seed #ARTEMIS-26. Why didn't everyone achieve the same final survival score and crew morale?"
                    </h4>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                      <div>
                        <strong className="text-emerald-400 font-mono">Expected Student Reasoning:</strong>
                        <p className="text-slate-300 mt-0.5 leading-relaxed">
                          The deterministic seed locked the external environment (the controlled independent variable)—meaning everyone faced the same solar flare on Sol 5 and dust storm on Sol 7. The divergent scores were caused entirely by the students' decision paths. Teams that built proactive battery reserves on Sols 1–3 absorbed emergencies easily, while teams running with zero buffer suffered brownouts.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80">
                        <strong className="text-amber-300 font-mono">Socratic Probing Follow-Up:</strong>
                        <p className="text-slate-400 italic mt-0.5">
                          "How does comparing identical-seed runs prove that mission success in aerospace is driven by engineering strategy rather than random luck?"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Prompt 5 */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#090E1A] border border-amber-500/40 shadow-lg space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-950 border border-amber-700/50">
                        PROMPT 5 · ROOT-CAUSE ANALYSIS (MS-ETS1-2)
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Emergent System Failures</span>
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-white">
                      "When an alert flashed 'OXYGEN BUFFER CRITICAL' on Sol 7, was the root cause a broken oxygen tank, or a failure in your energy budgeting?"
                    </h4>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                      <div>
                        <strong className="text-emerald-400 font-mono">Expected Student Reasoning:</strong>
                        <p className="text-slate-300 mt-0.5 leading-relaxed">
                          The low oxygen buffer was merely the visible symptom; the true root cause was upstream electrical deficit. When a commander ran a net power deficit, the automated grid governor brownouted the Sabatier scrubbers. In complex aerospace systems, failures cascade across subsystem boundaries.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80">
                        <strong className="text-amber-300 font-mono">Socratic Probing Follow-Up:</strong>
                        <p className="text-slate-400 italic mt-0.5">
                          "Why is treating the symptom (e.g., forcing oxygen production when total power is negative) dangerous in real NASA Mission Control?"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: PRINT / DOWNLOAD TEACHER GUIDE                     */}
            {/* ========================================================= */}
            {activeTab === "print-guide" && (
              <motion.div
                key="tab-print-guide"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Print Action Toolbar */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Printer className="w-5 h-5 text-cyan-400" />
                      <span>Print-Friendly Lesson Plan & Syllabus</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Formatted for ink-friendly standard 8.5"×11" black-and-white printing or PDF export.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 active:scale-95 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 border border-cyan-300/40 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Lesson Plan (PDF)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyMarkdown}
                      className={`px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                        isCopiedMarkdown
                          ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                          : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                      }`}
                    >
                      {isCopiedMarkdown ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopiedMarkdown ? "Copied Markdown!" : "Copy as Markdown"}</span>
                    </button>
                  </div>
                </div>

                {/* Printable Document Preview Area */}
                <div className="educator-guide-printable p-6 sm:p-8 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-300 space-y-6">
                  {/* Official Header */}
                  <div className="border-b-2 border-slate-900 pb-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-mono font-black uppercase tracking-wider text-blue-900">
                        NASA Space Apps Challenge · Educational Impact Resource
                      </div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight mt-0.5">
                        Outpost Commander: Educator Hub & NGSS Curriculum
                      </h1>
                      <div className="text-xs font-medium text-slate-600 mt-1">
                        Systems Engineering · Space Science · Bioregenerative Life Support (ECLSS)
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono border-l-2 border-slate-300 pl-4">
                      <div><strong>Grade Band:</strong> 6–8 (9–12 Ext)</div>
                      <div><strong>Duration:</strong> 45 Minutes</div>
                      <div><strong>Classroom Seed:</strong> #{CLASSROOM_SEED}</div>
                      <div><strong>Software:</strong> Free Web PWA / No Sign-up</div>
                    </div>
                  </div>

                  {/* Overview */}
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-blue-950 border-b border-slate-300 pb-1 mb-2">
                      1. Classroom Lesson Overview & Purpose
                    </h2>
                    <p className="text-xs leading-relaxed text-slate-800">
                      Outpost Commander tasks students with serving as Junior Flight Directors managing an off-world planetary habitat (Moon, Mars, Europa, or Titan). Students operate within a strict 100 MW electrical power envelope under extreme space environmental hazards. By executing deterministic Seed <strong>#{CLASSROOM_SEED}</strong>, classroom peers isolate operational decision-making as the primary variable, promoting evidence-based STEM argumentation and systems engineering trade-off analysis.
                    </p>
                  </div>

                  {/* 45-Minute Lesson Script */}
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-blue-950 border-b border-slate-300 pb-1 mb-2">
                      2. 45-Minute Step-by-Step Lesson Script
                    </h2>
                    <div className="space-y-3 text-xs text-slate-800">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <strong className="text-blue-900 font-mono">00:00 – 10:00 (10 Min) · Introduction & Energy Budgeting:</strong>
                        <p className="mt-1">
                          Teacher introduces the 100 MW power envelope governed by the First Law of Thermodynamics (E_in = E_out). Direct students to form pairs and launch Outpost Commander using Seed <strong>#{CLASSROOM_SEED}</strong> on Lunar South Pole (Commander tier).
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <strong className="text-blue-900 font-mono">10:00 – 30:00 (20 Min) · 10-Sol Mission Execution:</strong>
                        <p className="mt-1">
                          Students execute Sols 1 through 10. Check that students balance crop lighting (minimum 15 MW to avoid Thermal Shock), allocate ~25 MW to magnetic deflection during Sol 5's Solar Proton Event, and monitor astronaut career radiation against the 500 mSv limit.
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <strong className="text-blue-900 font-mono">30:00 – 45:00 (15 Min) · Debrief & Peer Trade-Off Analysis:</strong>
                        <p className="mt-1">
                          Students open the STEM Debrief Worksheet and compare final scores, mSv doses, and crop harvest cycles with a partner pair. Facilitate class discussion using the 5 guided prompts.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* NGSS Standards Crosswalk Table */}
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-blue-950 border-b border-slate-300 pb-1 mb-2">
                      3. Next Generation Science Standards (NGSS) Crosswalk
                    </h2>
                    <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 font-mono font-bold text-slate-900">
                          <th className="p-2 border border-slate-300">Standard</th>
                          <th className="p-2 border border-slate-300">Focus</th>
                          <th className="p-2 border border-slate-300">Simulation Mechanic</th>
                          <th className="p-2 border border-slate-300">NASA Science Grounding</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        <tr>
                          <td className="p-2 border border-slate-300 font-bold">MS-ETS1-2</td>
                          <td className="p-2 border border-slate-300">Engineering Design Trade-offs</td>
                          <td className="p-2 border border-slate-300">Balancing 100 MW power pool; dynamic brownouts</td>
                          <td className="p-2 border border-slate-300">Kilopower Fission & Surface Power grids</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-300 font-bold">MS-ESS1-3</td>
                          <td className="p-2 border border-slate-300">Solar System Extremes</td>
                          <td className="p-2 border border-slate-300">227°C diurnal swings, 0.3 vs 0.64 mSv radiation, dust storm tau</td>
                          <td className="p-2 border border-slate-300">LRO Diviner, MSL Curiosity REMS/RAD</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-300 font-bold">MS-LS2-5</td>
                          <td className="p-2 border border-slate-300">Closed-Loop ECLSS Ecosystems</td>
                          <td className="p-2 border border-slate-300">Hydroponic thermal shock (&lt;15 MW); 4 crew O₂ & caloric mass balance</td>
                          <td className="p-2 border border-slate-300">ISS Veggie/APH & Sabatier recycling</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 5 Guided Prompts */}
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-blue-950 border-b border-slate-300 pb-1 mb-2">
                      4. Post-Mission Guided Classroom Questions
                    </h2>
                    <ol className="list-decimal list-inside space-y-2 text-xs text-slate-800">
                      <li>
                        <strong>Energy Conservation:</strong> When available power was limited to 100 MW, which subsystem did you choose to starve during an anomaly, and why?
                      </li>
                      <li>
                        <strong>Radiation Biology:</strong> NASA sets a strict 500 mSv career limit. Why can't a flight director simply leave radiation shields at 100% at all times?
                      </li>
                      <li>
                        <strong>Biological ECLSS:</strong> Why does dropping greenhouse power below 15 MW cause Thermal Shock, while mechanical scrubbers can pause and resume?
                      </li>
                      <li>
                        <strong>Experimental Controls:</strong> With identical Seed #{CLASSROOM_SEED}, why did different teams achieve different survival scores?
                      </li>
                      <li>
                        <strong>Root-Cause Analysis:</strong> When oxygen levels dropped critically, was the cause a broken scrubber or an upstream energy budgeting failure?
                      </li>
                    </ol>
                  </div>

                  {/* Student Assessment Rubric */}
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-blue-950 border-b border-slate-300 pb-1 mb-2">
                      5. Student Assessment Rubric (Systems Engineering)
                    </h2>
                    <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 font-mono font-bold text-slate-900">
                          <th className="p-2 border border-slate-300">Criteria</th>
                          <th className="p-2 border border-slate-300">Novice (Level 1)</th>
                          <th className="p-2 border border-slate-300">Proficient (Level 2)</th>
                          <th className="p-2 border border-slate-300">Advanced Flight Director (Level 3)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        <tr>
                          <td className="p-2 border border-slate-300 font-bold">Energy Budgeting</td>
                          <td className="p-2 border border-slate-300">Frequent brownouts; overdraws 100 MW budget without reserve.</td>
                          <td className="p-2 border border-slate-300">Maintains net power balance; keeps minimal reserves.</td>
                          <td className="p-2 border border-slate-300">Proactively builds battery buffers to absorb solar anomalies without brownout.</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-300 font-bold">Radiation & Safety</td>
                          <td className="p-2 border border-slate-300">Ignores SPE warnings; crew exceeds 500 mSv limit.</td>
                          <td className="p-2 border border-slate-300">Surges shields during storm; keeps crew under 500 mSv.</td>
                          <td className="p-2 border border-slate-300">Dynamically optimizes shield power vs life support; minimizes lifetime career dose.</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-300 font-bold">ECLSS & Agriculture</td>
                          <td className="p-2 border border-slate-300">Triggers crop thermal shock (&lt;15 MW); exhausts food reserves.</td>
                          <td className="p-2 border border-slate-300">Maintains greenhouse baselines; completes 1 harvest.</td>
                          <td className="p-2 border border-slate-300">Synchronizes crop harvests, balances O₂ buffers, and maintains 90%+ crew morale.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Sign-off */}
                  <div className="pt-4 border-t-2 border-slate-900 flex justify-between text-[11px] font-mono text-slate-600">
                    <span>NASA Space Apps Challenge 2026</span>
                    <span>Curriculum Alignment: NGSS MS-ETS1-2 · MS-ESS1-3 · MS-LS2-5</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3.5 border-t border-slate-800/80 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs text-slate-400 no-print">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>100% Free · No Sign-in · COPPA & FERPA Compliant</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-mono font-bold transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Guide</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
              >
                Close Hub
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
