// ============================================================
// CrewCommsBubble.tsx — Dynamic Comic-Style Radio Comms Bubble
// Features:
// 1. Comic-style speech bubble with authentic aerospace radio styling
// 2. Scanline raster overlay & pulsing green transmission LED dot
// 3. Typewriter text animation with click-to-skip
// 4. Astronaut avatar, role badge icon, callsign, and name
// 5. Automatic subtle radio squelch via soundEffects.ts
// 6. Non-intrusive, auto-dismiss with progress bar & one-click dismiss
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  Zap,
  HeartPulse,
  Hammer,
  Radio,
  X,
  Volume2,
} from "lucide-react";
import type { CommsDialogue } from "../data/crewDialogue";
import { soundEffects } from "../utils/soundEffects";

interface CrewCommsBubbleProps {
  dialogue: CommsDialogue | null;
  onDismiss: () => void;
  autoDismissMs?: number; // default 8500ms
  className?: string;
}

export default function CrewCommsBubble({
  dialogue,
  onDismiss,
  autoDismissMs = 8500,
  className = "",
}: CrewCommsBubbleProps) {
  const [displayedText, setDisplayedText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(100);
  const lastDialogueIdRef = useRef<string | null>(null);

  // Play radio squelch and start typewriter when a new dialogue arrives
  useEffect(() => {
    if (!dialogue) {
      setDisplayedText("");
      setIsTyping(false);
      lastDialogueIdRef.current = null;
      return;
    }

    // Only play audio and re-type if the dialogue has actually changed
    if (dialogue.id !== lastDialogueIdRef.current) {
      lastDialogueIdRef.current = dialogue.id;
      soundEffects.playRadioSquelch();
      setDisplayedText("");
      setIsTyping(true);
      setProgress(100);
    }
  }, [dialogue]);

  // Typewriter effect
  useEffect(() => {
    if (!dialogue || !isTyping) return;

    const fullMessage = dialogue.message;
    if (displayedText.length < fullMessage.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullMessage.slice(0, displayedText.length + 1));
      }, 18); // 18ms per character for snappy comic cadence
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [dialogue, displayedText, isTyping]);

  // Auto-dismiss countdown timer with pause on hover
  useEffect(() => {
    if (!dialogue || isPaused) return;

    const stepMs = 50;
    const decrement = (stepMs / autoDismissMs) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= decrement) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - decrement;
      });
    }, stepMs);

    return () => clearInterval(interval);
  }, [dialogue, isPaused, autoDismissMs, onDismiss]);

  if (!dialogue) return null;

  const { speaker, tone } = dialogue;

  // Icon mapping
  const renderBadgeIcon = () => {
    switch (speaker.badgeIcon) {
      case "Leaf":
        return <Leaf className="w-3.5 h-3.5 text-emerald-300" />;
      case "Zap":
        return <Zap className="w-3.5 h-3.5 text-amber-300" />;
      case "HeartPulse":
        return <HeartPulse className="w-3.5 h-3.5 text-pink-300" />;
      case "Hammer":
        return <Hammer className="w-3.5 h-3.5 text-cyan-300" />;
      default:
        return <Radio className="w-3.5 h-3.5 text-cyan-300" />;
    }
  };

  // Skip typing or dismiss on card click
  const handleBubbleClick = () => {
    if (isTyping) {
      setDisplayedText(dialogue.message);
      setIsTyping(false);
    } else {
      onDismiss();
    }
  };

  const handleReplayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playRadioSquelch();
  };

  const handleManualDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss();
  };

  // Tone badge formatting
  const toneLabel =
    tone === "urgent"
      ? "PRIORITY ALERT"
      : tone === "warning"
      ? "ADVISORY"
      : tone === "positive"
      ? "TELEMETRY OPTIMAL"
      : "INCOMING TRANSMISSION";

  const toneBg =
    tone === "urgent"
      ? "bg-rose-950/80 border-rose-500/60 text-rose-300"
      : tone === "warning"
      ? "bg-amber-950/80 border-amber-500/60 text-amber-300"
      : tone === "positive"
      ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-300"
      : "bg-cyan-950/80 border-cyan-500/60 text-cyan-300";

  return (
    <AnimatePresence>
      <motion.div
        key={dialogue.id}
        initial={{ opacity: 0, y: -12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onClick={handleBubbleClick}
        className={`relative z-30 w-full cursor-pointer select-none ${className}`}
        role="region"
        aria-live="polite"
        title="Click to skip typing / dismiss"
      >
        <div
          className="relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-[#0B132B]/95 via-[#0D1B2A]/95 to-[#080E1C]/95 backdrop-blur-md shadow-2xl p-3 sm:p-4 transition-all hover:brightness-105"
          style={{
            borderColor: speaker.color,
            boxShadow: `0 10px 25px -5px ${speaker.color}35, 0 0 15px 0 ${speaker.color}20`,
          }}
        >
          {/* Authentic Radio Scanlines Effect Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay z-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.07) 0px, rgba(255, 255, 255, 0.07) 1px, transparent 1px, transparent 3px)",
            }}
          />

          {/* Comic Radio Top Bar */}
          <div className="relative z-20 flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10 text-xs">
            {/* LED Status and Channel */}
            <div className="flex items-center gap-2">
              {/* Pulsing Green LED indicator */}
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
              </span>

              <span className="font-mono font-bold text-[10px] tracking-wider text-emerald-400 uppercase">
                COMMS ACTIVE
              </span>
              <span className="text-slate-600 font-mono hidden xs:inline">•</span>
              <span className="font-mono text-[10px] text-slate-400 font-semibold hidden xs:inline">
                {speaker.channel}
              </span>
            </div>

            {/* Right Header: Tone Pill & Controls */}
            <div className="flex items-center gap-2">
              <span
                className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${toneBg}`}
              >
                {toneLabel}
              </span>

              {/* Squelch Replay Button */}
              <button
                type="button"
                onClick={handleReplayAudio}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-cyan-300 transition-colors"
                title="Replay Radio Audio Squelch"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={handleManualDismiss}
                className="p-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                title="Dismiss transmission"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Comic Message Body: Avatar + Astronaut Identity + Typewriter Speech */}
          <div className="relative z-20 flex items-start gap-3">
            {/* Astronaut Avatar / Role Badge */}
            <div className="relative shrink-0">
              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-2xl border-2 shadow-inner"
                style={{
                  backgroundColor: `${speaker.color}20`,
                  borderColor: speaker.color,
                }}
              >
                {speaker.avatar}
              </div>
              <div
                className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-900 border border-white/20"
                style={{ backgroundColor: "#0f172a" }}
              >
                {renderBadgeIcon()}
              </div>
            </div>

            {/* Speaker Info & Comic Speech Dialogue */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-black text-sm text-white tracking-wide font-sans">
                  {speaker.name}
                </span>
                <span
                  className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded"
                  style={{
                    backgroundColor: `${speaker.color}25`,
                    color: speaker.color,
                  }}
                >
                  {speaker.role}
                </span>
                <span className="text-[10px] font-mono text-slate-400 italic hidden sm:inline">
                  "{speaker.callsign}"
                </span>
              </div>

              {/* Typewriter text with animated terminal caret */}
              <p className="text-xs sm:text-sm font-medium text-slate-100 leading-snug tracking-tight">
                <span className="font-sans italic">"{displayedText}"</span>
                {isTyping && (
                  <span
                    className="inline-block w-1.5 h-3.5 ml-1 align-middle bg-cyan-400 animate-pulse"
                    style={{ backgroundColor: speaker.color }}
                  />
                )}
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1.5">
                <span className="text-slate-400 hover:text-slate-300">
                  {isTyping ? "Click to complete..." : "Click anywhere to dismiss"}
                </span>
                <span className="text-[9px] text-slate-400 hidden sm:inline">
                  NASA Habitat Subspace Link
                </span>
              </div>
            </div>
          </div>

          {/* Auto-Dismiss Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden">
            <div
              className="h-full transition-all ease-linear"
              style={{
                width: `${progress}%`,
                backgroundColor: speaker.color,
              }}
            />
          </div>
        </div>

        {/* Comic Speech Bubble Callout Tail pointing down toward Habitat Visualizer */}
        <div className="flex justify-center -mt-0.5">
          <div
            className="w-4 h-2.5 [clip-path:polygon(0_0,100%_0,50%_100%)]"
            style={{ backgroundColor: speaker.color }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
