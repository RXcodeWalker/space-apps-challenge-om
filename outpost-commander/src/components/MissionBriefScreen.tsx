// ============================================================
// MissionBriefScreen — environment + mission selection screen
// ============================================================
import { motion } from "framer-motion";
import { Rocket, Info } from "lucide-react";
import type { MissionEnvironment } from "../data/nasaConstants";
import { LUNAR_SOUTH_POLE, MARS_GALE_CRATER } from "../data/nasaConstants";

interface MissionBriefScreenProps {
  onStart: (environment: MissionEnvironment) => void;
  onShowNasaData: (environment: MissionEnvironment) => void;
}

const environments = [LUNAR_SOUTH_POLE, MARS_GALE_CRATER];

export default function MissionBriefScreen({ onStart, onShowNasaData }: MissionBriefScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Starfield backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1 + "px",
              height: Math.random() * 2 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.7 + 0.1,
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 max-w-3xl w-full flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl">🚀</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Outpost Commander
          </h1>
          <p className="text-lg text-blue-300 font-semibold mt-1">
            Junior Astronaut Mission Trainer
          </p>
          <p className="text-sm text-slate-400 mt-2">by Team The Event Horizons · NASA Space Apps Challenge</p>
        </div>

        {/* Description */}
        <div className="glass-panel p-5 text-center max-w-xl">
          <p className="text-sm text-slate-300 leading-relaxed">
            Run a real lunar or Martian outpost over{" "}
            <strong className="text-white">10 turns</strong>! Allocate power
            between three critical systems each turn, survive solar storms and
            dust events, and bring your crew home safe. All science data comes
            from real NASA missions! 🛸
          </p>
        </div>

        {/* Environment cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          {environments.map((env) => (
            <motion.div
              key={env.id}
              className="glass-panel p-5 flex flex-col gap-4 cursor-pointer hover:border-blue-500/40 transition-all group"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-4xl">{env.emoji}</span>
                <div>
                  <h2 className="font-black text-lg text-white">{env.name}</h2>
                  <p className="text-xs text-slate-400">{env.subtitle}</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                {env.kidSummary}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-slate-500 mb-0.5">Solar Efficiency</p>
                  <p className="font-bold text-emerald-300">
                    {Math.round(env.baselineSolarEfficiency * 100)}%
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-slate-500 mb-0.5">Daily Radiation</p>
                  <p className="font-bold text-orange-300">
                    {env.baselineDailyRadiationMSv} mSv/day
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onStart(env)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
                >
                  <Rocket size={15} />
                  Launch Mission
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onShowNasaData(env); }}
                  className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-blue-300 rounded-xl transition-colors"
                  title="View NASA Data Sources"
                >
                  <Info size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-600 text-center">
          Ages 7–12 · No login required · Science grounded in real NASA mission data
        </p>
      </motion.div>
    </div>
  );
}
