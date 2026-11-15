// ============================================================
// Flight Panel sound engine (design system v3 · section 07).
// Synthesised live with Web Audio — no files, works offline.
//
//   sfx.play('tick')      every MW step / UI press
//   sfx.play('commit')    Run Day pressed
//   sfx.play('chime')     good day report, achievement unlocked
//   sfx.play('caution')   a value enters caution
//   sfx.play('alarm')     a value goes critical
//   sfx.play('victory')   Day 10 survived, rank promotion
//
// Silenced by: Settings.sfx = false, the legacy global mute
// (utils/soundEffects), or no user gesture yet (autoplay policy).
// ============================================================

import { getSettings } from '../game/progress';
import { soundEffects } from '../../utils/soundEffects';

export type SoundId = 'tick' | 'commit' | 'chime' | 'caution' | 'alarm' | 'victory';

export const SOUNDS: ReadonlyArray<{ id: SoundId; name: string; spec: string; use: string }> = [
  { id: 'tick', name: 'Slider tick', spec: 'Sine 1200 → 800 Hz · 50 ms', use: 'Every MW step' },
  { id: 'commit', name: 'Commit', spec: 'Sine drop 180 → 60 Hz', use: 'Run Day pressed' },
  { id: 'chime', name: 'Day advance', spec: 'D5 · A5 · D6 arpeggio', use: 'A good day report' },
  { id: 'caution', name: 'Caution', spec: 'Square 660 Hz × 2', use: 'A value enters caution' },
  { id: 'alarm', name: 'Master alarm', spec: 'Sawtooth 440 ↔ 880 Hz', use: 'A value goes critical' },
  { id: 'victory', name: 'Mission complete', spec: 'Major 9th arpeggio', use: 'Day 10 survived' },
];

/** Minimum gap between repeats of the same sound, so drags and award bursts don't machine-gun. */
const MIN_GAP: Record<SoundId, number> = { tick: 30, commit: 200, chime: 200, caution: 300, alarm: 800, victory: 1000 };

class SoundEngine {
  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private lastAt: Partial<Record<SoundId, number>> = {};
  private playing: { id: SoundId; until: number } | null = null;

  /** True when a sound would actually be heard right now. */
  canPlay(): boolean {
    if (typeof window === 'undefined') return false;
    if (!getSettings().sfx || soundEffects.getIsMuted()) return false;
    const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
    return ua ? ua.hasBeenActive : !!this.ac;
  }

  private ctx(): AudioContext | null {
    if (!this.ac) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ac = new AC();
      this.master = this.ac.createGain();
      this.analyser = this.ac.createAnalyser();
      this.analyser.fftSize = 2048;
      this.master.connect(this.analyser);
      this.analyser.connect(this.ac.destination);
    }
    if (this.ac.state === 'suspended') void this.ac.resume();
    this.master!.gain.value = 0.22 * soundEffects.getSfxVolume();
    return this.ac;
  }

  private tone(type: OscillatorType, f0: number, f1: number, t0: number, dur: number, gain = 0.6) {
    const ac = this.ac!, o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.master!);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  /**
   * Play a sound. `pitch` (0–1) nudges the tick up the scale so a slider sweep is audible.
   * `force` skips the settings/mute check (preview buttons in Settings).
   */
  play(id: SoundId, opts: { pitch?: number; force?: boolean } = {}): void {
    if (!opts.force && !this.canPlay()) return;
    const now = performance.now();
    if (now - (this.lastAt[id] ?? -1e9) < MIN_GAP[id]) return;
    this.lastAt[id] = now;
    const ac = this.ctx();
    if (!ac) return;
    const t = ac.currentTime + 0.02;
    let len = 0.4;
    switch (id) {
      case 'tick': { const k = 1 + (opts.pitch ?? 0.5) * 0.3 - 0.15; this.tone('sine', 1200 * k, 800 * k, t, 0.05, 0.5); len = 0.3; break; }
      case 'commit': this.tone('sine', 180, 60, t, 0.35, 0.8); this.tone('triangle', 360, 120, t, 0.2, 0.3); len = 0.5; break;
      case 'chime': [587.33, 880, 1174.66].forEach((f, i) => this.tone('triangle', f, 0, t + i * 0.12, 0.5, 0.5)); len = 0.9; break;
      case 'caution': this.tone('square', 660, 0, t, 0.12, 0.25); this.tone('square', 660, 0, t + 0.25, 0.12, 0.25); len = 0.5; break;
      case 'alarm': for (let i = 0; i < 6; i++) this.tone('sawtooth', i % 2 ? 880 : 440, 0, t + i * 0.18, 0.16, 0.3); len = 1.2; break;
      case 'victory': [523.25, 659.25, 783.99, 987.77, 1174.66].forEach((f, i) => this.tone('triangle', f, 0, t + i * 0.09, 0.9, 0.4)); len = 1.4; break;
    }
    this.playing = { id, until: now + len * 1000 };
  }

  /** Which sound is sounding right now (for oscilloscope labels / pressed states). */
  nowPlaying(): SoundId | null {
    return this.playing && performance.now() < this.playing.until ? this.playing.id : null;
  }

  /** Analyser on the master bus, or null before the first sound. Read with getByteTimeDomainData. */
  getAnalyser(): AnalyserNode | null { return this.analyser; }
}

export const sfx = new SoundEngine();
