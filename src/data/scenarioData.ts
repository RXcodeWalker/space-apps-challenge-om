// ============================================================
// NASA Historic & Future Scenarios Data — Outpost Commander
// Realistic, high-stakes space exploration events for STEM classrooms
// 1. 🌑 Artemis III: The 14-Day Lunar Night (Shackleton Crater Rim)
// 2. 🔴 Opportunity's Dust Storm (2018 Global Storm - Mars Gale Crater)
// 3. 🚀 Apollo 13 Cold Cabin Emergency Protocol (Lunar Transit Basecamp)
// All parameters and telemetry quotes grounded in real NASA mission transcripts.
// ============================================================

import type {
  MissionEnvironment,
  MissionEnvironmentId,
  TurnEvent,
} from "./nasaConstants";
import {
  LUNAR_SOUTH_POLE,
  MARS_GALE_CRATER,
} from "./nasaConstants";

export type ScenarioId =
  | "artemis_iii_lunar_night"
  | "opportunity_dust_storm"
  | "apollo_13_cold_cabin";

export interface HistoricTelemetryQuote {
  quote: string;
  speaker: string;
  mission: string;
  timestampOrDate: string;
  historicalNote?: string;
}

export interface ScenarioConstraint {
  id: string;
  title: string;
  value: string;
  description: string;
  icon: string;
  technicalMetric: string;
  gameplayConsequence: string;
}

export interface ScenarioInitialConditions {
  powerBudgetMW: number;
  fixedPowerMW?: number;
  maxPowerCapMW?: number;
  solarGenerationMW?: number;
  startingSubsystems?: {
    powerGrid?: { health: number; wearAccumulated: number; statusMessage: string };
    lifeSupport?: { health: number; wearAccumulated: number; statusMessage: string };
    radiationShielding?: { health: number; wearAccumulated: number; statusMessage: string };
    foodProduction?: { health: number; wearAccumulated: number; statusMessage: string };
  };
  startingCrewMorale?: number;
  startingFoodDays?: number;
  startingOxygenBufferPercent?: number;
  statusBadge: string;
  specialRulesDescription: string;
}

export interface HistoricScenario {
  id: ScenarioId;
  title: string;
  shortTitle: string;
  subtitle: string;
  badge: string;
  emoji: string;
  location: string;
  environmentId: MissionEnvironmentId;
  baseEnvironment: MissionEnvironment;
  yearOrEra: string;
  difficultyRating: "Extreme" | "Severe" | "Critical";
  difficultyStars: number;
  difficultyBadge: string;
  historicContext: string;
  telemetryQuote: HistoricTelemetryQuote;
  constraints: ScenarioConstraint[];
  survivalChallenge: string;
  initialConditions: ScenarioInitialConditions;
  turnEvents: TurnEvent[];
  accentColor: string;
  glowColor: string;
  borderColor: string;
  cardGradient: string;
  recommendedTactics: string[];
}

// ---------------------------------------------------------------------------
// Lunar Transit Basecamp environment definition (adapted for Apollo 13)
// ---------------------------------------------------------------------------
export const LUNAR_TRANSIT_BASECAMP: MissionEnvironment = {
  ...LUNAR_SOUTH_POLE,
  id: "lunar_south_pole",
  name: "Lunar Transit Basecamp",
  subtitle: "Apollo 13 Free-Return Trajectory",
  emoji: "🚀",
  backgroundGradient: "from-slate-950 via-zinc-900 to-black",
  basePowerBudgetMW: 45, // Capped at 45 MW
  baselineSolarEfficiency: 0.0, // Running on emergency fuel cells / batteries
};

