// ============================================================
// soundEffects.ts — Native Web Audio API Sound Synthesizer
// Zero external MP3 files needed. Synthesizes subtle aerospace UI audio:
// 1. Subtle tactile clicks on power slider adjustments
// 2. Soft telemetry chime on Sol turn advance
// 3. Urgent alert pulse on Solar Storm / hazard incidents
// 4. Heroic victory chord on mission completion
// Includes persistent mute/unmute toggle state.
// ============================================================

const MUTE_STORAGE_KEY = "outpost_commander_muted";

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private listeners: Set<(muted: boolean) => void> = new Set();
  private lastSliderClickTime: number = 0;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(MUTE_STORAGE_KEY);
        this.isMuted = saved === "true";
      } catch {
        this.isMuted = false;
      }
    }
  }

  /**
   * Lazily initializes and resumes the Web Audio context upon user interaction
   */
  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, muted ? "true" : "false");
    } catch {
      // Ignore storage errors in restricted contexts
    }
    this.notifyListeners();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public subscribe(listener: (muted: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.isMuted));
  }

  /**
   * 1. Subtle, pleasant tactile UI click when adjusting power sliders or steppers
   * Throttled to max 25 clicks/sec to avoid distortion during rapid slider drags.
   */
  public playSliderClick(freqOffset: number = 0): void {
    if (this.isMuted) return;

    const now = performance.now();
    if (now - this.lastSliderClickTime < 35) return;
    this.lastSliderClickTime = now;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Short, high-tech sine pop
      const startFreq = 880 + Math.min(400, Math.max(-200, freqOffset * 6));
      osc.type = "sine";
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, ctx.currentTime + 0.02);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.022);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.025);
    } catch {
      // Graceful fallback if audio context fails
    }
  }

  /**
   * 2. Soft aerospace telemetry chime on Sol turn advance
   * Sings a smooth ascending tri-tone chime (D5 -> A5 -> D6)
   */
  public playTurnChime(): void {
    if (this.isMuted) return;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [
        { freq: 587.33, start: 0.0, duration: 0.35, gainVal: 0.12 }, // D5
        { freq: 880.0, start: 0.09, duration: 0.42, gainVal: 0.14 },  // A5
        { freq: 1174.66, start: 0.18, duration: 0.55, gainVal: 0.16 }, // D6
      ];

      notes.forEach(({ freq, start, duration, gainVal }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + start;
        const endTime = startTime + duration;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        // Soft attack to avoid clicks, then exponential decay
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(gainVal, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(endTime);
      });
    } catch {
      // Graceful fallback
    }
  }

  /**
   * 3. Alert pulse on Solar Storm / Environmental Hazards
   * Authentic dual-tone warning pulse (caution tone)
   */
  public playIncidentAlert(): void {
    if (this.isMuted) return;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Two quick urgent pulses: 880Hz + 740Hz
      const pulses = [
        { start: 0.0, duration: 0.11 },
        { start: 0.16, duration: 0.13 },
      ];

      pulses.forEach(({ start, duration }) => {
        const startTime = ctx.currentTime + start;
        const endTime = startTime + duration;

        // Tone 1
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sawtooth";
        osc1.frequency.setValueAtTime(880, startTime);

        // Tone 2
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(740, startTime);

        // Lowpass filter for smooth aerospace warning sound rather than harsh buzz
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1400, startTime);

        gain1.gain.setValueAtTime(0.09, startTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, endTime);

        gain2.gain.setValueAtTime(0.08, startTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, endTime);

        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(filter);
        gain2.connect(filter);
        filter.connect(ctx.destination);

        osc1.start(startTime);
        osc1.stop(endTime);
        osc2.start(startTime);
        osc2.stop(endTime);
      });
    } catch {
      // Graceful fallback
    }
  }

  /**
   * 4. Victory chord on mission completion
   * Warm, heroic sci-fi major 9th arpeggio with rich decay
   */
  public playVictoryChord(): void {
    if (this.isMuted) return;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // C Major 9th chord: C4 (261.63), G4 (392.00), C5 (523.25), E5 (659.25), G5 (783.99), B5 (987.77)
      const chord = [
        { freq: 261.63, start: 0.0, duration: 1.8, type: "sine" as OscillatorType, vol: 0.12 },
        { freq: 392.0, start: 0.08, duration: 1.7, type: "sine" as OscillatorType, vol: 0.11 },
        { freq: 523.25, start: 0.16, duration: 1.9, type: "sine" as OscillatorType, vol: 0.14 },
        { freq: 659.25, start: 0.24, duration: 2.1, type: "triangle" as OscillatorType, vol: 0.13 },
        { freq: 783.99, start: 0.32, duration: 2.3, type: "sine" as OscillatorType, vol: 0.15 },
        { freq: 987.77, start: 0.42, duration: 2.5, type: "sine" as OscillatorType, vol: 0.12 },
      ];

      chord.forEach(({ freq, start, duration, type, vol }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + start;
        const endTime = startTime + duration;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(endTime);
      });
    } catch {
      // Graceful fallback
    }
  }

  /**
   * General button interaction beep
   */
  public playButtonClick(): void {
    if (this.isMuted) return;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(640, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.045);
    } catch {
      // Graceful fallback
    }
  }
}

export const soundEffects = new SoundEffectsManager();

/**
 * React hook to listen to mute state changes
 */
import { useState, useEffect } from "react";

export function useSoundMuted(): [boolean, () => void] {
  const [muted, setLocalMuted] = useState<boolean>(() => soundEffects.getIsMuted());

  useEffect(() => {
    return soundEffects.subscribe((newVal) => setLocalMuted(newVal));
  }, []);

  const toggle = () => {
    soundEffects.toggleMute();
  };

  return [muted, toggle];
}
