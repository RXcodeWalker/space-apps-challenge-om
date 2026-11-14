// ============================================================
// ambientAudio.ts — Procedural Sci-Fi Ambient Audio & Soundtrack Engine
// NASA Outpost Commander
//
// 100% Procedurally Synthesized via Web Audio API (Zero external audio files).
// Synthesizes 4 immersive layers:
// 1. Procedural Sci-Fi Space Drone Soundtrack (polyphonic evolving modal ambient chords)
// 2. Low-Frequency Life Support Hum (55Hz/110Hz ECLSS pumps, detuned beating, LFO filter)
// 3. Airlock Pressure Hiss & Valve Venting (pneumatic equalization sweeps & solenoid seals)
// 4. Geiger Counter Clicks (Poisson-distributed ionizing radiation impulses with live CPM)
//
// All layers react dynamically to NASA environment, radiation spikes, and subsystem health!
// ============================================================

import { soundEffects } from "./soundEffects";

const STORAGE_KEYS = {
  AMBIENT_VOLUME: "outpost_ambient_volume",
  DRONE_ENABLED: "outpost_ambient_drone_enabled",
  LIFESUPPORT_ENABLED: "outpost_ambient_lifesupport_enabled",
  AIRLOCK_ENABLED: "outpost_ambient_airlock_enabled",
  GEIGER_ENABLED: "outpost_ambient_geiger_enabled",
};

export interface AmbientAudioSettings {
  ambientVolume: number;        // 0.0 to 1.0 (master ambient balance)
  soundtrackEnabled: boolean;    // Ambient generative musical drone
  lifeSupportEnabled: boolean;   // ECLSS low-frequency hum
  airlockEnabled: boolean;       // Periodic pneumatic pressure release
  geigerEnabled: boolean;        // Ionizing radiation Geiger clicks
}

export interface AmbientTelemetry {
  environmentId: string;         // "lunar_south_pole" | "mars_gale_crater"
  radiationMultiplier: number;   // 1.0 = baseline; >1.0 = flare / SPE
  shieldingHealth: number;       // 0–100 %
  shieldingPowerRatio: number;   // 1.0 = nominal, <1.0 = power starved
  lifeSupportHealth: number;     // 0–100 %
  lifeSupportPowerRatio: number; // 1.0 = nominal, <1.0 = power starved
}

/**
 * Pre-computes 2.0s of stereo Pink Noise using Paul Kellet's refined 6-pole filter
 */
function createPinkNoiseBuffer(ctx: AudioContext, seconds: number = 2.0): AudioBuffer {
  const bufferSize = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }

  return buffer;
}

/**
 * Pre-computes an authentic 2.5ms biphasic Geiger-Müller ionization discharge impulse
 */
