// ============================================================
// MissionBriefingScreen.tsx — Junior Commander Briefing & Selection
// Clean high-contrast dark space-mission aesthetic:
// Deep Navy #0B1120, NASA Cobalt #1D4ED8, Telemetry Cyan #06B6D4, Amber #F59E0B
// ============================================================
import { useState, useEffect } from "react";
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
  Volume2,
  VolumeX,
  Sliders,
  Flame,
  AlertTriangle,
  Award,
} from "lucide-react";
import type { MissionEnvironment } from "../data/nasaConstants";
import { LUNAR_SOUTH_POLE, MARS_GALE_CRATER } from "../data/nasaConstants";
import { soundEffects, useSoundMuted } from "../utils/soundEffects";
import { ambientAudio } from "../utils/ambientAudio";
import AmbientAudioModal from "./AmbientAudioModal";
import {
  DIFFICULTY_PRESETS,
  type DifficultyTier,
} from "../data/difficultyTiers";
import { useTranslation } from "../i18n/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import PwaNavButton from "./PwaNavButton";

interface MissionBriefingScreenProps {
  onStart: (environment: MissionEnvironment, difficulty: DifficultyTier) => void;
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
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string>(LUNAR_SOUTH_POLE.id);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyTier>("commander");
  const [isMuted, toggleMute] = useSoundMuted();
  const [isAudioModalOpen, setIsAudioModalOpen] = useState<boolean>(false);

  // Sync ambient space drone chord selection with chosen planet
  useEffect(() => {
    ambientAudio.updateTelemetry({
      environmentId: selectedId,
      radiationMultiplier: 1.0,
      lifeSupportHealth: 100,
      lifeSupportPowerRatio: 1.0,
      shieldingHealth: 100,
      shieldingPowerRatio: 1.0,
    });
  }, [selectedId]);

