// ============================================================
// MissionBriefingScreen.tsx — Junior Commander Briefing & Selection
// Clean high-contrast dark space-mission aesthetic:
// Deep Navy #0B1120, NASA Cobalt #1D4ED8, Telemetry Cyan #06B6D4, Amber #F59E0B
// ============================================================
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Rocket,
  Sun,
  ShieldAlert,
  ThermometerSnowflake,
  Database,
  Radio,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import type { MissionEnvironment } from "../data/nasaConstants";
import { LUNAR_SOUTH_POLE, MARS_GALE_CRATER } from "../data/nasaConstants";

interface MissionBriefingScreenProps {
  onStart: (environment: MissionEnvironment) => void;
  onShowNasaData?: (environment: MissionEnvironment) => void;
}

interface DestinationCardData {
  env: MissionEnvironment;
  code: string;
  badge: string;
  sunlightLabel: string;
  sunlightValue: string;
  sunlightRating: "Near-Constant" | "Storm Vulnerable";
  sunlightPercent: number;
  radiationLabel: string;
  radiationValue: string;
  radiationRating: "Solar Flare Risk" | "Thin Atmosphere";
  radiationLevel: number; // 1-100 for visual bar
  tempLabel: string;
  tempValue: string;
  tempRating: "Extreme 227°C Swing" | "Severe −80°C Nights";
  tempSwingRange: string;
  nasaMission: string;
  tagline: string;
  accentColor: string;
  glowColor: string;
}

const DESTINATIONS: DestinationCardData[] = [
  {
    env: LUNAR_SOUTH_POLE,
    code: "MOON-SP-01",
    badge: "Artemis Program Basecamp",
    sunlightLabel: "Solar Sunlight",
    sunlightValue: "86% Year-Round",
    sunlightRating: "Near-Constant",
    sunlightPercent: 86,
    radiationLabel: "Radiation Risk",
    radiationValue: "0.30 mSv/day",
    radiationRating: "Solar Flare Risk",
    radiationLevel: 45,
    tempLabel: "Temperature Swing",
    tempValue: "227°C Delta",
    tempRating: "Extreme 227°C Swing",
    tempSwingRange: "−173°C to +54°C",
    nasaMission: "NASA LRO Diviner & LOLA",
    tagline: "Icy dark craters with mountain peaks bathed in perpetual solar light.",
    accentColor: "#06B6D4", // Telemetry Cyan
    glowColor: "rgba(6, 182, 212, 0.35)",
  },
  {
    env: MARS_GALE_CRATER,
    code: "MARS-GC-04",
    badge: "Curiosity Rover Territory",
    sunlightLabel: "Solar Sunlight",
    sunlightValue: "60% Baseline",
    sunlightRating: "Storm Vulnerable",
    sunlightPercent: 60,
    radiationLabel: "Radiation Risk",
    radiationValue: "0.64 mSv/day",
    radiationRating: "Thin Atmosphere",
    radiationLevel: 75,
    tempLabel: "Temperature Swing",
    tempValue: "100°C Delta",
    tempRating: "Severe −80°C Nights",
    tempSwingRange: "−80°C to +20°C",
    nasaMission: "MSL Curiosity REMS & RAD",
    tagline: "Thin CO₂ atmosphere, ancient lakebed minerals, and global dust storms.",
    accentColor: "#F59E0B", // Amber Warning
    glowColor: "rgba(245, 158, 11, 0.35)",
  },
];