function createGeigerImpulseBuffer(ctx: AudioContext): AudioBuffer {
  const durationSec = 0.0028;
  const length = Math.floor(ctx.sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Sharp electrical discharge: fast initial spike, rapid negative overshoot, micro-ringing decay
  for (let i = 0; i < length; i++) {
    const t = i / ctx.sampleRate;
    const decay = Math.exp(-t * 2800);
    const wave = Math.sin(2 * Math.PI * 3200 * t) - 0.35 * Math.sin(2 * Math.PI * 6400 * t);
    data[i] = wave * decay;
  }

  return buffer;
}

// ============================================================
// 1. Procedural Sci-Fi Space Drone Soundtrack
// Continuous, meditative generative space ambient score.
// Crossfades between open modal aerospace chord voicings every 22 seconds.
// ============================================================
class SpaceDroneSoundtrack {
  private ctx: AudioContext;
  private destination: AudioNode;
  private masterGain: GainNode;
  private filter: BiquadFilterNode;
  private isRunning: boolean = false;
  private timerId: number | null = null;
  private currentVoiceIndex: number = 0;

  // Chord presets: Open 5ths, 9ths, suspended harmonics
  private lunarChords = [
    [73.42, 110.0, 220.0, 277.18, 329.63], // D2, A2, A3, C#4, E4 (Dmaj9 aerospace)
    [65.41, 98.0, 196.0, 261.63, 329.63],  // C2, G2, G3, C4, E4   (Cmaj7 wonder)
    [82.41, 123.47, 246.94, 329.63, 392.0],// E2, B2, B3, E4, G4   (Em9 deep vacuum)
    [58.27, 87.31, 174.61, 261.63, 349.23],// Bb1, F2, F3, C4, F4  (Bb sus2 expanse)
  ];

  private marsChords = [
    [65.41, 98.0, 196.0, 233.08, 311.13],  // C2, G2, G3, Bb3, Eb4 (Cm7 dusty dusk)
    [58.27, 87.31, 174.61, 233.08, 349.23],// Bb1, F2, F3, Bb3, F4 (Bbsus2 desert wind)
    [51.91, 77.78, 155.56, 233.08, 311.13],// Ab1, Eb2, Eb3, Bb3, Eb4 (Abmaj9 horizon)
    [73.42, 110.0, 220.0, 261.63, 329.63], // D2, A2, A3, C4, E4   (Dm9 Gale crater)
  ];

  private europaChords = [
    [46.25, 92.5, 185.0, 277.18, 369.99],  // F#1, F#2, F#3, C#4, F#4 (F#m deep ice abyssal)
    [73.42, 110.0, 220.0, 293.66, 369.99], // D2, A2, A3, D4, F#4    (Dmaj7 glacial blue)
    [61.74, 92.5, 185.0, 246.94, 369.99],  // B1, F#2, F#3, B3, F#4   (Bm9 ocean cavern)
    [55.0, 110.0, 220.0, 277.18, 329.63],  // A1, A2, A3, C#4, E4    (Amaj Jovian aura)
  ];

  private titanChords = [
    [48.99, 98.0, 196.0, 293.66, 349.23],  // G1, G2, G3, D4, F4     (Gm7 hydrocarbon lake)
    [38.89, 77.78, 155.56, 233.08, 311.13],// Eb1, Eb2, Eb3, Bb3, Eb4 (Ebmaj7 thick atmosphere)
    [65.41, 98.0, 196.0, 261.63, 311.13],  // C2, G2, G3, C4, Eb4    (Cm7 cryogenic methane)
    [43.65, 87.31, 174.61, 261.63, 349.23],// F1, F2, F3, C4, F4     (Fsus2 tholin dunes)
  ];

  private currentChordList = this.lunarChords;
  private activeNodes: { oscs: OscillatorNode[]; gain: GainNode }[] = [];

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.32, ctx.currentTime);

    // Warm aerospace lowpass filter: leaves room for UI sounds and speech
    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.setValueAtTime(480, ctx.currentTime);
    this.filter.Q.setValueAtTime(1.2, ctx.currentTime);

    this.masterGain.connect(this.filter);
    this.filter.connect(this.destination);
  }

  public setEnvironment(envId: string): void {
    if (envId === "europa_under_ice") {
      this.currentChordList = this.europaChords;
      this.filter.frequency.linearRampToValueAtTime(580, this.ctx.currentTime + 3.0);
    } else if (envId === "titan_hydrocarbon") {
      this.currentChordList = this.titanChords;
      this.filter.frequency.linearRampToValueAtTime(360, this.ctx.currentTime + 3.0);
    } else if (envId === "mars_gale_crater") {
      this.currentChordList = this.marsChords;
      this.filter.frequency.linearRampToValueAtTime(420, this.ctx.currentTime + 3.0);
    } else {
      this.currentChordList = this.lunarChords;
      this.filter.frequency.linearRampToValueAtTime(520, this.ctx.currentTime + 3.0);
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.spawnNextChord();
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }

    // Smoothly fade out active voices
    const now = this.ctx.currentTime;
    this.activeNodes.forEach(({ oscs, gain }) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0.0001, now + 1.2);
        setTimeout(() => {
          oscs.forEach((osc) => {
            try { osc.stop(); osc.disconnect(); } catch {}
          });
          gain.disconnect();
        }, 1300);
      } catch {}
    });
    this.activeNodes = [];
  }

  private spawnNextChord(): void {
    if (!this.isRunning) return;

    const chords = this.currentChordList;
    const chord = chords[this.currentVoiceIndex % chords.length];
    this.currentVoiceIndex++;

    const now = this.ctx.currentTime;
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, now);

    // Gentle 4.0s fade in
    voiceGain.gain.linearRampToValueAtTime(0.18, now + 4.5);
    // Hold for 14.0s
    voiceGain.gain.setValueAtTime(0.18, now + 18.5);
    // Gentle 4.5s fade out
    voiceGain.gain.linearRampToValueAtTime(0.0001, now + 23.0);

    const oscs: OscillatorNode[] = [];

    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      // Triangle on root and fifth for warmth; Sine on upper partials for crystalline shimmer
      osc.type = idx === 0 || idx === 1 ? "triangle" : "sine";
      // Subtle organic detuning (±0.4Hz) for rich analog phasing
      const detune = (Math.random() - 0.5) * 0.8;
      osc.frequency.setValueAtTime(freq + detune, now);

      osc.connect(voiceGain);
      osc.start(now);
      // Stop slightly after fade-out completes
      osc.stop(now + 23.5);
      oscs.push(osc);
    });

    voiceGain.connect(this.masterGain);

    const record = { oscs, gain: voiceGain };
    this.activeNodes.push(record);

    // Clean up record after chord completes
    setTimeout(() => {
      const idx = this.activeNodes.indexOf(record);
      if (idx !== -1) {
        this.activeNodes.splice(idx, 1);
        record.oscs.forEach((o) => {
          try { o.disconnect(); } catch {}
        });
        record.gain.disconnect();
      }
    }, 24000);

    // Schedule next chord crossfade
    this.timerId = window.setTimeout(() => {
      if (this.isRunning) {
        this.spawnNextChord();
      }
    }, 18000); // 5-second overlap crossfade
  }

  public setVolume(val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.masterGain.gain.linearRampToValueAtTime(clamped * 0.35, this.ctx.currentTime + 0.1);
  }
}

