// ============================================================
// judgeDemoData.ts — Realistic Mock Telemetry & Rapid Game State Engine
// Generates robust, valid GameState, telemetryHistory, and subsystems
// data for hackathon judges to evaluate Outpost Commander in < 3 minutes.
// ============================================================

import type {
  GameState,
  TurnResult,
  SubsystemId,
  SubsystemState,
  CrewState,
  DifficultyTier,
  IncidentChoiceRecord,
} from "../engine/simulationEngine";
import { createInitialCrewMembers } from "../engine/simulationEngine";
import type { MissionEnvironment } from "../data/nasaConstants";
import { LUNAR_SOUTH_POLE } from "../data/nasaConstants";
import type { IncidentCard, IncidentChoice } from "../data/incidentCards";
import type { HistoricScenario } from "../data/scenarioData";
import { normalizeSeed } from "./seededRandom";

/**
 * Creates 10 turns of realistic, NASA-grounded telemetry history.
 * Populates Subsystems, Crew vitals, Power Allocations, and Events
 * so SVG charts, flight recorder replay, and debrief worksheets render flawlessly.
 */
export function createMockTelemetryHistory(
  environment: MissionEnvironment = LUNAR_SOUTH_POLE,
  difficulty: DifficultyTier = "commander",
  turnsToGenerate: number = 10
): TurnResult[] {
  const history: TurnResult[] = [];
  const events = environment.turnEvents || [];

  // Simulated metrics across 10 Sols
  const profiles = [
    // Sol 1: Arrival & Nominal Ops
    {
      budget: 100,
      alloc: { powerGrid: 25, lifeSupport: 25, radiationShielding: 25, foodProduction: 25 },
      health: { grid: 95, ls: 96, shield: 94, food: 95 },
      wear: { grid: 0.02, ls: 0.01, shield: 0.02, food: 0.01 },
      morale: 88,
      o2: 98,
      food: 14.5,
      radDelta: 0.08,
      score: 95,
      summary: "Sol 1 Nominal Touchdown: Solar array tracking calibrated. Habitat pressurized with nominal ECLSS balance.",
      kidSummary: "Welcome to the base! All systems are green and humming happily.",
    },
    // Sol 2: Minor Solar Storm
    {
      budget: 100,
      alloc: { powerGrid: 20, lifeSupport: 30, radiationShielding: 30, foodProduction: 20 },
      health: { grid: 93, ls: 94, shield: 92, food: 92 },
      wear: { grid: 0.04, ls: 0.02, shield: 0.05, food: 0.02 },
      morale: 86,
      o2: 96,
      food: 13.5,
      radDelta: 0.14,
      score: 92,
      summary: "Sol 2 Solar Proton Influx: Magnetic deflector absorbed elevated background flux. Shield integrity steady.",
      kidSummary: "A tiny space storm blew by, but your shields kept everyone safe!",
    },
    // Sol 3: Subsurface Cryo Drill Run
    {
      budget: 100,
      alloc: { powerGrid: 30, lifeSupport: 25, radiationShielding: 25, foodProduction: 20 },
      health: { grid: 90, ls: 92, shield: 90, food: 90 },
      wear: { grid: 0.06, ls: 0.04, shield: 0.06, food: 0.03 },
      morale: 85,
      o2: 95,
      food: 12.5,
      radDelta: 0.23,
      score: 90,
      summary: "Sol 3 Cryo-Drill Activation: Water ice core extracted. Regolith volatiles fed into water recovery buffer.",
      kidSummary: "You drilled into deep ice! Free drinking water for the crew.",
    },
    // Sol 4: Thermal Gradient Peak
    {
      budget: 95,
      alloc: { powerGrid: 25, lifeSupport: 25, radiationShielding: 30, foodProduction: 15 },
      health: { grid: 87, ls: 89, shield: 88, food: 86 },
      wear: { grid: 0.08, ls: 0.05, shield: 0.09, food: 0.05 },
      morale: 84,
      o2: 93,
      food: 11.5,
      radDelta: 0.40,
      score: 87,
      summary: "Sol 4 Deep Freeze Thermal Gradient: Structural heating elements countered 200°C rim shadow swing.",
      kidSummary: "It got freezing cold outside, but habitat heaters kept the crew warm.",
    },
    // Sol 5: Hydroponic Harvest Milestone
    {
      budget: 110,
      alloc: { powerGrid: 20, lifeSupport: 30, radiationShielding: 20, foodProduction: 40 },
      health: { grid: 89, ls: 92, shield: 87, food: 94 },
      wear: { grid: 0.09, ls: 0.06, shield: 0.10, food: 0.04 },
      morale: 90,
      o2: 96,
      food: 14.2, // Harvest added +3.5 days!
      radDelta: 0.20,
      score: 94,
      summary: "Sol 5 Fresh Hydroponic Harvest: 48 kg fresh greens gathered. Crew morale surged with fresh nutrition.",
      kidSummary: "Harvest day! The crew ate delicious space-grown lettuce and tomatoes.",
    },
    // Sol 6: Major X-Class Solar Particle Event (SPE)
    {
      budget: 100,
      alloc: { powerGrid: 15, lifeSupport: 20, radiationShielding: 50, foodProduction: 15 },
      health: { grid: 82, ls: 84, shield: 90, food: 82 },
      wear: { grid: 0.13, ls: 0.09, shield: 0.18, food: 0.08 },
      morale: 83,
      o2: 90,
      food: 13.0,
      radDelta: 0.30, // Held low by 50 MW shielding!
      score: 88,
      summary: "Sol 6 X-Class SPE Weathered: Active water-walls energized with 50 MW deflection, holding crew dosage to +0.3 mSv.",
      kidSummary: "Major solar storm weathered! Your magnetic shield force field blocked the radiation.",
    },
    // Sol 7: Battery Recharge & Post-Storm Maintenance
    {
      budget: 100,
      alloc: { powerGrid: 30, lifeSupport: 25, radiationShielding: 25, foodProduction: 20 },
      health: { grid: 85, ls: 86, shield: 86, food: 84 },
      wear: { grid: 0.14, ls: 0.10, shield: 0.19, food: 0.09 },
      morale: 85,
      o2: 92,
      food: 12.0,
      radDelta: 0.15,
      score: 89,
      summary: "Sol 7 Grid Rebalancing: Energy reserves cycled into secondary storage capacitors after the storm pass.",
      kidSummary: "Engineers patched up the power lines and topped off the batteries.",
    },
    // Sol 8: Regolith Micro-Puncture Triage
    {
      budget: 95,
      alloc: { powerGrid: 25, lifeSupport: 30, radiationShielding: 25, foodProduction: 15 },
      health: { grid: 83, ls: 88, shield: 84, food: 82 },
      wear: { grid: 0.16, ls: 0.12, shield: 0.22, food: 0.11 },
      morale: 86,
      o2: 94,
      food: 11.0,
      radDelta: 0.18,
      score: 88,
      summary: "Sol 8 Airlock Maintenance: Pressure bulkheads inspect nominal. Oxygen recycling holds at 94%.",
      kidSummary: "Crew checked all air seals and made sure not a single drop of oxygen leaked.",
    },
    // Sol 9: Pre-Departure Resource Conservation
    {
      budget: 85,
      alloc: { powerGrid: 20, lifeSupport: 30, radiationShielding: 25, foodProduction: 10 },
      health: { grid: 80, ls: 86, shield: 82, food: 80 },
      wear: { grid: 0.18, ls: 0.14, shield: 0.24, food: 0.13 },
      morale: 88,
      o2: 93,
      food: 10.0,
      radDelta: 0.12,
      score: 87,
      summary: "Sol 9 Mission Data Consolidation: Telemetry science packets beamed to Houston Mission Control.",
      kidSummary: "Mission wrap-up begins! All science data safely transmitted to Earth.",
    },
    // Sol 10: Final Expedition Completion & Orbit Rendezvous
    {
      budget: 100,
      alloc: { powerGrid: 25, lifeSupport: 30, radiationShielding: 25, foodProduction: 20 },
      health: { grid: 84, ls: 92, shield: 88, food: 90 },
      wear: { grid: 0.19, ls: 0.14, shield: 0.25, food: 0.14 },
      morale: 94,
      o2: 95,
      food: 9.2,
      radDelta: 0.05,
      score: 95,
      summary: "Sol 10 Mission Accomplished: All 10 Sols survived with positive margins. Artemis Expedition verified successful!",
      kidSummary: "You did it! 10 Sols in deep space, crew is healthy, and the mission is a huge success!",
    },
  ];

  let cumulativeRad = 0;

  for (let i = 0; i < Math.min(turnsToGenerate, profiles.length); i++) {
    const sol = i + 1;
    const p = profiles[i];
    cumulativeRad = Math.round((cumulativeRad + p.radDelta) * 100) / 100;

    const event = events[i] || {
      id: `sol_${sol}_event`,
      label: `Sol ${sol} — Operational Phase`,
      description: p.summary,
      kidFriendlyDescription: p.kidSummary,
      powerDeltaMW: 0,
      radiationSpikeMultiplier: sol === 6 ? 3.5 : 1.0,
      lifeSupportStressFactor: 1.0,
      shieldingWearDelta: 0.02,
    };

    const subsystems: Record<SubsystemId, SubsystemState> = {
      powerGrid: {
        id: "powerGrid",
        label: "Power Grid",
        health: p.health.grid,
        wearAccumulated: p.wear.grid,
        powerDrawMW: p.alloc.powerGrid,
        statusMessage: "Solar array & RTG power balance nominal.",
        kidFriendlyStatus: "Power systems running strong!",
      },
      lifeSupport: {
        id: "lifeSupport",
        label: "Life Support (ECLSS)",
        health: p.health.ls,
        wearAccumulated: p.wear.ls,
        powerDrawMW: p.alloc.lifeSupport,
        statusMessage: "O₂ scrubbers and water recycling loop at 96% efficiency.",
        kidFriendlyStatus: "Clean air and water flowing smoothly!",
      },
      radiationShielding: {
        id: "radiationShielding",
        label: "Radiation & Thermal Shielding",
        health: p.health.shield,
        wearAccumulated: p.wear.shield,
        powerDrawMW: p.alloc.radiationShielding,
        statusMessage: "Magnetic deflection coil active; water-wall bulkheads pressurized.",
        kidFriendlyStatus: "Force field protecting the habitat!",
      },
      foodProduction: {
        id: "foodProduction",
        label: "Hydroponic Bay (Food)",
        health: p.health.food,
        wearAccumulated: p.wear.food,
        powerDrawMW: p.alloc.foodProduction,
        statusMessage: "Aeroponic misting and LED light array operating nominally.",
        kidFriendlyStatus: "Space crops growing nicely!",
      },
    };

    const crew: CrewState = {
      members: createInitialCrewMembers(difficulty),
      morale: p.morale,
      radiationExposureMSv: cumulativeRad,
      safeRadiationLimitMSv: 50,
      careerRadiationExposureMSv: 50 + cumulativeRad,
      careerLimitMSv: 500,
      foodReserveDays: p.food,
      crewCaloricReserveDays: p.food,
      harvestYieldKg: sol >= 5 ? 48.0 : 40.0,
      cropGrowthProgressPercent: sol >= 5 ? 100 : (sol * 20) % 100,
      cropThermalShock: false,
      starvationActive: false,
      oxygenBufferPercent: p.o2,
      recentMoraleEvents: [],
    };

    history.push({
      turn: sol,
      difficulty,
      event,
      powerBudgetMW: p.budget,
      allocation: p.alloc,
      subsystems,
      crew,
      alerts: sol === 6 ? [
        {
          severity: "critical",
          subsystem: "radiationShielding",
          headline: "X-Class SPE Storm Detected",
          detail: "Solar proton burst peaked at 400% background. 50 MW shielding held crew dose to nominal.",
          tradeOffExplanation: "Power diverted from hydroponics to magnetic deflection.",
          kidFriendlyExplanation: "Giant solar flare shielded!",
        }
      ] : [],
      outcome: sol === 10 ? "mission_success" : "ongoing",
      missionScorePercent: p.score,
      turnNarrativeSummary: p.summary,
      kidNarrativeSummary: p.kidSummary,
    });
  }

  return history;
}

