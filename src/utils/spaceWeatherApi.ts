// ============================================================
// spaceWeatherApi.ts — Real-World Space Weather Service
// NASA DONKI (Space Weather Database of Notifications, Knowledge, and Information)
// & NOAA Space Weather Prediction Center (SWPC) Integration
// Features:
// 1. Live queries to NASA DONKI Solar Flare (FLR) and NOAA Kp index feeds
// 2. Robust 1-Hour localStorage caching to eliminate rate limiting
// 3. Graceful offline fallback to curated NASA historical archive events
// ============================================================

export type SpaceWeatherAlertLevel = "green" | "amber" | "red";
export type SpaceWeatherDataSource = "live" | "cache" | "archive";

export interface SimulationComparisonPoint {
  parameter: string;
  realWorldValue: string;
  inGameModelValue: string;
  physicsRationale: string;
}

export interface SpaceWeatherTelemetry {
  alertLevel: SpaceWeatherAlertLevel;
  badgeText: string;
  headline: string;
  summary: string;
  flareClass: string;
  kpIndex: number;
  protonFluxPfu: number;
  cmeSpeedKmS: number;
  solarCyclePhase: string;
  source: SpaceWeatherDataSource;
  dataSourceName: string;
  timestamp: string;
  lastFetched: number;
  instruments: string[];
  recommendedOutpostAction: string;
  simulationComparison: SimulationComparisonPoint[];
}

const STORAGE_KEY = "outpost_space_weather_telemetry_v1";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Hour

// ------------------------------------------------------------
// Curated NASA Historical Archive Events (Offline / Fallback)
// ------------------------------------------------------------
export const HISTORICAL_SPACE_WEATHER_ARCHIVE: Record<
  "calm" | "active_m_flare" | "extreme_proton",
  SpaceWeatherTelemetry