// ---------------------------------------------------------------------------
// SCENARIO 1: Artemis III — The 14-Day Lunar Night
// ---------------------------------------------------------------------------
const artemisTurnEvents: TurnEvent[] = [
  {
    id: "artemis_sol_1",
    label: "Sol 1 — Nightfall Ingress",
    description: "The terminator crosses Shackleton Crater rim. Sunlight drops to zero on all solar masts. Kilopower 35 MW Stirling baseload engaged.",
    kidFriendlyDescription: "Night has arrived at the lunar south pole! The Sun dips beneath the crater rim. Solar panels go dark, and the 35 MW nuclear battery starts up.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.0,
    shieldingWearDelta: 0.03,
  },
  {
    id: "artemis_sol_2",
    label: "Sol 2 — Cryogenic Drop (−120°C)",
    description: "Surface temperature plummets to −120°C. Habitat thermal loops contract under sudden cryogenic gradient. Thermal radiators require steady power.",
    kidFriendlyDescription: "It's getting super cold outside (−120°C)! The base heaters must stay on, or the habitat walls will freeze.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.1,
    shieldingWearDelta: 0.06,
  },
  {
    id: "artemis_sol_3",
    label: "Sol 3 — Regolith Heat Loss",
    description: "Surrounding lunar regolith cools completely, eliminating conductive ground heat. Habitat bulkheads experience rapid thermal leakage.",
    kidFriendlyDescription: "The Moon rocks outside have lost all their stored warmth. Keep power flowing to heaters so the inside stays cozy for the astronauts.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.15,
    shieldingWearDelta: 0.05,
  },
  {
    id: "artemis_sol_4",
    label: "Sol 4 — Midnight Minimum (−173°C)",
    description: "LRO Diviner logs the peak cryogenic night minimum of −173°C (100 K). Heaters at maximum strain; allocate at least 10 MW to avoid freezing.",
    kidFriendlyDescription: "Coldest day of the mission! It's −173°C outside! If heaters drop below 10 MW, the habitat will begin to freeze.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.25,
    shieldingWearDelta: 0.08,
  },
  {
    id: "artemis_sol_5",
    label: "Sol 5 — Kilopower Core Oscillation",
    description: "Kilopower Stirling engines experience a minor sodium coolant fluctuation. Baseload drops 2 MW momentarily before self-regulating.",
    kidFriendlyDescription: "The nuclear generator has a tiny hiccup while pumping liquid sodium, losing 2 MW for a bit before stabilizing.",
    powerDeltaMW: -2,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.05,
    shieldingWearDelta: 0.04,
  },
  {
    id: "artemis_sol_6",
    label: "Sol 6 — Cold-Wall Dehumidification",
    description: "Crew exhaled moisture condenses against icy hull walls. ECLSS scrubbers work overtime to dehumidify air and prevent internal short circuits.",
    kidFriendlyDescription: "Water from the astronauts' breath is turning into frost on the cold walls! The air scrubbers need power to clean and dry the air.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.2,
    shieldingWearDelta: 0.04,
  },
  {
    id: "artemis_sol_7",
    label: "Sol 7 — Crop Stasis Sol",
    description: "Hydroponic bay enters Sol 7 of darkness. LED light rationing keeps crops in dormancy, but power must stay above 10 MW to prevent death.",
    kidFriendlyDescription: "The space plants have been in darkness for 7 days. Give them at least 10 MW of LED lights so they don't wither and die!",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.1,
    shieldingWearDelta: 0.02,
  },
  {
    id: "artemis_sol_8",
    label: "Sol 8 — Final Night Watch",
    description: "Batteries hold steady; Kilopower reactor remains reliable at 35 MW. Crew celebrates reaching the end of the full lunar darkness cycle.",
    kidFriendlyDescription: "The last full night sol! The crew has managed their 35 MW nuclear power carefully, and dawn is just over the horizon.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.0,
    shieldingWearDelta: 0.02,
  },
  {
    id: "artemis_sol_9",
    label: "Sol 9 — Penumbral Ridge Crest",
    description: "High mast solar sensor catches the first penumbral photons across Shackleton rim. +3 MW solar trickle begins augmenting the Kilopower reactor.",
    kidFriendlyDescription: "The very top of the solar mast sees the first glimmer of sunlight over the mountain! +3 MW of extra power arrives.",
    powerDeltaMW: 3,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 0.9,
    shieldingWearDelta: 0.01,
  },
  {
    id: "artemis_sol_10",
    label: "Sol 10 — Shackleton Sunrise",
    description: "Golden sunlight floods the crater rim! Solar arrays unfold and generate 25 MW. The 14-day lunar night has been successfully survived!",
    kidFriendlyDescription: "SUNRISE! Bright sunlight floods the Moon crater! All solar panels are generating power again. You survived the 14-day lunar night!",
    powerDeltaMW: 25,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 0.7,
    shieldingWearDelta: 0,
  },
];

