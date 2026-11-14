// ============================================================
// AmbientAudioModal.tsx — NASA Outpost Space Audio & Telemetry Deck
// Procedural audio controls for ambient drones, life support hum,
// airlock pressure hiss, and real-time Geiger radiation spikes.
// ============================================================
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Radio,
  Wind,
  ShieldAlert,
  Activity,
  Sliders,
  Sparkles,
  X,
  Info,
} from "lucide-react";
import { useAmbientAudio } from "../utils/ambientAudio";
import { soundEffects } from "../utils/soundEffects";

interface AmbientAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  environmentName?: string;
}

export default function AmbientAudioModal({
  isOpen,
  onClose,
  environmentName = "Lunar South Pole",
}: AmbientAudioModalProps) {
  const {
    settings,
    cpm,
    isMuted,
    setAmbientVolume,
    toggleSoundtrack,
    toggleLifeSupport,
    toggleAirlock,
    toggleGeiger,
    triggerAirlock,
    triggerGeigerBurst,
    toggleMute,
  } = useAmbientAudio();

  const [sfxVol, setSfxVol] = React.useState<number>(() => soundEffects.getSfxVolume());

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSfxVol(val);
    soundEffects.setSfxVolume(val);
    soundEffects.playSliderClick(val * 100);
  };

  const handleAmbientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setAmbientVolume(val);
  };

  if (!isOpen) return null;

  const isRadiationElevated = cpm > 120;
  const isRadiationCritical = cpm > 300;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-slate-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
                <Sliders className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-100 font-mono tracking-wide">
                    ACOUSTIC TELEMETRY & AMBIENT AUDIO
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    ZERO-MP3 SYNTH
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Real-time procedural Web Audio soundscapes for {environmentName}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title="Close Deck"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="overflow-y-auto px-5 py-4 space-y-5 text-sm">
            {/* Master Audio Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    toggleMute();
                    soundEffects.playButtonClick();
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                    isMuted
                      ? "bg-rose-950/50 border-rose-600/50 text-rose-300 hover:bg-rose-900/50"
                      : "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40"
                  }`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>{isMuted ? "SYSTEM MUTED" : "AUDIO ACTIVE"}</span>
                </button>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {isMuted ? "All sound paused" : "Master audio bus online"}
                </span>
              </div>

              {/* Live Radiation CPM Indicator */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-xs ${
                  isRadiationCritical
                    ? "bg-rose-950/50 border-rose-500 text-rose-300 animate-pulse"
                    : isRadiationElevated
                    ? "bg-amber-950/40 border-amber-500/50 text-amber-300"
                    : "bg-cyan-950/40 border-cyan-500/30 text-cyan-300"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>GEIGER:</span>
                <span className="font-bold">{cpm} CPM</span>
                <span className="text-[10px] text-slate-400 uppercase">
                  {isRadiationCritical ? "CRITICAL" : isRadiationElevated ? "ELEVATED" : "NOMINAL"}
                </span>
              </div>
            </div>

            {/* Volume Mix Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Ambient Volume */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    Ambient Space Audio
                  </span>
                  <span className="text-cyan-400 font-bold">
                    {Math.round(settings.ambientVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.ambientVolume}
                  onChange={handleAmbientChange}
                  disabled={isMuted}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
                />
                <p className="text-[11px] text-slate-400">
                  Drones, life support hum, airlock venting & Geiger
                </p>
              </div>

              {/* SFX Volume */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    UI Clicks & Chimes
                  </span>
                  <span className="text-amber-400 font-bold">{Math.round(sfxVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxVol}
                  onChange={handleSfxChange}
                  disabled={isMuted}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 disabled:opacity-40"
                />
                <p className="text-[11px] text-slate-400">
                  Tactile slider clicks, turn chimes & incident alerts
                </p>
              </div>
            </div>

            {/* 4 Procedural Sound Generators Deck */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>Procedural Audio Generators</span>
                <span className="h-px flex-1 bg-slate-800"></span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Generative Space Drone */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    settings.soundtrackEnabled
                      ? "bg-slate-950/80 border-cyan-500/40"
                      : "bg-slate-950/30 border-slate-800 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
                        <Radio className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold font-mono text-slate-200">
                          Sci-Fi Space Drone
                        </div>
                        <div className="text-[10px] text-cyan-400 font-mono">
                          Modal Aerospace Chords
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toggleSoundtrack();
                        soundEffects.playButtonClick();
                      }}
                      disabled={isMuted}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-bold border transition-colors ${
                        settings.soundtrackEnabled
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {settings.soundtrackEnabled ? "ON" : "OFF"}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                    Procedural polyphonic ambient pads evolving in real time with open 5ths & 9ths.
                  </p>
                </div>

                {/* 2. Life Support Hum */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    settings.lifeSupportEnabled
                      ? "bg-slate-950/80 border-emerald-500/40"
                      : "bg-slate-950/30 border-slate-800 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold font-mono text-slate-200">
                          Life Support Hum
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono">
                          55Hz Sub-Bass + LFO
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toggleLifeSupport();
                        soundEffects.playButtonClick();
                      }}
                      disabled={isMuted}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-bold border transition-colors ${
                        settings.lifeSupportEnabled
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {settings.lifeSupportEnabled ? "ON" : "OFF"}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                    Re-creates ECLSS ventilation pumps. Modulates dynamically with life support
                    health and power.
                  </p>
                </div>

                {/* 3. Airlock Pressure Hiss */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    settings.airlockEnabled
                      ? "bg-slate-950/80 border-sky-500/40"
                      : "bg-slate-950/30 border-slate-800 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-sky-950/60 text-sky-400 border border-sky-500/30">
                        <Wind className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold font-mono text-slate-200">
                          Airlock Pressure Hiss
                        </div>
                        <div className="text-[10px] text-sky-400 font-mono">
                          Pneumatic Valve Sweep
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          triggerAirlock(1.0);
                          soundEffects.playButtonClick();
                        }}
                        disabled={isMuted || !settings.airlockEnabled}
                        className="px-2 py-1 rounded text-[10px] font-mono bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-600/40 transition-colors disabled:opacity-40"
                        title="Test valve release"
                      >
                        Vent
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          toggleAirlock();
                          soundEffects.playButtonClick();
                        }}
                        disabled={isMuted}
                        className={`px-2 py-1 rounded text-[11px] font-mono font-bold border transition-colors ${
                          settings.airlockEnabled
                            ? "bg-sky-500/20 text-sky-300 border-sky-500/50"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {settings.airlockEnabled ? "ON" : "OFF"}
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                    Pink-noise bandpass equalization sweeps simulate cyclical airlock pressure seals
                    and venting.
                  </p>
                </div>

                {/* 4. Geiger Counter Clicks */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    settings.geigerEnabled
                      ? "bg-slate-950/80 border-amber-500/40"
                      : "bg-slate-950/30 border-slate-800 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-500/30">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold font-mono text-slate-200">
                          Geiger Radiation Clicks
                        </div>
                        <div className="text-[10px] text-amber-400 font-mono">
                          Poisson-Distributed Particles
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          triggerGeigerBurst(2.5, 95);
                          soundEffects.playButtonClick();
                        }}
                        disabled={isMuted || !settings.geigerEnabled}
                        className="px-2 py-1 rounded text-[10px] font-mono bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-600/40 transition-colors disabled:opacity-40"
                        title="Simulate Solar Flare Spike"
                      >
                        Spike
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          toggleGeiger();
                          soundEffects.playButtonClick();
                        }}
                        disabled={isMuted}
                        className={`px-2 py-1 rounded text-[11px] font-mono font-bold border transition-colors ${
                          settings.geigerEnabled
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {settings.geigerEnabled ? "ON" : "OFF"}
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                    Impulse clicks accelerate during Solar Storms or when radiation shielding is
                    starved of power.
                  </p>
                </div>
              </div>
            </div>

            {/* NASA Science Note */}
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3 text-xs text-slate-300">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono font-bold text-cyan-300">NASA ACOUSTICS FACT: </span>
                While space is a vacuum, astronauts inside the habitat experience continuous internal
                sounds conducted through pressurized atmosphere and habitat structures — primarily
                50–60 dB life support pumps, pressure equalization vents, and ionization detector
                instrumentation.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              Web Audio API · Real-Time Dynamic DSP
            </span>
            <button
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