// ============================================================
// 2. Low-Frequency Life Support Hum Generator (ECLSS)
// Re-creates habitat atmospheric circulation, coolant loops,
// and CO2 scrubbers. Reacts in real-time to Life Support health and power!
// ============================================================
class LifeSupportHumGenerator {
  private ctx: AudioContext;
  private destination: AudioNode;
  private masterGain: GainNode;
  private subOsc: OscillatorNode | null = null;
  private midOsc: OscillatorNode | null = null;
  private beatOsc: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private isRunning: boolean = false;
  private pinkBuffer: AudioBuffer;

  constructor(ctx: AudioContext, destination: AudioNode, pinkBuffer: AudioBuffer) {
    this.ctx = ctx;
    this.destination = destination;
    this.pinkBuffer = pinkBuffer;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.38, ctx.currentTime);
    this.masterGain.connect(this.destination);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    const now = this.ctx.currentTime;

    // 1. Sub-bass fundamental (55 Hz - deep habitat reactor hum)
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = "sine";
    this.subOsc.frequency.setValueAtTime(55.0, now);

    // 2. Harmonic overtone (110 Hz - ventilation motor rotor)
    this.midOsc = this.ctx.createOscillator();
    this.midOsc.type = "triangle";
    this.midOsc.frequency.setValueAtTime(110.0, now);

    // 3. Acoustic beater (55.35 Hz - slow 0.35 Hz breathing pulse)
    this.beatOsc = this.ctx.createOscillator();
    this.beatOsc.type = "sine";
    this.beatOsc.frequency.setValueAtTime(55.35, now);

    // Filter to retain deep warmth and prevent high-frequency hum fatigue
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.setValueAtTime(220, now);
    this.filter.Q.setValueAtTime(2.0, now);

    // LFO: 0.08 Hz sine wave to gently sweep the filter cutoff (air pressure cycling)
    this.lfo = this.ctx.createOscillator();
    this.lfo.type = "sine";
    this.lfo.frequency.setValueAtTime(0.075, now);

    this.lfoGain = this.ctx.createGain();
    this.lfoGain.gain.setValueAtTime(45.0, now); // Sweeps cutoff ±45 Hz
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filter.frequency);

    // Soft airflow whisper layer (filtered pink noise)
    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = this.pinkBuffer;
    this.noiseNode.loop = true;

    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = "bandpass";
    this.noiseFilter.frequency.setValueAtTime(480, now);
    this.noiseFilter.Q.setValueAtTime(1.5, now);

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0.045, now);

    this.noiseNode.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);

    // Connect tone oscillators
    const toneGain = this.ctx.createGain();
    toneGain.gain.setValueAtTime(0.24, now);

    this.subOsc.connect(toneGain);
    this.midOsc.connect(toneGain);
    this.beatOsc.connect(toneGain);

    toneGain.connect(this.filter);
    this.filter.connect(this.masterGain);

    // Start all nodes
    this.subOsc.start(now);
    this.midOsc.start(now);
    this.beatOsc.start(now);
    this.lfo.start(now);
    this.noiseNode.start(now);
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    const now = this.ctx.currentTime;
    try {
      this.subOsc?.stop(now);
      this.midOsc?.stop(now);
      this.beatOsc?.stop(now);
      this.lfo?.stop(now);
      this.noiseNode?.stop(now);

      this.subOsc?.disconnect();
      this.midOsc?.disconnect();
      this.beatOsc?.disconnect();
      this.lfo?.disconnect();
      this.noiseNode?.disconnect();
    } catch {}

    this.subOsc = null;
    this.midOsc = null;
    this.beatOsc = null;
    this.lfo = null;
    this.noiseNode = null;
  }

  /**
   * Modulate life support hum based on real-time subsystem state
   */
  public updateTelemetry(health: number, powerRatio: number, envId: string): void {
    if (!this.isRunning) return;

    const now = this.ctx.currentTime;
    const baseFreq = envId === "mars_gale_crater" ? 58.0 : 52.0;

    // Pitch drops slightly if power is starved
    const targetFreq = baseFreq * (0.85 + 0.15 * Math.min(1, powerRatio));
    this.subOsc?.frequency.linearRampToValueAtTime(targetFreq, now + 0.5);
    this.midOsc?.frequency.linearRampToValueAtTime(targetFreq * 2, now + 0.5);
    this.beatOsc?.frequency.linearRampToValueAtTime(targetFreq + 0.35, now + 0.5);

    // When health drops below 60%, air circulation becomes stressed (filter opens up, airflow jitters)
    const healthFactor = Math.max(0, Math.min(1, health / 100));
    const targetCutoff = 180 + (1 - healthFactor) * 160;
    this.filter?.frequency.linearRampToValueAtTime(targetCutoff, now + 0.5);

    // Stressed pump noise increases if health < 50%
    const noiseLevel = 0.045 + (1 - healthFactor) * 0.08;
    this.noiseGain?.gain.linearRampToValueAtTime(noiseLevel, now + 0.5);
  }

  public setVolume(val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.masterGain.gain.linearRampToValueAtTime(clamped * 0.45, this.ctx.currentTime + 0.1);
  }
}

