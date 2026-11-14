// ============================================================
// IncidentModal.tsx — Outpost Commander Dynamic NASA Incident Modal
// Presents location-specific mid-mission hazards, real NASA instrument
// science, engineering trade-off decisions, and optional
// Emergency Crew Specialist repair assignments (Risk vs. Reward).
// ============================================================
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Info,
  Radio,
  CheckCircle2,
  Users,
  Shield,
} from "lucide-react";
import type { IncidentCard, IncidentChoice } from "../data/incidentCards";
import type { FlightDirectorInterventionResult } from "../types/intervention";
import FlightDirectorIntervention from "./interventions/FlightDirectorIntervention";
import {
  type CrewRoleId,
  type CrewMember,
  type SpecialistRepairOption,
  INCIDENT_SPECIALIST_REPAIRS,
} from "../data/crewData";
import { soundEffects } from "../utils/soundEffects";

interface IncidentModalProps {
  incident: IncidentCard;
  isOpen: boolean;
  crewMembers?: CrewMember[];
  onSelectChoice: (
    choice: IncidentChoice,
    specialistRepair?: SpecialistRepairOption,
    interventionResult?: FlightDirectorInterventionResult
  ) => void;
}

export default function IncidentModal({
  incident,
  isOpen,
  crewMembers = [],
  onSelectChoice,
}: IncidentModalProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>(
    incident.choices[0]?.id || ""
  );

  // Crew Specialist Assignment State: "none" or one of the 4 roles
  const [selectedSpecialistRole, setSelectedSpecialistRole] = useState<CrewRoleId | "none">("none");

  // 15-Second Flight Director Tactical Intervention State
  const [interventionResult, setInterventionResult] =
    useState<FlightDirectorInterventionResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      soundEffects.playIncidentAlert();
      setSelectedSpecialistRole("none");
      setSelectedChoiceId(incident.choices[0]?.id || "");
      setInterventionResult(null);
    }
  }, [isOpen, incident]);

  const selectedChoice =
    incident.choices.find((c) => c?.id === selectedChoiceId) ||
    incident.choices[0];

  const specialistRepairs = INCIDENT_SPECIALIST_REPAIRS[incident.id];
  const activeSpecialistRepair: SpecialistRepairOption | undefined =
    selectedSpecialistRole !== "none" && specialistRepairs
      ? specialistRepairs[selectedSpecialistRole]
      : undefined;

  const activeCrewMember = crewMembers.find((m) => m.role === selectedSpecialistRole);

  if (!isOpen || !incident) return null;

  const severityBadge =
    incident.severity === "critical"
      ? { label: "CRITICAL FLIGHT ALERT", bg: "bg-red-500/20 text-red-300 border-red-500/40" }
      : incident.severity === "warning"
      ? { label: "ENVIRONMENTAL HAZARD", bg: "bg-amber-500/20 text-amber-300 border-amber-500/40" }
      : { label: "MISSION OPPORTUNITY", bg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-3xl rounded-3xl bg-[#090D16] border-2 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto ${
            incident.severity === "critical"
              ? "border-red-500/40 shadow-red-950/50"
              : incident.severity === "warning"
              ? "border-amber-500/40 shadow-amber-950/50"
              : "border-cyan-500/40 shadow-cyan-950/50"
          }`}
        >
          {/* Top Alert Bar */}
          <div
            className={`w-full py-1.5 px-4 text-[11px] font-mono font-bold tracking-widest uppercase flex items-center justify-between border-b ${
              incident.severity === "critical"
                ? "bg-red-950/80 border-red-800/40 text-red-200"
                : incident.severity === "warning"
                ? "bg-amber-950/80 border-amber-800/40 text-amber-200"
                : "bg-cyan-950/80 border-cyan-800/40 text-cyan-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>INCOMING NASA TELEMETRY INCIDENT · SOL {incident.triggerSol}</span>
            </div>
            <span className="opacity-75">
              {incident.environmentId === "lunar_south_pole"
                ? "MOON // SHACKLETON RIM"
                : incident.environmentId === "mars_gale_crater"
                ? "MARS // GALE CRATER"
                : incident.environmentId === "europa_under_ice"
                ? "EUROPA // SUB-SURFACE OCEAN"
                : "TITAN // KRAKEN MARE"}
            </span>
          </div>

          {/* Modal Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${severityBadge.bg}`}
              >
                {severityBadge.label}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Sol {incident.triggerSol} of 10
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              {incident.severity === "critical" && (
                <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
              )}
              {incident.severity === "warning" && (
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
              )}
              {incident.severity === "opportunity" && (
                <Sparkles className="w-6 h-6 text-cyan-400 shrink-0" />
              )}
              <span>{incident.title}</span>
            </h2>

            <p className="text-xs sm:text-sm font-semibold text-cyan-300/90 mt-1">
              {incident.headline}
            </p>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
              {incident.description}
            </p>
          </div>

          {/* Modal Body: NASA Science, Directives & Crew Emergency Assignments */}
          <div className="overflow-y-auto p-5 sm:p-6 flex flex-col gap-6">
            {/* REAL NASA SCIENCE BADGE */}
            <div className="rounded-2xl bg-gradient-to-r from-blue-950/70 via-indigo-950/50 to-slate-900 border-2 border-blue-500/40 p-4 shadow-lg relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-md bg-blue-600 text-[10px] font-mono font-black uppercase tracking-wider text-white flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                    {incident.nasaScience.badgeTitle}
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-300">
                    {incident.nasaScience.mission}
                  </span>
                </div>
                {incident.nasaScience.dataSourceUrl && (
                  <a
                    href={incident.nasaScience.dataSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-blue-300 transition-colors p-1"
                    title="Open NASA reference"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <p className="text-xs font-mono font-semibold text-cyan-300 mb-1">
                Instrument: {incident.nasaScience.instrument}
              </p>
              <p className="text-xs text-slate-200 leading-relaxed">
                {incident.nasaScience.explanation}
              </p>
            </div>

            {/* FAST-PACED 15-SECOND FLIGHT DIRECTOR TACTICAL INTERVENTION */}
            <FlightDirectorIntervention
              incident={incident}
              onInterventionComplete={(res) => setInterventionResult(res)}
              activeResult={interventionResult}
            />

            {/* SECTION 1: PRIMARY COMMANDER DIRECTIVE */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>1. Base Engineering Directive (Required)</span>
                </label>
                <span className="text-[11px] text-cyan-400 font-mono">
                  {incident.choices.filter(Boolean).length} Options Available
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {incident.choices.map((choice) => {
                  if (!choice) return null;
                  const isSelected = selectedChoice?.id === choice.id;

                  return (
                    <motion.button
                      key={choice.id}
                      type="button"
                      whileHover={{ scale: 1.006 }}
                      whileTap={{ scale: 0.994 }}
                      onClick={() => {
                        soundEffects.playButtonClick();
                        setSelectedChoiceId(choice.id);
                      }}
                      className={`text-left p-3.5 rounded-2xl border-2 transition-all relative ${
                        isSelected
                          ? "bg-blue-950/60 border-cyan-400 shadow-md shadow-cyan-950/40"
                          : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                isSelected
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {choice.shortTag}
                            </span>
                            <h3 className="text-xs sm:text-sm font-black text-white">
                              {choice.label}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed mt-1">
                            {choice.description}
                          </p>

                          {/* Trade-off pill */}
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono">
                            <span className="text-amber-400 font-bold">Trade-Off:</span>
                            <span className="text-slate-200">
                              {choice.tradeOffSummary}
                            </span>
                          </div>
                        </div>

                        {/* Radio selection indicator */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-colors ${
                            isSelected
                              ? "border-cyan-400 bg-cyan-500 text-slate-950"
                              : "border-slate-600 bg-transparent"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: EMERGENCY CREW SPECIALIST REPAIR ASSIGNMENT */}
            {specialistRepairs && (
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>2. Emergency Crew Repair Assignment (Risk vs. Reward)</span>
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-600/40 text-emerald-300">
                    Commander Authorization
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  Authorize a specialist astronaut for immediate emergency intervention. Introduces a
                  tactical risk-vs-reward choice: high systemic rewards to the outpost at the expense
                  of individual astronaut radiation dose, physical injury, or morale shock.
                </p>

                {/* 5-Button Role Selector (Shelter + 4 Crew Roles) */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                  {/* Option 0: Safe Shelter / No Deployment */}
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setSelectedSpecialistRole("none");
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      selectedSpecialistRole === "none"
                        ? "bg-slate-800 border-cyan-400 shadow-md ring-1 ring-cyan-400/50"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Shield className="w-4 h-4 text-slate-300" />
                      <span className="text-xs font-bold text-white">Safe Shelter</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      No Crew Risk
                    </span>
                  </button>

                  {/* Option 1: Botanist */}
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setSelectedSpecialistRole("botanist");
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      selectedSpecialistRole === "botanist"
                        ? "bg-emerald-950/80 border-emerald-400 shadow-md ring-1 ring-emerald-400/50"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">🌱</span>
                      <span className="text-xs font-bold text-emerald-300 truncate">
                        Dr. Lin (Botanist)
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400/80 font-mono">
                      Crops & O₂
                    </span>
                  </button>

                  {/* Option 2: Power Engineer */}
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setSelectedSpecialistRole("power_engineer");
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      selectedSpecialistRole === "power_engineer"
                        ? "bg-amber-950/80 border-amber-400 shadow-md ring-1 ring-amber-400/50"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">⚡</span>
                      <span className="text-xs font-bold text-amber-300 truncate">
                        Cdr. Vance (Power)
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-400/80 font-mono">
                      Grid & Megawatts
                    </span>
                  </button>

                  {/* Option 3: Medical Officer */}
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setSelectedSpecialistRole("medical_officer");
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      selectedSpecialistRole === "medical_officer"
                        ? "bg-pink-950/80 border-pink-400 shadow-md ring-1 ring-pink-400/50"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">🩺</span>
                      <span className="text-xs font-bold text-pink-300 truncate">
                        Dr. Chen (Medical)
                      </span>
                    </div>
                    <span className="text-[10px] text-pink-400/80 font-mono">
                      Health & Morale
                    </span>
                  </button>

                  {/* Option 4: Geologist */}
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setSelectedSpecialistRole("geologist");
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      selectedSpecialistRole === "geologist"
                        ? "bg-sky-950/80 border-sky-400 shadow-md ring-1 ring-sky-400/50"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">🪨</span>
                      <span className="text-xs font-bold text-sky-300 truncate">
                        Dr. Rivera (EVA)
                      </span>
                    </div>
                    <span className="text-[10px] text-sky-400/80 font-mono">
                      Hull & Regolith
                    </span>
                  </button>
                </div>

                {/* SELECTED SPECIALIST REPAIR DETAIL CARD */}
                {activeSpecialistRepair ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-black border-2 border-emerald-500/50 flex flex-col gap-3 shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            SPECIALIST ACTION
                          </span>
                          <h4 className="text-sm font-black text-white">
                            {activeSpecialistRepair.actionTitle}
                          </h4>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-cyan-200 mt-1 italic">
                          "{activeSpecialistRepair.actionPrompt}"
                        </p>
                        <p className="text-xs text-slate-300 mt-1">
                          {activeSpecialistRepair.tacticalSummary}
                        </p>
                      </div>

                      {activeSpecialistRepair.isHighRiskWarning && (
                        <span className="px-2.5 py-1 rounded-lg bg-red-950 border border-red-500/60 text-red-300 font-mono text-[10px] font-bold shrink-0 animate-pulse flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          <span>HIGH FLUX EVA RISK</span>
                        </span>
                      )}
                    </div>

                    {/* DUAL RISK-VS-REWARD MATRIX */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {/* Reward Box */}
                      <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex flex-col gap-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                          <span>OUTPOST REWARD</span>
                        </span>
                        <p className="text-xs font-bold text-emerald-200">
                          {activeSpecialistRepair.rewardDescription}
                        </p>
                      </div>

                      {/* Risk Box */}
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex flex-col gap-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                          <span>PERSONAL CREW RISK</span>
                        </span>
                        <p className="text-xs font-bold text-rose-200">
                          {activeSpecialistRepair.riskDescription}
                        </p>
                      </div>
                    </div>

                    {/* Active Astronaut Current Vitals Pill */}
                    {activeCrewMember && (
                      <div className="flex items-center justify-between text-[11px] font-mono bg-black/50 p-2.5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 text-slate-300">
                          <span>{activeCrewMember.avatar}</span>
                          <span className="font-bold text-white">{activeCrewMember.name}</span>
                          <span className="text-slate-400">({activeCrewMember.roleTitle})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-400">Health: {activeCrewMember.health}%</span>
                          <span className="text-pink-400">Morale: {activeCrewMember.morale}%</span>
                          <span className="text-amber-400">Dose: {activeCrewMember.radiationDoseMSv.toFixed(2)} mSv</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-400 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      <strong>Safe Shelter Active:</strong> All 4 astronauts remain secured inside
                      radiation-shielded storm modules. Zero individual biological risk.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400 font-mono flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  {activeSpecialistRepair
                    ? `Deploying ${activeCrewMember?.name || "Astronaut"} to emergency repair.`
                    : "Automated systems protocol selected. No crew assigned to risk."}
                </span>
              </div>
              {interventionResult && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 w-fit ${
                    interventionResult.status === "success"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : interventionResult.status === "skipped"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-red-500/20 text-red-300 border border-red-500/40"
                  }`}
                >
                  <span>
                    Intervention:{" "}
                    {interventionResult.status === "success"
                      ? "Optimal Deflection / Grid Balanced"
                      : interventionResult.status === "skipped"
                      ? "Auto-Resolved (Cadet Mode)"
                      : "Breached"}
                  </span>
                </span>
              )}
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!selectedChoice}
              onClick={() => {
                if (selectedChoice) {
                  onSelectChoice(
                    selectedChoice,
                    activeSpecialistRepair,
                    interventionResult || undefined
                  );
                }
              }}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all ${
                activeSpecialistRepair
                  ? "bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 hover:brightness-110 text-white shadow-emerald-950/60"
                  : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-cyan-900/40"
              }`}
            >
              <span>
                {activeSpecialistRepair
                  ? `Authorize Order & Deploy ${activeCrewMember?.callsign || "Specialist"}`
                  : "Execute Engineering Directive"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