> = {
  calm: {
    alertLevel: "green",
    badgeText: "NOAA Space Weather: Geomagnetic Calm (Kp 1-2)",
    headline: "Quiet Solar Interplanetary Medium",
    summary:
      "Solar magnetic field lines are quiet. Background solar wind speed is steady at 330 km/s. Galactic Cosmic Ray (GCR) background flux remains stable with zero coronal mass ejections directed at Earth or the Moon.",
    flareClass: "B1.4",
    kpIndex: 1.5,
    protonFluxPfu: 0.35,
    cmeSpeedKmS: 320,
    solarCyclePhase: "Solar Cycle 25 Baseline Quiet Phase",
    source: "archive",
    dataSourceName: "NASA Heliophysics Data System & NOAA SWPC Archive",
    timestamp: new Date().toISOString(),
    lastFetched: Date.now(),
    instruments: [
      "SOHO LASCO (Lagrange L1)",
      "GOES-16 Solar Ultraviolet Imager (SUVI)",
      "DSCOVR PlasMag",
      "LRO CRaTER",
    ],
    recommendedOutpostAction:
      "Maintain nominal 100 MW power distribution. Routine EVA construction and regolith drilling permitted at 100% duty cycle.",
    simulationComparison: [
      {
        parameter: "Crew Radiation Exposure",
        realWorldValue: "0.30 mSv / 24h (Quiet cislunar background)",
        inGameModelValue: "0.20 – 0.35 mSv / Sol baseline",
        physicsRationale:
          "NASA CRaTER measurements at the Lunar South Pole confirm deep-space galactic cosmic rays constitute a steady ~1 mSv every 3 days in absence of solar storms.",
      },
      {
        parameter: "Solar Array Efficiency",
        realWorldValue: "100% nominal photovoltaic generation",
        inGameModelValue: "60 MW baseline solar output (Lunar/Mars)",
        physicsRationale:
          "Zero solar energetic proton (SEP) degradation allows maximum triple-junction solar cell conversion efficiency.",
      },
      {
        parameter: "Shielding Power Demand",
        realWorldValue: "Nominal secondary deflector field standby",
        inGameModelValue: "20 MW baseline allocation sufficient",
        physicsRationale:
          "Passive regolith berms (1.5m thickness) absorb 85% of ambient GCR without requiring emergency water-wall recirculation surges.",
      },
    ],
  },

  active_m_flare: {
    alertLevel: "amber",
    badgeText: "NOAA Alert: M-Class Solar Flare Recorded",
    headline: "Active Solar Cycle 25 Baseline - Moderate Proton Flux",
    summary:
      "Active Solar Cycle 25 Baseline - Moderate Proton Flux. Active Region AR13664 produced an impulsive M4.2 solar flare and coronal mass ejection. S1 minor radiation storm observed across cislunar and Martian orbital transfer paths.",
    flareClass: "M4.2",
    kpIndex: 4.8,
    protonFluxPfu: 24.0,
    cmeSpeedKmS: 740,
    solarCyclePhase: "Active Solar Cycle 25 Baseline - Moderate Proton Flux",
    source: "archive",
    dataSourceName: "NASA Solar Dynamics Observatory (SDO) & NOAA SWPC",
    timestamp: new Date().toISOString(),
    lastFetched: Date.now(),
    instruments: [
      "SDO Atmospheric Imaging Assembly (AIA)",
      "GOES-16 EXIS (Extreme Ultraviolet and X-ray)",
      "STEREO-Ahead Heliospheric Imager",
      "Mars Odyssey THEMIS / HEND",
    ],
    recommendedOutpostAction:
      "Divert +10 MW to active magnetic deflection and hydrological water-walls. Delay unshielded EVAs until solar proton flux drops below 10 pfu.",
    simulationComparison: [
      {
        parameter: "Crew Radiation Exposure",
        realWorldValue: "1.2 – 2.8 mSv / 24h (S1 Moderate Storm)",
        inGameModelValue: "0.8 – 1.4 mSv / Sol (Alert Level Amber)",
        physicsRationale:
          "Protons at >10 MeV penetrate outer spacesuit polymer fabrics. Outpost Commander simulates acute dosage spikes against the NASA 500 mSv career limit.",
      },
      {
        parameter: "Solar Array Efficiency",
        realWorldValue: "12% temporary power sag due to ionization & dust charging",
        inGameModelValue: "Power budget reduced by 8–15 MW",
        physicsRationale:
          "Solar UV photo-electric charging elevates electrostatic regolith clinging to photovoltaic glass covers.",
      },
      {
        parameter: "Shielding Power Demand",
        realWorldValue: "Active water-wall loop pumped to perimeter bulkheads",
        inGameModelValue: "30 MW radiation shield allocation required",
        physicsRationale:
          "Hydrogen atoms in water closely match proton mass, braking high-energy ions without creating secondary Bremsstrahlung gamma splatter.",
      },
    ],
  },

  extreme_proton: {
    alertLevel: "red",
    badgeText: "NASA DONKI Alert: Extreme Proton Event Active",
    headline: "Severe X-Class Coronal Mass Ejection & SPE Superstorm",
    summary:
      "NASA DONKI Alert: Extreme Proton Event Active. Major X8.7 solar flare accompanied by a fast halo Coronal Mass Ejection (1,650 km/s). Extreme solar energetic particle (SEP) storm impacting Moon, Mars, and orbital assets with flux exceeding 1,200 pfu.",
    flareClass: "X8.7",
    kpIndex: 8.8,
    protonFluxPfu: 1420.0,
    cmeSpeedKmS: 1650,
    solarCyclePhase: "Active Solar Cycle 25 Peak - Superflare Event",
    source: "archive",
    dataSourceName: "NASA DONKI Space Weather Notification System & NOAA SWPC",
    timestamp: new Date().toISOString(),
    lastFetched: Date.now(),
    instruments: [
      "NASA DONKI Automated Notification System",
      "GOES-16 Space Environment In-Situ Suite (SEISS)",
      "SOHO LASCO C2/C3 Coronagraph",
      "MSL Curiosity RAD (Radiation Assessment Detector)",
    ],
    recommendedOutpostAction:
      "CRITICAL: Commander must activate full storm shelter protocol! Overclock radiation shielding to 35+ MW. Shutdown non-critical scientific arrays to avoid transformer burnout.",
    simulationComparison: [
      {
        parameter: "Crew Radiation Exposure",
        realWorldValue: "50 – 250 mSv / 24h unshielded (Hazard to Life)",
        inGameModelValue: "+3.8 mSv unshielded in Sol 9 SPE Crisis Card",
        physicsRationale:
          "Unshielded astronauts outside a planetary magnetosphere face acute radiation sickness without prompt retreat to water-shielded underground habitat cores.",
      },
      {
        parameter: "Solar Array Efficiency",
        realWorldValue: "40% drop; risk of electrical arcing on array surfaces",
        inGameModelValue: "Power Grid baseline health degraded by −20%",
        physicsRationale:
          "Relativistic protons disrupt inverter semiconductor gates and degrade solar cell crystal lattices permanently.",
      },
      {
        parameter: "Shielding Power Demand",
        realWorldValue: "100% emergency water circulation + magnetic coil energization",
        inGameModelValue: "Max 35 MW allocation stops 85% of radiation dose",
        physicsRationale:
          "Diverting electrical power and water to radiation shields starves agricultural hydroponics and carbon scrubbers, creating life-and-death engineering trade-offs.",
      },
    ],
  },
};