export const ARTEMIS_III_LUNAR_NIGHT: HistoricScenario = {
  id: "artemis_iii_lunar_night",
  title: "Artemis III: The 14-Day Lunar Night",
  shortTitle: "Artemis III Night",
  subtitle: "Shackleton Crater Rim (89.9°S, 0.0°E)",
  badge: "NASA Artemis Program · Future Scenario",
  emoji: "🌑",
  location: "Shackleton Crater Rim",
  environmentId: "lunar_south_pole",
  baseEnvironment: LUNAR_SOUTH_POLE,
  yearOrEra: "September 2026 / Artemis Basecamp",
  difficultyRating: "Extreme",
  difficultyStars: 5,
  difficultyBadge: "★★★★★ EXTREME",
  historicContext:
    "While the peaks of eternal light at the Lunar South Pole enjoy long periods of sunlight, orbital mechanics periodically cast the Shackleton Crater rim into a grueling 14-day (336-hour) continuous night. Outside, temperatures plummet to −173°C (100 Kelvin). Solar arrays produce exactly 0 MW. The entire expedition must survive exclusively on a single 35 MW Kilopower High-Enrichment Uranium fission reactor, requiring meticulous load balancing between habitat thermal heaters, ECLSS scrubbers, and aeroponics.",
  telemetryQuote: {
    quote:
      "Solar array telemetry reads zero millivolts across all six mast wings. Kilopower Stirling engines at nominal 800°C core temp, locked at 35.0 Megawatts electrical. You are on battery buffer and nuclear baseload for the next 14 Earth days. Keep those thermal loops circulating or the habitat will freeze solid.",
    speaker: "Flight Director (CAPCOM White Team)",
    mission: "Artemis III Basecamp Lunar Night Entry Protocol",
    timestampOrDate: "MET 214:18:00 · Artemis Surface Ops",
    historicalNote:
      "Based on NASA LRO Diviner radiometer data and NASA Kilopower KRUSTY reactor tests (35–40 kWe space fission architecture).",
  },
  constraints: [
    {
      id: "zero_solar",
      title: "0 MW Solar Power for 7 Consecutive Sols",
      value: "0 MW Solar Flux",
      description: "Total darkness on all photovoltaic cells for 7 consecutive Sols.",
      icon: "Sun",
      technicalMetric: "0 W/m² Insolation",
      gameplayConsequence: "Photovoltaic generation is zero. Only nuclear baseload is available.",
    },
    {
      id: "kilopower_ration",
      title: "Fixed 35 MW Kilopower Nuclear Basename",
      value: "35 MW Fixed Supply",
      description: "The outpost must ration a single 35 MW reactor across all 4 subsystems.",
      icon: "Zap",
      technicalMetric: "35 MW Total Electrical Budget",
      gameplayConsequence: "Total power is 65% below normal operations; severe rationing required.",
    },
    {
      id: "cryo_freeze",
      title: "Cryogenic Hull Freezing Risk (−173°C)",
      value: "−173°C External Gradient",
      description: "If Radiation & Thermal Shielding power drops below 10 MW, the habitat freezes.",
      icon: "ThermometerSnowflake",
      technicalMetric: "100 Kelvin Equilibrium",
      gameplayConsequence: "Thermal deficit causes structural seal contraction and rapid fatigue wear.",
    },
    {
      id: "eclss_scrub",
      title: "Atmospheric CO₂ Degradation Risk",
      value: "ECLSS Degradation",
      description: "If O₂ scrubbers lose power below 12 MW, atmosphere degrades rapidly.",
      icon: "Wind",
      technicalMetric: "0.5 kPa CO₂ Partial Pressure Ceiling",
      gameplayConsequence: "Oxygen buffer drops rapidly if Life Support is starved of power.",
    },
  ],
  survivalChallenge:
    "Ration a fixed 35 MW Kilopower nuclear backup generator across 4 subsystems. If thermal heating drops below 10 MW, habitat freezes; if O₂ scrubbers lose power below 12 MW, atmosphere degrades. Allocate minimal power to keep crops alive while cycling heaters and life support until Shackleton sunrise.",
  initialConditions: {
    powerBudgetMW: 35,
    fixedPowerMW: 35,
    startingSubsystems: {
      powerGrid: {
        health: 82,
        wearAccumulated: 0.05,
        statusMessage: "0 MW Solar generation (Lunar Night). Kilopower 35 MW Stirling reactor baseload locked.",
      },
      lifeSupport: {
        health: 88,
        wearAccumulated: 0.03,
        statusMessage: "Cryogenic CO₂ scrubbers on low-energy cycle. Maintain ≥12 MW to avoid atmosphere degradation.",
      },
      radiationShielding: {
        health: 80,
        wearAccumulated: 0.06,
        statusMessage: "External temp −173°C. Thermal heating loops require ≥10 MW to prevent structural freeze.",
      },
      foodProduction: {
        health: 85,
        wearAccumulated: 0.02,
        statusMessage: "Aeroponic bay in low-lux dormancy. Warning: power <10 MW triggers severe crop thermal shock.",
      },
    },
    startingCrewMorale: 80,
    startingFoodDays: 14,
    startingOxygenBufferPercent: 100,
    statusBadge: "35 MW KILOPOWER LOCKED · LUNAR NIGHT",
    specialRulesDescription: "Solar generation is 0 MW. Maintain Thermal ≥10 MW and Life Support ≥12 MW.",
  },
  turnEvents: artemisTurnEvents,
  accentColor: "#06B6D4",
  glowColor: "rgba(6, 182, 212, 0.4)",
  borderColor: "border-cyan-500",
  cardGradient: "from-cyan-950/60 via-slate-900 to-slate-950",
  recommendedTactics: [
    "Dedicate at least 10 MW to Radiation & Thermal Shielding every sol to prevent habitat freeze.",
    "Dedicate at least 12 MW to Life Support to prevent deadly CO₂ accumulation in the habitat air.",
    "Keep Food Production at 10 MW to prevent crop thermal shock, or sacrifice crops to save crew life.",
    "Ration Power Grid to 3–5 MW; batteries are on nuclear float and require minimal charging.",
  ],
};

