// ============================================================
// capComVoice.ts — Authentic Procedural NASA CapCom Radio Voice
// Zero external MP3/audio files needed.
// Uses browser-native window.speechSynthesis API coupled with
// Web Audio radio squelch chirps (Quindar tones) to simulate
// mission control capsule communicator transmissions.
// ============================================================

import { soundEffects } from "./soundEffects";

const MUTE_STORAGE_KEY = "outpost_commander_muted";

/**
 * Checks whether the browser natively supports SpeechSynthesis
 */
export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

/**
 * Searches available browser voices for an English robotic / clear voice,
 * prioritizing authentic radio tones:
 * 1. "Google UK English Female"
 * 2. "Microsoft David"
 * 3. "Samantha"
 * 4. Clear robotic / UK English system voices
 * 5. Standard system English voices
 */
function selectCapComVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // 1. High-priority named voices
  const topPriority = [
    "google uk english female",
    "microsoft david",
    "samantha",
  ];

  for (const name of topPriority) {
    const match = voices.find((v) => v.name.toLowerCase().includes(name));
    if (match) return match;
  }

  // 2. Clear robotic or formal English radio voices
  const secondaryEnglish = [
    "uk english female",
    "david",
    "daniel",
    "george",
    "oliver",
    "serena",
    "alex",
    "hazel",
    "karen",
  ];

  for (const name of secondaryEnglish) {
    const match = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith("en") &&
        v.name.toLowerCase().includes(name)
    );
    if (match) return match;
  }

  // 3. Default English voice marked by system
  const defaultEnglish = voices.find(
    (v) => v.default && v.lang.toLowerCase().startsWith("en")
  );
  if (defaultEnglish) return defaultEnglish;

  // 4. Any English voice (prefer en-US / en-GB)
  const standardEn = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith("en-us") ||
      v.lang.toLowerCase().startsWith("en-gb")
  );
  if (standardEn) return standardEn;

  const anyEnglish = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  if (anyEnglish) return anyEnglish;

  // 5. Ultimate fallback to default system voice
  return voices.find((v) => v.default) || voices[0] || null;
}

// Module-level voice cache & active utterance trackers
let cachedVoice: SpeechSynthesisVoice | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let currentSpeechId = 0;

function updateVoiceCache(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      cachedVoice = selectCapComVoice(voices);
    }
  } catch {
    // Graceful fallback for restricted environments
  }
}

// Initialize voices and listen for async voiceschanged event
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  try {
    updateVoiceCache();
    window.speechSynthesis.onvoiceschanged = () => {
      updateVoiceCache();
    };
  } catch {
    // Ignore initialization errors
  }
}

/**
 * Returns currently selected CapCom voice (or null if unavailable)
 */
export function getCapComVoice(): SpeechSynthesisVoice | null {
  if (!cachedVoice) {
    updateVoiceCache();
  }
  return cachedVoice;
}

/**
 * Checks if sound is currently muted by user
 */
function isSoundMuted(): boolean {
  if (soundEffects.getIsMuted()) return true;
  if (typeof window !== "undefined") {
    try {
      if (localStorage.getItem(MUTE_STORAGE_KEY) === "true") {
        return true;
      }
    } catch {
      // Ignore storage errors
    }
  }
  return false;
}

/**
 * Cancels any active speech transmission cleanly
 */
export function cancelCapComSpeech(): void {
  currentSpeechId++;
  if (activeUtterance) {
    activeUtterance.onstart = null;
    activeUtterance.onend = null;
    activeUtterance.onerror = null;
    activeUtterance = null;
  }
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore cancellation errors
    }
  }
}

/**
 * Returns the currently speaking utterance (if any)
 */
export function getActiveUtterance(): SpeechSynthesisUtterance | null {
  return activeUtterance;
}

export interface SpeakCapComOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Speaks an authentic CapCom radio message with pre and post Web Audio squelch
 */