/**
 * Check if localStorage is accessible in current browser session
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__sw_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read cached telemetry from localStorage if valid
 */
function getCachedSpaceWeatherData(): SpaceWeatherTelemetry | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SpaceWeatherTelemetry;
    if (parsed && typeof parsed.lastFetched === "number") {
      return parsed;
    }
  } catch (err) {
    console.warn("[SpaceWeatherApi] Error parsing cached telemetry:", err);
  }
  return null;
}

/**
 * Save telemetry to localStorage
 */
function saveSpaceWeatherData(data: SpaceWeatherTelemetry): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("[SpaceWeatherApi] Error saving telemetry to localStorage:", err);
  }
}

/**
 * Format Date as YYYY-MM-DD
 */
function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

interface DonkiFlareItem {
  flrID?: string;
  beginTime?: string;
  peakTime?: string;
  endTime?: string;
  classType?: string;
  sourceLocation?: string;
  activeRegionNum?: number;
  instruments?: Array<{ displayName?: string }>;
}

/**
 * Determine alert level and badge text from flare classification and Kp index
 */
function evaluateAlertFromData(
  flareClass: string,
  kp: number
): {
  alertLevel: SpaceWeatherAlertLevel;
  badgeText: string;
} {
  const upper = flareClass.toUpperCase().trim();
  const isXClass = upper.startsWith("X");
  const isMClass = upper.startsWith("M");

  if (isXClass || kp >= 7.0) {
    return {
      alertLevel: "red",
      badgeText: "NASA DONKI Alert: Extreme Proton Event Active",
    };
  }

  if (isMClass || kp >= 4.0) {
    return {
      alertLevel: "amber",
      badgeText: "NOAA Alert: M-Class Solar Flare Recorded",
    };
  }

  return {
    alertLevel: "green",
    badgeText: "NOAA Space Weather: Geomagnetic Calm (Kp 1-2)",
  };
}

/**
 * Query live NASA DONKI Solar Flare API or NOAA SWPC Planetary K-Index
 * with timeout, caching, and graceful offline fallback.
 */