/**
 * Standard Incident Choice Records for realistic personalized insights in debrief.
 */
export function createMockIncidentHistory(): IncidentChoiceRecord[] {
  return [
    {
      incidentId: "lunar_trident_drill",
      incidentTitle: "TRIDENT Cryo Ice Drill Breakthrough",
      sol: 3,
      choiceId: "overclock_drill_harvest",
      choiceLabel: "Over-clock Cryo-Drill (+15% Water/O₂ Buffer)",
      tradeOffSummary: "Consumes 25 MW surge, yields permanent +15% water and oxygen recycling buffer.",
      engineeringTakeaway: "You over-clocked the TRIDENT cryo-drill in Shackleton Crater; absorbing the 25 MW grid surge rewarded your outpost with a permanent +15% water and oxygen recycling buffer.",
      specialistName: "Marcus Vance",
      specialistRole: "power_engineer",
      specialistAction: "Surge shunt bypass installed",
    },
    {
      incidentId: "lunar_x_class_spe",
      incidentTitle: "X-Class Solar Particle Event (SPE)",
      sol: 6,
      choiceId: "divert_water_wall",
      choiceLabel: "Energize Active Water-Wall & Magnetic Deflection",
      tradeOffSummary: "Shielding Integrity +20%, Crew Radiation Dosed = 0 mSv, Life Support Health −18%",
      engineeringTakeaway: "You prioritized shielding during the X-class solar flare by energizing the active water-wall; this completely neutralized crew radiation dose, though life support hydroponics dipped temporarily under the diverted megawatts.",
      specialistName: "Dr. Sarah Chen",
      specialistRole: "medical_officer",
      specialistAction: "Administered protective radioprotectants",
    },
    {
      incidentId: "perchlorate_wash_salts",
      incidentTitle: "Perchlorate Regolith Salt Contamination",
      sol: 8,
      choiceId: "catalytic_purification",
      choiceLabel: "Multi-Stage Catalytic Dechlorination (-14 MW)",
      tradeOffSummary: "Consumes 14 MW power, permanently purifies greywater and safeguards crop beds.",
      engineeringTakeaway: "You deployed multi-stage catalytic dechlorination when toxic perchlorate salts infiltrated the well, spending 14 MW to preserve long-term crop safety.",
      specialistName: "Dr. Maya Lin",
      specialistRole: "botanist",
      specialistAction: "Soil bioremediation scrub",
    },
  ];
}

