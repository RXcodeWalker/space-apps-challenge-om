// ============================================================
// MissionBriefingScreen.tsx — Junior Commander Briefing & Selection
// Features:
// 1. "Standard Expedition (10 Sols)" mode (Moon, Mars, Europa, Titan)
// 2. "Extreme NASA Scenarios" mode:
//    - 🌑 Artemis III: The 14-Day Lunar Night (Shackleton Crater Rim)
//    - 🔴 Opportunity's Dust Storm (2018 Global Storm - Mars Gale Crater)
//    - 🚀 Apollo 13 Cold Cabin Emergency Protocol (Lunar Transit Basecamp)
// Displays historic context, real NASA telemetry quotes, difficulty ratings,
// unique initial conditions, and tactical constraints.
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
  Hash,
  Shuffle,
  Copy,
  Check,
  Globe,
  Zap,
  Sprout,
  Wind,
  BatteryWarning,
  Clock,
  Quote,
  Eye,
} from "lucide-react";
import { useAccessibility } from "../utils/AccessibilityContext";
import {
  generateMissionSeed,
  normalizeSeed,
  formatSeedDisplay,
} from "../utils/seededRandom";
import type { MissionEnvironment } from "../data/nasaConstants";
import {
  LUNAR_SOUTH_POLE,
  MARS_GALE_CRATER,
  EUROPA_UNDER_ICE,
  TITAN_HYDROCARBON,
} from "../data/nasaConstants";
import {
  HISTORIC_SCENARIOS,
  type HistoricScenario,
  type ScenarioId,
} from "../data/scenarioData";
import { soundEffects, useSoundMuted } from "../utils/soundEffects";
import { ambientAudio } from "../utils/ambientAudio";
import AmbientAudioModal from "./AmbientAudioModal";
import EducatorHubModal from "./EducatorHubModal";
import MissionPatchDesigner, { MissionPatchView } from "./MissionPatchDesigner";
import { loadSavedPatch, type MissionPatchState } from "../data/patchAssets";
import LiveSpaceWeatherBadge from "./LiveSpaceWeatherBadge";
import {
  DIFFICULTY_PRESETS,
  type DifficultyTier,
} from "../data/difficultyTiers";
import { useTranslation } from "../i18n/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import PwaNavButton from "./PwaNavButton";
import { JudgeDemoNavPill } from "./JudgeDemoBar";

interface MissionBriefingScreenProps {
  onStart: (
    environment: MissionEnvironment,
    difficulty: DifficultyTier,
    seed: string,
    scenario?: HistoricScenario
  ) => void;
  onShowNasaData?: (environment: MissionEnvironment) => void;
  initialSeed?: string;
  initialEnvironmentId?: string;
  initialScenarioId?: ScenarioId;
  onToggleDemoBar?: () => void;
  isDemoBarOpen?: boolean;
  onOpenPatchDesigner?: () => void;
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
  radiationLevel: number;
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
    accentColor: "#06B6D4",
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
    accentColor: "#F59E0B",
    glowColor: "rgba(245, 158, 11, 0.35)",
  },
  {
    env: EUROPA_UNDER_ICE,
    code: "EUR-OC-06",
    badge: "Europa Clipper Sub-Surface Base",
    sunlightLabel: "Solar Sunlight",
    sunlightValue: "0% Flux (Under-Ice)",
    sunlightRating: "Near-Constant" as const,
    sunlightPercent: 0,
    radiationLabel: "Radiation Risk",
    radiationValue: "1.80 mSv/day (Surge: 5×)",
    radiationRating: "Solar Flare Risk" as const,
    radiationLevel: 95,
    tempLabel: "Cryogenic Boundary",
    tempValue: "160°C Gradient",
    tempRating: "Extreme 227°C Swing" as const,
    tempSwingRange: "−173°C to −13°C",
    nasaMission: "NASA Europa Clipper (REASON/PIMS/MASPEX)",
    tagline: "Sub-surface ocean station beneath 15 km of ice, powered by cryo-geothermal & RTG.",
    accentColor: "#38BDF8",
    glowColor: "rgba(56, 189, 248, 0.4)",
  },
  {
    env: TITAN_HYDROCARBON,
    code: "TTN-HC-08",
    badge: "Dragonfly Hydrocarbon Outpost",
    sunlightLabel: "Solar Sunlight",
    sunlightValue: "1% Flux (Dense Smog)",
    sunlightRating: "Storm Vulnerable" as const,
    sunlightPercent: 1,
    radiationLabel: "Radiation Risk",
    radiationValue: "0.12 mSv/day",
    radiationRating: "Thin Atmosphere" as const,
    radiationLevel: 20,
    tempLabel: "Surface Temperature",
    tempValue: "94 Kelvin Baseline",
    tempRating: "Severe −80°C Nights" as const,
    tempSwingRange: "−183°C to −179°C",
    nasaMission: "NASA Dragonfly & Cassini-Huygens",
    tagline: "Thick 1.45 bar atmosphere, cryogenic methane lakes, and Dragonfly aerial sorties.",
    accentColor: "#FB923C",
    glowColor: "rgba(251, 146, 60, 0.4)",
  },
];

