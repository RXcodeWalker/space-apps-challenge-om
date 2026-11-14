// ============================================================
// CrewPanel.tsx — 4 NASA Astronaut Specialists & Crew Morale Center
// Features:
// 1. Team Vitals Telemetry (Morale %, O₂ Buffer %, Food, Radiation mSv)
// 2. 4 Distinct Astronaut Specialist Profiles:
//    - Dr. Mei Lin (🌱 Botanist / "Sprout")
//    - Cdr. Marcus Vance (⚡ Power Engineer / "Volt")
//    - Dr. Sarah Chen (🩺 Flight Medical Officer / "Doc")
//    - Dr. Alex Rivera (🪨 Planetary Geologist & EVA / "Bedrock")
// 3. Status Badges, Passive Perks, Individual Radiation, Skill Ratings
// 4. Incident Morale Events Log (Heroic Sacrifices & Missions)
// ============================================================
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Zap,
  Apple,
  Wind,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";
import type { CrewState } from "../engine/simulationEngine";
import { soundEffects } from "../utils/soundEffects";

interface CrewPanelProps {
  crew: CrewState;
  kidMode?: boolean;
  onDeploySpecialist?: (role: string) => void;
  compact?: boolean;
}

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  max: number;
  unit?: string;
  inverted?: boolean;
  kidMode?: boolean;
  kidLabel?: string;
}

function StatRow({
  icon,
  label,
  value,
  max,
  unit = "%",
  inverted = false,
  kidMode,
  kidLabel,
}: StatRowProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const displayColor = inverted
    ? pct > 70
      ? "#ef4444"
      : pct > 40
      ? "#eab308"
      : "#10b981"
    : pct < 30
    ? "#ef4444"
    : pct < 60
    ? "#eab308"
    : "#10b981";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-mono">
          {icon}
          <span>{kidMode && kidLabel ? kidLabel : label}</span>
        </div>
        <span className="font-mono font-bold" style={{ color: displayColor }}>
          {typeof value === "number" ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
          <span className="text-slate-400 font-normal ml-0.5">{unit}</span>
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: displayColor }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />
      </div>
    </div>
  );
}

function StarRating({ rating, color = "#06b6d4" }: { rating: number; color?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={10}
          className={i <= rating ? "fill-current" : "opacity-20"}
          style={{ color: i <= rating ? color : "#64748b" }}
        />
      ))}
    </div>
  );
}