/**
 * Generates Sol 9 High-Stakes Crisis GameState:
 * - Current Sol = 9 (0-indexed currentTurn = 8)
 * - Sols 1-8 realistic telemetry history populated
 * - Low battery / brownout active modifier (-20 MW)
 * - Worn subsystems (powerGrid 48%, battery critical)
 * - Low food/O₂ margins
 * - Active Solar Particle Event ready to trigger
 */
export function createSol9CrisisGameState(
  environment: MissionEnvironment = LUNAR_SOUTH_POLE,
  difficulty: DifficultyTier = "commander",
  missionSeed: string = "JUDGE-SOL9-CRISIS",
  scenario?: HistoricScenario
): GameState {
  const seed = normalizeSeed(missionSeed);
  const history = createMockTelemetryHistory(environment, difficulty, 8);
  const incidents = createMockIncidentHistory().filter((i) => i.sol < 9);

  const subsystems: Record<SubsystemId, SubsystemState> = {
    powerGrid: {
      id: "powerGrid",
      label: "Power Grid",
      health: 48,
      wearAccumulated: 0.42,
      powerDrawMW: 15,
      statusMessage: "CRITICAL: Secondary battery depleted to 18%. Heavy cyclical inverter wear.",
      kidFriendlyStatus: "Warning! Backup batteries are nearly empty!",
    },
    lifeSupport: {
      id: "lifeSupport",
      label: "Life Support (ECLSS)",
      health: 74,
      wearAccumulated: 0.22,
      powerDrawMW: 30,
      statusMessage: "O₂ scrubbers operating under brownout restriction.",
      kidFriendlyStatus: "Air filters working hard on low power!",
    },
    radiationShielding: {
      id: "radiationShielding",
      label: "Radiation & Thermal Shielding",
      health: 65,
      wearAccumulated: 0.35,
      powerDrawMW: 25,
      statusMessage: "High flux alert! Magnetic deflection coils require immediate power boost.",
      kidFriendlyStatus: "Shield coils heating up! Solar storm incoming!",
    },
    foodProduction: {
      id: "foodProduction",
      label: "Hydroponic Bay (Food)",
      health: 72,
      wearAccumulated: 0.18,
      powerDrawMW: 10,
      statusMessage: "Grow lights dimmed to 40% to prevent main breaker trip.",
      kidFriendlyStatus: "Crops are in the dark to save battery!",
    },
  };

  const crew: CrewState = {
    members: createInitialCrewMembers(difficulty),
    morale: 68,
    radiationExposureMSv: 3.42,
    safeRadiationLimitMSv: 50,
    careerRadiationExposureMSv: 53.42,
    careerLimitMSv: 500,
    foodReserveDays: 5.2,
    crewCaloricReserveDays: 5.2,
    harvestYieldKg: 48.0,
    cropGrowthProgressPercent: 40,
    cropThermalShock: false,
    starvationActive: false,
    oxygenBufferPercent: 74,
    recentMoraleEvents: [],
  };

  return {
    missionSeed: seed,
    environment,
    difficulty,
    currentTurn: 8, // 0-indexed; Sol 9 is currentTurn + 1
    history,
    telemetryHistory: history,
    subsystems,
    crew,
    finalOutcome: "ongoing",
    cumulativeScore: 68,
    incidentHistory: incidents,
    activeModifiers: [
      {
        id: "battery_depletion_brownout",
        name: "Secondary Battery Depletion",
        powerDeltaMW: -20,
        turnsRemaining: 2,
      },
    ],
    permanentWaterO2Bonus: 0,
    cumulativeThermalFatigueWear: 0.08,
    micrometeoroidHistory: [],
    scenario,
  };
}

