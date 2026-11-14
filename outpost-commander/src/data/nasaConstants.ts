// ============================================================
// NASA Data Constants — Outpost Commander
// All physical parameters sourced from real NASA missions.
// ============================================================

export type MissionEnvironmentId = "lunar_south_pole" | "mars_gale_crater";

export interface NasaCitation {
  datasetName: string;
  missionInstrument: string;
  parameter: string;
  value: string;
  kidFriendlyExplanation: string;
  sourceUrl: string;
}

export interface TurnEvent {
  id: string;
  label: string;
  description: string;
  kidFriendlyDescription: string;
  powerDeltaMW: number;         // positive = bonus power; negative = loss
  radiationSpikeMultiplier: number; // 1.0 = baseline; >1 = heightened radiation
  lifeSupportStressFactor: number;  // 1.0 = normal; <1 = easier; >1 = harder
  shieldingWearDelta: number;   // extra wear applied to shielding subsystem (0–1 scale)
}

export interface MissionEnvironment {
  id: MissionEnvironmentId;
  name: string;
  subtitle: string;
  emoji: string;
  backgroundGradient: string;
  basePowerBudgetMW: number;    // total MW available for the outpost
  baselineSolarEfficiency: number; // fraction 0–1
  baselineDailyRadiationMSv: number;
  citations: NasaCitation[];
  turnEvents: TurnEvent[];      // deterministic sequence, one per turn
  kidSummary: string;
}