export default function MissionBriefingScreen({
  onStart,
  onShowNasaData,
}: MissionBriefingScreenProps) {
  const [selectedId, setSelectedId] = useState<string>(LUNAR_SOUTH_POLE.id);

  const selectedDestination =
    DESTINATIONS.find((d) => d.env.id === selectedId) ?? DESTINATIONS[0];

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Dynamic Background Starfield & Subtle Telemetry Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 20%, rgba(29, 78, 216, 0.25) 0%, transparent 60%),
              radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
              linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
            backgroundSize: "100% 100%, 100% 100%, 48px 48px, 48px 48px",
          }}
        />
        {/* Subtle twinkling stars */}
        {Array.from({ length: 45 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-200"
            style={{
              width: (i % 3) + 1 + "px",
              height: (i % 3) + 1 + "px",
              top: `${(i * 19) % 100}%`,
              left: `${(i * 31) % 100}%`,
              opacity: (i % 5) * 0.18 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Top Telemetry Header */}
      <header className="relative z-10 w-full border-b border-cyan-900/30 bg-[#0B1120]/80 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1D4ED8] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-blue-900/50 border border-cyan-400/30">
              <Rocket className="text-white w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#06B6D4] px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                  NASA Space Apps Challenge
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold tracking-wide hidden sm:inline">
                  TELEMETRY LIVE
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                OUTPOST COMMANDER
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1D4ED8]/30 text-blue-300 border border-blue-500/30">
                  v2.0 Real-Data Sim
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
              <Radio className="w-3.5 h-3.5 text-[#06B6D4] animate-pulse" />
              <span>DSN LINK: 100% SIGNAL</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-blue-950/40 border border-blue-800/50 text-blue-200 flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>AGES 7–12 · NO LOGIN</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Briefing Body */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col justify-center flex-1">
        {/* Kid-Friendly Mission Objective Hook */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm font-semibold mb-3 shadow-inner"
          >
            <span>👨‍🚀👩‍🚀 Junior Flight Director Briefing</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight"
          >
            Choose Your Outpost Destination
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl mx-auto"
          >
            Can you keep your 4 astronauts alive for 10 Sols? Balance your 100 MW
            power grid between Life Support, Radiation Shields, and Batteries!
          </motion.p>
        </div>

        {/* 2-Column Destination Selector Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto w-full">
          {DESTINATIONS.map((dest) => {
            const isSelected = selectedId === dest.env.id;

            return (
              <motion.div
                key={dest.env.id}
                onClick={() => setSelectedId(dest.env.id)}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className={`relative rounded-3xl p-5 sm:p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between border-2 ${
                  isSelected
                    ? "bg-slate-900/90 border-[#06B6D4] shadow-2xl shadow-cyan-950/60 ring-2 ring-cyan-400/20"
                    : "bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50"
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 35px ${dest.glowColor}` : undefined,
                }}
              >
                {/* Selected Indicator Ribbon */}
                {isSelected && (
                  <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg border border-cyan-300/40">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    TARGET ACQUIRED
                  </div>
                )}

                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl sm:text-5xl drop-shadow-md">
                        {dest.env.emoji}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-cyan-400 font-bold tracking-wider">
                            {dest.code}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                            {dest.badge}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          {dest.env.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                          {dest.env.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* High-Concept 10-Second Explainer */}
                  <p className="text-xs sm:text-sm text-slate-200 mb-5 leading-relaxed bg-white/5 rounded-2xl p-3 border border-white/5">
                    {dest.tagline}
                  </p>

                  {/* 3 Visual Stat Badges (Kid-friendly cause & effect) */}
                  <div className="grid grid-cols-3 gap-2.5 mb-5">
                    {/* Stat 1: Sunlight */}
                    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-2.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-amber-400 mb-1">
                        <Sun className="w-4 h-4" />
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                          SOLAR
                        </span>
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-black text-white leading-tight">
                          {dest.sunlightValue}
                        </p>
                        <p className="text-[10px] font-medium text-amber-300 mt-0.5 truncate">
                          {dest.sunlightRating}
                        </p>
                      </div>
                      {/* Mini visual bar */}
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full"
                          style={{ width: `${dest.sunlightPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Stat 2: Radiation Risk */}
                    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-2.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-rose-400 mb-1">
                        <ShieldAlert className="w-4 h-4" />
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                          RAD DOSE
                        </span>
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-black text-white leading-tight">
                          {dest.radiationValue}
                        </p>
                        <p className="text-[10px] font-medium text-rose-300 mt-0.5 truncate">
                          {dest.radiationRating}
                        </p>
                      </div>
                      {/* Mini visual bar */}
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 rounded-full"
                          style={{ width: `${dest.radiationLevel}%` }}
                        />
                      </div>
                    </div>

                    {/* Stat 3: Temperature Swing */}
                    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-2.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-cyan-400 mb-1">
                        <ThermometerSnowflake className="w-4 h-4" />
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                          THERMAL
                        </span>
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-black text-white leading-tight">
                          {dest.tempValue}
                        </p>
                        <p className="text-[10px] font-medium text-cyan-300 mt-0.5 truncate">
                          {dest.tempSwingRange}
                        </p>
                      </div>
                      {/* Mini visual bar */}
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full"
                          style={{ width: `${dest.env.id === "lunar_south_pole" ? 90 : 55}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* NASA Science Citation Pill */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-[#06B6D4]" />
                      Data Source:
                    </span>
                    <span className="text-slate-200 font-semibold">
                      {dest.nasaMission}
                    </span>
                  </div>
                </div>

                {/* Direct Launch / Select Buttons inside Card */}
                <div className="mt-5 flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStart(dest.env);
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                      isSelected
                        ? "bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] text-white hover:brightness-110 shadow-blue-900/50"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                    }`}
                  >
                    <Rocket className="w-4 h-4" />
                    <span>Launch {dest.env.name}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>

                  {onShowNasaData && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowNasaData(dest.env);
                      }}
                      className="px-3.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
                      title="Inspect NASA Scientific Instruments"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Selected Environment Summary Box & Global 1-Click Launch Bar */}
        <div className="max-w-5xl mx-auto w-full mt-6">
          <motion.div
            key={selectedDestination.env.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-r from-[#0B1120] via-slate-900 to-[#0B1120] border border-cyan-500/20 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-2xl flex-shrink-0">
                {selectedDestination.env.emoji}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#06B6D4] uppercase tracking-wider">
                    Ready to Command:
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    10-Sol Mission · 4 Astronauts
                  </span>
                </div>
                <p className="text-sm sm:text-base font-bold text-white">
                  {selectedDestination.env.name} — {selectedDestination.env.subtitle}
                </p>
                <p className="text-xs text-slate-300 line-clamp-1 max-w-xl">
                  {selectedDestination.env.kidSummary}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onStart(selectedDestination.env)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-blue-600 to-[#06B6D4] hover:brightness-110 active:scale-95 text-white font-black text-base sm:text-lg tracking-wide flex items-center justify-center gap-3 shadow-xl shadow-blue-900/60 transition-all border border-cyan-300/40 flex-shrink-0"
            >
              <Rocket className="w-5 h-5 -rotate-45" />
              <span>LAUNCH MISSION</span>
              <span className="text-xs font-mono bg-black/30 px-2 py-0.5 rounded-full text-cyan-200">
                SOL 1
              </span>
            </button>
          </motion.div>
        </div>
      </main>

      {/* Footer Info & NASA Credibility Strip */}
      <footer className="relative z-10 w-full border-t border-slate-900 bg-[#0B1120]/90 px-4 py-3 sm:px-8 text-center text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-cyan-500" />
          <span>Physics-based 10-Sol Resource Allocation Simulation</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Target Audience: Students Ages 7–12</span>
          <span>•</span>
          <span>Zero Sign-up · Instant Play</span>
        </div>
      </footer>
    </div>
  );
}
