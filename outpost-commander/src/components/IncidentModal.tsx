// ============================================================
// IncidentModal.tsx — Outpost Commander Dynamic NASA Incident Modal
// Presents location-specific mid-mission hazards, real NASA instrument
// science, and engineering trade-off decisions.
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
} from "lucide-react";
import type { IncidentCard, IncidentChoice } from "../data/incidentCards";
import { soundEffects } from "../utils/soundEffects";

interface IncidentModalProps {
  incident: IncidentCard;
  isOpen: boolean;
  onSelectChoice: (choice: IncidentChoice) => void;
}

export default function IncidentModal({
  incident,
  isOpen,
  onSelectChoice,
}: IncidentModalProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>(
    incident.choices[0]?.id || ""
  );

  useEffect(() => {
    if (isOpen) {
      soundEffects.playIncidentAlert();
    }
  }, [isOpen]);

  const selectedChoice =
    incident.choices.find((c) => c?.id === selectedChoiceId) ||
    incident.choices[0];

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
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-3xl rounded-3xl bg-[#090D16] border-2 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto ${
            incident.severity === "critical"
              ? "border-red-500/40 shadow-red-950/50"
              : incident.severity === "warning"
              ? "border-amber-500/40 shadow-amber-950/50"
              : "border-cyan-500/40 shadow-cyan-950/50"
          }`}
        >
          {/* Subtle Top Alert Bar */}
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
                : "MARS // GALE CRATER"}
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

          {/* Modal Body: NASA Science & Decision Choices */}
          <div className="overflow-y-auto p-5 sm:p-6 flex flex-col gap-5">
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

            {/* ACTION CHOICES */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
                  Select Commander Directive (1 Choice Required)
                </label>
                <span className="text-[11px] text-cyan-400 font-mono">
                  {incident.choices.filter(Boolean).length} Options Available
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {incident.choices.map((choice) => {
                  if (!choice) return null;
                  const isSelected = selectedChoice?.id === choice.id;

                  return (
                    <motion.button
                      key={choice.id}
                      type="button"
                      whileHover={{ scale: 1.008 }}
                      whileTap={{ scale: 0.992 }}
                      onClick={() => setSelectedChoiceId(choice.id)}
                      className={`text-left p-4 rounded-2xl border-2 transition-all relative ${
                        isSelected
                          ? "bg-blue-950/60 border-cyan-400 shadow-lg shadow-cyan-950/40"
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
                            <h3 className="text-sm font-black text-white">
                              {choice.label}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed mt-1">
                            {choice.description}
                          </p>

                          {/* Trade-off pill */}
                          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono">
                            <span className="text-amber-400 font-bold">Trade-Off:</span>
                            <span className="text-slate-200">
                              {choice.tradeOffSummary}
                            </span>
                          </div>
                        </div>

                        {/* Radio selection circle */}
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-colors ${
                            isSelected
                              ? "border-cyan-400 bg-cyan-500 text-slate-950"
                              : "border-slate-600 bg-transparent"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Decisions directly impact resource telemetry and mission evaluation.</span>
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!selectedChoice}
              onClick={() => {
                if (selectedChoice) {
                  onSelectChoice(selectedChoice);
                }
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 disabled:opacity-50"
            >
              <span>Execute Engineering Order</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