function resolveDestKey(id: string): "moon" | "mars" | "europa" | "titan" {
  if (id === "lunar_south_pole") return "moon";
  if (id === "mars_gale_crater") return "mars";
  if (id === "europa_under_ice") return "europa";
  return "titan";
}

function renderConstraintIcon(iconName: string) {
  switch (iconName) {
    case "Sun":
      return <Sun className="w-4 h-4 text-amber-400 shrink-0" />;
    case "Zap":
      return <Zap className="w-4 h-4 text-cyan-400 shrink-0" />;
    case "ThermometerSnowflake":
      return <ThermometerSnowflake className="w-4 h-4 text-sky-400 shrink-0" />;
    case "Wind":
      return <Wind className="w-4 h-4 text-teal-400 shrink-0" />;
    case "Sprout":
      return <Sprout className="w-4 h-4 text-emerald-400 shrink-0" />;
    case "ShieldAlert":
      return <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />;
    case "BatteryWarning":
      return <BatteryWarning className="w-4 h-4 text-red-400 shrink-0" />;
    case "AlertTriangle":
      return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
    default:
      return <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />;
  }
}

export default function MissionBriefingScreen({
  onStart,
  onShowNasaData,
  initialSeed,
  initialEnvironmentId,
  initialScenarioId,
  onToggleDemoBar,
  isDemoBarOpen,
  onOpenPatchDesigner,
}: MissionBriefingScreenProps) {
  const { t } = useTranslation();

  // Mode Selection: Standard Expedition vs Extreme NASA Scenarios
  const [briefingMode, setBriefingMode] = useState<"standard" | "extreme">(() => {
    return initialScenarioId ? "extreme" : "standard";
  });

  const [selectedId, setSelectedId] = useState<string>(() => {
    if (initialEnvironmentId && DESTINATIONS.some((d) => d.env.id === initialEnvironmentId)) {
      return initialEnvironmentId;
    }
    return LUNAR_SOUTH_POLE.id;
  });

  const [selectedScenarioId, setSelectedScenarioId] = useState<ScenarioId>(() => {
    if (initialScenarioId && HISTORIC_SCENARIOS.some((s) => s.id === initialScenarioId)) {
      return initialScenarioId;
    }
    return "artemis_iii_lunar_night";
  });

  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyTier>("commander");
  const [missionSeed, setMissionSeed] = useState<string>(() => {
    return initialSeed ? normalizeSeed(initialSeed) : generateMissionSeed();
  });
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isMuted, toggleMute] = useSoundMuted();
  const { colorblindMode, toggleColorblindMode, shapes } = useAccessibility();
  const [isAudioModalOpen, setIsAudioModalOpen] = useState<boolean>(false);
  const [isEducatorHubOpen, setIsEducatorHubOpen] = useState<boolean>(false);
  const [isPatchModalOpen, setIsPatchModalOpen] = useState<boolean>(false);
  const [customPatch, setCustomPatch] = useState<MissionPatchState>(() => loadSavedPatch());

  // Listen for patch state updates from localStorage or custom events
  useEffect(() => {
    const handlePatchUpdate = () => {
      setCustomPatch(loadSavedPatch());
    };
    if (typeof window !== "undefined") {
      window.addEventListener("outpost_patch_saved", handlePatchUpdate);
      window.addEventListener("storage", handlePatchUpdate);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("outpost_patch_saved", handlePatchUpdate);
        window.removeEventListener("storage", handlePatchUpdate);
      }
    };
  }, []);

  const selectedDestination =
    DESTINATIONS.find((d) => d.env.id === selectedId) ?? DESTINATIONS[0];
  const selectedScenario =
    HISTORIC_SCENARIOS.find((s) => s.id === selectedScenarioId) ?? HISTORIC_SCENARIOS[0];
  const activeDifficultyPreset = DIFFICULTY_PRESETS[selectedDifficulty];

  const handleGenerateSeed = () => {
    soundEffects.playButtonClick();
    const fresh = generateMissionSeed();
    setMissionSeed(fresh);
  };

  const handleCopySeed = async () => {
    soundEffects.playTurnChime();
    const formatted = formatSeedDisplay(missionSeed);
    try {
      await navigator.clipboard.writeText(formatted);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleLaunchStandard = (env: MissionEnvironment) => {
    soundEffects.playTurnChime();
    const effectiveSeed = missionSeed.trim() ? normalizeSeed(missionSeed) : generateMissionSeed();
    if (!missionSeed.trim()) {
      setMissionSeed(effectiveSeed);
    }
    onStart(env, selectedDifficulty, effectiveSeed);
  };

  const handleLaunchScenario = (scenario: HistoricScenario) => {
    soundEffects.playTurnChime();
    const effectiveSeed = missionSeed.trim() ? normalizeSeed(missionSeed) : generateMissionSeed();
    if (!missionSeed.trim()) {
      setMissionSeed(effectiveSeed);
    }
    onStart(scenario.baseEnvironment, selectedDifficulty, effectiveSeed, scenario);
  };

  // Sync ambient space audio with chosen destination or scenario environment
  useEffect(() => {
    const targetEnvId =
      briefingMode === "extreme" ? selectedScenario.environmentId : selectedId;
    ambientAudio.updateTelemetry({
      environmentId: targetEnvId,
      radiationMultiplier: 1.0,
      lifeSupportHealth: 100,
      lifeSupportPowerRatio: 1.0,
      shieldingHealth: 100,
      shieldingPowerRatio: 1.0,
    });
  }, [selectedId, selectedScenarioId, briefingMode, selectedScenario.environmentId]);

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
            {/* Real NASA DONKI / NOAA Space Weather Telemetry Pill */}
            <LiveSpaceWeatherBadge />

            {onToggleDemoBar && (
              <JudgeDemoNavPill onClick={onToggleDemoBar} isOpen={isDemoBarOpen} />
            )}
            <PwaNavButton />
            <LanguageSelector />

            {/* Mission Patch Designer Studio Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                soundEffects.playButtonClick();
                if (onOpenPatchDesigner) {
                  onOpenPatchDesigner();
                } else {
                  setIsPatchModalOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/50 hover:border-purple-400 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 text-xs font-mono font-bold transition-all shadow-sm shadow-purple-950/40 cursor-pointer"
              title="Mission Patch Designer: Customize Crew Insignia & Team Patch"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">Mission Patch</span>
              <span className="sm:hidden">Patch</span>
            </motion.button>

            {/* Educator Hub & NGSS Curriculum Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                soundEffects.playButtonClick();
                setIsEducatorHubOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-600/50 hover:border-amber-400 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 text-xs font-mono font-bold transition-all shadow-sm shadow-amber-950/40 cursor-pointer"
              title="Educator Hub: 45-Min Lesson Plan, NGSS Alignment & Teacher Prompts"
            >
              <span className="text-sm">🍎</span>
              <span className="hidden sm:inline">For Teachers / NGSS</span>
              <span className="sm:hidden">NGSS</span>
            </motion.button>

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

            {/* Vision / Accessibility Toggle */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                toggleColorblindMode();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                colorblindMode
                  ? "bg-sky-950/70 border-sky-400 text-sky-200 shadow-sm shadow-sky-950/50 ring-1 ring-sky-400/40"
                  : "bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-sky-300"
              }`}
              title={
                colorblindMode
                  ? "Vision / Accessibility: Colorblind-Safe Mode ACTIVE (Click to switch to Standard)"
                  : "Vision / Accessibility: Enable Colorblind-Safe & High-Contrast Mode"
              }
              aria-pressed={colorblindMode}
              aria-label="Vision and Accessibility: Toggle Colorblind-Safe Mode"
            >
              <Eye className={`w-3.5 h-3.5 ${colorblindMode ? "text-sky-400" : "text-slate-400"}`} />
              <span className="hidden sm:inline">Vision / Accessibility</span>
              {colorblindMode && (
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1 py-0.2 rounded font-mono font-bold">
                  {shapes.nominal} SAFE
                </span>
              )}
            </button>

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
        {/* Mission Objective Header */}
        <div className="text-center max-w-3xl mx-auto mb-6">
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
            {briefingMode === "extreme"
              ? "NASA Historic & Future Scenarios"
              : t("briefing.title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl mx-auto"
          >
            {briefingMode === "extreme"
              ? "Experience real, high-stakes space exploration events. Survive Apollo 13's cold cabin, Opportunity's 2018 Martian dust storm blackout, or Artemis III's 14-day lunar night."
              : t("briefing.subtitle")}
          </motion.p>
        </div>

        {/* MISSION MODE SELECTOR TABS: Standard Expedition vs Extreme NASA Scenarios */}
        <div className="max-w-3xl mx-auto w-full mb-8 flex flex-col items-center">
          <div className="bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 flex items-stretch sm:items-center gap-1.5 shadow-2xl backdrop-blur-md w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                setBriefingMode("standard");
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                briefingMode === "standard"
                  ? "bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] text-white shadow-lg shadow-blue-900/50 border border-cyan-400/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Standard Expedition (10 Sols)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                setBriefingMode("extreme");
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer relative ${
                briefingMode === "extreme"
                  ? "bg-gradient-to-r from-rose-700 via-amber-600 to-amber-500 text-white shadow-lg shadow-amber-950/60 border border-amber-400/40"
                  : "text-slate-400 hover:text-amber-300 hover:bg-slate-900/60"
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Extreme NASA Scenarios</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/50 font-bold hidden md:inline">
                Historic & Future
              </span>
            </button>
          </div>
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
                            <span>Realistic power trade-offs & storms</span>
                          </div>
                        </>
                      )}

                      {tierKey === "flight_director" && (
                        <>
                          <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Random micro-meteoroid punctures & leaks</span>
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

        {/* CLASSROOM MISSION SEED & REPRODUCIBLE COMPETITION SYNC */}
        <div className="max-w-5xl mx-auto w-full mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase">
                Classroom Mission Seed
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-bold hidden sm:inline">
                STEM Class Competitions · Deterministic Simulation
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              Guarantees identical solar flares, dust storms & power flux for all students
            </span>
          </div>

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur-sm">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="mission-seed-input" className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                    <span className="text-cyan-400 font-bold">Mission Code:</span>
                    <span className="text-slate-400 text-[11px] hidden sm:inline">
                      Share this code with your class so every run has identical events
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setIsEducatorHubOpen(true);
                    }}
                    className="text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Open 45-Min Lesson Plan & NGSS Curriculum"
                  >
                    <span>🍎 Lesson Plan (#ARTEMIS-26)</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-mono font-black text-cyan-400 text-base select-none">
                    #
                  </span>
                  <input
                    id="mission-seed-input"
                    type="text"
                    value={missionSeed}
                    onChange={(e) => setMissionSeed(e.target.value.toUpperCase())}
                    placeholder="e.g. ARTEMIS-26"
                    maxLength={24}
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-950/90 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white font-mono font-black text-base sm:text-lg tracking-wider uppercase transition-all shadow-inner placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:self-end">
                <button
                  type="button"
                  onClick={handleGenerateSeed}
                  className="flex-1 sm:flex-initial px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 hover:border-cyan-500/40 text-slate-200 hover:text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  title="Generate random authentic NASA code"
                >
                  <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Generate Seed</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySeed}
                  className={`flex-1 sm:flex-initial px-4 py-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 border cursor-pointer ${
                    isCopied
                      ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-emerald-950/50"
                      : "bg-cyan-950/70 hover:bg-cyan-900/60 border-cyan-700/60 hover:border-cyan-400 text-cyan-200 hover:text-white shadow-cyan-950/40"
                  }`}
                  title="Copy Mission Code"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied! ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Seeds */}
            <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Quick Seeds:
              </span>
              {(briefingMode === "extreme"
                ? ["ARTEMIS-III", "OPPORTUNITY-5111", "APOLLO-13", "SHACKLETON-NIGHT", "GALE-STORM"]
                : ["ARTEMIS-26", "GALE-99", "ORION-07", "VALKYRIE-18", "SHACKLETON-42"]
              ).map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setMissionSeed(quick);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all border cursor-pointer ${
                    missionSeed.replace(/^#/, "") === quick
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm"
                      : "bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  #{quick}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* EXPEDITION MISSION PATCH PREVIEW & CUSTOMIZER CALLOUT */}
        <div className="max-w-5xl mx-auto w-full mb-8">
          <div className="rounded-2xl bg-gradient-to-r from-slate-900/95 via-purple-950/30 to-slate-900/95 border border-purple-500/30 p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {/* Miniature Patch Preview */}
              <div
                onClick={() => {
                  soundEffects.playButtonClick();
                  if (onOpenPatchDesigner) onOpenPatchDesigner();
                  else setIsPatchModalOpen(true);
                }}
                className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0 cursor-pointer transform hover:scale-105 transition-transform"
                title="Click to customize team patch"
              >
                <MissionPatchView patch={customPatch} size="100%" showShadow={false} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-purple-400 uppercase">
                    OFFICIAL CREW INSIGNIA
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-purple-950 border border-purple-800 text-purple-300">
                    CDR. {customPatch.commanderCallsign}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-black font-serif text-white tracking-wide mt-0.5 truncate">
                  {customPatch.outpostName}
                </h4>
                <p className="text-xs text-slate-300 italic">
                  "{customPatch.motto}" · Embroidered Merrowed Patch
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                if (onOpenPatchDesigner) onOpenPatchDesigner();
                else setIsPatchModalOpen(true);
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-600 to-cyan-600 hover:from-purple-600 hover:to-cyan-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-950/50 border border-purple-400/40 cursor-pointer shrink-0 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Customize Team Patch</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: STANDARD EXPEDITION SELECTION                       */}
        {/* ========================================================= */}
        {briefingMode === "standard" && (
          <div>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto w-full">
              {DESTINATIONS.map((dest) => {
                const isSelected = selectedId === dest.env.id;
                const destKey = resolveDestKey(dest.env.id);
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
                    {isSelected && (
                      <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg border border-cyan-300/40">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t("common.targetAcquired")}
                      </div>
                    )}

                    <div>
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

                      <p className="text-xs sm:text-sm text-slate-200 mb-5 leading-relaxed bg-white/5 rounded-2xl p-3 border border-white/5">
                        {destTagline}
                      </p>

                      <div className="grid grid-cols-3 gap-2.5 mb-5">
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
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full"
                              style={{ width: `${dest.sunlightPercent}%` }}
                            />
                          </div>
                        </div>

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
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 rounded-full"
                              style={{ width: `${dest.radiationLevel}%` }}
                            />
                          </div>
                        </div>

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
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                            <div
                              className="h-full bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full"
                              style={{ width: `${dest.env.id === "lunar_south_pole" ? 90 : 55}%` }}
                            />
                          </div>
                        </div>
                      </div>

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

                    <div className="mt-5 flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLaunchStandard(dest.env);
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
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: EXTREME NASA SCENARIOS SELECTION                   */}
        {/* ========================================================= */}
        {briefingMode === "extreme" && (
          <div className="max-w-7xl mx-auto w-full">
            <div className="mb-4 px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold tracking-wider text-amber-300 uppercase">
                  Step 2: Select High-Stakes NASA Historic Event
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Authentic NASA Telemetry · Real Engineering Dilemmas
              </span>
            </div>

            {/* 3 Scenario Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              {HISTORIC_SCENARIOS.map((scenario) => {
                const isSelected = selectedScenarioId === scenario.id;

                return (
                  <motion.div
                    key={scenario.id}
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setSelectedScenarioId(scenario.id);
                    }}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    className={`relative rounded-3xl p-5 sm:p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between border-2 ${
                      isSelected
                        ? "bg-slate-900/95 ring-2 ring-white/20 shadow-2xl"
                        : "bg-slate-950/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50"
                    }`}
                    style={{
                      borderColor: isSelected ? scenario.accentColor : undefined,
                      boxShadow: isSelected ? `0 0 35px ${scenario.glowColor}` : undefined,
                    }}
                  >
                    {/* Active Ribbon */}
                    {isSelected && (
                      <div
                        className="absolute -top-3.5 right-6 text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg border"
                        style={{
                          backgroundColor: scenario.accentColor,
                          borderColor: "rgba(255, 255, 255, 0.4)",
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ACTIVE SELECTION
                      </div>
                    )}

                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl sm:text-5xl drop-shadow-md">
                            {scenario.emoji}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${scenario.accentColor}20`,
                                  color: scenario.accentColor,
                                  border: `1px solid ${scenario.accentColor}50`,
                                }}
                              >
                                {scenario.badge}
                              </span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
                              {scenario.title}
                            </h3>
                            <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-cyan-400" />
                              <span>{scenario.location} · {scenario.yearOrEra}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Difficulty Badge & Stars */}
                      <div className="flex items-center justify-between bg-slate-950/70 rounded-xl px-3 py-2 border border-slate-800 mb-4">
                        <span className="text-[11px] font-mono text-slate-400">
                          DIFFICULTY:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-xs font-mono font-black uppercase px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: `${scenario.accentColor}25`,
                              color: scenario.accentColor,
                              border: `1px solid ${scenario.accentColor}50`,
                            }}
                          >
                            {scenario.difficultyBadge}
                          </span>
                        </div>
                      </div>

                      {/* Historic Context */}
                      <div className="mb-4 bg-slate-900/60 rounded-2xl p-3 border border-slate-800">
                        <p className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          Historic Context & Physics
                        </p>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {scenario.historicContext}
                        </p>
                      </div>

                      {/* Real NASA Telemetry Box */}
                      <div className="mb-4 rounded-2xl bg-black/80 border border-slate-700/80 p-3.5 font-mono text-xs shadow-inner relative overflow-hidden">
                        <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold pb-2 mb-2 border-b border-slate-800">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            <Radio className="w-3.5 h-3.5 text-cyan-400" />
                            REAL NASA TELEMETRY TRANSCRIPT
                          </span>
                          <span className="text-slate-400">
                            {scenario.telemetryQuote.timestampOrDate}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <Quote className="w-4 h-4 text-cyan-400/60 shrink-0 mt-0.5 rotate-180" />
                          <p className="text-slate-200 text-xs italic leading-relaxed">
                            "{scenario.telemetryQuote.quote}"
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="text-cyan-300 font-semibold truncate">
                            — {scenario.telemetryQuote.speaker}
                          </span>
                          <span className="truncate max-w-[140px] text-slate-400">
                            {scenario.telemetryQuote.mission}
                          </span>
                        </div>
                      </div>

                      {/* Initial Conditions Status Banner */}
                      <div className="mb-4 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-mono text-slate-400 uppercase">
                            Initial Conditions
                          </p>
                          <p className="text-xs font-bold text-white mt-0.5">
                            {scenario.initialConditions.statusBadge}
                          </p>
                        </div>
                        <span
                          className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg"
                          style={{
                            backgroundColor: `${scenario.accentColor}20`,
                            color: scenario.accentColor,
                            border: `1px solid ${scenario.accentColor}40`,
                          }}
                        >
                          {scenario.initialConditions.powerBudgetMW} MW Power
                        </span>
                      </div>

                      {/* 4 Constraints Tiles */}
                      <div className="space-y-2 mb-4">
                        <p className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                          Key Constraints & Failure Modes
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {scenario.constraints.map((c) => (
                            <div
                              key={c.id}
                              className="rounded-xl bg-slate-900/60 border border-slate-800 p-2 flex items-start gap-2 text-xs"
                            >
                              <div className="p-1 rounded bg-slate-800">
                                {renderConstraintIcon(c.icon)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <p className="font-bold text-white text-[11px] truncate">
                                    {c.title}
                                  </p>
                                  <span className="text-[10px] font-mono text-amber-300 font-semibold shrink-0">
                                    {c.value}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-300 leading-tight mt-0.5">
                                  {c.gameplayConsequence}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tactical Survival Challenge */}
                      <div
                        className="rounded-2xl p-3 border mb-5"
                        style={{
                          backgroundColor: `${scenario.accentColor}10`,
                          borderColor: `${scenario.accentColor}40`,
                        }}
                      >
                        <p
                          className="text-[10px] font-mono font-bold uppercase tracking-wider mb-1 flex items-center gap-1"
                          style={{ color: scenario.accentColor }}
                        >
                          <Flame className="w-3 h-3" />
                          Survival Challenge
                        </p>
                        <p className="text-xs text-slate-100 font-medium leading-relaxed">
                          {scenario.survivalChallenge}
                        </p>
                      </div>
                    </div>

                    {/* Launch Button inside card */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLaunchScenario(scenario);
                      }}
                      className={`w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                        isSelected
                          ? "text-white hover:brightness-110 shadow-lg"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                      }`}
                      style={{
                        background: isSelected
                          ? `linear-gradient(to right, #1D4ED8, ${scenario.accentColor})`
                          : undefined,
                      }}
                    >
                      <Rocket className="w-4 h-4" />
                      <span>
                        LAUNCH {scenario.shortTitle.toUpperCase()} ({t(`difficulties.${selectedDifficulty}.title`)})
                      </span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Summary Box & Global 1-Click Launch Bar */}
        <div className="max-w-5xl mx-auto w-full mt-6">
          <motion.div
            key={`${briefingMode}-${briefingMode === "extreme" ? selectedScenario.id : selectedDestination.env.id}-${selectedDifficulty}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-r from-[#0B1120] via-slate-900 to-[#0B1120] border border-cyan-500/20 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-2xl flex-shrink-0">
                {briefingMode === "extreme" ? selectedScenario.emoji : selectedDestination.env.emoji}
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
                  {briefingMode === "extreme"
                    ? `${selectedScenario.title} — ${selectedScenario.location}`
                    : `${t(`destinations.${resolveDestKey(selectedDestination.env.id)}.name`)} — ${t(`destinations.${resolveDestKey(selectedDestination.env.id)}.subtitle`)}`}
                </p>
                <p className="text-xs text-slate-300 line-clamp-1 max-w-xl">
                  {briefingMode === "extreme"
                    ? selectedScenario.survivalChallenge
                    : `${t(`difficulties.${selectedDifficulty}.tagline`)} ${t(`destinations.${resolveDestKey(selectedDestination.env.id)}.summary`)}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (briefingMode === "extreme") {
                  handleLaunchScenario(selectedScenario);
                } else {
                  handleLaunchStandard(selectedDestination.env);
                }
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-blue-600 to-[#06B6D4] hover:brightness-110 active:scale-95 text-white font-black text-base sm:text-lg tracking-wide flex items-center justify-center gap-3 shadow-xl shadow-blue-900/60 transition-all border border-cyan-300/40 flex-shrink-0 cursor-pointer"
            >
              <Rocket className="w-5 h-5 -rotate-45" />
              <span>
                {briefingMode === "extreme"
                  ? `LAUNCH ${selectedScenario.shortTitle.toUpperCase()} (${t(`difficulties.${selectedDifficulty}.title`).toUpperCase()})`
                  : t("briefing.launchAs", { rank: t(`difficulties.${selectedDifficulty}.title`).toUpperCase() })}
              </span>
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

      <AmbientAudioModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        environmentName={
          briefingMode === "extreme"
            ? selectedScenario.title
            : selectedDestination.env.name
        }
      />

      <EducatorHubModal
        isOpen={isEducatorHubOpen}
        onClose={() => setIsEducatorHubOpen(false)}
        onSelectSeed={(seed) => setMissionSeed(seed)}
      />

      <MissionPatchDesigner
        isOpen={isPatchModalOpen}
        onClose={() => {
          setIsPatchModalOpen(false);
          setCustomPatch(loadSavedPatch());
        }}
      />
    </div>
  );
}
