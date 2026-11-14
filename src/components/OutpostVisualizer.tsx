// ============================================================
// OutpostVisualizer.tsx — Interactive Animated Cross-Section
// Responsive SVG/CSS Cross-Section of Lunar / Martian Basecamp
// Visualizes:
//  1. Solar panels & Battery Glow (dims in dust storms / eclipses)
//  2. Hydroponic Bio-Dome Plants (thrives or wilts based on Life Support)
//  3. Translucent Energy/Water Radiation Shield Dome (pulses cyan or cracks)
//  4. Module Status Indicator Lights & Interactive Telemetry
// ============================================================
import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Zap,
  Leaf,
  Shield,
  ShieldAlert,
  BatteryCharging,
  Radio,
  AlertTriangle,
  Compass,
  Box,
  Layers,
  Atom,
  Search,
} from "lucide-react";
import Habitat3DDiorama from "./Habitat3DDiorama";
import RegolithChemistryViewer from "./RegolithChemistryViewer";
import { soundEffects } from "../utils/soundEffects";
import type {
  SubsystemState,
  SubsystemId,
  PowerAllocation,
  CrewState,
} from "../engine/simulationEngine";
import type { MissionEnvironment, TurnEvent } from "../data/nasaConstants";

export interface OutpostVisualizerProps {
  environment: MissionEnvironment;
  subsystems: Record<SubsystemId, SubsystemState>;
  allocation: PowerAllocation;
  effectiveBudgetMW: number;
  currentEvent?: TurnEvent;
  crew?: CrewState;
  interactive?: boolean;
  onInspectRootCause?: (type: "brownout" | "life_support" | "radiation_shield") => void;
}

type InspectedModule = "shield" | "hydroponics" | "power" | "command" | "rover" | null;

