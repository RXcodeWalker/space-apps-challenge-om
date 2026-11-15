// ============================================================
// seededRandom.ts — Deterministic Pseudo-Random Number Generator (PRNG)
// Outpost Commander — STEM Classroom Reproducible Mission Seed Architecture
// Mulberry32-based deterministic algorithm initialized via 32-bit FNV-1a hash
// ============================================================

export interface SeededRNG {
  readonly seed: string;
  readonly seedInt: number;
  /** Returns a pseudo-random float in [0, 1) */
  next(): number;
  /** Returns a pseudo-random integer in [min, max] inclusive */
  nextInt(min: number, max: number): number;
  /** Returns a pseudo-random float in [min, max) */
  nextFloat(min: number, max: number): number;
  /** Returns a randomly selected element from a non-empty array */
  choice<T>(array: readonly T[]): T;
  /** Returns a deterministically shuffled shallow copy of the array */
  shuffle<T>(array: readonly T[]): T[];
}

/**
 * NASA-style authentic mission naming prefixes for random code generation
 */
export const NASA_SEED_PREFIXES = [
  "APOLLO",
  "ARTEMIS",
  "ORION",
  "VALKYRIE",
  "GALE",
  "SHACKLETON",
  "CURIOSITY",
  "PERSEVERANCE",
  "VOYAGER",
  "PIONEER",
  "HORIZONS",
  "DISCOVERY",
  "ATLANTIS",
  "ENDEAVOUR",
  "COLUMBIA",
  "CHALLENGER",
  "AQUARIUS",
  "OLYMPUS",
  "PHOENIX",
  "DRAGONFLY",
  "CLIPPER",
  "TITAN",
  "EUROPA",
  "MARS",
] as const;

/**
 * Hashes a string into a 32-bit unsigned integer using FNV-1a + Murmur-like bit mixing.
 */
export function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  // Avalanching step
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Normalizes a seed string: trims whitespace, removes leading '#' or '?',
 * and converts to uppercase alphanumeric/dash format.
 */
export function normalizeSeed(rawSeed: string): string {
  if (!rawSeed) return "ARTEMIS-01";
  const cleaned = rawSeed
    .trim()
    .toUpperCase()
    .replace(/^[#?]+/, "")
    .replace(/[^A-Z0-9\-_]/g, "");
  return cleaned || "ARTEMIS-01";
}

/**
 * Formats a seed for display with the canonical '#' prefix.
 */
export function formatSeedDisplay(seed: string): string {
  const norm = normalizeSeed(seed);
  return `#${norm}`;
}

/**
 * Creates a deterministic, stateful pseudo-random number generator (Mulberry32).
 * Given the same seed string, calling .next() will yield the exact same sequence.
 */
export function createSeededRNG(seed: string): SeededRNG {
  const normalized = normalizeSeed(seed);
  let state = hashString(normalized);
  if (state === 0) state = 0x6d2b79f5;

  function next(): number {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min: number, max: number): number {
    return Math.floor(next() * (max - min + 1)) + min;
  }

  function nextFloat(min: number, max: number): number {
    return next() * (max - min) + min;
  }

  function choice<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error("Cannot choose from an empty array");
    }
    const idx = Math.floor(next() * array.length);
    return array[idx];
  }

  function shuffle<T>(array: readonly T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  return {
    seed: normalized,
    seedInt: state,
    next,
    nextInt,
    nextFloat,
    choice,
    shuffle,
  };
}

// Active singleton instance for convenience
let activeRNG: SeededRNG = createSeededRNG("ARTEMIS-01");

/**
 * Sets the active global RNG to a specific seed string.
 */
export function setActiveSeed(seed: string): SeededRNG {
  activeRNG = createSeededRNG(seed);
  return activeRNG;
}

/**
 * Helper returning a pseudo-random float in [0, 1).
 * If a seed string is provided, a fresh generator is seeded and evaluated.
 * Otherwise, the active global generator advances.
 */
export function seededRandom(seed?: string): number {
  if (seed) {
    return createSeededRNG(seed).next();
  }
  return activeRNG.next();
}

/**
 * Generates a cool NASA-style random mission seed code,
 * e.g. "APOLLO-42", "ORION-07", "VALKYRIE-18", "GALE-99".
 */
export function generateMissionSeed(): string {
  const prefix = NASA_SEED_PREFIXES[Math.floor(Math.random() * NASA_SEED_PREFIXES.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  const numStr = String(num).padStart(2, "0");
  return `${prefix}-${numStr}`;
}

/**
 * Constructs a shareable URL parameter string with current seed and environment.
 */
export function buildChallengeUrl(
  seed: string,
  environmentId: string,
  difficulty?: string
): string {
  const normSeed = normalizeSeed(seed);
  if (typeof window === "undefined") {
    return `?seed=${encodeURIComponent(normSeed)}&env=${encodeURIComponent(environmentId)}`;
  }
  const url = new URL(window.location.href);
  url.searchParams.set("seed", normSeed);
  url.searchParams.set("env", environmentId);
  if (difficulty) {
    url.searchParams.set("difficulty", difficulty);
  }
  return url.toString();
}

/**
 * Extracts mission configuration parameters from the current window URL.
 */
export function parseMissionParamsFromUrl(): {
  seed: string | null;
  env: string | null;
  difficulty: string | null;
  demo: boolean;
} {
  if (typeof window === "undefined") {
    return { seed: null, env: null, difficulty: null, demo: false };
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const rawSeed = params.get("seed");
    const rawEnv = params.get("env");
    const rawDiff = params.get("difficulty");
    const demoParam = params.get("demo");
    const demo = demoParam === "true" || demoParam === "1" || params.has("demo");
    return {
      seed: rawSeed ? normalizeSeed(rawSeed) : null,
      env: rawEnv || null,
      difficulty: rawDiff || null,
      demo,
    };
  } catch {
    return { seed: null, env: null, difficulty: null, demo: false };
  }
}
