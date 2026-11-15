// ============================================================
// MissionEndScreen — results, outcome, retry, and scoring
// ============================================================
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  Satellite,
  Sparkles,
  Globe,
  Award,
  Printer,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import type { GameState, TurnResult } from "../engine/simulationEngine";
import type { MissionEnvironment } from "../data/nasaConstants";
import MissionDebriefModal from "./MissionDebriefModal";
import JuniorAstronautCertificate from "./JuniorAstronautCertificate";
import StemDebriefWorksheet from "./StemDebriefWorksheet";
import { calculateOutcomeRank } from "../utils/flightRecorder";
import { DIFFICULTY_PRESETS } from "../data/difficultyTiers";
import { useTranslation } from "../i18n/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import { JudgeDemoNavPill } from "./JudgeDemoBar";
import {
  buildChallengeUrl,
  formatSeedDisplay,
} from "../utils/seededRandom";

interface MissionEndScreenProps {
  gameState: GameState;
  environment: MissionEnvironment;
  onRetry: () => void;
  onNewMission: () => void;
  onShowNasaData: () => void;
  kidMode: boolean;
  onToggleDemoBar?: () => void;
  isDemoBarOpen?: boolean;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#eab308" : "#ef4444";

  return (
    <svg width={130} height={130} className="rotate-[-90deg]">
      <circle cx={65} cy={65} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
      <motion.circle
        cx={65}
        cy={65}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      <text
        x={65}
        y={65}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={22}
        fontWeight="bold"
        transform="rotate(90 65 65)"
      >
        {score}
      </text>
      <text
        x={65}
        y={82}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={10}
        transform="rotate(90 65 65)"
      >
        / 100
      </text>
    </svg>
  );
}

function TurnHistoryRow({ result, kidMode }: { result: TurnResult; kidMode: boolean }) {
  const scoreColor = result.missionScorePercent >= 70 ? "text-emerald-400" : result.missionScorePercent >= 45 ? "text-yellow-400" : "text-red-400";
  return (
    <div className="flex items-center gap-3 text-xs py-2 border-b border-white/5 last:border-0">
      <span className="text-slate-500 font-mono w-10 shrink-0">T{result.turn}</span>
      <span className="flex-1 text-slate-300 truncate">
        {kidMode ? result.kidNarrativeSummary : result.event.label}
      </span>
      <span className={`font-mono font-bold shrink-0 ${scoreColor}`}>
        {result.missionScorePercent}
      </span>
    </div>
  );
}