// ============================================================
// 3. Airlock Pressure Hiss & Valve Venting Generator
// Simulates pneumatic pressure releases, airlock cycling,
// and atmospheric scrubber exhaust.
// ============================================================
class AirlockHissGenerator {
  private ctx: AudioContext;
  private destination: AudioNode;
  private masterGain: GainNode;
  private pinkBuffer: AudioBuffer;
  private ambientTimerId: number | null = null;
  private isAutoCycleEnabled: boolean = true;

  constructor(ctx: AudioContext, destination: AudioNode, pinkBuffer: AudioBuffer) {
    this.ctx = ctx;
    this.destination = destination;
    this.pinkBuffer = pinkBuffer;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.5, ctx.currentTime);
    this.masterGain.connect(this.destination);
  }

  public startAutoCycle(): void {
    this.isAutoCycleEnabled = true;
    this.scheduleNextHiss();
  }

  public stopAutoCycle(): void {
    this.isAutoCycleEnabled = false;
    if (this.ambientTimerId !== null) {
      window.clearTimeout(this.ambientTimerId);
      this.ambientTimerId = null;
    }
  }

  private scheduleNextHiss(): void {
    if (!this.isAutoCycleEnabled) return;
    // Periodic subtle pressure equalization every 24–45 seconds with random jitter
    const delayMs = 24000 + Math.random() * 21000;
    this.ambientTimerId = window.setTimeout(() => {
      if (this.isAutoCycleEnabled) {
        this.triggerHiss(0.65); // Subtle ambient background venting
        this.scheduleNextHiss();
      }
    }, delayMs);
  }

  /**
   * Triggers a pneumatic airlock equalization hiss
   * @param intensity 0.0 to 1.0
   */
  public triggerHiss(intensity: number = 1.0): void {
    try {
      const now = this.ctx.currentTime;
      const effectiveIntensity = Math.max(0.1, Math.min(1.0, intensity));

      // 1. Solenoid latch release thud
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = "sine";
      thudOsc.frequency.setValueAtTime(130, now);
      thudOsc.frequency.exponentialRampToValueAtTime(32, now + 0.05);

      thudGain.gain.setValueAtTime(0.12 * effectiveIntensity, now);
      thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

      thudOsc.connect(thudGain);
      thudGain.connect(this.masterGain);
      thudOsc.start(now);
      thudOsc.stop(now + 0.06);

      // 2. Rushing gas hiss (pink noise through dynamic bandpass)
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = this.pinkBuffer;

      const hissFilter = this.ctx.createBiquadFilter();
      hissFilter.type = "bandpass";
      hissFilter.frequency.setValueAtTime(2200, now);
      // Sweeps downward as pressure stabilizes
      hissFilter.frequency.exponentialRampToValueAtTime(550, now + 1.8);
      hissFilter.Q.setValueAtTime(1.8, now);

      const hissGain = this.ctx.createGain();
      hissGain.gain.setValueAtTime(0.0001, now);
      // Fast attack
      hissGain.gain.linearRampToValueAtTime(0.24 * effectiveIntensity, now + 0.06);
      // Smooth gas dissipation decay
      hissGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);

      noiseSource.connect(hissFilter);
      hissFilter.connect(hissGain);
      hissGain.connect(this.masterGain);

      noiseSource.start(now);
      noiseSource.stop(now + 2.0);

      // 3. Final pressure seal click
      setTimeout(() => {
        try {
          const sealNow = this.ctx.currentTime;
          const sealOsc = this.ctx.createOscillator();
          const sealGain = this.ctx.createGain();
          sealOsc.type = "triangle";
          sealOsc.frequency.setValueAtTime(2600, sealNow);

          sealGain.gain.setValueAtTime(0.06 * effectiveIntensity, sealNow);
          sealGain.gain.exponentialRampToValueAtTime(0.0001, sealNow + 0.02);

          sealOsc.connect(sealGain);
          sealGain.connect(this.masterGain);
          sealOsc.start(sealNow);
          sealOsc.stop(sealNow + 0.025);
        } catch {}
      }, 1750);
    } catch {}
  }

  public setVolume(val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.masterGain.gain.linearRampToValueAtTime(clamped * 0.55, this.ctx.currentTime + 0.1);
  }
}

