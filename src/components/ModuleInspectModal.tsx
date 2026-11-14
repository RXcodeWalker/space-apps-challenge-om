// ============================================================
// ModuleInspectModal.tsx — Click-to-Inspect Habitat Cutaway Module Viewer
// Educational UI for "Outpost Commander" (NASA Space Apps Challenge)
// Bridges the gap: presents real NASA engineering trade-offs, citations,
// and BVAD formulas alongside kid-friendly analogies and live telemetry.
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  Leaf,
  Activity,
  Shield,
  Zap,
  DoorOpen,
  Sun,
  Droplet,
  RefreshCw,
  Sparkles,
  Filter,
  Flame,
  Cpu,
  Layers,
  Radio,
  ShieldAlert,
  Atom,
  Thermometer,
  Maximize2,
  LogOut,
  Wind,
  Heart,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Search,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import {
  HABITAT_MODULES,
  type HabitatModuleId,
  type HabitatModuleData,
} from "../data/habitatModulesData";
import type {
  SubsystemState,
  SubsystemId,
  PowerAllocation,
  CrewState,
} from "../engine/simulationEngine";
import type { MissionEnvironment } from "../data/nasaConstants";
import { soundEffects } from "../utils/soundEffects";

export interface ModuleInspectModalProps {
  moduleId: HabitatModuleId | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (id: HabitatModuleId) => void;
  subsystems: Record<SubsystemId, SubsystemState>;
  allocation: PowerAllocation;
  effectiveBudgetMW: number;
  crew?: CrewState;
  environment?: MissionEnvironment;
}

type TabKey = "junior" | "engineering" | "status";

// Helper to render dynamic icon based on string name
function renderStepIcon(name: string) {
  const props = { className: "w-5 h-5 text-cyan-300 shrink-0" };
  switch (name) {
    case "Sun":
      return <Sun {...props} className="w-5 h-5 text-amber-400 shrink-0" />;
    case "Droplet":
      return <Droplet {...props} className="w-5 h-5 text-blue-400 shrink-0" />;
    case "RefreshCw":
      return <RefreshCw {...props} className="w-5 h-5 text-emerald-400 shrink-0" />;
    case "Sparkles":
      return <Sparkles {...props} className="w-5 h-5 text-yellow-300 shrink-0" />;
    case "Filter":
      return <Filter {...props} className="w-5 h-5 text-cyan-400 shrink-0" />;
    case "Flame":
      return <Flame {...props} className="w-5 h-5 text-rose-400 shrink-0" />;
    case "Cpu":
      return <Cpu {...props} className="w-5 h-5 text-purple-400 shrink-0" />;
    case "Radio":
      return <Radio {...props} className="w-5 h-5 text-blue-400 shrink-0" />;
    case "ShieldAlert":
      return <ShieldAlert {...props} className="w-5 h-5 text-amber-400 shrink-0" />;
    case "Layers":
      return <Layers {...props} className="w-5 h-5 text-indigo-400 shrink-0" />;
    case "Atom":
      return <Atom {...props} className="w-5 h-5 text-amber-300 shrink-0" />;
    case "Thermometer":
      return <Thermometer {...props} className="w-5 h-5 text-red-400 shrink-0" />;
    case "Maximize2":
      return <Maximize2 {...props} className="w-5 h-5 text-cyan-300 shrink-0" />;
    case "LogOut":
      return <LogOut {...props} className="w-5 h-5 text-purple-400 shrink-0" />;
    case "Wind":
      return <Wind {...props} className="w-5 h-5 text-sky-300 shrink-0" />;
    case "Heart":
      return <Heart {...props} className="w-5 h-5 text-rose-400 shrink-0" />;
    case "Zap":
      return <Zap {...props} className="w-5 h-5 text-amber-400 shrink-0" />;
    default:
      return <Sparkles {...props} />;
  }
}