/**
 * Generates Completed 10-Sol GameState for instant debrief & lab report testing:
 * - 10 completed turns in history & telemetryHistory
 * - Score: 88 (Artemis Master Architect rank)
 * - Full 3 incident choices recorded
 * - Safe radiation (<2 mSv), excellent ECLSS buffers
 */
export function createCompletedMissionGameState(
  environment: MissionEnvironment = LUNAR_SOUTH_POLE,
  difficulty: DifficultyTier = "commander",
  missionSeed: string = "JUDGE-DEBRIEF-10",
  scenario?: HistoricScenario
): GameState {
  const seed = normalizeSeed(missionSeed);
  const history = createMockTelemetryHistory(environment, difficulty, 10);
  const incidentHistory = createMockIncidentHistory();

  const subsystems: Record<SubsystemId, SubsystemState> = {
    powerGrid: {
      id: "powerGrid",
      label: "Power Grid",
      health: 84,
      wearAccumulated: 0.16,
      powerDrawMW: 25,
      statusMessage: "Solar arrays & RTG storage cells nominal.",
      kidFriendlyStatus: "All power systems worked great!",
    },
    lifeSupport: {
      id: "lifeSupport",
      label: "Life Support (ECLSS)",
      health: 92,
      wearAccumulated: 0.12,
      powerDrawMW: 30,
      statusMessage: "Closed-loop ECLSS water recovery at 98% efficiency.",
      kidFriendlyStatus: "Clean air and water throughout the mission!",
    },
    radiationShielding: {
      id: "radiationShielding",
      label: "Radiation & Thermal Shielding",
      health: 88,
      wearAccumulated: 0.20,
      powerDrawMW: 25,
      statusMessage: "Active magnetic deflection coils held radiation to 1.85 mSv.",
      kidFriendlyStatus: "Force field held strong against every space storm!",
    },
    foodProduction: {
      id: "foodProduction",
      label: "Hydroponic Bay (Food)",
      health: 90,
      wearAccumulated: 0.11,
      powerDrawMW: 20,
      statusMessage: "Aeroponic crop harvest produced 52 kg fresh biomass.",
      kidFriendlyStatus: "Tons of fresh space veggies harvested!",
    },
  };

  const crew: CrewState = {
    members: createInitialCrewMembers(difficulty),
    morale: 92,
    radiationExposureMSv: 1.85,
    safeRadiationLimitMSv: 50,
    careerRadiationExposureMSv: 51.85,
    careerLimitMSv: 500,
    foodReserveDays: 9.5,
    crewCaloricReserveDays: 9.5,
    harvestYieldKg: 52.0,
    cropGrowthProgressPercent: 100,
    cropThermalShock: false,
    starvationActive: false,
    oxygenBufferPercent: 95,
    recentMoraleEvents: [],
  };

  return {
    missionSeed: seed,
    environment,
    difficulty,
    currentTurn: 10,
    history,
    telemetryHistory: history,
    subsystems,
    crew,
    finalOutcome: "mission_success",
    cumulativeScore: 88,
    incidentHistory,
    activeModifiers: [],
    permanentWaterO2Bonus: 15,
    cumulativeThermalFatigueWear: 0.04,
    micrometeoroidHistory: [],
    scenario,
  };
}