// ============================================================
// 4. Geiger Counter Clicks Generator
// Real Poisson-distributed ionizing radiation clicks.
// Reacts dynamically to baseline cosmic rays, Solar Storm spikes,
// and radiation shielding power!
// ============================================================
class GeigerCounterGenerator {
  private ctx: AudioContext;
  private destination: AudioNode;
  private masterGain: GainNode;
  private impulseBuffer: AudioBuffer;
  private isRunning: boolean = false;
  private nextClickTimeout: number | null = null;
  private filter: BiquadFilterNode;

  // Real-time telemetry driving CPM (Counts Per Minute)
  private currentClicksPerSecond: number = 0.8; // Baseline cosmic ray background
  private recentClicksHistory: number[] = [];
  private onCpmChange?: (cpm: number) => void;

  constructor(
    ctx: AudioContext,
    destination: AudioNode,
    impulseBuffer: AudioBuffer,
    onCpmChange?: (cpm: number) => void
  ) {
    this.ctx = ctx;
    this.destination = destination;
    this.impulseBuffer = impulseBuffer;
    this.onCpmChange = onCpmChange;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.48, ctx.currentTime);

    // Sharp resonant filter characteristic of speaker discharge in a Geiger-Müller tube
    this.filter = ctx.createBiquadFilter();
    this.filter.type = "bandpass";
    this.filter.frequency.setValueAtTime(2800, ctx.currentTime);
    this.filter.Q.setValueAtTime(3.5, ctx.currentTime);

    this.masterGain.connect(this.filter);
    this.filter.connect(this.destination);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNextPoissonClick();
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.nextClickTimeout !== null) {
      window.clearTimeout(this.nextClickTimeout);
      this.nextClickTimeout = null;
    }
  }

  /**
   * Schedules the next Geiger click using the exponential distribution
   * of a Poisson process: dt = -ln(1 - U) / lambda
   */
  private scheduleNextPoissonClick(): void {
    if (!this.isRunning) return;

    const rate = Math.max(0.1, this.currentClicksPerSecond);
    const u = Math.max(0.0001, Math.min(0.9999, Math.random()));
    const deltaSeconds = -Math.log(1 - u) / rate;
    const deltaMs = Math.max(4, Math.floor(deltaSeconds * 1000));

    this.nextClickTimeout = window.setTimeout(() => {
      if (this.isRunning) {
        this.playSingleClick();
        this.scheduleNextPoissonClick();
      }
    }, deltaMs);
  }

  /**
   * Fires a single crisp ionizing particle click
   */
  public playSingleClick(gainFactor: number = 1.0): void {
    try {
      const now = this.ctx.currentTime;
      const source = this.ctx.createBufferSource();
      source.buffer = this.impulseBuffer;

      // Realistic acoustic micro-jitter
      const pitchJitter = 0.92 + Math.random() * 0.18;
      source.playbackRate.setValueAtTime(pitchJitter, now);

      const gain = this.ctx.createGain();
      const amplitudeJitter = 0.8 + Math.random() * 0.4;
      gain.gain.setValueAtTime(0.28 * gainFactor * amplitudeJitter, now);

      source.connect(gain);
      gain.connect(this.masterGain);

      source.start(now);
      source.stop(now + 0.005);

      // Record for rolling CPM calculation
      const pNow = performance.now();
      this.recentClicksHistory.push(pNow);
      this.cleanOldClicks(pNow);
    } catch {}
  }

  private cleanOldClicks(now: number): void {
    // Keep last 4 seconds of clicks
    while (this.recentClicksHistory.length > 0 && now - this.recentClicksHistory[0] > 4000) {
      this.recentClicksHistory.shift();
    }
    if (this.onCpmChange) {
      const cpm = Math.round((this.recentClicksHistory.length / 4.0) * 60);
      this.onCpmChange(cpm);
    }
  }

  /**
   * Updates click rate dynamically based on mission radiation state & shielding power
   */
  public updateTelemetry(
    radiationMultiplier: number,
    shieldingPowerRatio: number,
    shieldingHealth: number
  ): void {
    // Baseline Moon/Mars background: ~0.8 to 1.5 clicks/sec
    let rate = 0.9;

    // Environmental radiation spikes (e.g., M-class or X-class solar flare: multiplier 2.2x to 5.0x)
    const radFactor = Math.max(1.0, radiationMultiplier);
    rate *= Math.pow(radFactor, 1.4);

    // Shielding attenuation:
    // If fully powered & 100% health, shields absorb 85% of radiation.
    // If power starved or broken, radiation surges through the habitat walls!
    const effectiveShield = Math.min(1.0, shieldingPowerRatio) * (shieldingHealth / 100);
    const vulnerability = Math.max(0.12, 1.0 - effectiveShield * 0.88);

    rate = rate * vulnerability * (vulnerability > 0.6 ? 3.5 : 1.0);

    // Cap rate to realistic maximum Geiger tube resolution (max ~140 clicks/sec)
    this.currentClicksPerSecond = Math.max(0.4, Math.min(140.0, rate));
  }

  /**
   * Fires a dramatic Geiger radiation burst (e.g., during solar storm alert)
   */
  public triggerBurst(durationSec: number = 2.0, burstRate: number = 65): void {
    const originalRate = this.currentClicksPerSecond;
    this.currentClicksPerSecond = burstRate;

    setTimeout(() => {
      this.currentClicksPerSecond = originalRate;
    }, durationSec * 1000);
  }

  public setVolume(val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.masterGain.gain.linearRampToValueAtTime(clamped * 0.5, this.ctx.currentTime + 0.1);
  }

  public getCurrentCPM(): number {
    return Math.round(this.currentClicksPerSecond * 60);
  }
}

