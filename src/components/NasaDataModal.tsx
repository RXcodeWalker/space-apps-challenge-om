// ============================================================
// NasaDataModal.tsx — Real NASA Science & Engineering Calibration Modal
// Accessible from the header at any time.
// Lists exact NASA datasets, flight instruments, and explains how
// these real numbers calibrate Outpost Commander's simulation trade-offs.
// ============================================================
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  Satellite,
  Sliders,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import type { MissionEnvironment } from "../data/nasaConstants";
import {
  LUNAR_SOUTH_POLE,
  MARS_GALE_CRATER,
} from "../data/nasaConstants";
import { useTranslation } from "../i18n/LanguageContext";
import LanguageSelector from "./LanguageSelector";

interface NasaDataModalProps {
  environment?: MissionEnvironment | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "lunar" | "mars" | "calibration";

interface ArchitectureCalibrationPoint {
  system: string;
  instruments: string;
  nasaDataValue: string;
  simulationRule: string;
  tradeOffPhysics: string;
}

const CALIBRATION_POINTS: ArchitectureCalibrationPoint[] = [
  {
    system: "100 MW Outpost Power Grid & Baseloads",
    instruments: "NASA Moon to Mars Architecture & Fission Surface Power (Kilopower)",
    nasaDataValue: "100 MW micro-grid benchmark; 40 kWe FSP + vertical solar masts",
    simulationRule:
      "Allocating 35 MW Life Support, 30 MW Radiation/Thermal, 25 MW Grid baseline. Remaining 10 MW serves as battery replenishment reserve.",
    tradeOffPhysics:
      "Drawing more than 100 MW triggers brownouts across all three sectors proportionally. Overclocking any subsystem past 120% accelerates transformer thermal wear.",
  },
  {
    system: "Solar Insolation & Dust Storm Drop (Tau)",
    instruments: "MSL Curiosity REMS Optical Sensor & MRO MARCI",
    nasaDataValue: "Martian atmospheric opacity Tau > 8.0 reduces solar insolation by 55% to 70%",
    simulationRule:
      "Solar output plunges from baseline 60 MW down to 22–38 MW during regional/global dust events.",
    tradeOffPhysics:
      "Players must ration between Life Support (air scrubbers) and Battery Reserves. Opportunity died when dust blocked 98% of light; Curiosity survived using an MMRTG.",
  },
  {
    system: "Thermal Swings & Heaters (−173°C to +54°C)",
    instruments: "NASA LRO Diviner Lunar Radiometer Experiment (DLRE)",
    nasaDataValue: "227°C diurnal swing on lunar surface; down to −246°C in Shackleton PSRs",
    simulationRule:
      "Micrometeorite thermal blanket punctures bleed heat, demanding 18 MW of resistive heating or manual EVA.",
    tradeOffPhysics:
      "Without atmosphere, radiative cooling to deep space (3 Kelvin) is immediate. Resistive heating coils directly compete with life support O₂ scrubbers for electrical power.",
  },
  {
    system: "Radiation Shielding & Active Water-Walls",
    instruments: "LRO CRaTER & MSL Curiosity RAD (Radiation Assessment Detector)",
    nasaDataValue: "GCR baseline: 0.3 mSv/day (Moon), 0.64 mSv/day (Mars); SPE spikes deliver 400–500% flux",
    simulationRule:
      "Active magnetic deflection and water-wall shielding reduce crew dose by up to 85% at a cost of 30–32 MW.",
    tradeOffPhysics:
      "Water's high hydrogen density matches proton mass, stopping high-energy SPE protons without creating secondary Bremsstrahlung radiation. Diverting water/power to bulkheads directly starves hydroponics.",
  },
  {
    system: "In-Situ Ice Extraction (TRIDENT & MOXIE)",
    instruments: "NASA PRIME-1 TRIDENT Drill, LCROSS & Perseverance MOXIE",
    nasaDataValue: "5.6% water ice by mass in PSRs; MOXIE solid-oxide electrolysis splits 600 Pa CO₂ into O₂",
    simulationRule:
      "Harvesting ice yields permanent +15% Water/O₂ buffers if the grid can absorb the 25 MW cryogenic sublimation surge.",
    tradeOffPhysics:
      "Volatiles at 40 Kelvin require intense thermal pulse energy to sublimate into collection tanks. High immediate electrical cost unlocks compounding long-term resource security.",
  },
];

export default function NasaDataModal({
  environment,
  isOpen,
  onClose,
}: NasaDataModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (environment?.id === "mars_gale_crater") return "mars";
    if (environment?.id === "lunar_south_pole") return "lunar";
    return "calibration";
  });

  if (!isOpen) return null;

  const currentEnv =
    activeTab === "lunar"
      ? LUNAR_SOUTH_POLE
      : activeTab === "mars"
      ? MARS_GALE_CRATER
      : environment || LUNAR_SOUTH_POLE;

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
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl rounded-3xl bg-[#090E1A] border-2 border-cyan-500/40 shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col max-h-[88vh] my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-slate-950/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/30">
                <Satellite size={22} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>{t("nasaModal.title")}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                    REAL DATA
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  {t("nasaModal.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector compact />
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-white/10 bg-slate-900/60">
            <button
              onClick={() => setActiveTab("calibration")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                activeTab === "calibration"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Sliders size={14} />
              <span>Simulation Calibration</span>
            </button>
            <button
              onClick={() => setActiveTab("lunar")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                activeTab === "lunar"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span>🌕 {t("destinations.moon.name")}</span>
            </button>
            <button
              onClick={() => setActiveTab("mars")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                activeTab === "mars"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span>🔴 {t("destinations.mars.name")}</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="overflow-y-auto p-5 flex flex-col gap-5">
            {/* TAB 1: CALIBRATION & SIMULATION RULES */}
            {activeTab === "calibration" && (
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl bg-cyan-950/40 border border-cyan-500/40 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-black text-cyan-200">
                      How NASA Numbers Calibrate Simulation Trade-Offs
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Outpost Commander is not a fantasy game — every power deficit, radiation spike,
                    and thermal constraint is calibrated directly to NASA flight hardware and orbital
                    telemetry. Here is how real space physics drive the in-game mechanics:
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {CALIBRATION_POINTS.map((pt, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col gap-2 hover:border-cyan-500/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{pt.system}</span>
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40 shrink-0">
                          {pt.instruments}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        <div className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                          <p className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                            NASA Flight Benchmark
                          </p>
                          <p className="text-xs text-slate-200 font-mono mt-0.5">
                            {pt.nasaDataValue}
                          </p>
                        </div>
                        <div className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                          <p className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                            In-Game Simulation Rule
                          </p>
                          <p className="text-xs text-slate-200 mt-0.5">
                            {pt.simulationRule}
                          </p>
                        </div>
                      </div>

                      <div className="bg-blue-950/30 rounded-xl p-2.5 border border-blue-500/20 text-xs text-slate-300">
                        <strong className="text-cyan-300 font-mono">Physics Trade-Off: </strong>
                        {pt.tradeOffPhysics}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2 & 3: LOCATION-SPECIFIC INSTRUMENTS & CITATIONS */}
            {(activeTab === "lunar" || activeTab === "mars") && (
              <div className="flex flex-col gap-4">
                {/* Overview banner */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                  <p className="text-sm font-bold text-blue-300 mb-1 flex items-center gap-2">
                    <span>{currentEnv.emoji}</span>
                    <span>{currentEnv.name} — {currentEnv.subtitle}</span>
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">{currentEnv.kidSummary}</p>
                </div>

                {/* Citations List */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    Primary NASA Instruments & Ground Truth Datasets
                  </h3>

                  {currentEnv.citations.map((citation, i) => (
                    <div
                      key={i}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 hover:border-cyan-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-100">{citation.datasetName}</p>
                          <p className="text-xs text-cyan-400 font-mono">{citation.missionInstrument}</p>
                        </div>
                        <a
                          href={citation.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-cyan-300 shrink-0"
                          title="Open official NASA page"
                        >
                          <ExternalLink size={15} />
                        </a>
                      </div>

                      <div className="bg-black/30 rounded-xl px-3 py-2 border border-white/5">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase font-mono">
                          {citation.parameter}
                        </p>
                        <p className="text-xs font-mono text-emerald-300 mt-0.5">{citation.value}</p>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                        <p className="text-[11px] text-amber-300 font-semibold mb-0.5">
                          🔭 Engineering Significance:
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {citation.kidFriendlyExplanation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>NASA Space Apps Challenge · Outpost Commander</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
            >
              Close Telemetry
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