// ---------------------------------------------------------------------------
// Lunar South Pole — Shackleton Crater Rim
// Primary data sources: NASA LRO Diviner Lunar Radiometer Experiment (DLRE),
// Lunar Orbiter Laser Altimeter (LOLA), LRO Mini-RF & LCROSS mission results.
// ---------------------------------------------------------------------------
const lunarTurnEvents: TurnEvent[] = [
  {
    id: "nominal_start",
    label: "Sol 1 — Nominal Ops",
    description: "All systems nominal. Solar arrays at peak efficiency on the crater rim.",
    kidFriendlyDescription: "Great start! The Sun is shining on the crater rim and all your systems are working perfectly.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.0,
    shieldingWearDelta: 0,
  },
  {
    id: "solar_particle_event_minor",
    label: "Sol 2 — Minor Solar Particle Event",
    description: "NOAA Space Weather Center detects an M-class solar flare. Radiation increases 2×. Shielding systems under moderate stress.",
    kidFriendlyDescription: "The Sun just burped out a bunch of tiny fast particles! Your radiation shields need extra power to protect the crew.",
    powerDeltaMW: -5,
    radiationSpikeMultiplier: 2.2,
    lifeSupportStressFactor: 1.0,
    shieldingWearDelta: 0.08,
  },
  {
    id: "water_ice_extraction_bonus",
    label: "Sol 3 — PSR Ice Extraction",
    description: "Rover successfully mines water ice from a Permanently Shadowed Region (PSR). Life support water reserves +20%.",
    kidFriendlyDescription: "Your ice-mining rover found water hiding in the super-cold shadows of the crater! More water means more oxygen for the crew.",
    powerDeltaMW: -8,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 0.8,
    shieldingWearDelta: 0,
  },
  {
    id: "partial_eclipse",
    label: "Sol 4 — Partial Lunar Eclipse",
    description: "Earth occludes partial sunlight reaching the crater rim. Solar panel output drops 35% for this turn. Battery reserves critical.",
    kidFriendlyDescription: "Earth is blocking some of the Sun's light from reaching your solar panels — like a giant shadow! Use your backup batteries wisely.",
    powerDeltaMW: -18,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.1,
    shieldingWearDelta: 0,
  },
  {
    id: "micrometeorite_impact",
    label: "Sol 5 — Micrometeorite Strike",
    description: "A micrometeorite impacts a solar panel array. 15 MW generation lost until repairs complete. Shielding and thermal regulation stressed.",
    kidFriendlyDescription: "A tiny space rock hit one of your solar panels! You'll need to fix it, but that takes crew time away from other jobs.",
    powerDeltaMW: -15,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.15,
    shieldingWearDelta: 0.12,
  },
  {
    id: "x_class_spe",
    label: "Sol 6 — X-class Solar Particle Event",
    description: "Major X-class solar flare (similar to the 2003 Halloween storms). Radiation spikes 5× baseline. Crew must shelter; shielding systems at maximum load.",
    kidFriendlyDescription: "DANGER! The Sun fired its biggest energy burst! Everyone must hide in the shelter. Your radiation shields are working super hard right now.",
    powerDeltaMW: -10,
    radiationSpikeMultiplier: 5.0,
    lifeSupportStressFactor: 1.3,
    shieldingWearDelta: 0.22,
  },
  {
    id: "rtg_maintenance",
    label: "Sol 7 — RTG Maintenance Window",
    description: "Scheduled maintenance on the Radioisotope Thermoelectric Generator (RTG). Backup power output reduced 10 MW for this sol.",
    kidFriendlyDescription: "It's time to service the nuclear battery (RTG) that keeps the base running at night. Things slow down a bit while the engineers work on it.",
    powerDeltaMW: -10,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.0,
    shieldingWearDelta: 0.04,
  },
  {
    id: "thermal_extreme",
    label: "Sol 8 — Extreme Thermal Gradient",
    description: "LRO Diviner data shows a 227°C surface swing this sol (−173°C shadow / +54°C sunlit). Thermal management systems under high load.",
    kidFriendlyDescription: "Half the Moon is freezing cold (−173°C!) and the other half is baking hot (+54°C). Your thermal systems are working overtime to keep the temperature comfortable inside.",
    powerDeltaMW: -12,
    radiationSpikeMultiplier: 1.2,
    lifeSupportStressFactor: 1.2,
    shieldingWearDelta: 0.1,
  },
  {
    id: "hydroponics_milestone",
    label: "Sol 9 — First Lunar Harvest",
    description: "Hydroponics bay produces first crop yield. Crew morale +15%. Food reserves extend mission by an estimated 2 days.",
    kidFriendlyDescription: "Your plants grew food on the Moon! The crew is so happy — eating fresh vegetables in space is amazing. This helps everyone stay healthy and energetic.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 0.9,
    lifeSupportStressFactor: 0.75,
    shieldingWearDelta: 0,
  },
  {
    id: "mission_complete_lunar",
    label: "Sol 10 — Mission Evaluation",
    description: "Mission control conducts final systems review. All readings are logged for the science return.",
    kidFriendlyDescription: "It's the last day! Mission Control is checking all your work. Let's see how well you managed the outpost!",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.0,
    shieldingWearDelta: 0,
  },
];

const lunarCitations: NasaCitation[] = [
  {
    datasetName: "LRO Diviner Lunar Radiometer Experiment (DLRE)",
    missionInstrument: "NASA Lunar Reconnaissance Orbiter / Diviner",
    parameter: "Surface Temperature Range",
    value: "−173°C (PSR) to +54°C (sunlit equatorial peak); crater rim swings ≈ 100°C",
    kidFriendlyExplanation: "The Moon has no air to hold heat, so it swings from super-hot to super-cold. Special craters near the poles stay frozen forever — that's where we find water ice!",
    sourceUrl: "https://diviner.ucla.edu/",
  },
  {
    datasetName: "LRO LOLA (Lunar Orbiter Laser Altimeter) Illumination Maps",
    missionInstrument: "NASA Lunar Reconnaissance Orbiter / LOLA",
    parameter: "Peak Solar Illumination on Shackleton Crater Rim",
    value: "≈ 86% of the year (some peaks receive ~89–94% illumination seasonally)",
    kidFriendlyExplanation: "The tips of the mountains on the crater rim see sunlight almost all year long — that's why they're perfect for solar panels!",
    sourceUrl: "https://lola.gsfc.nasa.gov/",
  },
  {
    datasetName: "LCROSS & LRO Mini-RF Water Ice Detection",
    missionInstrument: "NASA LCROSS Impact Mission / LRO Mini-RF Radar",
    parameter: "Water Ice in Permanently Shadowed Regions (PSRs)",
    value: "5.6% ± 2.9% water by mass in LCROSS debris plume; Mini-RF confirms widespread PSR deposits",
    kidFriendlyExplanation: "Scientists crashed a rocket into the Moon's shadow on purpose and found real water! That water (as ice) could become drinking water or rocket fuel for future astronauts.",
    sourceUrl: "https://www.nasa.gov/mission_pages/LCROSS/main/",
  },
  {
    datasetName: "NASA Space Radiation Environment — Galactic Cosmic Rays (GCR) & SPE",
    missionInstrument: "LRO CRaTER (Cosmic Ray Telescope for the Effects of Radiation)",
    parameter: "Surface Radiation Dose Rate (no magnetosphere/atmosphere)",
    value: "GCR baseline ≈ 0.3 mSv/day; X-class SPE can deliver 1–10 Sv in hours without shielding",
    kidFriendlyExplanation: "The Moon has no magnetic force field or air to block dangerous rays from the Sun and distant stars. Astronauts need thick shielding — like wearing a super-powered invisible suit!",
    sourceUrl: "https://crater.bu.edu/",
  },
];