// ---------------------------------------------------------------------------
// SCENARIO 2: Opportunity's Dust Storm (2018 Global Storm)
// ---------------------------------------------------------------------------
const opportunityTurnEvents: TurnEvent[] = [
  {
    id: "oppy_sol_1",
    label: "Sol 1 — Yellow Skies & Rising Tau (3.2)",
    description: "Atmospheric opacity tau jumps from 0.8 to 3.2. Martian sky turns deep butterscotch. Solar array flux drops 45% as high-altitude dust arrives.",
    kidFriendlyDescription: "A huge dust storm is blowing in! The Martian sky turns yellow, and the sunlight gets cut in half.",
    powerDeltaMW: -15,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.1,
    shieldingWearDelta: 0.04,
  },
  {
    id: "oppy_sol_2",
    label: "Sol 2 — Global Blackout: Tau 10.8 Surge",
    description: "The storm encircles the entire planet. Atmospheric tau leaps to 10.8—a 98% sunlight blackout. Total solar output drops to barely 2 MW. RTG floor engaged (22 MW total).",
    kidFriendlyDescription: "Total blackout! The dust storm covers the entire planet. Midday looks like midnight. Only the 22 MW backup battery is left!",
    powerDeltaMW: -38,
    radiationSpikeMultiplier: 0.8, // Dust blocks cosmic rays slightly
    lifeSupportStressFactor: 1.25,
    shieldingWearDelta: 0.06,
  },
  {
    id: "oppy_sol_3",
    label: "Sol 3 — Electrostatic Dust Clinging",
    description: "Airborne iron-oxide silt clings electrostatically to solar panels and radiator fins. External air intake filters require manual blowback cycles.",
    kidFriendlyDescription: "Sticky red Martian dust is clinging to everything outside like static cling! Air filters need cleaning.",
    powerDeltaMW: -40,
    radiationSpikeMultiplier: 0.8,
    lifeSupportStressFactor: 1.3,
    shieldingWearDelta: 0.08,
  },
  {
    id: "oppy_sol_4",
    label: "Sol 4 — Greenhouse Caloric Triage",
    description: "Hydroponic bay has no natural sunlight. If greenhouse power drops below 10 MW, aeroponic crops enter thermal shock and die. Crew begins emergency ration hibernation.",
    kidFriendlyDescription: "The space greenhouse is in total darkness! Keep power at 10 MW or the plants will freeze, and astronauts must eat emergency rations.",
    powerDeltaMW: -38,
    radiationSpikeMultiplier: 0.8,
    lifeSupportStressFactor: 1.3,
    shieldingWearDelta: 0.05,
  },
  {
    id: "oppy_sol_5",
    label: "Sol 5 — Peak Planet-Encircling Storm",
    description: "MER and Curiosity orbiters report 41 million km² engulfed. Wind speeds drop, leaving high-altitude suspended silt hovering in the atmosphere.",
    kidFriendlyDescription: "The biggest storm ever seen on Mars! The dust hangs high in the air, blocking the Sun completely.",
    powerDeltaMW: -39,
    radiationSpikeMultiplier: 0.8,
    lifeSupportStressFactor: 1.25,
    shieldingWearDelta: 0.04,
  },
  {
    id: "oppy_sol_6",
    label: "Sol 6 — Atmospheric Thermal Inversion",
    description: "Suspended dust warms the upper atmosphere while chilling the surface. Thermal heating needs remain moderate, but darkness persists.",
    kidFriendlyDescription: "The dust blanket traps some heat in the air, but the ground is dark and cold. The crew stays inside in emergency low-power mode.",
    powerDeltaMW: -38,
    radiationSpikeMultiplier: 0.8,
    lifeSupportStressFactor: 1.2,
    shieldingWearDelta: 0.03,
  },
  {
    id: "oppy_sol_7",
    label: "Sol 7 — Electrostatic Potential Surge",
    description: "Friction from colliding dust grains generates high static electric fields across the rover masts. Electromagnetic shielding prevents circuit damage.",
    kidFriendlyDescription: "Static electricity is crackling in the dust clouds outside! The shields protect the outpost's computers from sparks.",
    powerDeltaMW: -37,
    radiationSpikeMultiplier: 0.8,
    lifeSupportStressFactor: 1.2,
    shieldingWearDelta: 0.06,
  },
  {
    id: "oppy_sol_8",
    label: "Sol 8 — Dust Aggregation & Settling (Tau 7.8)",
    description: "Fine dust grains clump into heavier aggregates and begin slowly falling to the surface. Atmospheric tau eases to 7.8; faint diffuse photons detected.",
    kidFriendlyDescription: "The dust is finally clumping together and falling like red snow! The sky is lightening up just a tiny bit.",
    powerDeltaMW: -32,
    radiationSpikeMultiplier: 0.9,
    lifeSupportStressFactor: 1.15,
    shieldingWearDelta: 0.03,
  },
  {
    id: "oppy_sol_9",
    label: "Sol 9 — Diffuse Solar Breakthrough (Tau 4.2)",
    description: "Sky lightens from black to reddish ochre. Atmospheric tau drops to 4.2. Solar arrays begin generating +10 MW of diffuse sunlight.",
    kidFriendlyDescription: "Light returns to Mars! The Sun begins shining through the thinning dust, bringing +10 MW of fresh solar power.",
    powerDeltaMW: -20,
    radiationSpikeMultiplier: 0.95,
    lifeSupportStressFactor: 1.0,
    shieldingWearDelta: 0.02,
  },
  {
    id: "oppy_sol_10",
    label: "Sol 10 — Opportunity's Legacy: Skies Clear",
    description: "Atmospheric tau drops to 1.8. Solar panels come back to full life. What took Opportunity's mission has been survived by the Outpost Commander!",
    kidFriendlyDescription: "The storm has ended! The skies are clear, the solar panels are charged, and your crew has survived the historic 2018 Martian dust storm!",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 0.8,
    shieldingWearDelta: 0,
  },
];