export default function MissionEndScreen({
  gameState,
  environment,
  onRetry,
  onNewMission,
  onShowNasaData,
  kidMode,
  onToggleDemoBar,
  isDemoBarOpen,
}: MissionEndScreenProps) {
  const { t } = useTranslation();
  const [showDebrief, setShowDebrief] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showWorksheet, setShowWorksheet] = useState(false);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [copiedCodeOnly, setCopiedCodeOnly] = useState(false);
  const { finalOutcome, cumulativeScore, history: missionHistory = [] } = gameState;

  const outcomeRank = useMemo(() => calculateOutcomeRank(gameState), [gameState]);

  const handleShareChallenge = async () => {
    const challengeUrl = buildChallengeUrl(
      gameState.missionSeed || "ARTEMIS-01",
      environment.id,
      gameState.difficulty
    );
    try {
      await navigator.clipboard.writeText(challengeUrl);
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyCodeOnly = async () => {
    const code = formatSeedDisplay(gameState.missionSeed || "ARTEMIS-01");
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeOnly(true);
      setTimeout(() => setCopiedCodeOnly(false), 2000);
    } catch {
      // fallback
    }
  };

  const isSuccess = finalOutcome === "mission_success";
  const isPartial = finalOutcome === "partial_success";

  const outcomeConfig = {
    mission_success: {
      emoji: "🏆",
      title: kidMode ? "Amazing! Mission Complete!" : "Mission Success",
      subtitle: kidMode
        ? "You kept the crew safe and all systems running. You're a real Outpost Commander!"
        : "All critical systems maintained. Crew returned safely. Excellent engineering decisions.",
      color: "text-emerald-300",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      icon: <Trophy size={28} className="text-emerald-400" />,
    },
    partial_success: {
      emoji: "⚠️",
      title: kidMode ? "Mission Mostly Done!" : "Partial Success",
      subtitle: kidMode
        ? "Some systems struggled, but the crew made it! Try again and see if you can balance power better."
        : "Mission objectives partially met. Review power allocation trade-offs for improvement.",
      color: "text-yellow-300",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      icon: <AlertCircle size={28} className="text-yellow-400" />,
    },
    critical_alert: {
      emoji: "🚨",
      title: kidMode ? "Critical Alert — Try Again!" : "Mission Critical Alert",
      subtitle: kidMode
        ? "One or more systems failed. Don't worry — real engineers learn from every mission! Retry and try a different power balance."
        : "One or more critical systems failed. Review the engineering trade-offs in each turn's alerts and retry.",
      color: "text-red-300",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      icon: <AlertCircle size={28} className="text-red-400" />,
    },
    ongoing: {
      emoji: "🔄",
      title: "Mission Ongoing",
      subtitle: "",
      color: "text-blue-300",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      icon: <RefreshCw size={28} className="text-blue-400" />,
    },
  }[finalOutcome];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        className="max-w-2xl w-full flex flex-col gap-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center px-1 relative z-30">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
              {t("common.nasaSpaceApps")}
            </span>
            {onToggleDemoBar && (
              <JudgeDemoNavPill onClick={onToggleDemoBar} isOpen={isDemoBarOpen} />
            )}
          </div>
          <LanguageSelector compact />
        </div>

        {/* Outcome card */}
        <div
          className={`glass-panel p-6 border ${outcomeConfig.borderColor} ${outcomeConfig.bgColor}`}
        >
          <div className="flex items-start gap-4">
            <div className="text-5xl">{outcomeConfig.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${DIFFICULTY_PRESETS[gameState.difficulty || "commander"].accentColor}25`,
                    color: DIFFICULTY_PRESETS[gameState.difficulty || "commander"].accentColor,
                    border: `1px solid ${DIFFICULTY_PRESETS[gameState.difficulty || "commander"].accentColor}50`,
                  }}
                >
                  {DIFFICULTY_PRESETS[gameState.difficulty || "commander"].emoji}{" "}
                  {DIFFICULTY_PRESETS[gameState.difficulty || "commander"].commanderRank}
                </span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  {outcomeRank.rankTitle}
                </span>
              </div>
              <h2 className={`text-2xl font-black ${outcomeConfig.color}`}>
                {outcomeConfig.title}
              </h2>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                {outcomeConfig.subtitle}
              </p>
            </div>
            <ScoreRing score={cumulativeScore} />
          </div>
        </div>

        {/* Classroom Mission Seed & Challenge Classmates Card */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900/95 via-cyan-950/50 to-slate-900/95 border border-cyan-500/30 p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-300 font-mono font-black text-xl shrink-0 shadow-lg shadow-cyan-950/60">
              #
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold tracking-wider text-cyan-400 uppercase">
                  Classroom Mission Seed
                </span>
                <button
                  type="button"
                  onClick={handleCopyCodeOnly}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-200 border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                  title="Click to copy raw code"
                >
                  {copiedCodeOnly ? (
                    <>
                      <Check size={10} className="text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={10} />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-lg sm:text-xl font-black font-mono text-white tracking-wider mt-0.5 truncate">
                {formatSeedDisplay(gameState.missionSeed || "ARTEMIS-01")}
              </p>
              <p className="text-xs text-slate-300">
                Challenge classmates with identical solar storms & power flux!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleShareChallenge}
            className={`w-full sm:w-auto px-5 py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 border cursor-pointer shrink-0 ${copiedChallenge
              ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-900/60"
              : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white border-cyan-400/40 shadow-cyan-900/40"
              }`}
          >
            {copiedChallenge ? (
              <>
                <Check size={16} className="text-white" />
                <span>Challenge Link Copied! 🚀</span>
              </>
            ) : (
              <>
                <Share2 size={16} />
                <span>Share / Challenge a Classmate</span>
              </>
            )}
          </button>
        </div>

        {/* Final crew stats */}
        <div className="glass-panel p-5">
          <h3 className="font-bold text-sm text-slate-300 mb-4">
            {kidMode ? "How Your Crew Did 👨‍🚀" : "Final Crew Metrics"}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: kidMode ? "Happy Crew 😊" : "Crew Morale", value: `${gameState.crew.morale}%`, color: "text-pink-400" },
              { label: kidMode ? "Oxygen Left 🌬️" : "O₂ Buffer", value: `${gameState.crew.oxygenBufferPercent.toFixed(0)}%`, color: "text-sky-400" },
              { label: kidMode ? "Food Left 🥗" : "Food Reserves", value: `${gameState.crew.foodReserveDays.toFixed(1)} days`, color: "text-green-400" },
              { label: kidMode ? "Radiation Absorbed ☢️" : "Total Radiation", value: `${gameState.crew.radiationExposureMSv.toFixed(1)} mSv`, color: "text-orange-400" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 rounded-xl p-3 text-center">
                <p className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Turn history */}
        <div className="glass-panel p-5">
          <h3 className="font-bold text-sm text-slate-300 mb-3">
            {kidMode ? "Mission Log (what happened each turn)" : "Turn-by-Turn Log"}
          </h3>
          <div className="max-h-48 overflow-y-auto">
            {(missionHistory || []).map((result: TurnResult) => (
              <TurnHistoryRow key={result.turn} result={result} kidMode={kidMode} />
            ))}
          </div>
        </div>

        {/* Learning moment */}
        {!isSuccess && (
          <div className="glass-panel p-4 border border-blue-500/20 bg-blue-500/5">
            <p className="text-xs font-bold text-blue-300 mb-2">
              {kidMode ? "🧠 What to Try Next Time:" : "⚖️ Key Engineering Trade-Off to Review:"}
            </p>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              {isPartial && (
                <>
                  <li>Try keeping all three systems above 25 MW each turn, even during storms.</li>
                  <li>During Solar Particle Events, temporarily boost Radiation Shielding but not at the expense of O₂.</li>
                  <li>Life Support needs consistent power — it doesn't recover quickly when starved.</li>
                </>
              )}
              {!isPartial && (
                <>
                  <li>Power is your most critical resource — never over-budget.</li>
                  <li>Radiation damage is cumulative and invisible; shield health matters every single turn.</li>
                  <li>Oxygen and food depletion build slowly — maintain Life Support power even when storms hit.</li>
                  <li>Watch for the white baseline markers on each slider — they show safe operating levels.</li>
                </>
              )}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {/* Certificate Primary Action Button */}
          <button
            onClick={() => setShowCertificate(true)}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black py-4 rounded-xl transition-all shadow-xl shadow-amber-950/60 text-sm cursor-pointer transform hover:scale-[1.01]"
          >
            <Award size={20} className="text-black" />
            <span>{t("debrief.viewCertificate")}</span>
          </button>

          {/* STEM Debrief Worksheet Action Button */}
          <button
            onClick={() => setShowWorksheet(true)}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black py-3.5 rounded-xl transition-all shadow-lg shadow-teal-950/50 text-sm cursor-pointer transform hover:scale-[1.01]"
          >
            <Printer size={18} />
            <span>📄 Print / Save PDF Lab Report</span>
          </button>

          <button
            onClick={() => setShowDebrief(true)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-900/40 text-sm cursor-pointer"
          >
            <Sparkles size={18} />
            <span>{t("debrief.flightRecorder")}</span>
          </button>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onRetry}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw size={16} />
              {t("common.retry")} {t(`destinations.${environment.id === "lunar_south_pole" ? "moon" : "mars"}.name`)}
            </button>
            <button
              onClick={onNewMission}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer"
            >
              <Globe size={16} />
              {t("common.switchPlanet")}
            </button>
            <button
              onClick={onShowNasaData}
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold py-3 rounded-xl transition-colors cursor-pointer"
            >
              <Satellite size={16} />
              {t("common.nasaData")}
            </button>
          </div>
        </div>

        {/* Engineering Debrief Modal */}
        {showDebrief && (
          <MissionDebriefModal
            isOpen={showDebrief}
            gameState={gameState}
            environment={environment}
            onPlayAgain={() => {
              setShowDebrief(false);
              onRetry();
            }}
            onSwitchPlanet={() => {
              setShowDebrief(false);
              onNewMission();
            }}
            onShowNasaData={onShowNasaData}
          />
        )}

        {/* Junior Astronaut Mission Certificate Modal */}
        {showCertificate && (
          <JuniorAstronautCertificate
            isOpen={showCertificate}
            onClose={() => setShowCertificate(false)}
            gameState={gameState}
            environment={environment}
            rankTitle={outcomeRank.rankTitle}
            rankTier={outcomeRank.tier}
          />
        )}

        {/* STEM Flight Director Debrief Worksheet Modal */}
        {showWorksheet && (
          <StemDebriefWorksheet
            isOpen={showWorksheet}
            onClose={() => setShowWorksheet(false)}
            gameState={gameState}
            environment={environment}
          />
        )}
      </motion.div>
    </div>
  );
}