export const LUNAR_SOUTH_POLE: MissionEnvironment = {
  id: "lunar_south_pole",
  name: "Lunar South Pole",
  subtitle: "Shackleton Crater Rim",
  emoji: "🌕",
  backgroundGradient: "from-slate-900 via-indigo-950 to-slate-800",
  basePowerBudgetMW: 100,
  baselineSolarEfficiency: 0.86,
  baselineDailyRadiationMSv: 0.3,
  citations: lunarCitations,
  turnEvents: lunarTurnEvents,
  kidSummary:
    "The south pole of the Moon is special! Mountaintop rims near Shackleton Crater get sunlight almost all year, and deep icy craters hold frozen water. But there's NO air and NO magnetic shield, so the Sun's radiation is dangerous. You'll need to balance solar power, grow food, and keep the crew safe from solar storms!",
};

// ---------------------------------------------------------------------------
// Mars — Gale Crater (MSL Curiosity Rover Site)
// Primary data sources: NASA MSL Curiosity REMS (Rover Environmental
// Monitoring Station) & RAD (Radiation Assessment Detector) instruments.
// ---------------------------------------------------------------------------
const marsTurnEvents: TurnEvent[] = [
  {
    id: "nominal_sol1",
    label: "Sol 1 — Arrival Ops",
    description: "Outpost systems check out nominal. REMS records typical Gale Crater conditions: thin CO₂ atmosphere at 610 Pa.",
    kidFriendlyDescription: "Welcome to Mars! Everything's starting up. The air pressure here is 170 times less than Earth's — but your base keeps you safe inside!",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.0,
    shieldingWearDelta: 0,
  },
  {
    id: "regional_dust_storm",
    label: "Sol 2 — Regional Dust Storm",
    description: "REMS detects opacity (tau) rising to 2.5. Solar panel efficiency drops 40% as dust coats panels. Similar conditions to 2018 global dust storm that ended Opportunity.",
    kidFriendlyDescription: "A Mars dust storm is blowing! Dust covers your solar panels like a dirty window. You're getting way less power — be careful how you spend it!",
    powerDeltaMW: -22,
    radiationSpikeMultiplier: 0.8,
    lifeSupportStressFactor: 1.2,
    shieldingWearDelta: 0.06,
  },
  {
    id: "perchlorate_soil_discovery",
    label: "Sol 3 — Perchlorate Soil Alert",
    description: "MECA soil analysis detects perchlorate salts (~0.5% by weight). Life support hydroponics require additional filtration power to process safe growing media.",
    kidFriendlyDescription: "The Mars soil contains a chemical called perchlorate that's dangerous for plants. Your life support team needs extra power to filter it out before you can grow food safely.",
    powerDeltaMW: -6,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.3,
    shieldingWearDelta: 0,
  },
  {
    id: "solar_flare_thin_atm",
    label: "Sol 4 — Solar Particle Event",
    description: "RAD detects elevated SEP flux. Mars' thin CO₂ atmosphere offers ≈12% the shielding of Earth's atmosphere. Radiation dose rate spikes 3×.",
    kidFriendlyDescription: "The Sun is shooting dangerous particles at Mars! Earth's thick air normally stops most of them, but Mars has very thin air — your radiation shields are really important right now.",
    powerDeltaMW: -8,
    radiationSpikeMultiplier: 3.0,
    lifeSupportStressFactor: 1.1,
    shieldingWearDelta: 0.14,
  },
  {
    id: "co2_frost_cycle",
    label: "Sol 5 — CO₂ Frost Condensation",
    description: "Night temperatures drop to −80°C. CO₂ frost forms on exposed surfaces, increasing thermal load on habitat seals and power lines.",
    kidFriendlyDescription: "Mars gets SO cold at night that the air itself starts to freeze! Your base needs extra heating to prevent cracks, like warming up a frozen water pipe.",
    powerDeltaMW: -14,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.15,
    shieldingWearDelta: 0.08,
  },
  {
    id: "global_dust_storm",
    label: "Sol 6 — Global Dust Storm (tau > 8)",
    description: "REMS records opacity above tau 8.0 — a planet-encircling storm like the 2018 event. Solar panel output reduced 70%. RTG/fuel cell backup critical.",
    kidFriendlyDescription: "The biggest kind of Martian dust storm is happening! It covers the WHOLE planet. Your solar panels are almost completely blocked. Time to use backup power very carefully!",
    powerDeltaMW: -38,
    radiationSpikeMultiplier: 0.6,
    lifeSupportStressFactor: 1.4,
    shieldingWearDelta: 0.1,
  },
  {
    id: "subsurface_water_find",
    label: "Sol 7 — Subsurface Hydrated Minerals",
    description: "Ground-penetrating radar detects hydrated sulfate minerals 2 m below the surface. Drilling operation successful; supplemental water source available.",
    kidFriendlyDescription: "Your drill found water hiding underground inside minerals — like squeezing a wet sponge! This is a huge discovery that gives you backup water for the crew.",
    powerDeltaMW: -10,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 0.7,
    shieldingWearDelta: 0,
  },
  {
    id: "storm_clearing",
    label: "Sol 8 — Storm Clearing, Panel Dust-Off",
    description: "Dust storm begins clearing. Crew EVA to clean solar panels (similar to dust-cleaning events observed saving Spirit/Opportunity). Power generation partially restored (+20 MW).",
    kidFriendlyDescription: "The storm is passing! Your crew is going outside in their spacesuits to wipe off the solar panels — just like cleaning dirty windows. Power is coming back!",
    powerDeltaMW: 20,
    radiationSpikeMultiplier: 1.1,
    lifeSupportStressFactor: 1.1,
    shieldingWearDelta: 0.05,
  },
  {
    id: "methane_detection",
    label: "Sol 9 — Methane Spike Detection",
    description: "SAM (Sample Analysis at Mars) detects a methane spike (21 ppbv). Science team excited; life support atmospheric monitors on alert for unexpected chemistry.",
    kidFriendlyDescription: "Your sensors smell something weird — methane gas! On Earth this usually comes from living things, but on Mars we're not sure yet. Scientists are very excited about this mystery!",
    powerDeltaMW: -5,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.05,
    shieldingWearDelta: 0,
  },
  {
    id: "mission_complete_mars",
    label: "Sol 10 — Mission Evaluation",
    description: "Mission control conducts final systems review and science data downlink. Earth is currently 20 light-minutes away; all logs transmitted.",
    kidFriendlyDescription: "Last day on Mars! Mission Control is checking all your work — but remember, messages take 20 minutes each way to reach Earth! Let's see how you did.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.0,
    shieldingWearDelta: 0,
  },
];