// Module icon renderer
function renderModuleHeaderIcon(id: HabitatModuleId) {
  const c = "w-6 h-6";
  switch (id) {
    case "greenhouse":
      return <Leaf className={`${c} text-emerald-400`} />;
    case "life_support":
      return <Activity className={`${c} text-cyan-400`} />;
    case "radiation_shield":
      return <Shield className={`${c} text-blue-400`} />;
    case "power_core":
      return <Zap className={`${c} text-amber-400`} />;
    case "airlock":
      return <DoorOpen className={`${c} text-purple-400`} />;
  }
}

export default function ModuleInspectModal({
  moduleId,
  isOpen,
  onClose,
  onSelectModule,
  subsystems,
  allocation,
  effectiveBudgetMW,
  crew,
  environment,
}: ModuleInspectModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("junior");

  if (!isOpen || !moduleId) return null;

  const currentModule: HabitatModuleData = HABITAT_MODULES[moduleId];
  const allModuleKeys = Object.keys(HABITAT_MODULES) as HabitatModuleId[];

  // --- Dynamic Live Telemetry Calculations ---
  // 1. Food Production / Greenhouse
  const foodAllocated = allocation.foodProduction;
  const foodHealth = subsystems.foodProduction.health;
  const foodEfficiency = Math.min(
    100,
    Math.round((foodAllocated / 25) * (foodHealth / 100) * 100)
  );
  const foodDailyCalories = Math.round(
    2500 * (Math.min(foodAllocated, 35) / 25) * (foodHealth / 100)
  );

  // 2. Life Support / MOXIE & Sabatier
  const lsAllocated = allocation.lifeSupport;
  const lsHealth = subsystems.lifeSupport.health;
  const lsEfficiency = Math.min(
    100,
    Math.round((lsAllocated / 30) * (lsHealth / 100) * 100)
  );
  const oxygenRatePerPerson = (
    0.84 *
    (Math.min(lsAllocated, 40) / 30) *
    (lsHealth / 100)
  ).toFixed(2);
  const oxygenRateTotal = (
    3.36 *
    (Math.min(lsAllocated, 40) / 30) *
    (lsHealth / 100)
  ).toFixed(2);

  // 3. Radiation Shielding / Water-Wall
  const shieldAllocated = allocation.radiationShielding;
  const shieldHealth = subsystems.radiationShielding.health;
  const shieldEfficiency = Math.min(
    100,
    Math.round((shieldAllocated / 25) * (shieldHealth / 100) * 100)
  );
  const protonDeflectionPercent = Math.min(
    98,
    Math.max(
      15,
      Math.round(92 * (shieldAllocated / 25) * (shieldHealth / 100))
    )
  );
  const dailyCrewDose = (
    Math.max(
      0.08,
      0.64 *
        (1 - (shieldAllocated / 30) * (shieldHealth / 100) * 0.85)
    )
  ).toFixed(2);

  // 4. Power Grid / Kilopower
  const powerAllocated = allocation.powerGrid;
  const powerHealth = subsystems.powerGrid.health;
  const powerEfficiency = Math.min(
    100,
    Math.round((powerAllocated / 25) * (powerHealth / 100) * 100)
  );
  const totalAllocatedMW =
    allocation.powerGrid +
    allocation.lifeSupport +
    allocation.radiationShielding +
    allocation.foodProduction;
  const gridReserveMW = effectiveBudgetMW - totalAllocatedMW;

  // 5. Airlock & EVA
  const airlockHealth = Math.round((powerHealth + lsHealth) / 2);
  const airlockEfficiency = Math.min(
    100,
    Math.round(((powerAllocated + lsAllocated) / 55) * 100)
  );
  const dustRepulsionRate = Math.min(
    99.9,
    98.2 + (powerHealth / 100) * 1.6
  ).toFixed(1);

  // Determine which metrics to show in Tab 3 based on module
  const getStatusData = () => {
    switch (moduleId) {
      case "greenhouse":
        return {
          health: foodHealth,
          allocatedMW: foodAllocated,
          nominalMW: 25,
          efficiency: foodEfficiency,
          statusLabel:
            foodAllocated < 10
              ? "THERMAL SHOCK (<10 MW)"
              : foodAllocated < 25
              ? "SUB-OPTIMAL LIGHTING"
              : "NOMINAL GROWTH",
          statusColor:
            foodAllocated < 10
              ? "text-rose-400 bg-rose-950/60 border-rose-500/50"
              : foodAllocated < 25
              ? "text-amber-400 bg-amber-950/60 border-amber-500/50"
              : "text-emerald-400 bg-emerald-950/60 border-emerald-500/50",
          metric1: {
            label: "Daily Calorie Yield",
            value: `${foodDailyCalories.toLocaleString()} kcal/person`,
            sub: "Target: 2,500 kcal/person/day",
          },
          metric2: {
            label: "Canopy Temperature",
            value: foodAllocated < 10 ? "4.5°C (Chilled)" : "23.8°C (Optimal)",
            sub: "Root baseline: 22.0°C",
          },
          metric3: {
            label: "Food Reserves",
            value: `${crew?.foodReserveDays ?? 15} Sols remaining`,
            sub: "4 Crew members active",
          },
          metric4: {
            label: "Biomass Harvest Rate",
            value: `${foodAllocated >= 10 ? "16.0" : "4.0"} kg / 3-Sol cycle`,
            sub: "Dwarf wheat & red romaine",
          },
          tradeoffSummary:
            "Cutting power below 25 MW drops vegetable calorie output. Dropping below 10 MW causes severe thermal shock, freezing roots and destroying 25% of the crop cycle per Sol!",
        };
      case "life_support":
        return {
          health: lsHealth,
          allocatedMW: lsAllocated,
          nominalMW: 30,
          efficiency: lsEfficiency,
          statusLabel:
            lsAllocated < 20
              ? "SCRUBBER STRESSED"
              : lsHealth < 50
              ? "DEGRADED CATALYST"
              : "ATMOSPHERE NOMINAL",
          statusColor:
            lsAllocated < 20 || lsHealth < 50
              ? "text-rose-400 bg-rose-950/60 border-rose-500/50"
              : "text-cyan-400 bg-cyan-950/60 border-cyan-500/50",
          metric1: {
            label: "Per-Crew O₂ Output",
            value: `${oxygenRatePerPerson} kg / day`,
            sub: "NASA BVAD adult: 0.84 kg",
          },
          metric2: {
            label: "Total Outpost O₂",
            value: `${oxygenRateTotal} kg / day`,
            sub: "All 4 astronauts combined",
          },
          metric3: {
            label: "Water Loop Recovery",
            value: `${Math.min(99, Math.round(98 * (lsHealth / 100)))}%`,
            sub: "Urine + breath condensate",
          },
          metric4: {
            label: "Oxygen Buffer",
            value: `${crew?.oxygenBufferPercent ?? 100}%`,
            sub: "Emergency pressurized reservoir",
          },
          tradeoffSummary:
            "The Sabatier and MOXIE reactors maintain 101.3 kPa habitat pressure and scrub toxic CO₂. Under-allocating power causes CO₂ to spike and depletes emergency oxygen reserves within 24 hours.",
        };
      case "radiation_shield":
        return {
          health: shieldHealth,
          allocatedMW: shieldAllocated,
          nominalMW: 25,
          efficiency: shieldEfficiency,
          statusLabel:
            shieldAllocated < 15 || shieldHealth < 35
              ? "FORCE-FIELD FISSURED"
              : shieldAllocated >= 25
              ? "3.2T FIELD ACTIVE"
              : "PARTIAL DEFLECTION",
          statusColor:
            shieldAllocated < 15 || shieldHealth < 35
              ? "text-rose-400 bg-rose-950/60 border-rose-500/50"
              : "text-blue-400 bg-blue-950/60 border-blue-500/50",
          metric1: {
            label: "SPE Proton Deflection",
            value: `${protonDeflectionPercent}% blocked`,
            sub: "Superconducting magnetic coil",
          },
          metric2: {
            label: "Crew Daily Dose",
            value: `${dailyCrewDose} mSv / day`,
            sub: "Career ceiling: 500 mSv",
          },
          metric3: {
            label: "Water-Wall Mass",
            value: "12,000 Liters",
            sub: "Bunk hydrogen shielding",
          },
          metric4: {
            label: "Regolith Overburden",
            value: "1.5 m sintered berm",
            sub: "Density: 2.8 g/cm³",
          },
          tradeoffSummary:
            "During solar particle events (SPE), radiation spikes up to 400%. Diverting power to the superconducting coils bends charged ions away; failing to shield risks acute sickness and career dose limits.",
        };
      case "power_core":
        return {
          health: powerHealth,
          allocatedMW: powerAllocated,
          nominalMW: 25,
          efficiency: powerEfficiency,
          statusLabel:
            totalAllocatedMW > effectiveBudgetMW
              ? "OVERLOAD BROWNOUT"
              : powerAllocated < 15
              ? "BATTERY DRAIN"
              : "KILOPOWER BASELOAD 100%",
          statusColor:
            totalAllocatedMW > effectiveBudgetMW || powerAllocated < 15
              ? "text-rose-400 bg-rose-950/60 border-rose-500/50"
              : "text-amber-400 bg-amber-950/60 border-amber-500/50",
          metric1: {
            label: "Total Budget",
            value: `${effectiveBudgetMW} MW Available`,
            sub: `Draw: ${totalAllocatedMW} MW`,
          },
          metric2: {
            label: "Grid Buffer Margin",
            value: `${gridReserveMW >= 0 ? "+" : ""}${gridReserveMW} MW`,
            sub: gridReserveMW >= 0 ? "Replenishing storage" : "Depleting batteries",
          },
          metric3: {
            label: "Stirling Reactor Temp",
            value: powerHealth >= 50 ? "650°C (Hot End)" : "480°C (Degraded)",
            sub: "Sodium heat pipes nominal",
          },
          metric4: {
            label: "Solar Mast Output",
            value:
              environment?.id === "mars_gale_crater"
                ? "32% GaAs (Dust Sensitive)"
                : "Continuous Polar Insolation",
            sub: "Triple-junction cells",
          },
          tradeoffSummary:
            "The Kilopower reactor supplies an unshakable nuclear baseload, but solar panels drop severely during dust storms or eclipses. If your total allocation exceeds available MW, brownouts strike all modules!",
        };
      case "airlock":
        return {
          health: airlockHealth,
          allocatedMW: Math.round(powerAllocated * 0.25),
          nominalMW: 10,
          efficiency: airlockEfficiency,
          statusLabel:
            airlockHealth >= 70
              ? "EDS DUST SHIELD READY"
              : "MAINTENANCE ADVISED",
          statusColor:
            airlockHealth >= 70
              ? "text-purple-400 bg-purple-950/60 border-purple-500/50"
              : "text-amber-400 bg-amber-950/60 border-amber-500/50",
          metric1: {
            label: "Dust Exclusion",
            value: `${dustRepulsionRate}% cleared`,
            sub: "Electrodynamic wave AC field",
          },
          metric2: {
            label: "Hatch Seal Integrity",
            value: `${airlockHealth}%`,
            sub: "Double elastomer vacuum seal",
          },
          metric3: {
            label: "EVA Suit Pressure",
            value: "29.6 kPa (4.3 psi)",
            sub: "100% pure O₂ prebreathe",
          },
          metric4: {
            label: "Cycle Time",
            value: "12 Minutes",
            sub: "Depress / repress recovery",
          },
          tradeoffSummary:
            "Sharp abrasive regolith shards cut spacesuit fabric and destroy air seals. The airlock's electrostatic field levitates dust off suits before astronauts enter, preventing toxic habitat contamination.",
        };
    }
  };

  const status = getStatusData();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0A0F1D] border border-cyan-800/60 rounded-3xl shadow-2xl shadow-cyan-950/60 overflow-hidden text-slate-200"
        >
          {/* TOP BAR / HEADER */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-[#0E1626] via-[#111C30] to-[#0E1626] border-b border-cyan-800/40">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-2xl ${currentModule.color.bg} border ${currentModule.color.border} shadow-lg ${currentModule.color.glow}`}
              >
                {renderModuleHeaderIcon(currentModule.id)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] tracking-widest uppercase font-bold text-cyan-400">
                    HABITAT CUTAWAY INSPECTOR
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/80 text-slate-300 border border-slate-700">
                    NASA BVAD CALIBRATED
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  {currentModule.name}
                </h2>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-700"
              aria-label="Close cutaway viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MODULE SELECTOR CAROUSEL / PILLS */}
          <div className="flex items-center gap-1.5 px-4 py-2 bg-[#080D1A] border-b border-slate-800/80 overflow-x-auto scrollbar-none text-xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider pl-1 pr-2 hidden sm:inline">
              Inspect:
            </span>
            {allModuleKeys.map((key) => {
              const mod = HABITAT_MODULES[key];
              const isSelected = key === moduleId;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    soundEffects.playSliderClick(70);
                    onSelectModule(key);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? `${mod.color.bg} ${mod.color.primary} border ${mod.color.border} shadow-md shadow-black`
                      : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent"
                  }`}
                >
                  <span className="text-sm">
                    {key === "greenhouse"
                      ? "🌿"
                      : key === "life_support"
                      ? "🫁"
                      : key === "radiation_shield"
                      ? "🛡️"
                      : key === "power_core"
                      ? "⚡"
                      : "🚪"}
                  </span>
                  <span>{mod.shortName}</span>
                </button>
              );
            })}
          </div>

          {/* TAB SWITCHER */}
          <div className="flex border-b border-cyan-900/40 bg-[#0B1222]/80 px-4 pt-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                soundEffects.playSliderClick(60);
                setActiveTab("junior");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono font-bold transition-all cursor-pointer border-t border-x ${
                activeTab === "junior"
                  ? "bg-[#0F172A] border-cyan-500/50 text-cyan-300 shadow-sm -mb-px"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>🔍 How It Works (For Junior Astronauts)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSliderClick(60);
                setActiveTab("engineering");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono font-bold transition-all cursor-pointer border-t border-x ${
                activeTab === "engineering"
                  ? "bg-[#0F172A] border-amber-500/50 text-amber-300 shadow-sm -mb-px"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>📐 Real NASA Engineering Specs</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSliderClick(60);
                setActiveTab("status");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono font-bold transition-all cursor-pointer border-t border-x ${
                activeTab === "status"
                  ? "bg-[#0F172A] border-emerald-500/50 text-emerald-300 shadow-sm -mb-px"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>⚡ Current Status in Your Outpost</span>
            </button>
          </div>

          {/* TAB CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#0F172A]">
            {/* ======================================================== */}
            {/* TAB 1: HOW IT WORKS (FOR JUNIOR ASTRONAUTS)              */}
            {/* ======================================================== */}
            {activeTab === "junior" && (
              <motion.div
                key="junior"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                {/* Big Kid-Friendly Metaphor Card */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl ${currentModule.color.bg} border ${currentModule.color.border} shadow-lg`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">💡</span>
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-cyan-300">
                        SPACE METAPHOR
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                        {currentModule.junior.metaphor}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-200 mt-2 leading-relaxed">
                        {currentModule.junior.simpleStory}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4 Step Illustrated Process Flow */}
                <div>
                  <h4 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    How This Machine Works Inside The Base
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentModule.junior.processSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-700/60 transition-all flex items-start gap-3 shadow-sm"
                      >
                        <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 mt-0.5">
                          {renderStepIcon(step.iconName)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white font-mono">
                            {step.title}
                          </p>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Did You Know? Curiosity Box */}
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex items-start gap-3.5 shadow-sm">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase font-bold text-amber-300">
                      DID YOU KNOW?
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                      {currentModule.junior.funFact}
                    </p>
                  </div>
                </div>

                {/* Junior Astronaut Takeaway */}
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold text-emerald-200">
                    <span className="font-bold">Junior Takeaway: </span>
                    {currentModule.junior.juniorTakeaway}
                  </p>
                </div>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: REAL NASA ENGINEERING SPECS                       */}
            {/* ======================================================== */}
            {activeTab === "engineering" && (
              <motion.div
                key="engineering"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                {/* NASA Mission & Instrument Banner */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700/80">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                      NASA MISSION & FLIGHT HARDWARE
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                      FLIGHT TESTED
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {currentModule.engineering.missions}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs font-mono">
                    <div>
                      <span className="text-slate-400">Operating Temp: </span>
                      <span className="text-slate-200 font-semibold">
                        {currentModule.engineering.operatingTemp}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Power Consumption: </span>
                      <span className="text-slate-200 font-semibold">
                        {currentModule.engineering.powerConsumption}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Core Inputs: </span>
                      <span className="text-slate-200 font-semibold">
                        {currentModule.engineering.inputs}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Core Outputs: </span>
                      <span className="text-slate-200 font-semibold">
                        {currentModule.engineering.outputs}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BVAD MATHEMATICAL FORMULA CARD */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#09101E] border border-cyan-800/80 shadow-md">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📐</span>
                      <h4 className="text-xs sm:text-sm font-bold text-cyan-300 font-mono">
                        {currentModule.engineering.formula.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                      NASA/TP-2015-218570
                    </span>
                  </div>

                  {/* Primary Equation Box */}
                  <div className="p-3.5 my-3 rounded-xl bg-black/60 border border-cyan-900/60 font-mono text-center text-sm sm:text-base text-cyan-200 font-bold overflow-x-auto">
                    <code>{currentModule.engineering.formula.equation}</code>
                    {currentModule.engineering.formula.subEquation && (
                      <div className="text-xs sm:text-sm text-cyan-400/90 mt-1 font-semibold">
                        <code>{currentModule.engineering.formula.subEquation}</code>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {currentModule.engineering.formula.description}
                  </p>

                  {/* Variables Legend Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-3">Symbol</th>
                          <th className="py-2 px-3">Engineering Meaning</th>
                          <th className="py-2 px-3">NASA BVAD Standard Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {currentModule.engineering.formula.variables.map(
                          (v, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40">
                              <td className="py-2 px-3 font-bold text-cyan-300">
                                {v.symbol}
                              </td>
                              <td className="py-2 px-3">{v.meaning}</td>
                              <td className="py-2 px-3 text-slate-400 font-medium">
                                {v.bvadStandard}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Technical Specifications Grid */}
                <div>
                  <h4 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase mb-2">
                    NASA Design Specifications
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.entries(currentModule.engineering.technicalSpecs).map(
                      ([label, val], idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
                        >
                          <span className="text-[11px] font-mono text-slate-400 font-medium">
                            {label}
                          </span>
                          <span className="text-xs font-mono font-bold text-white mt-1">
                            {val}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Official NASA Citations & Links */}
                <div>
                  <h4 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase mb-2">
                    Official NASA Documentation & Flight Links
                  </h4>
                  <div className="space-y-2">
                    {currentModule.engineering.citations.map((cite, idx) => (
                      <a
                        key={idx}
                        href={cite.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/60 transition-all text-xs group"
                      >
                        <div>
                          <p className="font-bold text-cyan-300 group-hover:text-cyan-200">
                            {cite.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {cite.organization}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 shrink-0 ml-3" />
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: CURRENT STATUS IN YOUR OUTPOST                    */}
            {/* ======================================================== */}
            {activeTab === "status" && (
              <motion.div
                key="status"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                {/* Live Health & Power Allocation Header */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                        MODULE TELEMETRY
                      </span>
                      <h3 className="text-base font-bold text-white">
                        {currentModule.name}
                      </h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-black border ${status.statusColor}`}
                    >
                      {status.statusLabel}
                    </span>
                  </div>

                  {/* Dual Health & Efficiency Progress Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs font-mono font-bold mb-1">
                        <span className="text-slate-400">Subsystem Health</span>
                        <span className="text-white">{status.health}%</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            status.health >= 70
                              ? "bg-emerald-500"
                              : status.health >= 35
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${status.health}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono font-bold mb-1">
                        <span className="text-slate-400">
                          Operational Efficiency
                        </span>
                        <span className="text-cyan-400">{status.efficiency}%</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                          style={{ width: `${status.efficiency}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Allocated MW vs Nominal */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      Current Power Allocation:
                    </span>
                    <span className="font-bold text-amber-300">
                      {status.allocatedMW} MW{" "}
                      <span className="text-slate-500 font-normal">
                        (Baseline: {status.nominalMW} MW)
                      </span>
                    </span>
                  </div>
                </div>

                {/* 4 Dynamic Live Real-Time Output Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-800/50 shadow-sm">
                    <span className="text-[11px] font-mono text-cyan-400 font-medium">
                      {status.metric1.label}
                    </span>
                    <p className="text-base sm:text-lg font-black text-white font-mono mt-1">
                      {status.metric1.value}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {status.metric1.sub}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-blue-800/50 shadow-sm">
                    <span className="text-[11px] font-mono text-blue-400 font-medium">
                      {status.metric2.label}
                    </span>
                    <p className="text-base sm:text-lg font-black text-white font-mono mt-1">
                      {status.metric2.value}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {status.metric2.sub}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-800/50 shadow-sm">
                    <span className="text-[11px] font-mono text-emerald-400 font-medium">
                      {status.metric3.label}
                    </span>
                    <p className="text-base sm:text-lg font-black text-white font-mono mt-1">
                      {status.metric3.value}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {status.metric3.sub}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-purple-800/50 shadow-sm">
                    <span className="text-[11px] font-mono text-purple-400 font-medium">
                      {status.metric4.label}
                    </span>
                    <p className="text-base sm:text-lg font-black text-white font-mono mt-1">
                      {status.metric4.value}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {status.metric4.sub}
                    </p>
                  </div>
                </div>

                {/* Real-time Engineering Trade-off Impact Card */}
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 flex items-start gap-3.5 shadow-sm">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase font-bold text-amber-300">
                      LIVE COMMANDER TRADE-OFF
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                      {status.tradeoffSummary}
                    </p>
                  </div>
                </div>

                {/* Educational Thought Experiment for Junior Learners */}
                <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/40 flex items-start gap-3.5 shadow-sm">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 shrink-0 mt-0.5">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase font-bold text-blue-300">
                      CHALLENGE THOUGHT EXPERIMENT
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                      What happens if an unexpected dust storm reduces total outpost power by 30 MW?
                      Which system would you throttle first: the Greenhouse LEDs, the Water-Wall deflector, or the MOXIE air scrubbers?
                      Notice how in space systems engineering, every choice involves keeping humans alive while protecting critical machines from freezing or overheating!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between px-5 py-3 bg-[#080D1A] border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Click any module in the top strip to inspect other cutaway sections</span>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs shadow-md shadow-cyan-950/50 cursor-pointer transition-all active:scale-95"
            >
              Done Inspecting
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