/**
 * Returns a high-stakes Solar Particle Event incident card for Sol 9 crisis testing.
 */
export function getSpeIncidentForEnvironment(environment: MissionEnvironment): IncidentCard {
  return {
    id: `${environment.id}_spe_crisis_sol9`,
    environmentId: environment.id,
    triggerSol: 9,
    severity: "critical",
    title: "X-Class Solar Particle Event (SPE)",
    headline: "Coronal mass ejection delivers 400% radiation spike directly onto outpost",
    description:
      "NOAA Space Weather and NASA CRaTER sensors detect a massive X9.3 solar flare. Energetic solar protons are bombarding the outpost with no planetary magnetosphere to deflect them. Radiation levels spike 400% for the next 24 hours.",
    nasaScience: {
      instrument: "LRO CRaTER & Artemis Orion Active Water-Wall Shielding",
      mission: "NASA Lunar Reconnaissance Orbiter / Artemis Program",
      badgeTitle: "Real NASA Science",
      explanation:
        "NASA's CRaTER instrument measured cosmic radiation dosages that exceed 1 Sievert during intense SPEs. Hydrogen atoms are the most effective particle decelerators because protons match neutron mass; Artemis engineers design habitats to pump water reserves into perimeter bulkheads ('water-walls') to protect crews without generating secondary ionizing splatter.",
      dataSourceUrl: "https://crater.bu.edu/",
    },
    choices: [
      {
        id: "divert_water_wall",
        label: "Energize Active Water-Wall & Magnetic Deflection (-15 MW)",
        shortTag: "Water-Wall",
        description:
          "Siphon 32 MW into the active magnetic deflection field and pump greywater tanks into surrounding habitat bulkheads. Halts hydroponics grow lights for 1 Sol.",
        tradeOffSummary: "Shielding Integrity +20%, Crew Radiation Dosed = 0 mSv, Life Support Health −18%",
        effects: {
          powerDeltaMW: -15,
          radiationDeltaMSv: 0,
          shieldingHealthDelta: 20,
          lifeSupportHealthDelta: -18,
        },
        engineeringTakeaway:
          "You starved your agricultural crops to erect an impenetrable hydrological radiation shield around crew quarters.",
      },
      {
        id: "retreat_storm_shelter",
        label: "Retreat Entire Crew into Buried Regolith Storm Shelter",
        shortTag: "Bunker Evac",
        description:
          "Seal the astronauts inside the subterranean basalt lava tube bunker. Power systems run uninterrupted, but all active outpost research is frozen.",
        tradeOffSummary: "Power Untouched, Morale −15, Minimal Dose (+0.4 mSv)",
        effects: {
          moraleDelta: -15,
          radiationDeltaMSv: 0.4,
          shieldingHealthDelta: 5,
        },
        engineeringTakeaway:
          "Physical regolith mass proved effective, though crew isolation and confinement significantly depressed team morale.",
      },
      {
        id: "absorb_solar_dosage",
        label: "Maintain Full Base Operations & Accept Crew Radiation Exposure",
        shortTag: "Accept Dose",
        description:
          "Keep hydroponics, water recycling, and power grids at 100% output. Astronauts take standard shielding doses while working their stations.",
        tradeOffSummary: "Power Normal, Grid Protected, Crew Radiation Dosed +3.8 mSv",
        effects: {
          radiationDeltaMSv: 3.8,
          moraleDelta: -10,
        },
        engineeringTakeaway:
          "You gambled with biological limits to keep station infrastructure completely undisturbed.",
      },
    ],
  };
}