export default function OutpostVisualizer({
  environment,
  subsystems,
  allocation,
  effectiveBudgetMW,
  currentEvent,
  crew,
  interactive = true,
  onInspectRootCause,
}: OutpostVisualizerProps) {
  const [viewMode, setViewMode] = useState<"3d" | "2d" | "chemistry">("3d");
  const [inspectedModule, setInspectedModule] = useState<InspectedModule>(null);
  const filterId = useId();

  const isMars = environment.id === "mars_gale_crater";
  const isEuropa = environment.id === "europa_under_ice";
  const isTitan = environment.id === "titan_hydrocarbon";

  // Check event types
  const hasDustStorm =
    Boolean(currentEvent?.id.includes("dust_storm")) ||
    (currentEvent?.powerDeltaMW ?? 0) <= -20;
  const hasEclipse = Boolean(currentEvent?.id.includes("eclipse"));
  const hasSolarFlare = (currentEvent?.radiationSpikeMultiplier ?? 1) > 2;

  // Visual state calculations based on allocation & health
  // 1. Greenhouse Agronomy / Food Production:
  // Lush glowing green when ≥25 MW, dim yellow when 10–24 MW, wilting brown with warning alert when <10 MW
  const foodAllocated = allocation.foodProduction;
  const isGreenhouseLush = foodAllocated >= 25;
  const isGreenhouseDim = foodAllocated >= 10 && foodAllocated < 25;
  const isGreenhouseThermalShock = foodAllocated < 10;

  // 3. Shielding:
  // Baseline is 25-30 MW.
  const shieldAllocated = allocation.radiationShielding;
  const shieldHealth = subsystems.radiationShielding.health;
  const shieldIntensity = Math.min(1.0, Math.max(0.1, (shieldAllocated / 30) * (shieldHealth / 100)));
  const isShieldStrong = shieldAllocated >= 25 && shieldHealth >= 70;
  const isShieldCritical = shieldAllocated < 15 || shieldHealth < 35;

  // 4. Power & Battery:
  // Baseline is 25 MW.
  const powerAllocated = allocation.powerGrid;
  const powerHealth = subsystems.powerGrid.health;
  const totalAllocated =
    allocation.powerGrid +
    allocation.lifeSupport +
    allocation.radiationShielding +
    allocation.foodProduction;
  const isOverBudget = totalAllocated > effectiveBudgetMW;
  const isBatteryCharging = powerAllocated >= 25 && !isOverBudget;
  const isPowerCritical = powerAllocated < 15 || powerHealth < 35 || isOverBudget;

  return (
    <div className="relative w-full rounded-3xl bg-[#070C18] border border-cyan-900/40 overflow-hidden shadow-2xl flex flex-col select-none">
      {/* Visualizer Top Bar & View Mode Switcher */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#0B1120]/90 backdrop-blur-md border-b border-cyan-900/40 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-base">{environment.emoji}</span>
          <span className="font-mono font-bold tracking-wider uppercase text-cyan-400">
            HABITAT OBSERVATORY
          </span>
          <span className="text-slate-500 font-mono hidden sm:inline">|</span>
          <span className="text-slate-300 font-semibold hidden sm:inline truncate max-w-xs">
            {environment.name} Basecamp
          </span>
        </div>

        {/* View Mode Switcher: 3D Diorama, 2D Cross-Section, Regolith Chem */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-cyan-800/50">
          <button
            type="button"
            onClick={() => {
              soundEffects.playSliderClick(70);
              setViewMode("3d");
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              viewMode === "3d"
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-md shadow-cyan-950 font-black"
                : "text-slate-300 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Diorama</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playSliderClick(70);
              setViewMode("2d");
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              viewMode === "2d"
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-md shadow-cyan-950 font-black"
                : "text-slate-300 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D Cross-Section</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playSliderClick(70);
              setViewMode("chemistry");
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              viewMode === "chemistry"
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-md shadow-cyan-950 font-black"
                : "text-slate-300 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span>Regolith Chem (Mol*)</span>
          </button>
        </div>

        {/* Environmental Warning Pills */}
        <div className="flex items-center gap-2">
          {hasDustStorm && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[11px] animate-pulse">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              DUST STORM ACTIVE
            </span>
          )}
          {hasEclipse && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-[11px]">
              <Sun className="w-3 h-3 text-indigo-400" />
              PARTIAL ECLIPSE
            </span>
          )}
          {hasSolarFlare && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[11px] animate-bounce">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              SOLAR FLARE SPIKE
            </span>
          )}
        </div>
      </div>

      {/* 3D DIORAMA VIEW */}
      {viewMode === "3d" && (
        <Habitat3DDiorama
          environment={environment}
          subsystems={subsystems}
          allocation={allocation}
          effectiveBudgetMW={effectiveBudgetMW}
          currentEvent={currentEvent}
          crew={crew}
          interactive={interactive}
          onSelectModule={(mod: InspectedModule) => setInspectedModule(mod)}
        />
      )}

      {/* REGOLITH CHEMISTRY / MOL* VIEW */}
      {viewMode === "chemistry" && (
        <RegolithChemistryViewer
          initialMolecule={
            isMars
              ? "perchlorate"
              : isEuropa
              ? "magnesium_sulfate"
              : isTitan
              ? "methane"
              : "silicate"
          }
          onClose={() => setViewMode("3d")}
        />
      )}

      {/* 2D SVG BLUEPRINT CROSS-SECTION VIEW */}
      {viewMode === "2d" && (
        <div className="relative w-full aspect-[16/9] max-h-[380px] overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 1000 520"
          className="w-full h-full object-contain"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Glow and Shimmer Filters */}
            <filter id={`glow-${filterId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id={`shieldGlow-${filterId}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Gradients */}
            {/* Sky gradient */}
            {isMars ? (
              <linearGradient id={`skyGrad-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2A100A" />
                <stop offset="50%" stopColor="#4A1E14" />
                <stop offset="100%" stopColor="#75351E" />
              </linearGradient>
            ) : isEuropa ? (
              <linearGradient id={`skyGrad-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#020617" />
                <stop offset="40%" stopColor="#082f49" />
                <stop offset="100%" stopColor="#0e7490" />
              </linearGradient>
            ) : isTitan ? (
              <linearGradient id={`skyGrad-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#451a03" />
                <stop offset="50%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#9a3412" />
              </linearGradient>
            ) : (
              <linearGradient id={`skyGrad-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#04060E" />
                <stop offset="60%" stopColor="#080F1E" />
                <stop offset="100%" stopColor="#111B2E" />
              </linearGradient>
            )}

            {/* Terrain gradient */}
            {isMars ? (
              <linearGradient id={`groundGrad-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#A84323" />
                <stop offset="30%" stopColor="#7A2D14" />
                <stop offset="100%" stopColor="#3E1508" />
              </linearGradient>
            ) : isEuropa ? (
              <linearGradient id={`groundGrad-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="35%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
            ) : isTitan ? (
              <linearGradient id={`groundGrad-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="35%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#1c1917" />
              </linearGradient>
            ) : (
              <linearGradient id={`groundGrad-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4B5563" />
                <stop offset="35%" stopColor="#374151" />
                <stop offset="100%" stopColor="#1F2937" />
              </linearGradient>
            )}

            {/* Shield Dome Radial Gradient */}
            <radialGradient id={`shieldGrad-${filterId}`} cx="50%" cy="85%" r="75%">
              <stop
                offset="0%"
                stopColor={isShieldCritical ? "rgba(244, 63, 94, 0.05)" : "rgba(6, 182, 212, 0.08)"}
              />
              <stop
                offset="70%"
                stopColor={
                  isShieldCritical
                    ? "rgba(244, 63, 94, 0.25)"
                    : isShieldStrong
                    ? "rgba(6, 182, 212, 0.35)"
                    : "rgba(29, 78, 216, 0.25)"
                }
              />
              <stop
                offset="100%"
                stopColor={
                  isShieldCritical
                    ? "rgba(244, 63, 94, 0.65)"
                    : isShieldStrong
                    ? "rgba(6, 182, 212, 0.85)"
                    : "rgba(59, 130, 246, 0.55)"
                }
              />
            </radialGradient>

            {/* Hydroponics Plant Glow */}
            <linearGradient id={`hydroGrad-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                stopColor={
                  isGreenhouseThermalShock
                    ? "#78350F"
                    : isGreenhouseDim
                    ? "#D97706"
                    : "#10B981"
                }
              />
              <stop
                offset="100%"
                stopColor={
                  isGreenhouseThermalShock
                    ? "#451A03"
                    : isGreenhouseDim
                    ? "#92400E"
                    : "#047857"
                }
              />
            </linearGradient>

            {/* Solar Panel Texture Pattern */}
            <pattern
              id={`solarPattern-${filterId}`}
              width="14"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <rect width="14" height="10" fill="#1E3A8A" stroke="#3B82F6" strokeWidth="0.6" />
              <line x1="7" y1="0" x2="7" y2="10" stroke="#60A5FA" strokeWidth="0.5" opacity="0.6" />
            </pattern>
          </defs>

          {/* BACKGROUND: Sky & Stars / Celestial Bodies */}
          <rect x="0" y="0" width="1000" height="380" fill={`url(#skyGrad-${filterId})`} />

          {/* Stars, Sky & Celestial Bodies */}
          {isMars ? (
            <g>
              {/* Mars Sun (smaller & pale) & Moons */}
              <circle cx="840" cy="80" r="18" fill="#FEF08A" opacity={hasDustStorm ? 0.35 : 0.85} />
              {/* Distant Phobos & Deimos */}
              <circle cx="750" cy="65" r="4" fill="#D6D3D1" />
              <circle cx="770" cy="55" r="2.5" fill="#A8A29E" />
              {/* Atmospheric dust haze lines */}
              <path
                d="M 0 160 Q 250 140 500 165 T 1000 150"
                fill="none"
                stroke="#C2410C"
                strokeWidth="24"
                opacity={hasDustStorm ? "0.45" : "0.15"}
              />
            </g>
          ) : isEuropa ? (
            <g>
              {/* Massive Subterranean Ice Cavern Roof Vault */}
              <path
                d="M 0 0 L 1000 0 L 1000 75 Q 750 35 500 65 Q 250 35 0 85 Z"
                fill="#082f49"
                opacity="0.85"
              />
              {/* Crystalline Ice Fissures in Ceiling */}
              <path
                d="M 120 0 L 140 40 L 180 65 M 480 0 L 510 35 L 530 60 M 820 0 L 850 45 L 890 75"
                stroke="#38bdf8"
                strokeWidth="2"
                opacity="0.8"
                fill="none"
              />
              {/* Jupiter glimpsed through surface ice rift */}
              <circle cx="850" cy="95" r="38" fill="#d97706" />
              <path d="M 814 84 Q 850 88 886 84" stroke="#b45309" strokeWidth="4" fill="none" />
              <path d="M 812 95 Q 850 98 888 95" stroke="#78350f" strokeWidth="5" fill="none" />
              <path d="M 814 106 Q 850 108 886 106" stroke="#92400e" strokeWidth="3" fill="none" />
              <ellipse cx="862" cy="103" rx="6" ry="3.5" fill="#ef4444" opacity="0.9" />
              {/* Jovian Magnetospheric Aurora glow */}
              <circle
                cx="850"
                cy="95"
                r="45"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                opacity="0.6"
                strokeDasharray="4 2"
              />
            </g>
          ) : isTitan ? (
            <g>
              {/* Dense Photochemical Tholin Smog Haze */}
              <rect x="0" y="0" width="1000" height="380" fill="#78350f" opacity="0.25" />
              <path
                d="M 0 110 Q 300 80 600 120 T 1000 95"
                fill="none"
                stroke="#d97706"
                strokeWidth="30"
                opacity="0.25"
              />
              {/* Saturn faintly shining through golden atmosphere */}
              <circle cx="850" cy="85" r="22" fill="#eab308" opacity="0.75" />
              <ellipse
                cx="850"
                cy="85"
                rx="48"
                ry="12"
                fill="none"
                stroke="#fef08a"
                strokeWidth="3.5"
                opacity="0.75"
                transform="rotate(-18 850 85)"
              />
              {/* Hydrocarbon Lake Shoreline (Kraken Mare) */}
              <path
                d="M 680 340 Q 820 330 1000 345 L 1000 380 L 680 380 Z"
                fill="#0f172a"
                opacity="0.9"
              />
              <path
                d="M 700 350 Q 850 345 980 355"
                stroke="#0284c7"
                strokeWidth="1.5"
                opacity="0.6"
                fill="none"
              />
            </g>
          ) : (
            <g opacity="0.7">
              {/* Earth visible in Moon's sky */}
              <circle cx="860" cy="90" r="32" fill="#1D4ED8" />
              <circle cx="850" cy="82" r="14" fill="#10B981" opacity="0.6" />
              <circle cx="872" cy="98" r="12" fill="#E2E8F0" opacity="0.7" />
              <circle
                cx="860"
                cy="90"
                r="35"
                fill="none"
                stroke="#60A5FA"
                strokeWidth="1.5"
                opacity="0.5"
              />

              {/* Twinkling star dots */}
              <circle cx="120" cy="60" r="1.5" fill="#FFFFFF" />
              <circle cx="240" cy="90" r="2" fill="#93C5FD" />
              <circle cx="380" cy="40" r="1.5" fill="#FFFFFF" />
              <circle cx="500" cy="80" r="1" fill="#FFFFFF" />
              <circle cx="680" cy="50" r="2" fill="#93C5FD" />
              <circle cx="790" cy="120" r="1.5" fill="#FFFFFF" />
              <circle cx="940" cy="40" r="1.5" fill="#93C5FD" />
            </g>
          )}

          {/* Distant Hills / Horizon */}
          <path
            d={
              isMars
                ? "M 0 340 Q 180 270 360 310 T 740 280 T 1000 320 L 1000 380 L 0 380 Z"
                : isEuropa
                ? "M 0 330 Q 200 290 400 325 T 800 285 T 1000 315 L 1000 380 L 0 380 Z"
                : isTitan
                ? "M 0 335 Q 240 285 460 320 T 780 275 T 1000 310 L 1000 380 L 0 380 Z"
                : "M 0 330 Q 220 280 440 315 T 820 270 T 1000 310 L 1000 380 L 0 380 Z"
            }
            fill={
              isMars
                ? "#5C2010"
                : isEuropa
                ? "#0c4a6e"
                : isTitan
                ? "#78350f"
                : "#242D3D"
            }
            opacity="0.85"
          />

          {/* GROUND TERRAIN */}
          <path
            d="M 0 370 Q 200 355 420 375 T 800 360 T 1000 375 L 1000 520 L 0 520 Z"
            fill={`url(#groundGrad-${filterId})`}
          />

          {/* Crater Shadows / Craters */}
          <ellipse
            cx="220"
            cy="440"
            rx="90"
            ry="24"
            fill={isMars ? "#2D0F06" : "#111827"}
            opacity="0.6"
          />
          <ellipse
            cx="780"
            cy="460"
            rx="110"
            ry="28"
            fill={isMars ? "#2D0F06" : "#111827"}
            opacity="0.6"
          />

          {/* ======================================================== */}
          {/* HABITAT STRUCTURES & SUBSYSTEMS                          */}
          {/* ======================================================== */}

          {/* 1. SOLAR ARRAYS & ENERGY CONDUITS (Left & Right) */}
          <g
            className="cursor-pointer transition-transform hover:opacity-90"
            onClick={() => interactive && setInspectedModule("power")}
          >
            {/* Left Solar Mast */}
            <line x1="160" y1="365" x2="160" y2="240" stroke="#64748B" strokeWidth="6" strokeLinecap="round" />
            <circle cx="160" cy="240" r="7" fill="#94A3B8" />
            {/* Left Solar Panel Array */}
            <polygon
              points="90,210 230,190 220,270 80,290"
              fill={`url(#solarPattern-${filterId})`}
              stroke="#60A5FA"
              strokeWidth="2"
              opacity={hasDustStorm ? 0.35 : hasEclipse ? 0.45 : 0.95}
            />
            {/* Solar Dust Coating if Dust Storm */}
            {hasDustStorm && (
              <polygon
                points="90,210 230,190 220,270 80,290"
                fill="#C2410C"
                opacity="0.55"
              />
            )}

            {/* Right Solar Mast */}
            <line x1="840" y1="365" x2="840" y2="240" stroke="#64748B" strokeWidth="6" strokeLinecap="round" />
            <circle cx="840" cy="240" r="7" fill="#94A3B8" />
            {/* Right Solar Panel Array */}
            <polygon
              points="770,190 910,210 920,290 780,270"
              fill={`url(#solarPattern-${filterId})`}
              stroke="#60A5FA"
              strokeWidth="2"
              opacity={hasDustStorm ? 0.35 : hasEclipse ? 0.45 : 0.95}
            />
            {hasDustStorm && (
              <polygon
                points="770,190 910,210 920,290 780,270"
                fill="#C2410C"
                opacity="0.55"
              />
            )}

            {/* Pulsing Power Conduit Lines to Battery Bank */}
            <path
              d="M 160 365 L 280 375 L 350 395"
              fill="none"
              stroke={isPowerCritical ? "#EF4444" : "#06B6D4"}
              strokeWidth="4"
              strokeDasharray="6,4"
              className={isPowerCritical ? "animate-pulse" : ""}
              opacity="0.9"
            />
            <path
              d="M 840 365 L 720 375 L 650 395"
              fill="none"
              stroke={isPowerCritical ? "#EF4444" : "#06B6D4"}
              strokeWidth="4"
              strokeDasharray="6,4"
              className={isPowerCritical ? "animate-pulse" : ""}
              opacity="0.9"
            />
          </g>

          {/* 2. TRANSLUCENT RADIATION & THERMAL SHIELD DOME */}
          {/* Surrounds the whole habitat (center at x=500, y=390, radius=240) */}
          <g
            className="cursor-pointer"
            onClick={() => interactive && setInspectedModule("shield")}
          >
            {/* Shield Dome Surface */}
            <path
              d="M 230 390 A 270 270 0 0 1 770 390 Z"
              fill={`url(#shieldGrad-${filterId})`}
              stroke={
                isShieldCritical
                  ? "#F43F5E"
                  : isShieldStrong
                  ? "#06B6D4"
                  : "#3B82F6"
              }
              strokeWidth={isShieldStrong ? "5" : isShieldCritical ? "2" : "3.5"}
              strokeDasharray={isShieldCritical ? "12,8" : undefined}
              filter={isShieldStrong ? `url(#shieldGlow-${filterId})` : undefined}
              opacity={shieldIntensity}
              className={isShieldCritical ? "animate-pulse" : ""}
            />

            {/* Shimmering Hex Shield Lattice (Visible when shield is powered) */}
            {isShieldStrong && (
              <g stroke="#67E8F9" strokeWidth="0.8" opacity="0.4" fill="none">
                <polygon points="500,160 520,172 520,195 500,207 480,195 480,172" />
                <polygon points="440,210 460,222 460,245 440,257 420,245 420,222" />
                <polygon points="560,210 580,222 580,245 560,257 540,245 540,222" />
                <polygon points="500,240 520,252 520,275 500,287 480,275 480,252" />
              </g>
            )}

            {/* Cosmic Ray / Solar Particle Deflection Sparks */}
            {hasSolarFlare && (
              <g>
                {/* Particle streaks coming from upper right */}
                <line x1="820" y1="90" x2="680" y2="200" stroke="#F43F5E" strokeWidth="2" strokeDasharray="8,6" />
                <line x1="720" y1="50" x2="600" y2="180" stroke="#FB923C" strokeWidth="2.5" />
                {/* Deflection splash sparks on shield surface */}
                {isShieldStrong ? (
                  <circle cx="680" cy="200" r="10" fill="#22D3EE" opacity="0.8" className="animate-ping" />
                ) : (
                  <circle cx="680" cy="200" r="12" fill="#F43F5E" opacity="0.8" className="animate-ping" />
                )}
              </g>
            )}
          </g>

          {/* 3. HABITAT MODULE ARCHITECTURE (Cross-Section) */}

          {/* LEFT POD: Hydroponics & Greenhouse Bio-Dome (Food Production) */}
          <g
            className="cursor-pointer transition-transform hover:opacity-95"
            onClick={() => interactive && setInspectedModule("hydroponics")}
          >
            {/* Foundation bunker */}
            <rect x="290" y="340" width="130" height="60" rx="10" fill="#1E293B" stroke="#475569" strokeWidth="2" />

            {/* Transparent bio-dome shell */}
            <path
              d="M 300 345 A 55 55 0 0 1 410 345 Z"
              fill={
                isGreenhouseLush
                  ? "rgba(16, 185, 129, 0.16)"
                  : isGreenhouseDim
                  ? "rgba(245, 158, 11, 0.14)"
                  : "rgba(239, 68, 68, 0.12)"
              }
              stroke={
                isGreenhouseLush
                  ? "#10B981"
                  : isGreenhouseDim
                  ? "#F59E0B"
                  : "#EF4444"
              }
              strokeWidth={isGreenhouseLush ? "3.5" : "2.5"}
              strokeDasharray={isGreenhouseThermalShock ? "6,4" : undefined}
            />
            <line x1="355" y1="290" x2="355" y2="345" stroke="#94A3B8" strokeWidth="1.5" opacity="0.6" />
            <line x1="320" y1="315" x2="390" y2="315" stroke="#94A3B8" strokeWidth="1.5" opacity="0.6" />

            {/* Vertical Hydroponic Trays & Plants */}
            {/* Tray 1 */}
            <rect x="315" y="332" width="80" height="7" rx="3" fill="#334155" />
            {/* Tray 2 */}
            <rect x="325" y="318" width="60" height="6" rx="2" fill="#334155" />

            {/* Plants (Lush green >= 25 MW, Dim yellow 10-24 MW, Wilting brown < 10 MW with alert) */}
            {isGreenhouseLush ? (
              // Healthy Lush Glowing Green Plants (>=25 MW)
              <g fill={`url(#hydroGrad-${filterId})`}>
                <circle cx="325" cy="326" r="6" />
                <circle cx="340" cy="325" r="7" />
                <circle cx="355" cy="324" r="7.5" />
                <circle cx="370" cy="325" r="7" />
                <circle cx="385" cy="326" r="6" />

                <circle cx="335" cy="313" r="5" />
                <circle cx="355" cy="312" r="6" />
                <circle cx="375" cy="313" r="5" />

                {/* Bright Pink/Magenta LED Grow light glow */}
                <line x1="320" y1="305" x2="390" y2="305" stroke="#EC4899" strokeWidth="3" opacity="0.9" />
              </g>
            ) : isGreenhouseDim ? (
              // Dim Yellowing Plants (10-24 MW)
              <g fill="#D97706">
                <ellipse cx="325" cy="328" rx="5" ry="3.5" />
                <ellipse cx="340" cy="328" rx="6" ry="4" />
                <ellipse cx="355" cy="327" rx="6" ry="4" />
                <ellipse cx="370" cy="328" rx="6" ry="4" />
                <ellipse cx="385" cy="328" rx="5" ry="3.5" />
                {/* Dim yellow grow light */}
                <line x1="320" y1="305" x2="390" y2="305" stroke="#F59E0B" strokeWidth="1.5" opacity="0.45" />
              </g>
            ) : (
              // Critical Wilting Brown Plants with Warning Alert (<10 MW)
              <g>
                <g fill="#78350F">
                  <line x1="330" y1="332" x2="330" y2="328" stroke="#78350F" strokeWidth="3" />
                  <line x1="355" y1="332" x2="355" y2="327" stroke="#78350F" strokeWidth="3" />
                  <line x1="380" y1="332" x2="380" y2="328" stroke="#78350F" strokeWidth="3" />
                </g>
                {/* Cold Frost / Thermal Shock Warning Badge */}
                <g transform="translate(355, 276)">
                  <rect x="-42" y="-10" width="84" height="18" rx="5" fill="#7F1D1D" stroke="#EF4444" strokeWidth="1.5" />
                  <text x="0" y="2" textAnchor="middle" fill="#FECACA" fontSize="8" fontWeight="bold" fontFamily="monospace">
                    ⚠️ SHOCK &lt;10MW
                  </text>
                </g>
              </g>
            )}

            {/* Greenhouse Indicator LED */}
            <circle
              cx="310"
              cy="355"
              r="4"
              fill={isGreenhouseLush ? "#10B981" : isGreenhouseDim ? "#F59E0B" : "#EF4444"}
              className="animate-pulse"
            />
            <text x="322" y="358" fill="#CBD5E1" fontSize="9" fontWeight="bold" fontFamily="monospace">
              GREENHOUSE ({foodAllocated}MW)
            </text>
          </g>

          {/* CENTER POD: Main Command Habitat (2 Levels) */}
          <g
            className="cursor-pointer transition-transform hover:opacity-95"
            onClick={() => interactive && setInspectedModule("command")}
          >
            {/* Main Dome Arch */}
            <path
              d="M 430 380 A 75 75 0 0 1 570 380 Z"
              fill="#1E293B"
              stroke="#64748B"
              strokeWidth="3.5"
            />

            {/* Comm Tower / Dish on top */}
            <line x1="500" y1="305" x2="500" y2="260" stroke="#CBD5E1" strokeWidth="3" />
            <path d="M 480 260 Q 500 248 520 260" fill="none" stroke="#38BDF8" strokeWidth="3" />
            <circle cx="500" cy="254" r="3" fill="#38BDF8" className="animate-ping" />

            {/* Hab Observation Windows */}
            <rect x="470" y="325" width="60" height="18" rx="6" fill="#0EA5E9" opacity="0.75" />
            <line x1="490" y1="325" x2="490" y2="343" stroke="#1E293B" strokeWidth="2" />
            <line x1="510" y1="325" x2="510" y2="343" stroke="#1E293B" strokeWidth="2" />

            {/* Inside Crew Figures (Little Astronaut Silhouette) */}
            <circle cx="482" cy="333" r="3" fill="#FFFFFF" />
            <path d="M 480 338 L 484 338 L 483 342" stroke="#FFFFFF" strokeWidth="1.5" />

            {/* Lower Level: Airlock & Tunnel Door */}
            <rect x="480" y="355" width="40" height="25" rx="4" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
            <circle cx="500" cy="367" r="5" fill="#38BDF8" opacity="0.8" />

            {/* Status LED */}
            <circle cx="445" cy="370" r="4" fill="#38BDF8" className="animate-pulse" />
            <text x="456" y="373" fill="#93C5FD" fontSize="9" fontWeight="bold" fontFamily="monospace">
              COMMAND HAB
            </text>
          </g>

          {/* RIGHT POD: Power Core & Battery Storage Vault */}
          <g
            className="cursor-pointer transition-transform hover:opacity-95"
            onClick={() => interactive && setInspectedModule("power")}
          >
            {/* Storage Vault Shell */}
            <rect x="580" y="340" width="130" height="60" rx="10" fill="#1E293B" stroke="#475569" strokeWidth="2" />

            {/* 3 Large Battery Cells with Glowing Charge Levels */}
            {/* Battery 1 */}
            <rect x="595" y="348" width="22" height="40" rx="4" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />
            <rect
              x="597"
              y={350 + (1 - powerHealth / 100) * 36}
              width="18"
              height={(powerHealth / 100) * 36}
              rx="2"
              fill={isPowerCritical ? "#EF4444" : isBatteryCharging ? "#10B981" : "#06B6D4"}
            />

            {/* Battery 2 */}
            <rect x="625" y="348" width="22" height="40" rx="4" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />
            <rect
              x="627"
              y={350 + (1 - powerHealth / 100) * 36}
              width="18"
              height={(powerHealth / 100) * 36}
              rx="2"
              fill={isPowerCritical ? "#EF4444" : isBatteryCharging ? "#10B981" : "#06B6D4"}
            />

            {/* Battery 3 */}
            <rect x="655" y="348" width="22" height="40" rx="4" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />
            <rect
              x="657"
              y={350 + (1 - powerHealth / 100) * 36}
              width="18"
              height={(powerHealth / 100) * 36}
              rx="2"
              fill={isPowerCritical ? "#EF4444" : isBatteryCharging ? "#10B981" : "#06B6D4"}
            />

            {/* Battery Storage LED */}
            <circle
              cx="690"
              cy="355"
              r="4"
              fill={isPowerCritical ? "#EF4444" : isBatteryCharging ? "#10B981" : "#06B6D4"}
              className="animate-pulse"
            />
            <text x="595" y="396" fill="#CBD5E1" fontSize="9" fontWeight="bold" fontFamily="monospace">
              BATTERY CORE: {powerAllocated} MW
            </text>
          </g>

          {/* Inter-Module Pressurized Tunnels */}
          <rect x="410" y="360" width="30" height="16" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
          <line x1="425" y1="360" x2="425" y2="376" stroke="#94A3B8" strokeWidth="1" />

          <rect x="560" y="360" width="30" height="16" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
          <line x1="575" y1="360" x2="575" y2="376" stroke="#94A3B8" strokeWidth="1" />

          {/* OUTSIDE EVA ASTRONAUT & SURFACE ROVER */}
          <g>
            {/* Small Surface Exploration Rover on surface (left side) */}
            <rect x="230" y="380" width="28" height="14" rx="3" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1" />
            <circle cx="236" cy="394" r="5" fill="#334155" />
            <circle cx="252" cy="394" r="5" fill="#334155" />
            <line x1="240" y1="380" x2="235" y2="370" stroke="#94A3B8" strokeWidth="1.5" />
            <circle cx="235" cy="370" r="2.5" fill="#06B6D4" />

            {/* Astronaut on EVA (right side) */}
            <circle cx="730" cy="382" r="4.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1" />
            {/* Gold visor */}
            <ellipse cx="731" cy="382" rx="2" ry="1.5" fill="#F59E0B" />
            {/* Spacesuit body */}
            <rect x="726" y="387" width="8" height="10" rx="2" fill="#F1F5F9" />
            {/* Life support backpack */}
            <rect x="723" y="387" width="3" height="8" rx="1" fill="#94A3B8" />
            {/* Legs */}
            <line x1="728" y1="397" x2="727" y2="405" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="732" y1="397" x2="733" y2="405" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </svg>

        {/* Floating Quick Visual Status Chips (Immediate cause & effect for 7-12 yo) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {/* Hydroponics / Greenhouse Chip */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md border shadow-md ${
              isGreenhouseLush
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                : isGreenhouseDim
                ? "bg-amber-950/80 border-amber-500/50 text-amber-300"
                : "bg-rose-950/80 border-rose-500/50 text-rose-300 animate-pulse"
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>
              {isGreenhouseLush
                ? "Greenhouse: Lush (≥25 MW) 🌱"
                : isGreenhouseDim
                ? "Greenhouse: Dim (10-24 MW) 🌾"
                : "Greenhouse: Thermal Shock (<10 MW) ❄️"}
            </span>
          </div>

          {/* Shield Chip */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md border shadow-md ${
              isShieldStrong
                ? "bg-cyan-950/80 border-cyan-500/50 text-cyan-300"
                : isShieldCritical
                ? "bg-rose-950/80 border-rose-500/50 text-rose-300"
                : "bg-blue-950/80 border-blue-500/50 text-blue-300"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>
              {isShieldStrong
                ? "Shield: 100% Repelling 🛡️"
                : isShieldCritical
                ? "Shield: Fissured / Danger ⚠️"
                : "Shield: Holding Deflection"}
            </span>
          </div>

          {/* Battery Chip */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md border shadow-md ${
              isPowerCritical
                ? "bg-rose-950/80 border-rose-500/50 text-rose-300"
                : isBatteryCharging
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                : "bg-cyan-950/80 border-cyan-500/50 text-cyan-300"
            }`}
          >
            <BatteryCharging className="w-3.5 h-3.5" />
            <span>
              {isOverBudget
                ? "Grid: Overloaded! ⚡"
                : isBatteryCharging
                ? "Batteries: Charging 🔋"
                : "Batteries: Standby ⚡"}
            </span>
          </div>
        </div>
      </div>
      )}

      {/* Interactive Module Inspection Drawer / Bottom Bar */}
      <AnimatePresence mode="wait">
        {inspectedModule && (
          <motion.div
            key={inspectedModule}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-cyan-800/40 bg-slate-900/95 p-3 px-4 text-xs flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2.5">
              {inspectedModule === "hydroponics" && (
                <>
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">
                      Hydroponic Bay ({allocation.foodProduction} MW) & ECLSS ({allocation.lifeSupport} MW)
                    </p>
                    <p className="text-slate-300 text-xs">
                      {subsystems.foodProduction.statusMessage}
                    </p>
                  </div>
                </>
              )}

              {inspectedModule === "shield" && (
                <>
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">
                      Radiation Force-Field & Water Wall ({allocation.radiationShielding} MW allocated)
                    </p>
                    <p className="text-slate-300 text-xs">
                      {subsystems.radiationShielding.kidFriendlyStatus}
                    </p>
                  </div>
                </>
              )}

              {inspectedModule === "power" && (
                <>
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">
                      Solar Arrays & Battery Reserve ({allocation.powerGrid} MW allocated)
                    </p>
                    <p className="text-slate-300 text-xs">
                      {subsystems.powerGrid.kidFriendlyStatus}
                    </p>
                  </div>
                </>
              )}

              {inspectedModule === "command" && (
                <>
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">
                      Command Deck & Crew Habitat (4 Astronauts)
                    </p>
                    <p className="text-slate-300 text-xs">
                      Morale: {crew?.morale ?? 80}% · O₂ Buffer:{" "}
                      {crew?.oxygenBufferPercent ?? 100}% · Food:{" "}
                      {crew?.foodReserveDays ?? 15} days
                    </p>
                  </div>
                </>
              )}

              {inspectedModule === "rover" && (
                <>
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">
                      Surface Exploration Rover & EVA Spacesuit
                    </p>
                    <p className="text-slate-300 text-xs">
                      {isMars
                        ? "Curiosity/Perseverance class 6-wheel rover surveying Gale Crater mudstones & perchlorate deposits."
                        : isEuropa
                        ? "Autonomous Sub-Surface Ocean Cryo-Diver exploring hydrothermal vents and testing for biosignatures."
                        : isTitan
                        ? "NASA Dragonfly nuclear octocopter performing autonomous flights over prebiotic hydrocarbon lakes and dunes."
                        : "Artemis lunar rover mining ice from Permanently Shadowed Regions (PSRs) at −173°C."}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onInspectRootCause && (
                (inspectedModule === "power" && (isPowerCritical || isOverBudget)) ||
                (inspectedModule === "hydroponics" && (isGreenhouseThermalShock || isGreenhouseDim || subsystems.foodProduction.health < 45)) ||
                (inspectedModule === "shield" && isShieldCritical)
              ) && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playButtonClick();
                    onInspectRootCause(
                      inspectedModule === "power"
                        ? "brownout"
                        : inspectedModule === "hydroponics"
                        ? "life_support"
                        : "radiation_shield"
                    );
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:brightness-110 active:scale-95 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-950/50 border border-red-300/40 shrink-0"
                >
                  <Search size={12} />
                  <span>Inspect Root Cause</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setInspectedModule(null)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-[11px]"
              >
                Close ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