const marsCitations: NasaCitation[] = [
  {
    datasetName: "MSL Curiosity REMS — Surface Atmospheric Pressure",
    missionInstrument: "NASA Mars Science Laboratory / REMS (Rover Environmental Monitoring Station)",
    parameter: "Atmospheric Pressure at Gale Crater Floor",
    value: "~610 Pa average (~0.6% of Earth sea-level pressure of 101,325 Pa)",
    kidFriendlyExplanation: "Mars air is super thin — 170 times less than Earth's! You couldn't breathe it, and it barely protects you from space radiation. Your habitat is like a pressurized submarine on a distant world.",
    sourceUrl: "https://mars.nasa.gov/msl/spacecraft/instruments/rems/",
  },
  {
    datasetName: "MSL Curiosity RAD — Surface Radiation Dose",
    missionInstrument: "NASA Mars Science Laboratory / RAD (Radiation Assessment Detector)",
    parameter: "Average Surface Radiation Dose Rate",
    value: "0.64 mSv/day baseline (Gale Crater); rises to several mSv/day during Solar Particle Events",
    kidFriendlyExplanation: "Every day on Mars you get about twice the radiation dose of someone on Earth. During solar storms it can get much worse — that's why your radiation shield is so important!",
    sourceUrl: "https://mars.nasa.gov/msl/spacecraft/instruments/rad/",
  },
  {
    datasetName: "REMS Dust Opacity (tau) — Dust Storm Monitoring",
    missionInstrument: "NASA MSL Curiosity / MCS & REMS; MRO MCS",
    parameter: "Global Dust Storm Solar Panel Reduction",
    value: "Tau >8.0 reduces solar insolation by 70–98% (2018 global storm ended Opportunity rover at tau ~10.8)",
    kidFriendlyExplanation: "Mars dust storms can block almost all sunlight — imagine putting your solar panels in a dark closet! That's why the 2018 storm was so bad it shut down the Opportunity rover forever.",
    sourceUrl: "https://www.nasa.gov/feature/jpl/opportunity-s-decade-of-mars-exploration-came-to-an-unexpected-end",
  },
  {
    datasetName: "MSL Curiosity SAM — Methane Detection",
    missionInstrument: "NASA MSL Curiosity / SAM (Sample Analysis at Mars)",
    parameter: "Atmospheric Methane Concentration (spike events)",
    value: "21 ppbv (June 2019 peak); background ~0.4 ppbv; seasonal variation observed",
    kidFriendlyExplanation: "Curiosity's 'nose' (a super-sensitive chemistry lab) smelled methane on Mars! On Earth, methane usually comes from animals or microbes. We don't know yet if it means Mars has life — it's one of the biggest mysteries in science!",
    sourceUrl: "https://www.nasa.gov/feature/jpl/curiosity-detects-unusually-high-methane-levels-on-mars",
  },
];