export function speakCapCom(
  text: string,
  options: SpeakCapComOptions = {}
): void {
  if (!isSpeechSynthesisSupported()) return;
  if (!text || text.trim().length === 0) return;

  // Respect player's mute state
  if (isSoundMuted()) {
    cancelCapComSpeech();
    return;
  }

  // Cancel any prior speech cleanly
  cancelCapComSpeech();

  const speechId = ++currentSpeechId;

  // Play subtle NASA Quindar key-down comms chirp (intro)
  soundEffects.playRadioSquelch();

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance;

    const voice = getCapComVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || "en-US";
    } else {
      utterance.lang = "en-US";
    }

    // Authentic radio cadence: slightly lowered pitch (0.9), crisp rate (1.05)
    utterance.pitch = options.pitch ?? 0.9;
    utterance.rate = options.rate ?? 1.05;
    utterance.volume =
      options.volume ??
      (typeof soundEffects.getSfxVolume === "function"
        ? soundEffects.getSfxVolume()
        : 1.0);

    utterance.onstart = () => {
      if (speechId !== currentSpeechId) return;
      options.onStart?.();
    };

    utterance.onend = () => {
      if (speechId !== currentSpeechId) return;
      activeUtterance = null;
      // Play trailing Quindar unkey comms chirp (outro)
      soundEffects.playRadioOut();
      options.onEnd?.();
    };

    utterance.onerror = () => {
      if (speechId === currentSpeechId) {
        activeUtterance = null;
      }
    };

    // Delay speech ~70ms to allow the intro Quindar chirp to register authentically
    setTimeout(() => {
      if (speechId !== currentSpeechId) return;
      if (isSoundMuted()) return;
      window.speechSynthesis.speak(utterance);
    }, 70);
  } catch {
    activeUtterance = null;
  }
}

/**
 * Announces the start of a Sol with planetary weather and power conditions.
 * Example: "Sol 4. Solar array operating at 85 megawatts."
 */
export function announceSolStart(sol: number, weather: string): void {
  const cleanWeather = (weather || "").trim();
  let message = "";
  if (/^sol\s+\d+/i.test(cleanWeather)) {
    message = cleanWeather;
  } else if (cleanWeather.length > 0) {
    message = `Sol ${sol}. ${cleanWeather}`;
  } else {
    message = `Sol ${sol}. All systems telemetry reporting nominal.`;
  }
  speakCapCom(message);
}

/**
 * Announces a hazardous anomaly or incident.
 * Example: "Warning. Solar Particle Event detected on sector perimeter. Deflectors required."
 */
export function announceHazard(hazardTitle: string): void {
  const cleanHazard = (hazardTitle || "")
    .replace(/^[!⚠️🚨\s]+/, "")
    .trim();

  if (!cleanHazard) {
    speakCapCom("Warning. Environmental hazard detected on sector perimeter. Deflectors required.");
    return;
  }

  if (/^(warning|alert|critical|caution)/i.test(cleanHazard)) {
    speakCapCom(cleanHazard);
  } else {
    speakCapCom(
      `Warning. ${cleanHazard} detected on sector perimeter. Deflectors required.`
    );
  }
}

/**
 * Announces successful hydroponic crop harvest.
 * Example: "Hydroponic harvest confirmed. Caloric reserves replenished."
 */
export function announceHarvest(): void {
  speakCapCom("Hydroponic harvest confirmed. Caloric reserves replenished.");
}

/**
 * Announces power grid brownout alert.
 * Example: "Critical alert. Microgrid brownout detected. Auxiliary batteries engaged."
 */
export function announceBrownout(): void {
  speakCapCom("Critical alert. Microgrid brownout detected. Auxiliary batteries engaged.");
}

/**
 * CapCom Voice controller bundle
 */
export const capComVoice = {
  isSupported: isSpeechSynthesisSupported,
  getVoice: getCapComVoice,
  speak: speakCapCom,
  cancel: cancelCapComSpeech,
  announceSolStart,
  announceHazard,
  announceHarvest,
  announceBrownout,
};