// ============================================================
// Master Ambient Audio Manager Singleton
// Coordinates all procedural generators, master bus compression,
// telemetry synchronization, and mute/volume persistence.
// ============================================================
class AmbientAudioManager {
  private ctx: AudioContext | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private ambientBusGain: GainNode | null = null;

  private pinkNoiseBuffer: AudioBuffer | null = null;
  private geigerImpulseBuffer: AudioBuffer | null = null;

  private droneSoundtrack: SpaceDroneSoundtrack | null = null;
  private lifeSupportHum: LifeSupportHumGenerator | null = null;
  private airlockHiss: AirlockHissGenerator | null = null;
  private geigerCounter: GeigerCounterGenerator | null = null;

  private isInitialized: boolean = false;
  private isMuted: boolean = false;
  private currentCpm: number = 54; // default baseline display

  private settings: AmbientAudioSettings = {
    ambientVolume: 0.55,
    soundtrackEnabled: true,
    lifeSupportEnabled: true,
    airlockEnabled: true,
    geigerEnabled: true,
  };

  private listeners: Set<(settings: AmbientAudioSettings, cpm: number, isMuted: boolean) => void> =
    new Set();

  constructor() {
    if (typeof window !== "undefined") {
      this.loadSettings();

      // Listen to SoundEffects global mute state
      this.isMuted = soundEffects.getIsMuted();
      soundEffects.subscribe((muted) => {
        this.setMuted(muted);
      });

      // Browser autoplay unlock listeners
      const unlockAudio = () => {
        this.ensureContext();
        window.removeEventListener("pointerdown", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
      };
      window.addEventListener("pointerdown", unlockAudio, { once: true });
      window.addEventListener("keydown", unlockAudio, { once: true });

      // Suspend/resume on tab visibility
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          if (this.ctx && this.ctx.state === "running") {
            this.ctx.suspend().catch(() => {});
          }
        } else {
          if (this.ctx && this.ctx.state === "suspended" && !this.isMuted) {
            this.ctx.resume().catch(() => {});
          }
        }
      });
    }
  }

  private loadSettings(): void {
    try {
      const vol = localStorage.getItem(STORAGE_KEYS.AMBIENT_VOLUME);
      if (vol !== null) this.settings.ambientVolume = parseFloat(vol);

      const drone = localStorage.getItem(STORAGE_KEYS.DRONE_ENABLED);
      if (drone !== null) this.settings.soundtrackEnabled = drone === "true";

      const ls = localStorage.getItem(STORAGE_KEYS.LIFESUPPORT_ENABLED);
      if (ls !== null) this.settings.lifeSupportEnabled = ls === "true";

      const al = localStorage.getItem(STORAGE_KEYS.AIRLOCK_ENABLED);
      if (al !== null) this.settings.airlockEnabled = al === "true";

      const gc = localStorage.getItem(STORAGE_KEYS.GEIGER_ENABLED);
      if (gc !== null) this.settings.geigerEnabled = gc === "true";
    } catch {}
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AMBIENT_VOLUME, String(this.settings.ambientVolume));
      localStorage.setItem(STORAGE_KEYS.DRONE_ENABLED, String(this.settings.soundtrackEnabled));
      localStorage.setItem(STORAGE_KEYS.LIFESUPPORT_ENABLED, String(this.settings.lifeSupportEnabled));
      localStorage.setItem(STORAGE_KEYS.AIRLOCK_ENABLED, String(this.settings.airlockEnabled));
      localStorage.setItem(STORAGE_KEYS.GEIGER_ENABLED, String(this.settings.geigerEnabled));
    } catch {}
    this.notify();
  }

  /**
   * Lazily initializes audio graph on first user interaction
   */
  public ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }

    if (!this.ctx) return null;

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    if (!this.isInitialized && this.ctx) {
      this.initAudioGraph(this.ctx);
      this.isInitialized = true;
    }

    return this.ctx;
  }

  private initAudioGraph(ctx: AudioContext): void {
    // Master dynamics compressor: prevents digital clipping, provides punchy aerospace limiter feel
    this.masterCompressor = ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.setValueAtTime(-14, ctx.currentTime);
    this.masterCompressor.knee.setValueAtTime(24, ctx.currentTime);
    this.masterCompressor.ratio.setValueAtTime(4.5, ctx.currentTime);
    this.masterCompressor.attack.setValueAtTime(0.003, ctx.currentTime);
    this.masterCompressor.release.setValueAtTime(0.22, ctx.currentTime);

    this.masterCompressor.connect(ctx.destination);

    // Ambient Sub-Mix Bus Gain
    this.ambientBusGain = ctx.createGain();
    const initialGain = this.isMuted ? 0.0001 : this.settings.ambientVolume;
    this.ambientBusGain.gain.setValueAtTime(initialGain, ctx.currentTime);
    this.ambientBusGain.connect(this.masterCompressor);

    // Pre-calculate audio buffers
    this.pinkNoiseBuffer = createPinkNoiseBuffer(ctx, 2.0);
    this.geigerImpulseBuffer = createGeigerImpulseBuffer(ctx);

    // Initialize generators
    this.droneSoundtrack = new SpaceDroneSoundtrack(ctx, this.ambientBusGain);
    this.lifeSupportHum = new LifeSupportHumGenerator(
      ctx,
      this.ambientBusGain,
      this.pinkNoiseBuffer
    );
    this.airlockHiss = new AirlockHissGenerator(ctx, this.ambientBusGain, this.pinkNoiseBuffer);
    this.geigerCounter = new GeigerCounterGenerator(
      ctx,
      this.ambientBusGain,
      this.geigerImpulseBuffer,
      (cpm) => {
        this.currentCpm = cpm;
        this.notify();
      }
    );

    // Apply initial state
    if (!this.isMuted) {
      if (this.settings.soundtrackEnabled) this.droneSoundtrack.start();
      if (this.settings.lifeSupportEnabled) this.lifeSupportHum.start();
      if (this.settings.airlockEnabled) this.airlockHiss.startAutoCycle();
      if (this.settings.geigerEnabled) this.geigerCounter.start();
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.ambientBusGain && this.ctx) {
      const target = muted ? 0.0001 : this.settings.ambientVolume;
      this.ambientBusGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.15);
    }
    this.notify();
  }

  public setAmbientVolume(vol: number): void {
    this.settings.ambientVolume = Math.max(0, Math.min(1, vol));
    if (this.ambientBusGain && this.ctx && !this.isMuted) {
      this.ambientBusGain.gain.linearRampToValueAtTime(
        this.settings.ambientVolume,
        this.ctx.currentTime + 0.08
      );
    }
    this.saveSettings();
  }

  public toggleSoundtrack(enabled?: boolean): void {
    this.ensureContext();
    const next = enabled !== undefined ? enabled : !this.settings.soundtrackEnabled;
    this.settings.soundtrackEnabled = next;
    if (next && !this.isMuted) {
      this.droneSoundtrack?.start();
    } else {
      this.droneSoundtrack?.stop();
    }
    this.saveSettings();
  }

  public toggleLifeSupport(enabled?: boolean): void {
    this.ensureContext();
    const next = enabled !== undefined ? enabled : !this.settings.lifeSupportEnabled;
    this.settings.lifeSupportEnabled = next;
    if (next && !this.isMuted) {
      this.lifeSupportHum?.start();
    } else {
      this.lifeSupportHum?.stop();
    }
    this.saveSettings();
  }

  public toggleAirlock(enabled?: boolean): void {
    this.ensureContext();
    const next = enabled !== undefined ? enabled : !this.settings.airlockEnabled;
    this.settings.airlockEnabled = next;
    if (next && !this.isMuted) {
      this.airlockHiss?.startAutoCycle();
    } else {
      this.airlockHiss?.stopAutoCycle();
    }
    this.saveSettings();
  }

  public toggleGeiger(enabled?: boolean): void {
    this.ensureContext();
    const next = enabled !== undefined ? enabled : !this.settings.geigerEnabled;
    this.settings.geigerEnabled = next;
    if (next && !this.isMuted) {
      this.geigerCounter?.start();
    } else {
      this.geigerCounter?.stop();
    }
    this.saveSettings();
  }

  /**
   * Main telemetry dispatch from GameScreen / Simulation Engine
   */
  public updateTelemetry(data: Partial<AmbientTelemetry>): void {
    this.ensureContext();
    if (!this.isInitialized) return;

    if (data.environmentId) {
      this.droneSoundtrack?.setEnvironment(data.environmentId);
    }

    if (data.lifeSupportHealth !== undefined && data.lifeSupportPowerRatio !== undefined) {
      this.lifeSupportHum?.updateTelemetry(
        data.lifeSupportHealth,
        data.lifeSupportPowerRatio,
        data.environmentId || "lunar_south_pole"
      );
    }

    if (
      data.radiationMultiplier !== undefined &&
      data.shieldingPowerRatio !== undefined &&
      data.shieldingHealth !== undefined
    ) {
      this.geigerCounter?.updateTelemetry(
        data.radiationMultiplier,
        data.shieldingPowerRatio,
        data.shieldingHealth
      );
    }
  }

  /**
   * Triggers an immediate airlock equalization hiss (e.g. on turn change or EVA incident)
   */
  public triggerAirlock(intensity: number = 1.0): void {
    this.ensureContext();
    if (!this.isMuted && this.settings.airlockEnabled) {
      this.airlockHiss?.triggerHiss(intensity);
    }
  }

  /**
   * Triggers an ionizing radiation spike burst (e.g. on Solar Particle Event)
   */
  public triggerGeigerBurst(durationSec: number = 2.5, rate: number = 75): void {
    this.ensureContext();
    if (!this.isMuted && this.settings.geigerEnabled) {
      this.geigerCounter?.triggerBurst(durationSec, rate);
    }
  }

  /**
   * Test single click / element for the audio deck
   */
  public testGeigerClick(): void {
    this.ensureContext();
    this.geigerCounter?.playSingleClick(1.2);
  }

  public getSettings(): AmbientAudioSettings {
    return { ...this.settings };
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getCurrentCPM(): number {
    return this.currentCpm;
  }

  public subscribe(
    listener: (settings: AmbientAudioSettings, cpm: number, isMuted: boolean) => void
  ): () => void {
    this.listeners.add(listener);
    listener(this.settings, this.currentCpm, this.isMuted);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.settings, this.currentCpm, this.isMuted));
  }
}