const sampleDefaultChoices: [IncidentChoice, IncidentChoice] = [
  {
    id: "choice_nominal",
    label: "Engage Standard Mitigation Protocol",
    shortTag: "Standard",
    description: "Follow NASA flight director baseline operational procedures.",
    tradeOffSummary: "Balances power consumption against hardware thermal wear.",
    effects: { powerDeltaMW: -5 },
    engineeringTakeaway: "Baseline standard protocol ensures crew and habitat safety margins.",
  },
  {
    id: "choice_aggressive",
    label: "Emergency Circuit Isolation",
    shortTag: "Isolation",
    description: "Direct all reserve batteries to protect critical life support loops.",
    tradeOffSummary: "Saves astronaut oxygen buffers at the expense of science experiments.",
    effects: { powerDeltaMW: -15, lifeSupportHealthDelta: 10 },
    engineeringTakeaway: "Fast-acting protective shedding halts systemic cascades.",
  },
];

/**
 * Sample Crisis Incidents for the 3 distinct 15-second minigames.
 */
export const SAMPLE_CRISIS_INCIDENTS: Record<
  "magnetic_shield" | "circuit_breaker" | "perchlorate_wash",
  IncidentCard
> = {
  magnetic_shield: {
    id: "sample_spe_magnetic_shield",
    environmentId: "lunar_south_pole",
    triggerSol: 6,
    severity: "critical",
    title: "X-Class Solar Particle Event (SPE)",
    headline: "Coronal mass ejection delivers 400% radiation spike directly onto habitat",
    description:
      "A coronal mass ejection approaches at 1,800 km/s. Align the outpost magnetic deflection vector to match incoming solar proton flux before the wavefront strikes!",
    nasaScience: {
      instrument: "NASA LRO CRaTER & Artemis Active Water-Wall",
      mission: "Artemis Basecamp Shielding",
      badgeTitle: "Solar Physics",
      explanation:
        "Magnetic deflection angles must match incoming solar particle flux vectors to maximize the Lorentz force (F = q(v × B)) and deflect energetic protons away from habitat living modules.",
      dataSourceUrl: "https://crater.bu.edu/",
    },
    choices: sampleDefaultChoices,
  },
  circuit_breaker: {
    id: "sample_grid_circuit_breaker",
    environmentId: "lunar_south_pole",
    triggerSol: 4,
    severity: "critical",
    title: "120 MW Substation Bus Overload",
    headline: "Electrical arc surge threatens main transformer breaker trip",
    description:
      "A sudden cryo-drill pump spike pushed main distribution bus demand to 120 MW (safe ceiling is 100 MW). Triage circuit loads to prevent a catastrophic cascading brownout!",
    nasaScience: {
      instrument: "Fission Surface Power (FSP) Distribution Grid",
      mission: "NASA Space Technology Mission Directorate",
      badgeTitle: "Power Electronics",
      explanation:
        "Space nuclear and solar microgrids operate on automated circuit breaker hierarchies. Non-vital scientific and communications loads are shed first to maintain life support and thermal stability.",
      dataSourceUrl: "https://www.nasa.gov/mission_pages/tdm/fsp/index.html",
    },
    choices: sampleDefaultChoices,
  },
  perchlorate_wash: {
    id: "sample_regolith_perchlorate_wash",
    environmentId: "mars_gale_crater",
    triggerSol: 7,
    severity: "critical",
    title: "Toxic Perchlorate Salt Infiltration",
    headline: "Aggressive oxidizer salts detected in hydroponic graywater inlet",
    description:
      "Curiosity SAM instruments confirmed toxic perchlorate (ClO₄⁻) salts infiltrated the regolith hopper. Balance wash water volume and catalytic heat to cleanse the soil without boiling away water reserves!",
    nasaScience: {
      instrument: "Sample Analysis at Mars (SAM) Wet Chemistry Lab",
      mission: "Mars Science Laboratory (MSL) Curiosity",
      badgeTitle: "Astrobiology",
      explanation:
        "Martian soil contains 0.5–1% calcium and magnesium perchlorates. Catalytic thermal decomposition (250–350°C) with hydrothermal rinsing is required before regolith can sustain agricultural crops.",
      dataSourceUrl: "https://mars.nasa.gov/msl/spacecraft/instruments/sam/",
    },
    choices: sampleDefaultChoices,
  },
};