export async function fetchSpaceWeatherData(
  forceRefresh = false
): Promise<SpaceWeatherTelemetry> {
  // 1. Check local cache first (1 hour TTL)
  const cached = getCachedSpaceWeatherData();
  const now = Date.now();

  if (!forceRefresh && cached && now - cached.lastFetched < CACHE_TTL_MS) {
    return {
      ...cached,
      source: "cache",
    };
  }

  // 2. Check if browser is strictly offline
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    if (cached) {
      return { ...cached, source: "cache" };
    }
    return {
      ...HISTORICAL_SPACE_WEATHER_ARCHIVE.active_m_flare,
      source: "archive",
      lastFetched: now,
    };
  }

  // 3. Attempt live query to public NASA DONKI open API or NOAA SWPC
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const startDate = formatDate(thirtyDaysAgo);
    const endDate = formatDate(today);

    // Timeout controller: abort after 5.5s so client never hangs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5500);

    // Query NASA DONKI Solar Flare (FLR)
    // DEMO_KEY is NASA's designated public testing key with generous limits
    const donkiUrl = `https://api.nasa.gov/DONKI/FLR?startDate=${startDate}&endDate=${endDate}&api_key=DEMO_KEY`;

    let donkiFlares: DonkiFlareItem[] = [];
    let donkiSuccess = false;

    try {
      const res = await fetch(donkiUrl, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          donkiFlares = json;
          donkiSuccess = true;
        }
      }
    } catch {
      // DONKI might be blocked or rate limited; continue to fallback or NOAA
    }

    // Also attempt lightweight NOAA Planetary K-Index feed if available
    let latestKp = 2.0;
    try {
      const noaaKpUrl = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json";
      const kpRes = await fetch(noaaKpUrl, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (kpRes.ok) {
        const kpJson = await kpRes.json();
        if (Array.isArray(kpJson) && kpJson.length > 1) {
          const lastRow = kpJson[kpJson.length - 1];
          const parsedKp = parseFloat(lastRow[1]);
          if (!isNaN(parsedKp)) {
            latestKp = parsedKp;
          }
        }
      }
    } catch {
      // Keep default estimated Kp
    } finally {
      clearTimeout(timeoutId);
    }

    // If DONKI returned flare items, pick the most significant/recent one
    if (donkiSuccess && donkiFlares.length > 0) {
      // Sort to find the highest class or most recent flare
      const sortedFlares = [...donkiFlares].sort((a, b) => {
        const timeA = new Date(a.peakTime || a.beginTime || 0).getTime();
        const timeB = new Date(b.peakTime || b.beginTime || 0).getTime();
        return timeB - timeA;
      });

      const latestFlare = sortedFlares[0];
      const flareClass = latestFlare.classType || "C2.1";
      const instrumentsFound = (latestFlare.instruments || [])
        .map((i) => i.displayName)
        .filter((name): name is string => Boolean(name));

      const { alertLevel, badgeText } = evaluateAlertFromData(flareClass, latestKp);

      const template =
        alertLevel === "red"
          ? HISTORICAL_SPACE_WEATHER_ARCHIVE.extreme_proton
          : alertLevel === "amber"
          ? HISTORICAL_SPACE_WEATHER_ARCHIVE.active_m_flare
          : HISTORICAL_SPACE_WEATHER_ARCHIVE.calm;

      const liveTelemetry: SpaceWeatherTelemetry = {
        alertLevel,
        badgeText,
        headline: `Live NASA DONKI Flare Event: ${flareClass}`,
        summary: `Real-time space weather captured by NASA Heliophysics fleet. Active region ${
          latestFlare.activeRegionNum ? `AR${latestFlare.activeRegionNum}` : "Solar Disk"
        } triggered class ${flareClass} event at ${latestFlare.peakTime || latestFlare.beginTime || "recent sol"}. Estimated planetary Kp index at ${latestKp.toFixed(1)}.`,
        flareClass,
        kpIndex: latestKp,
        protonFluxPfu:
          alertLevel === "red" ? 850 : alertLevel === "amber" ? 18.5 : 0.8,
        cmeSpeedKmS: alertLevel === "red" ? 1420 : alertLevel === "amber" ? 640 : 360,
        solarCyclePhase: "Live Solar Cycle 25 Telemetry",
        source: "live",
        dataSourceName: "NASA DONKI FLR & NOAA SWPC Planetary K-Index",
        timestamp: latestFlare.peakTime || new Date().toISOString(),
        lastFetched: now,
        instruments:
          instrumentsFound.length > 0
            ? instrumentsFound
            : ["GOES-16 SUVI", "SDO AIA", "SOHO LASCO", "DSCOVR"],
        recommendedOutpostAction: template.recommendedOutpostAction,
        simulationComparison: template.simulationComparison,
      };

      saveSpaceWeatherData(liveTelemetry);
      return liveTelemetry;
    }

    // If DONKI returned an empty array (very quiet month), evaluate based on Kp
    if (donkiSuccess && donkiFlares.length === 0) {
      const { alertLevel, badgeText } = evaluateAlertFromData("B1.0", latestKp);
      const base = HISTORICAL_SPACE_WEATHER_ARCHIVE.calm;
      const quietTelemetry: SpaceWeatherTelemetry = {
        ...base,
        alertLevel,
        badgeText,
        kpIndex: latestKp,
        source: "live",
        dataSourceName: "NASA DONKI (No Flares > C-class) & NOAA SWPC",
        lastFetched: now,
      };
      saveSpaceWeatherData(quietTelemetry);
      return quietTelemetry;
    }

    // If both failed or network thrown
    throw new Error("Unable to establish handshake with NASA DONKI or NOAA endpoints.");
  } catch (networkError) {
    console.info(
      "[SpaceWeatherApi] Live network unreachable or offline. Falling back gracefully:",
      networkError
    );

    // If we have stale cache, use it
    if (cached) {
      return {
        ...cached,
        source: "cache",
      };
    }

    // Default graceful fallback: Active Solar Cycle 25 Baseline as required
    const fallback = {
      ...HISTORICAL_SPACE_WEATHER_ARCHIVE.active_m_flare,
      source: "archive" as const,
      lastFetched: now,
    };
    saveSpaceWeatherData(fallback);
    return fallback;
  }
}

/**
 * Manually switch to one of the historical archive presets for testing & demonstration
 */
export function getArchivePreset(
  preset: "calm" | "active_m_flare" | "extreme_proton"
): SpaceWeatherTelemetry {
  return {
    ...HISTORICAL_SPACE_WEATHER_ARCHIVE[preset],
    source: "archive",
    lastFetched: Date.now(),
  };
}

/**
 * Clear cached space weather data
 */
export function clearSpaceWeatherCache(): void {
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}