export default function CrewPanel({ crew, kidMode = false }: CrewPanelProps) {
  const [activeTab, setActiveTab] = useState<"team" | "specialists" | "events">("specialists");
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const radiationPct = Math.min(100, (crew.radiationExposureMSv / crew.safeRadiationLimitMSv) * 100);
  const members = crew.members || [];
  const events = crew.recentMoraleEvents || [];

  const toggleExpand = (id: string) => {
    soundEffects.playButtonClick();
    setExpandedMemberId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="rounded-2xl bg-[#090E1A]/90 border border-slate-800 p-4 flex flex-col gap-3 shadow-xl backdrop-blur-md">
      {/* Panel Header & Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-sm">
            👨‍🚀
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-2 font-mono uppercase tracking-wider">
              <span>{kidMode ? "Your 4 Astronauts" : "Expedition Crew Roster"}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                4 Active
              </span>
            </h3>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setActiveTab("specialists")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === "specialists"
                ? "bg-cyan-600 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Specialists
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("team")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === "team"
                ? "bg-cyan-600 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Vitals
          </button>
          {events.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("events")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === "events"
                  ? "bg-cyan-600 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Morale Logs</span>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: 4 DISTINCT ASTRONAUT SPECIALISTS */}
      {/* ========================================================= */}
      {activeTab === "specialists" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {members.map((member) => {
            const isExpanded = expandedMemberId === member.id;
            const healthColor =
              member.health > 70 ? "#10b981" : member.health > 40 ? "#eab308" : "#ef4444";
            const moraleColor =
              member.morale > 70 ? "#ec4899" : member.morale > 40 ? "#eab308" : "#ef4444";

            const statusBadgeConfig = {
              nominal: { label: "NOMINAL", bg: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" },
              fatigued: { label: "FATIGUED", bg: "bg-amber-950/80 text-amber-300 border-amber-500/40" },
              injured: { label: "INJURED", bg: "bg-red-950/80 text-red-300 border-red-500/40" },
              irradiated: { label: "IRRADIATED", bg: "bg-purple-950/80 text-purple-300 border-purple-500/50 animate-pulse" },
              heroic: { label: "HEROIC", bg: "bg-cyan-950/80 text-cyan-300 border-cyan-500/50" },
              on_eva: { label: "ON EVA", bg: "bg-sky-950/80 text-sky-300 border-sky-500/50 animate-pulse" },
            }[member.status] || { label: "NOMINAL", bg: "bg-emerald-950 text-emerald-300 border-emerald-500/40" };

            return (
              <motion.div
                key={member.id}
                layout
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                  isExpanded
                    ? "bg-[#0d1527] border-cyan-500/50 shadow-md ring-1 ring-cyan-500/20"
                    : "bg-white/[0.03] border-white/10 hover:border-white/20"
                }`}
              >
                {/* Header Row: Avatar, Name, Callsign, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl shrink-0 p-1 rounded-lg bg-black/40 border border-white/5">
                      {member.avatar}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-black text-white truncate">
                          {member.name}
                        </h4>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">
                          "{member.callsign}"
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        {member.roleTitle}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${statusBadgeConfig.bg}`}
                  >
                    {statusBadgeConfig.label}
                  </span>
                </div>

                {/* Vitals Summary: Health & Morale Progress */}
                <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-white/5 text-[11px] font-mono">
                  <div>
                    <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                      <span>Health</span>
                      <span style={{ color: healthColor }} className="font-bold">
                        {member.health}%
                      </span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${member.health}%`, backgroundColor: healthColor }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                      <span>Morale</span>
                      <span style={{ color: moraleColor }} className="font-bold">
                        {member.morale}%
                      </span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${member.morale}%`, backgroundColor: moraleColor }}
                      />
                    </div>
                  </div>
                </div>

                {/* Status description ticker */}
                <p className="text-[10px] text-slate-300 mt-2 line-clamp-1 italic bg-black/30 px-2 py-1 rounded border border-white/5">
                  "{member.statusDescription}"
                </p>

                {/* Radiation & Repairs Row */}
                <div className="flex items-center justify-between mt-2 pt-1.5 text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Zap size={10} className="text-amber-400" />
                    <span>Dose: {member.radiationDoseMSv.toFixed(2)} mSv</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleExpand(member.id)}
                    className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-0.5"
                  >
                    <span>{isExpanded ? "Less" : "Dossier"}</span>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                {/* Expandable Dossier & Background */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2.5 pt-2.5 border-t border-cyan-800/40 flex flex-col gap-2 text-xs"
                    >
                      {/* Passive Specialty Perk */}
                      <div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-500/30">
                        <span className="text-[10px] font-mono font-bold uppercase text-cyan-300 block mb-0.5">
                          ⭐ Passive Specialty:
                        </span>
                        <p className="text-[11px] text-slate-200">{member.specialtyPerk}</p>
                      </div>

                      {/* Bio Background */}
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-300 leading-relaxed">
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-0.5">
                          NASA Flight Record:
                        </span>
                        {member.bio}
                      </div>

                      {/* Skill Ratings Matrix */}
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-black/40 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">EVA Rating:</span>
                          <StarRating rating={member.stats.evaRating} color="#38bdf8" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Engineering:</span>
                          <StarRating rating={member.stats.engineering} color="#f59e0b" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Life Support:</span>
                          <StarRating rating={member.stats.lifeSupport} color="#10b981" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Medical:</span>
                          <StarRating rating={member.stats.medical} color="#ec4899" />
                        </div>
                      </div>

                      {/* Emergency Role & Repairs Conducted */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                        <span>Career Dose: {member.careerRadiationMSv.toFixed(1)} / 500 mSv</span>
                        <span className="text-emerald-400 font-bold">
                          Repairs: {member.repairsConducted}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: OVERALL TEAM VITALS */}
      {/* ========================================================= */}
      {activeTab === "team" && (
        <div className="flex flex-col gap-3 py-1">
          <StatRow
            icon={<Heart size={12} className="text-pink-400" />}
            label="Average Crew Morale"
            kidLabel="Crew Happiness 😊"
            value={crew.morale}
            max={100}
            kidMode={kidMode}
          />

          <StatRow
            icon={<Wind size={12} className="text-sky-400" />}
            label="Closed-Loop O₂ Buffer"
            kidLabel="Fresh Air Buffer 🌬️"
            value={crew.oxygenBufferPercent}
            max={100}
            kidMode={kidMode}
          />

          <StatRow
            icon={<Apple size={12} className="text-green-400" />}
            label="Hydroponic Food Reserves"
            kidLabel="Food Supply 🥗"
            value={crew.foodReserveDays}
            max={30}
            unit=" days"
            kidMode={kidMode}
          />

          {/* Expedition Radiation */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Zap size={12} className="text-yellow-400" />
                <span>{kidMode ? "Mission Radiation Absorbed" : "Expedition Radiation Dose"}</span>
              </div>
              <span
                className="font-bold"
                style={{
                  color:
                    radiationPct > 70 ? "#ef4444" : radiationPct > 40 ? "#eab308" : "#10b981",
                }}
              >
                {crew.radiationExposureMSv.toFixed(2)}
                <span className="text-slate-400 font-normal ml-0.5">mSv</span>
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor:
                    radiationPct > 70 ? "#ef4444" : radiationPct > 40 ? "#eab308" : "#10b981",
                }}
                animate={{ width: `${radiationPct}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 30 }}
              />
            </div>
            <p className="text-[10px] text-slate-500 text-right font-mono">
              Expedition Safe Threshold: {crew.safeRadiationLimitMSv} mSv
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: RECENT CREW MORALE EVENTS & HEROISM */}
      {/* ========================================================= */}
      {activeTab === "events" && (
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {events.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4 font-mono">
              No emergency repairs or major incidents logged yet.
            </p>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className={`p-3 rounded-xl border text-xs flex flex-col gap-1 ${
                  evt.type === "sacrifice"
                    ? "bg-red-950/40 border-red-500/40"
                    : evt.type === "heroic"
                    ? "bg-cyan-950/40 border-cyan-500/40"
                    : "bg-slate-900/60 border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold font-mono">
                    <span>{evt.roleIcon}</span>
                    <span className="text-white">{evt.crewMemberName}</span>
                    <span className="text-slate-400 font-normal text-[10px]">
                      · Sol {evt.sol}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      evt.moraleDelta >= 0
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {evt.moraleDelta >= 0 ? `+${evt.moraleDelta}` : evt.moraleDelta} Morale
                  </span>
                </div>
                <h5 className="font-bold text-cyan-200 text-xs mt-0.5">{evt.title}</h5>
                <p className="text-slate-300 text-[11px] leading-relaxed">{evt.narrative}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