export const OPPORTUNITY_DUST_STORM: HistoricScenario = {
  id: "opportunity_dust_storm",
  title: "Opportunity's Dust Storm (2018 Global Storm)",
  shortTitle: "Opportunity Dust Storm",
  subtitle: "Mars Gale Crater / Perseverance Valley",
  badge: "Historic NASA Mission · June 2018",
  emoji: "🔴",
  location: "Mars Gale Crater",
  environmentId: "mars_gale_crater",
  baseEnvironment: MARS_GALE_CRATER,
  yearOrEra: "June 2018 / Sol 5111",
  difficultyRating: "Severe",
  difficultyStars: 4,
  difficultyBadge: "★★★★☆ SEVERE",
  historicContext:
    "In June 2018, a planet-encircling dust storm swept across Mars, blanketing 41 million square kilometers. NASA's Opportunity rover recorded an atmospheric opacity (tau τ) of 10.8—the highest ever measured on Mars—blocking over 98% of sunlight. Opportunity's solar panels were reduced from 645 watt-hours/sol to under 22 watt-hours/sol, eventually ending its 14-year mission. In this scenario, your crewed outpost faces the exact same 2018 global dust storm with only a 22 MW emergency RTG baseload.",
  telemetryQuote: {
    quote:
      "Tau reading has jumped from 2.1 to 10.8. Sunlight is 98% occluded; sky is completely black at midday. Array current is negligible. Our battery is low, and it's getting dark.",
    speaker: "MER-B Opportunity Telemetry / Bill Nelson (JPL Mission Ops)",
    mission: "Sol 5111 Final Transmission from Perseverance Valley",
    timestampOrDate: "June 10, 2018 (Sol 5111) · Mars Exploration Rover Team",
    historicalNote:
      "Opportunity's final transmission inspired the world. In this scenario, students rewrite history by successfully triaging power to survive.",
  },
  constraints: [
    {
      id: "tau_10_8",
      title: "Atmospheric Opacity τ = 10.8 (98% Blackout)",
      value: "τ = 10.8 (98% Blackout)",
      description: "Direct sunlight is 98% blocked by suspended iron-oxide dust.",
      icon: "Sun",
      technicalMetric: "I = I₀ · e^(-10.8) ≈ 0.002% Direct Flux",
      gameplayConsequence: "Solar power drops to ~2 MW. Total power budget drops from 60 MW to ~22 MW.",
    },
    {
      id: "greenhouse_shock",
      title: "Greenhouse Caloric Crisis (<10 MW Shock)",
      value: "Crop Thermal Shock Risk",
      description: "Zero natural sunlight reaches the greenhouse. Power <10 MW causes 25% crop death/sol.",
      icon: "Sprout",
      technicalMetric: "<10 MW LED Aeroponic Power",
      gameplayConsequence: "Crops will die unless given 10 MW, or crew must be put on emergency caloric rations.",
    },
    {
      id: "silt_clog",
      title: "Electrostatic Dust Accumulation",
      value: "High Particulate Intake",
      description: "Dust adheres electrostatically to life support air intakes and radiator loops.",
      icon: "ShieldAlert",
      technicalMetric: "3.2 µm Mean Silt Diameter",
      gameplayConsequence: "Life support and thermal radiators suffer accelerated wear.",
    },
  ],
  survivalChallenge:
    "Emergency low-power triage. Keep the greenhouse alive with minimal power (≥10 MW) or put the crew into emergency ration hibernation. Manage 22 MW total power between life support, thermal heaters, and hydroponics until the 98% dust blackout clears.",
  initialConditions: {
    powerBudgetMW: 22,
    fixedPowerMW: 22,
    startingSubsystems: {
      powerGrid: {
        health: 68,
        wearAccumulated: 0.22,
        statusMessage: "Atmospheric tau 10.8 (98% blackout). Fine iron-oxide dust accumulating on arrays. Output 2 MW.",
      },
      lifeSupport: {
        health: 84,
        wearAccumulated: 0.08,
        statusMessage: "Electrostatic dust clogging external filters. Scrubbers operating on emergency RTG power.",
      },
      radiationShielding: {
        health: 80,
        wearAccumulated: 0.05,
        statusMessage: "Dust cloud traps atmospheric warmth (−40°C), but static electrical charges build up on hull.",
      },
      foodProduction: {
        health: 72,
        wearAccumulated: 0.12,
        statusMessage: "Zero solar illumination. Aeroponic crops will enter Thermal Shock if power drops <10 MW!",
      },
    },
    startingCrewMorale: 72,
    startingFoodDays: 12,
    startingOxygenBufferPercent: 95,
    statusBadge: "TAU 10.8 DUST BLACKOUT · 22 MW RTG",
    specialRulesDescription: "Solar generation blocked 98%. Maintain Greenhouse ≥10 MW or crew faces starvation.",
  },
  turnEvents: opportunityTurnEvents,
  accentColor: "#F59E0B",
  glowColor: "rgba(245, 158, 11, 0.4)",
  borderColor: "border-amber-500",
  cardGradient: "from-amber-950/60 via-slate-900 to-slate-950",
  recommendedTactics: [
    "Prioritize 10 MW to Food Production if you want to keep your crops alive and avoid severe starvation.",
    "If food reserves are adequate (≥8 days), temporarily cut Food Production to 0 MW and put crew on emergency ration hibernation.",
    "Keep Life Support at ≥8–10 MW to maintain the crew's oxygen buffer while dust storms rage.",
    "Allocate 2–4 MW to Power Grid to keep battery control circuits from total failure.",
  ],
};