export const ambientAudio = new AmbientAudioManager();

// ============================================================
// React Hook: useAmbientAudio
// ============================================================
import { useState, useEffect } from "react";

export function useAmbientAudio() {
  const [settings, setSettings] = useState<AmbientAudioSettings>(() => ambientAudio.getSettings());
  const [cpm, setCpm] = useState<number>(() => ambientAudio.getCurrentCPM());
  const [isMuted, setIsMuted] = useState<boolean>(() => ambientAudio.getIsMuted());

  useEffect(() => {
    return ambientAudio.subscribe((newSettings, newCpm, muted) => {
      setSettings(newSettings);
      setCpm(newCpm);
      setIsMuted(muted);
    });
  }, []);

  return {
    settings,
    cpm,
    isMuted,
    setAmbientVolume: (vol: number) => ambientAudio.setAmbientVolume(vol),
    toggleSoundtrack: (val?: boolean) => ambientAudio.toggleSoundtrack(val),
    toggleLifeSupport: (val?: boolean) => ambientAudio.toggleLifeSupport(val),
    toggleAirlock: (val?: boolean) => ambientAudio.toggleAirlock(val),
    toggleGeiger: (val?: boolean) => ambientAudio.toggleGeiger(val),
    triggerAirlock: (intensity?: number) => ambientAudio.triggerAirlock(intensity),
    triggerGeigerBurst: (durationSec?: number, rate?: number) =>
      ambientAudio.triggerGeigerBurst(durationSec, rate),
    testGeigerClick: () => ambientAudio.testGeigerClick(),
    toggleMute: () => soundEffects.toggleMute(),
  };
}