  const selectedDestination =
    DESTINATIONS.find((d) => d.env.id === selectedId) ?? DESTINATIONS[0];
  const activeDifficultyPreset = DIFFICULTY_PRESETS[selectedDifficulty];

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
                  {t("common.nasaSpaceApps")}
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold tracking-wide hidden sm:inline">
                  {t("common.telemetryLive")}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                {t("common.outpostCommander")}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1D4ED8]/30 text-blue-300 border border-blue-500/30">
                  {t("common.versionTag")}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
            {/* PWA Install / Classroom Offline Pill */}
            <PwaNavButton />

            {/* Multi-Language Selector */}
            <LanguageSelector />

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={toggleMute}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                isMuted
                  ? "bg-rose-950/40 border-rose-600/40 text-rose-300 hover:bg-rose-900/40"
                  : "bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-cyan-300"
              }`}
              title={isMuted ? "Audio Muted (Click to Unmute)" : "Audio Active (Click to Mute)"}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="hidden sm:inline">{isMuted ? t("common.muted") : t("common.sound")}</span>
            </button>

            {/* Procedural Space Audio Synthesizer Deck Modal Trigger */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                setIsAudioModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-800/60 hover:border-cyan-400 bg-slate-900/80 hover:bg-slate-800 text-cyan-300 text-xs font-mono font-bold transition-all shadow-sm shadow-cyan-950/40"
              title="Acoustic Telemetry & Procedural Audio Deck"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden lg:inline">{t("common.ambientAudio") || "Ambient Audio"}</span>
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
              <Radio className="w-3.5 h-3.5 text-[#06B6D4] animate-pulse" />
              <span>{t("common.dsnLink")}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-blue-950/40 border border-blue-800/50 text-blue-200 flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>{t("common.targetAges")}</span>
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
            <span>{t("briefing.briefingBadge")}</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight"
          >
            {t("briefing.title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl mx-auto"
          >
            {t("briefing.subtitle")}
          </motion.p>
        </div>

        {/* STEP 1: COMMANDER RANK & DIFFICULTY PRESETS */}
        <div className="max-w-5xl mx-auto w-full mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase">
                {t("briefing.step1Title")}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              Adjusts Safety Margins, Automated Guidance & NASA Physics
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {(["cadet", "commander", "flight_director"] as DifficultyTier[]).map((tierKey) => {
              const preset = DIFFICULTY_PRESETS[tierKey];
              const isTierSelected = selectedDifficulty === tierKey;

              return (
                <motion.div
                  key={tierKey}
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setSelectedDifficulty(tierKey);
                  }}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className={`rounded-2xl p-4 cursor-pointer transition-all duration-200 border-2 flex flex-col justify-between ${
                    isTierSelected
                      ? `bg-slate-900/95 ${preset.borderColor} shadow-xl ring-2 ring-white/10`
                      : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40"
                  }`}
                  style={{
                    boxShadow: isTierSelected ? `0 0 24px ${preset.glowColor}` : undefined,
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{preset.emoji}</span>
                      <span
                        className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${preset.accentColor}20`,
                          color: preset.accentColor,
                          border: `1px solid ${preset.accentColor}50`,
                        }}
                      >
                        {preset.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white flex items-center gap-1.5">
                      {t(`difficulties.${tierKey}.title`)}
                      {tierKey === "cadet" && (
                        <span className="text-xs text-emerald-400 font-semibold">(Ages 7–10)</span>
                      )}
                      {tierKey === "flight_director" && (
                        <span className="text-xs text-amber-400 font-semibold">(Hardcore)</span>
                      )}
                    </h3>

                    <p className="text-xs text-slate-300 font-medium mt-1 leading-snug">
                      {t(`difficulties.${tierKey}.tagline`)}
                    </p>

                    {/* Feature Highlights */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                      {tierKey === "cadet" && (
                        <>
                          <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Gentle automated hints when life support drops</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>High margin of error & 1.5× recovery rate</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <span>• Target: 28 MW Life Support, 24 MW Shields</span>
                          </div>
                        </>
                      )}

                      {tierKey === "commander" && (
                        <>
                          <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Current balanced NASA simulation baseline</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Realistic 100 MW power trade-offs & storms</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <span>• Target: 35 MW Life Support, 30 MW Shields</span>
                          </div>
                        </>
                      )}

                      {tierKey === "flight_director" && (
                        <>
                          <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Random micro-meteoroid punctures & leaks</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                            <Flame className="w-3.5 h-3.5 shrink-0" />
                            <span>Actual non-linear thermal fatigue curves</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-rose-300 font-medium">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            <span>Strict 500 mSv NASA astronaut career limits</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2 flex items-center justify-between border-t border-slate-800/60">
                    <span className="text-[10px] font-mono text-slate-500">
                      {t(`difficulties.${tierKey}.targetAudience`)}
                    </span>
                    <span
                      className={`text-xs font-bold font-mono transition-colors ${
                        isTierSelected ? "text-white" : "text-slate-500"
                      }`}
                    >
                      {isTierSelected ? "✓ ACTIVE RANK" : "SELECT →"}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* STEP 2: DESTINATION SELECTION */}
        <div className="max-w-5xl mx-auto w-full mb-3 px-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase">
              {t("briefing.step2Title")}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            NASA LRO & MSL Environmental Telemetry
          </span>
        </div>

        {/* 2-Column Destination Selector Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto w-full">
          {DESTINATIONS.map((dest) => {
            const isSelected = selectedId === dest.env.id;
            const destKey = dest.env.id === "lunar_south_pole" ? "moon" : "mars";
            const destName = t(`destinations.${destKey}.name`);
            const destSubtitle = t(`destinations.${destKey}.subtitle`);
            const destBadge = t(`destinations.${destKey}.badge`);
            const destTagline = t(`destinations.${destKey}.tagline`);
            const destSunlightValue = t(`destinations.${destKey}.sunlightValue`);
            const destSunlightRating = t(`destinations.${destKey}.sunlightRating`);
            const destRadiationValue = t(`destinations.${destKey}.radiationValue`);
            const destRadiationRating = t(`destinations.${destKey}.radiationRating`);
            const destTempValue = t(`destinations.${destKey}.tempValue`);
            const destTempSwingRange = t(`destinations.${destKey}.tempSwingRange`);

            return (
              <motion.div
                key={dest.env.id}
                onClick={() => {
                  soundEffects.playButtonClick();
                  setSelectedId(dest.env.id);
                }}
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
                    {t("common.targetAcquired")}
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
                            {destBadge}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          {destName}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                          {destSubtitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* High-Concept 10-Second Explainer */}
                  <p className="text-xs sm:text-sm text-slate-200 mb-5 leading-relaxed bg-white/5 rounded-2xl p-3 border border-white/5">
                    {destTagline}
                  </p>

                  {/* 3 Visual Stat Badges (Kid-friendly cause & effect) */}
                  <div className="grid grid-cols-3 gap-2.5 mb-5">
                    {/* Stat 1: Sunlight */}
                    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-2.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-amber-400 mb-1">
                        <Sun className="w-4 h-4" />
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                          {t("briefing.solarSunlight")}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-black text-white leading-tight">
                          {destSunlightValue}
                        </p>
                        <p className="text-[10px] font-medium text-amber-300 mt-0.5 truncate">
                          {destSunlightRating}
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
                          {t("briefing.radiationRisk")}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-black text-white leading-tight">
                          {destRadiationValue}
                        </p>
                        <p className="text-[10px] font-medium text-rose-300 mt-0.5 truncate">
                          {destRadiationRating}
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
                          {t("briefing.temperatureSwing")}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-black text-white leading-tight">
                          {destTempValue}
                        </p>
                        <p className="text-[10px] font-medium text-cyan-300 mt-0.5 truncate">
                          {destTempSwingRange}
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
                      {t("common.dataSource")}:
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
                      soundEffects.playTurnChime();
                      onStart(dest.env, selectedDifficulty);
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                      isSelected
                        ? "bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] text-white hover:brightness-110 shadow-blue-900/50"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                    }`}
                  >
                    <Rocket className="w-4 h-4" />
                    <span>{t("common.launch")} {destName} ({t(`difficulties.${selectedDifficulty}.title`)})</span>
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
                      title={t("briefing.inspectInstruments")}
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
            key={`${selectedDestination.env.id}-${selectedDifficulty}`}
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
                    {t("common.readyToCommand")}:
                  </span>
                  <span
                    className="text-[11px] font-mono px-2 py-0.5 rounded-full font-bold"
                    style={{
                      backgroundColor: `${activeDifficultyPreset.accentColor}25`,
                      color: activeDifficultyPreset.accentColor,
                    }}
                  >
                    {activeDifficultyPreset.emoji} {t(`difficulties.${selectedDifficulty}.commanderRank`)}
                  </span>
                  <span className="text-xs font-mono text-slate-400 hidden md:inline">
                    · {t("common.tenSolMission")}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-bold text-white mt-0.5">
                  {t(`destinations.${selectedDestination.env.id === "lunar_south_pole" ? "moon" : "mars"}.name`)} — {t(`destinations.${selectedDestination.env.id === "lunar_south_pole" ? "moon" : "mars"}.subtitle`)}
                </p>
                <p className="text-xs text-slate-300 line-clamp-1 max-w-xl">
                  {t(`difficulties.${selectedDifficulty}.tagline`)} {t(`destinations.${selectedDestination.env.id === "lunar_south_pole" ? "moon" : "mars"}.summary`)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEffects.playTurnChime();
                onStart(selectedDestination.env, selectedDifficulty);
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-blue-600 to-[#06B6D4] hover:brightness-110 active:scale-95 text-white font-black text-base sm:text-lg tracking-wide flex items-center justify-center gap-3 shadow-xl shadow-blue-900/60 transition-all border border-cyan-300/40 flex-shrink-0"
            >
              <Rocket className="w-5 h-5 -rotate-45" />
              <span>{t("briefing.launchAs", { rank: t(`difficulties.${selectedDifficulty}.title`).toUpperCase() })}</span>
              <span className="text-xs font-mono bg-black/30 px-2 py-0.5 rounded-full text-cyan-200">
                {t("common.sol")} 1
              </span>
            </button>
          </motion.div>
        </div>
      </main>

      {/* Footer Info & NASA Credibility Strip */}
      <footer className="relative z-10 w-full border-t border-slate-900 bg-[#0B1120]/90 px-4 py-3 sm:px-8 text-center text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-cyan-500" />
          <span>{t("common.footerTagline")}</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>{t("common.audienceTagline")}</span>
          <span>•</span>
          <span>{t("common.zeroSignUp")}</span>
        </div>
      </footer>

      {/* Procedural Space Audio Synthesizer Deck Modal */}
      <AmbientAudioModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        environmentName={selectedDestination.env.name}
      />
    </div>
  );
}