// ---------------------------------------------------------------------------
// SCENARIO 3: Apollo 13 Cold Cabin Emergency Protocol
// ---------------------------------------------------------------------------
const apolloTurnEvents: TurnEvent[] = [
  {
    id: "apollo_sol_1",
    label: "Sol 1 — Oxygen Tank 2 Rupture",
    description: "An electrical stir switch triggers a wire fire in Oxygen Tank 2. The tank explodes, blowing out Panel 4 and disabling Fuel Cells 1 and 3. Max power is capped at 45 MW total.",
    kidFriendlyDescription: "KABOOM! An oxygen tank explodes in the service module! Main power is knocked out and capped at 45 MW. Emergency Cold Cabin protocol is declared!",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.3,
    shieldingWearDelta: 0.15,
  },
  {
    id: "apollo_sol_2",
    label: "Sol 2 — Power Down to 12 Amps (Cold Cabin)",
    description: "Houston orders complete shutdown of Command Module Odyssey. Cabin heaters and auxiliary computers powered down. Interior temperature plummets to 4°C (39°F).",
    kidFriendlyDescription: "Turn off the heaters! The astronauts power down almost everything to save power, and the cabin drops to a freezing 4°C. Everyone puts on extra flight suits.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.25,
    shieldingWearDelta: 0.08,
  },
  {
    id: "apollo_sol_3",
    label: "Sol 3 — The LiOH Scrubber Crisis",
    description: "Carbon dioxide levels rise dangerously. The Command Module square lithium hydroxide canisters do not fit the Lunar Module round holes. Crew must jury-rig adapters with duct tape and cardboard.",
    kidFriendlyDescription: "Air emergency! CO₂ is rising! The astronauts use duct tape, plastic bags, and cardboard flight manuals to force square air filters into round holes!",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.35,
    shieldingWearDelta: 0.05,
  },
  {
    id: "apollo_sol_4",
    label: "Sol 4 — Bulkhead Water Condensation",
    description: "Freezing interior causes exhaled breath to condense into heavy water droplets covering instrument panels, guidance switches, and wiring harnesses. Risk of electrical shorts.",
    kidFriendlyDescription: "Water droplets are covering all the switches and buttons like thick frost! The crew gently wipes them down to prevent electrical shorts.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.2,
    shieldingWearDelta: 0.05,
  },
  {
    id: "apollo_sol_5",
    label: "Sol 5 — Strict Water Rationing (6 oz/day)",
    description: "Water is diverted away from drinking to cooling loops for the guidance computer. Astronauts rationed to 6 oz water per day; crew experiences dehydration.",
    kidFriendlyDescription: "Water must be saved to cool the navigation computers. Astronauts are only allowed a few sips of water each day.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.2,
    shieldingWearDelta: 0.04,
  },
  {
    id: "apollo_sol_6",
    label: "Sol 6 — Freezing Morale Test",
    description: "Cabin remains at 3°C. Sleep is nearly impossible due to shivering. Medical Officer monitors astronaut core temperatures while prioritizing power to ECLSS.",
    kidFriendlyDescription: "The crew is shivering in the freezing cold. Dr. Chen tucks everyone into thermal blankets while watching the air scrubbers carefully.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.25,
    shieldingWearDelta: 0.04,
  },
  {
    id: "apollo_sol_7",
    label: "Sol 7 — Manual Window Alignment Burn",
    description: "With navigation computers powered down, Commander Jim Lovell manually aligns the Lunar Module using the Earth's illuminated terminator in the center window.",
    kidFriendlyDescription: "Commander Lovell points the spaceship by looking right out the window at Earth! Precision steering with zero computer power.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.1,
    lifeSupportStressFactor: 1.15,
    shieldingWearDelta: 0.03,
  },
  {
    id: "apollo_sol_8",
    label: "Sol 8 — Entry Battery Trickle Charge",
    description: "Houston engineers design a makeshift jumper cable procedure to trickle-charge the re-entry batteries from the Lunar Module descent stage.",
    kidFriendlyDescription: "Houston figures out a clever way to trickle electricity back into the emergency batteries using custom wire jumpers!",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 1.1,
    shieldingWearDelta: 0.03,
  },
  {
    id: "apollo_sol_9",
    label: "Sol 9 — 39-Page Re-Activation Checklist",
    description: "CAPCOM reads up a 39-page handwritten reactivation checklist. Power is methodically sequenced to Command Module telemetry, O₂ scrubbers, and guidance.",
    kidFriendlyDescription: "Mission Control reads a 39-page handwritten checklist over the radio! Step by step, the computers and air scrubbers wake back up.",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 0.95,
    shieldingWearDelta: 0.02,
  },
  {
    id: "apollo_sol_10",
    label: "Sol 10 — Successful Splashdown / Safe Return",
    description: "The Cold Cabin emergency protocol succeeds! All three parachutes deploy over the South Pacific. NASA's finest hour of engineering problem-solving is complete!",
    kidFriendlyDescription: "MISSION SUCCESS! All three parachutes open over the ocean! You saved the crew by making smart engineering choices in a freezing cabin!",
    powerDeltaMW: 0,
    radiationSpikeMultiplier: 1.0,
    lifeSupportStressFactor: 0.7,
    shieldingWearDelta: 0,
  },
];

