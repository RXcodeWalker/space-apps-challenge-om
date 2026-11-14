// ============================================================
// NasaDataModal — "About the NASA Data" information modal
// ============================================================
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Satellite } from "lucide-react";
import type { MissionEnvironment } from "../data/nasaConstants";

interface NasaDataModalProps {
  environment: MissionEnvironment;
  isOpen: boolean;
  onClose: () => void;
}

export default function NasaDataModal({ environment, isOpen, onClose }: NasaDataModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl">
                    <Satellite size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">About the NASA Data</h2>
                    <p className="text-xs text-slate-400">
                      {environment.name} — {environment.subtitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Environment kid summary */}
              <div className="px-5 pt-4 pb-3">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-sm font-semibold text-blue-300 mb-1">
                    {environment.emoji} Kid-Friendly Overview
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">{environment.kidSummary}</p>
                </div>
              </div>

              {/* Citations */}
              <div className="overflow-y-auto px-5 pb-5 flex flex-col gap-4">
                {environment.citations.map((citation, i) => (
                  <div
                    key={i}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-100">{citation.datasetName}</p>
                        <p className="text-xs text-slate-400">{citation.missionInstrument}</p>
                      </div>
                      <a
                        href={citation.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-blue-400 shrink-0"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>

                    <div className="bg-black/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">
                        {citation.parameter}
                      </p>
                      <p className="text-sm font-mono text-emerald-300">{citation.value}</p>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-yellow-400 font-semibold mb-0.5">
                        🔭 What does this mean?
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {citation.kidFriendlyExplanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