export const MARS_GALE_CRATER: MissionEnvironment = {
  id: "mars_gale_crater",
  name: "Mars",
  subtitle: "Gale Crater — MSL Curiosity Site",
  emoji: "🔴",
  backgroundGradient: "from-red-950 via-orange-950 to-slate-900",
  basePowerBudgetMW: 100,
  baselineSolarEfficiency: 0.6,
  baselineDailyRadiationMSv: 0.64,
  citations: marsCitations,
  turnEvents: marsTurnEvents,
  kidSummary:
    "Gale Crater on Mars is where NASA's Curiosity rover lives! Mars has a super-thin atmosphere (mostly CO₂), giant planet-wide dust storms, and radiation from space. The good news: there's water hiding underground! You'll need to manage power through dust storms, protect your crew from solar bursts, and find clever ways to grow food on the Red Planet.",
};

export const MISSION_ENVIRONMENTS: Record<MissionEnvironmentId, MissionEnvironment> = {
  lunar_south_pole: LUNAR_SOUTH_POLE,
  mars_gale_crater: MARS_GALE_CRATER,
};

export const TOTAL_TURNS = 10;
export const TOTAL_POWER_MW = 100;
export const MIN_SYSTEM_HEALTH = 0;
export const MAX_SYSTEM_HEALTH = 100;