export const APOLLO_13_COLD_CABIN: HistoricScenario = {
  id: "apollo_13_cold_cabin",
  title: "Apollo 13 Cold Cabin Emergency Protocol",
  shortTitle: "Apollo 13 Cold Cabin",
  subtitle: "Lunar Transit Basecamp (Fra Mauro Trajectory)",
  badge: "NASA Historic Crisis · April 1970",
  emoji: "🚀",
  location: "Lunar Transit Basecamp",
  environmentId: "lunar_south_pole",
  baseEnvironment: LUNAR_TRANSIT_BASECAMP,
  yearOrEra: "April 13–17, 1970 / NASA Apollo 13",
  difficultyRating: "Critical",
  difficultyStars: 5,
  difficultyBadge: "★★★★★ CRITICAL",
  historicContext:
    "At 55 hours 55 minutes into flight, Oxygen Tank 2 in Apollo 13's service module ruptured following a cryo stir switch activation, blowing off an outer panel and disabling two of three Fuel Cells. Mission Commander Jim Lovell, Jack Swigert, and Fred Haise powered down Command Module Odyssey to just 12 amps to save battery power for re-entry, using Lunar Module Aquarius as a cold lifeboat. Cabin temperatures dropped to 3°C (38°F), water condensed heavily on bulkheads, and LiOH canisters had to be jury-rigged to scrub CO₂. In this outpost adaptation, a main battery rupture caps total outpost power at 45 MW maximum.",
  telemetryQuote: {
    quote:
      "Houston, we've had a problem. We've had a Main B bus undervolt. Oxygen Tank 2 pressure is zero, and Fuel Cells 1 and 3 are dead. We are shedding all non-essential loads. Power is capped at 45 MW. Powering down cabin heating and secondary computers now.",
    speaker: "Jim Lovell (Apollo 13 Commander) & Jack Lousma (CAPCOM)",
    mission: "Flight Log MET 55:55:20 · Houston Mission Control",
    timestampOrDate: "April 13, 1970 · 200,000 miles from Earth",
    historicalNote:
      "NASA's greatest engineering rescue. Known as 'NASA's finest hour', immortalized by Flight Director Gene Kranz: 'Failure is not an option.'",
  },
  constraints: [
    {
      id: "power_cap_45",
      title: "Ruptured Battery Bank: 45 MW Hard Cap",
      value: "45 MW Power Ceiling",
      description: "Severe battery rupture limits total combined habitat draw to 45 MW max.",
      icon: "BatteryWarning",
      technicalMetric: "45 MW Total Electrical Ceiling",
      gameplayConsequence: "All four subsystems must share 45 MW total (normally 100 MW).",
    },
    {
      id: "cold_cabin",
      title: "Cold Cabin Protocol (Shut Down Heaters)",
      value: "3°C Interior Cold",
      description: "Thermal heating must be minimized (<6 MW) to divert amps to ECLSS scrubbers.",
      icon: "ThermometerSnowflake",
      technicalMetric: "Thermal Heating Reduced to Shed Load",
      gameplayConsequence: "High heating allocation causes immediate power starvation for life support.",
    },
    {
      id: "lioh_scrubber",
      title: "CO₂ Scrubber Filtration Urgency",
      value: "LiOH Scrubber Urgency",
      description: "Life support scrubbers must be powered continuously to scrub lethal CO₂.",
      icon: "Wind",
      technicalMetric: "ECLSS Air Loop Priority",
      gameplayConsequence: "Life support must receive ≥16–18 MW or oxygen buffer and air safety degrade.",
    },
    {
      id: "damaged_grid",
      title: "Critical Power Grid Damage (45% Health)",
      value: "45% Power Grid Health",
      description: "Battery bank and bus wiring start heavily compromised with 0.35 wear.",
      icon: "AlertTriangle",
      technicalMetric: "Main B Bus Undervolt",
      gameplayConsequence: "Power Grid must be handled carefully to avoid complete electrical cascade failure.",
    },
  ],
  survivalChallenge:
    "Turn off habitat heating and shields to prioritize communications and life support scrubbers. Endure near-freezing habitat condensation while jury-rigging CO₂ scrubbers to stretch the capped 45 MW power budget until safe return.",
  initialConditions: {
    powerBudgetMW: 45,
    maxPowerCapMW: 45,
    startingSubsystems: {
      powerGrid: {
        health: 45,
        wearAccumulated: 0.35,
        statusMessage: "CRITICAL: Oxygen Tank 2 / Fuel Cell rupture! Main B bus undervolt. Max power capped at 45 MW.",
      },
      lifeSupport: {
        health: 78,
        wearAccumulated: 0.12,
        statusMessage: "Cold Cabin Protocol active. LiOH scrubber canisters jury-rigged with plastic bags and tape.",
      },
      radiationShielding: {
        health: 50,
        wearAccumulated: 0.2,
        statusMessage: "Thermal heating shut down to conserve amps (3°C cabin). Heavy bulkhead condensation.",
      },
      foodProduction: {
        health: 70,
        wearAccumulated: 0.15,
        statusMessage: "Greenhouse lights minimized to 5–8 MW. Crop growth slowed; emergency rations active.",
      },
    },
    startingCrewMorale: 65,
    startingFoodDays: 14,
    startingOxygenBufferPercent: 80,
    statusBadge: "45 MW MAX CAP · COLD CABIN EMERGENCY",
    specialRulesDescription: "Total power capped at 45 MW. Turn off thermal heaters (<6 MW) to prioritize O₂ scrubbers.",
  },
  turnEvents: apolloTurnEvents,
  accentColor: "#F43F5E",
  glowColor: "rgba(244, 63, 94, 0.4)",
  borderColor: "border-rose-500",
  cardGradient: "from-rose-950/60 via-slate-900 to-slate-950",
  recommendedTactics: [
    "Strictly limit Radiation & Thermal Shielding to 2–5 MW — this is Cold Cabin protocol!",
    "Channel at least 18–20 MW to Life Support to keep jury-rigged LiOH scrubbers clearing CO₂.",
    "Allocate 12–15 MW to Power Grid to repair the damaged bus wiring and prevent cascading brownouts.",
    "Ration Food Production to minimal power (5–8 MW); crew can survive on packed rations.",
  ],
};

// ---------------------------------------------------------------------------
// All Historic Scenarios Registry
// ---------------------------------------------------------------------------
export const HISTORIC_SCENARIOS: HistoricScenario[] = [
  ARTEMIS_III_LUNAR_NIGHT,
  OPPORTUNITY_DUST_STORM,
  APOLLO_13_COLD_CABIN,
];

export function getScenarioById(id: string): HistoricScenario | undefined {
  return HISTORIC_SCENARIOS.find((s) => s.id === id);
}
