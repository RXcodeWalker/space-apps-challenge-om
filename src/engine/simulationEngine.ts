// ============================================================
// Simulation Engine — Outpost Commander
// Implements a deterministic 10-turn mission loop for the
// Lunar South Pole and Mars Gale Crater environments, with
// 3 Difficulty Tiers / Commander Ranks:
// 1. Cadet (Ages 7–10): High margin of error, gentle automated hints
// 2. Commander (Standard): Balanced baseline 10-Sol simulation
// 3. Flight Director (Hardcore / Realistic Mode):
//    - Random micro-meteoroid punctures
//    - Actual thermal fatigue degradation curves (Coffin-Manson)
//    - Stricter 500 mSv NASA astronaut career limits (NASA-STD-3001)
// ============================================================

import type { MissionEnvironment, TurnEvent } from "../data/nasaConstants";
import type { IncidentCard, IncidentChoice } from "../data/incidentCards";
import type { FlightDirectorInterventionResult } from "../types/intervention";
import type { HistoricScenario } from "../data/scenarioData";
import {
  TOTAL_TURNS,
  MIN_SYSTEM_HEALTH,
  MAX_SYSTEM_HEALTH,
  GREENHOUSE_BASELINE_POWER_MW,
  GREENHOUSE_THERMAL_SHOCK_THRESHOLD_MW,
  GREENHOUSE_THERMAL_SHOCK_PROGRESS_PENALTY,
  HARVEST_CYCLE_SOLS,
  HARVEST_FOOD_RESERVE_DAYS_BONUS,
  HARVEST_CREW_MORALE_SURGE,
  HARVEST_YIELD_KG_PER_CYCLE,
  STARVATION_HEALTH_PENALTY_PER_TURN,
  STARVATION_REPAIR_SPEED_PENALTY,
} from "../data/nasaConstants";
import {
  DIFFICULTY_PRESETS,
  type DifficultyTier,
  type DifficultyConfig,
  type ThermalFatigueReport,
  type MicrometeoroidStrike,
  type AutomatedHint,
  calculateThermalFatigue,
  rollMicrometeoroidStrike,
  generateCadetAutomatedHints,
} from "../data/difficultyTiers";
import {
  type CrewRoleId,
  type CrewMemberStatus,
  type CrewSkillStats,
  type CrewMember,
  type CrewMoraleEvent,
  type SpecialistRepairEffects,
  type SpecialistRepairOption,
  createInitialCrewMembers,
  INCIDENT_SPECIALIST_REPAIRS,
} from "../data/crewData";
import {
  createSeededRNG,
  generateMissionSeed,
  normalizeSeed,
} from "../utils/seededRandom";

// Re-export difficulty & crew types for easy consumption
export type {
  DifficultyTier,
  DifficultyConfig,
  ThermalFatigueReport,
  MicrometeoroidStrike,
  AutomatedHint,
  CrewRoleId,
  CrewMemberStatus,
  CrewSkillStats,
  CrewMember,
  CrewMoraleEvent,
  SpecialistRepairEffects,
  SpecialistRepairOption,
  HistoricScenario,
};
export { DIFFICULTY_PRESETS, createInitialCrewMembers, INCIDENT_SPECIALIST_REPAIRS };

// ---------------------------------------------------------------------------
// Core type definitions
// ---------------------------------------------------------------------------

export type SubsystemId = "powerGrid" | "lifeSupport" | "radiationShielding" | "foodProduction";

export interface PowerAllocation {
  powerGrid: number;          // MW allocated to power grid management & batteries
  lifeSupport: number;        // MW allocated to O₂ scrubbers & water recycling (ECLSS)
  radiationShielding: number; // MW allocated to magnetic/water-wall & thermal management
  foodProduction: number;     // MW allocated to greenhouse LED lights, aeroponic pumps & heaters
}

export interface SubsystemState {
  id: SubsystemId;
  label: string;
  health: number;           // 0–100 percentage
  wearAccumulated: number;  // 0–1 cumulative wear factor (drives failure risk)
  powerDrawMW: number;      // current turn's allocated MW
  statusMessage: string;    // human-readable status description
  kidFriendlyStatus: string;
  thermalFatigueWear?: number; // structural fatigue wear from cyclic thermal strain
}

export interface CrewState {
  members?: CrewMember[];    // 4 distinct NASA astronauts (Botanist, Power Engineer, Medical Officer, Geologist)
  morale: number;           // 0–100; synchronized team average
  radiationExposureMSv: number; // cumulative mission exposure
  safeRadiationLimitMSv: number; // expedition threshold (45-60 mSv depending on difficulty)
  careerRadiationExposureMSv: number; // NASA career ledger (towards 500 mSv career ceiling)
  careerLimitMSv: number;   // 500 mSv NASA STD-3001 career limit
  foodReserveDays: number;  // days of food remaining (synced with crewCaloricReserveDays)
  crewCaloricReserveDays: number; // NASA BVAD baseline: 2,500 kcal/astronaut/day (10,000 kcal/day total for 4 crew)
  harvestYieldKg: number;   // fresh crop biomass harvested across mission
  cropGrowthProgressPercent: number; // 0% to 100% maturity cycle (3 Sols under adequate power)
  cropThermalShock: boolean; // true if greenhouse power < 10 MW this Sol
  starvationActive: boolean; // true if food reserves hit 0
  oxygenBufferPercent: number; // % of nominal O₂ buffer; 0 = emergency
  recentMoraleEvents?: CrewMoraleEvent[]; // recent crew heroism / sacrifice events
}

export interface MissionAlert {
  severity: "info" | "warning" | "critical";
  subsystem: SubsystemId | "crew" | "power" | "general";
  headline: string;
  detail: string;
  tradeOffExplanation: string; // which engineering trade-off caused this
  kidFriendlyExplanation: string;
}

export type MissionOutcome =
  | "ongoing"
  | "mission_success"
  | "partial_success"
  | "critical_alert";

export interface IncidentChoiceRecord {
  incidentId: string;
  incidentTitle: string;
  sol: number;
  choiceId: string;
  choiceLabel: string;
  tradeOffSummary: string;
  engineeringTakeaway: string;
  specialistRole?: CrewRoleId;
  specialistName?: string;
  specialistAction?: string;
  specialistRiskRewardSummary?: string;
  interventionResult?: FlightDirectorInterventionResult;
}

export interface ActiveModifier {
  id: string;
  name: string;
  powerDeltaMW?: number;
  turnsRemaining?: number; // undefined = permanent
}

export interface TurnResult {
  turn: number;             // 1–10
  difficulty: DifficultyTier;
  event: TurnEvent;
  powerBudgetMW: number;    // effective MW available this turn (after event modifiers)
  allocation: PowerAllocation;
  subsystems: Record<SubsystemId, SubsystemState>;
  crew: CrewState;
  alerts: MissionAlert[];
  outcome: MissionOutcome;
  missionScorePercent: number; // 0–100 running score
  turnNarrativeSummary: string;
  kidNarrativeSummary: string;
  thermalFatigue?: ThermalFatigueReport;
  micrometeoroidStrike?: MicrometeoroidStrike;
  cadetHints?: AutomatedHint[];
}

export interface GameState {
  missionSeed: string;      // Deterministic STEM Classroom Mission Seed (e.g. ARTEMIS-26)
  environment: MissionEnvironment;
  difficulty: DifficultyTier;
  currentTurn: number;      // 1-indexed; 0 = not started
  history: TurnResult[];
  subsystems: Record<SubsystemId, SubsystemState>;
  crew: CrewState;
  finalOutcome: MissionOutcome;
  cumulativeScore: number;
  incidentHistory: IncidentChoiceRecord[];
  activeModifiers: ActiveModifier[];
  permanentWaterO2Bonus: number;
  cumulativeThermalFatigueWear: number;
  micrometeoroidHistory: MicrometeoroidStrike[];
  cadetHints?: AutomatedHint[];
  scenario?: HistoricScenario;
}

// ---------------------------------------------------------------------------
// Constants for the simulation model
// ---------------------------------------------------------------------------

/** Health recovery per MW over baseline (diminishing above 100%). */
const HEALTH_RECOVERY_PER_EXCESS_MW = 1.4;

/** Health degradation per MW under baseline demand. */
const HEALTH_LOSS_PER_DEFICIT_MW = 2.5;

/** Overload penalty: running any system above 120% power triggers wear. */
const OVERLOAD_THRESHOLD_FRACTION = 1.2;
const OVERLOAD_WEAR_RATE = 0.05;

/** Morale modifiers. */
const MORALE_GAIN_GOOD_TURN = 4;
const MORALE_LOSS_LIFE_SUPPORT_LOW = 8;
const MORALE_LOSS_RADIATION_HIGH = 6;
const MORALE_LOSS_FOOD_LOW = 10;

/** Oxygen baseline rates. */
const OXYGEN_RECOVERY_PER_MW_EXCESS = 2;    // % O₂ buffer per MW excess
const OXYGEN_LOSS_PER_MW_DEFICIT = 4;       // % O₂ loss per MW deficit

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function totalAllocatedMW(allocation: PowerAllocation): number {
  return (
    allocation.powerGrid +
    allocation.lifeSupport +
    allocation.radiationShielding +
    allocation.foodProduction
  );
}

function initialSubsystems(difficulty: DifficultyTier): Record<SubsystemId, SubsystemState> {
  const config = DIFFICULTY_PRESETS[difficulty];
  const baselines = config.baselinePowerDemands;

  const isCadet = difficulty === "cadet";
  const isHardcore = difficulty === "flight_director";

  return {
    powerGrid: {
      id: "powerGrid",
      label: "Power Grid",
      health: isCadet ? 92 : isHardcore ? 80 : 85,
      wearAccumulated: isCadet ? 0.02 : isHardcore ? 0.08 : 0.05,
      powerDrawMW: baselines.powerGrid,
      statusMessage: "Solar arrays nominal. RTG on standby.",
      kidFriendlyStatus: "Your solar panels and backup batteries are working great!",
      thermalFatigueWear: 0,
    },
    lifeSupport: {
      id: "lifeSupport",
      label: "Life Support (ECLSS)",
      health: isCadet ? 95 : isHardcore ? 85 : 90,
      wearAccumulated: isCadet ? 0.01 : isHardcore ? 0.05 : 0.02,
      powerDrawMW: baselines.lifeSupport,
      statusMessage: "O₂ scrubbers and closed-loop water recycling nominal.",
      kidFriendlyStatus: "Air and water systems are running cleanly!",
      thermalFatigueWear: 0,
    },
    radiationShielding: {
      id: "radiationShielding",
      label: "Radiation & Thermal Shielding",
      health: isCadet ? 90 : isHardcore ? 75 : 80,
      wearAccumulated: isCadet ? 0.03 : isHardcore ? 0.12 : 0.08,
      powerDrawMW: baselines.radiationShielding,
      statusMessage: "Magnetic wall and regolith shielding at standard deflection.",
      kidFriendlyStatus: "Your radiation shield is protecting the crew like a force field!",
      thermalFatigueWear: 0,
    },
    foodProduction: {
      id: "foodProduction",
      label: "Hydroponic Bay (Food)",
      health: isCadet ? 95 : isHardcore ? 80 : 88,
      wearAccumulated: isCadet ? 0.01 : isHardcore ? 0.06 : 0.03,
      powerDrawMW: baselines.foodProduction,
      statusMessage: "Aeroponic nutrient misting, atmospheric heater, and full-spectrum LED arrays nominal.",
      kidFriendlyStatus: "Your space crops are basking in grow lights and thriving!",
      thermalFatigueWear: 0,
    },
  };
}

function initialCrew(difficulty: DifficultyTier): CrewState {
  const config = DIFFICULTY_PRESETS[difficulty];
  const isCadet = difficulty === "cadet";
  const isHardcore = difficulty === "flight_director";

  // In Flight Director realistic mode, veteran astronaut has an established career baseline
  const careerStartingDose = isHardcore ? 180 : 50;
  const members = createInitialCrewMembers(difficulty);
  const avgMorale = Math.round(members.reduce((sum, m) => sum + m.morale, 0) / members.length);
  const startingFoodDays = isCadet ? 18 : isHardcore ? 14 : 15;

  return {
    members,
    morale: avgMorale || (isCadet ? 95 : isHardcore ? 75 : 85),
    radiationExposureMSv: 0,
    safeRadiationLimitMSv: config.missionRadiationLimitMSv,
    careerRadiationExposureMSv: careerStartingDose,
    careerLimitMSv: config.careerRadiationLimitMSv,
    foodReserveDays: startingFoodDays,
    crewCaloricReserveDays: startingFoodDays,
    harvestYieldKg: 40.0,
    cropGrowthProgressPercent: 0,
    cropThermalShock: false,
    starvationActive: false,
    oxygenBufferPercent: 100,
    recentMoraleEvents: [],
  };
}

// ---------------------------------------------------------------------------
// Core simulation step — processes one turn given player allocation
// ---------------------------------------------------------------------------

function processSubsystem(
  subsystemId: SubsystemId,
  previous: SubsystemState,
  allocatedMW: number,
  eventStressFactor: number,
  extraWear: number,
  config: DifficultyConfig,
  thermalFatigueWear = 0
): SubsystemState {
  const baseline = config.baselinePowerDemands[subsystemId];
  const deficit = Math.max(0, baseline - allocatedMW);
  const excess = Math.max(0, allocatedMW - baseline);
  const overloadFraction = baseline > 0 ? allocatedMW / baseline : 1;

  let healthDelta = 0;
  // Scaled recovery with difficulty multiplier
  healthDelta +=
    excess *
    HEALTH_RECOVERY_PER_EXCESS_MW *
    config.recoveryMultiplier *
    (1 / Math.max(0.5, eventStressFactor));

  // Scaled deficit loss with difficulty penalty
  healthDelta -=
    deficit *
    HEALTH_LOSS_PER_DEFICIT_MW *
    config.deficitPenaltyMultiplier *
    eventStressFactor;

  let newWear = previous.wearAccumulated + extraWear * config.wearRateMultiplier + thermalFatigueWear;
  if (overloadFraction > OVERLOAD_THRESHOLD_FRACTION) {
    newWear +=
      OVERLOAD_WEAR_RATE *
      (overloadFraction - OVERLOAD_THRESHOLD_FRACTION) *
      10 *
      config.wearRateMultiplier;
  }

  // Accumulated wear linearly degrades max recoverable health
  const wearPenalty = newWear * 15;
  const newHealth = clamp(
    previous.health + healthDelta - wearPenalty * 0.3,
    MIN_SYSTEM_HEALTH,
    MAX_SYSTEM_HEALTH
  );

  const { statusMessage, kidFriendlyStatus } = buildSubsystemStatus(
    subsystemId,
    newHealth,
    deficit,
    excess,
    overloadFraction,
    eventStressFactor
  );

  return {
    ...previous,
    health: Math.round(newHealth * 10) / 10,
    wearAccumulated: Math.min(1, Math.round(newWear * 1000) / 1000),
    powerDrawMW: allocatedMW,
    statusMessage,
    kidFriendlyStatus,
    thermalFatigueWear: Math.round(((previous.thermalFatigueWear || 0) + thermalFatigueWear) * 1000) / 1000,
  };
}

function buildSubsystemStatus(
  id: SubsystemId,
  health: number,
  deficit: number,
  _excess: number,
  overloadFraction: number,
  stressFactor: number
): { statusMessage: string; kidFriendlyStatus: string } {
  const labels: Record<SubsystemId, { normal: string; low: string; critical: string; kid: string; kidLow: string; kidCritical: string }> = {
    powerGrid: {
      normal: "Solar arrays and RTG providing stable power output.",
      low: "Battery reserves depleting. Solar generation below demand.",
      critical: "POWER FAILURE RISK — reserves near zero. Immediate reallocation required.",
      kid: "Your solar panels and backup batteries are doing great!",
      kidLow: "Uh oh — the batteries are running low! Move more power to the grid.",
      kidCritical: "EMERGENCY! Almost no power left! Fix this right away!",
    },
    lifeSupport: {
      normal: "O₂ scrubbers and water recycling loop nominal.",
      low: "O₂ buffer dropping. CO₂ scrubbing under-powered.",
      critical: "LIFE SUPPORT CRITICAL — crew O₂ at risk. Immediate power allocation required.",
      kid: "Air and water systems are all working well!",
      kidLow: "The crew is running low on fresh air — add more power to Life Support!",
      kidCritical: "DANGER! The crew needs air NOW! Send more power to Life Support immediately!",
    },
    radiationShielding: {
      normal: "Magnetic deflection and thermal regulation within safe parameters.",
      low: "Shielding degraded. Elevated crew radiation exposure. Thermal stress detected.",
      critical: "SHIELDING FAILURE — crew exposed to hazardous radiation. Solar storm risk extreme.",
      kid: "Your radiation shield is working like a superhero force field!",
      kidLow: "The shield is getting weak — the crew is absorbing more radiation. Add more power!",
      kidCritical: "DANGER! The shield is almost broken! The crew is in serious danger from radiation!",
    },
    foodProduction: {
      normal: "Aeroponic nutrient misting, atmospheric heater, and LED arrays nominal.",
      low: "Crop growth stalled. Sub-optimal photon flux; risk of thermal shock.",
      critical: "GREENHOUSE THERMAL SHOCK — crops dying from sub-zero freeze. Reallocate power immediately.",
      kid: "Your space crops are basking in grow lights and producing fresh food!",
      kidLow: "The greenhouse is getting chilly! Give the plants more light and heat.",
      kidCritical: "FREEZING IN THE GREENHOUSE! Plants are wilting and dying — send power now!",
    },
  };

  const l = labels[id];
  if (health < 30 || (stressFactor > 3 && health < 50)) {
    return { statusMessage: l.critical, kidFriendlyStatus: l.kidCritical };
  }
  if (health < 60 || deficit > 8) {
    return { statusMessage: l.low, kidFriendlyStatus: l.kidLow };
  }
  if (overloadFraction > OVERLOAD_THRESHOLD_FRACTION) {
    return {
      statusMessage: `${l.normal} ⚠ OVERLOAD: running at ${Math.round(overloadFraction * 100)}%.`,
      kidFriendlyStatus: `${l.kid} But it's working TOO hard — this causes extra wear!`,
    };
  }
  return { statusMessage: l.normal, kidFriendlyStatus: l.kid };
}

function computeAlerts(
  prevSubsystems: Record<SubsystemId, SubsystemState>,
  nextSubsystems: Record<SubsystemId, SubsystemState>,
  crew: CrewState,
  event: TurnEvent,
  allocation: PowerAllocation,
  effectiveBudgetMW: number,
  config: DifficultyConfig,
  thermalReport?: ThermalFatigueReport,
  strike?: MicrometeoroidStrike,
  scenario?: HistoricScenario
): MissionAlert[] {
  const alerts: MissionAlert[] = [];
  const totalUsed = totalAllocatedMW(allocation);

  // Over-budget alert
  if (totalUsed > effectiveBudgetMW + 1) {
    alerts.push({
      severity: "critical",
      subsystem: "power",
      headline: "Over-budget Power Allocation",
      detail: `You allocated ${totalUsed} MW but only ${effectiveBudgetMW.toFixed(0)} MW is available this turn.`,
      tradeOffExplanation:
        "Allocating more power than the grid can produce causes brownouts across all systems simultaneously — you can't draw more than you generate.",
      kidFriendlyExplanation:
        "You tried to use more power than your solar panels and batteries make! Everything gets weak at once.",
    });
  }

  // Micro-meteoroid strike alert (Flight Director mode)
  if (strike) {
    alerts.push({
      severity: "critical",
      subsystem: strike.subsystemHit,
      headline: `⚡ ${strike.telemetryHeadline}`,
      detail: `${strike.technicalDetails} Impact velocity: ${strike.impactVelocityKmh.toLocaleString()} km/h. Particle size: ${strike.particleDiameterMm.toFixed(1)} mm.`,
      tradeOffExplanation: strike.mitigationProtocol,
      kidFriendlyExplanation:
        "A hypervelocity space rock pierced your outpost armor! Divert power to patch the damage right away!",
    });
  }

  // Thermal fatigue degradation alert (Flight Director mode)
  if (thermalReport && thermalReport.warningLevel !== "nominal") {
    alerts.push({
      severity: thermalReport.warningLevel === "critical" ? "critical" : "warning",
      subsystem: "radiationShielding",
      headline: `🌡️ Thermal Cycling Fatigue: ${thermalReport.warningLevel.toUpperCase()}`,
      detail: thermalReport.technicalDiagnosis,
      tradeOffExplanation:
        "Actual thermal fatigue follows Coffin-Manson low-cycle expansion strain. Insufficient active thermal loop power allows deep temperature swings to warp composite structural seals.",
      kidFriendlyExplanation:
        "The base is freezing and boiling from space temperature swings! Thermal shielding needs steady power to prevent metal cracking.",
    });
  }

  // Subsystem health drops
  (["powerGrid", "lifeSupport", "radiationShielding", "foodProduction"] as SubsystemId[]).forEach((id) => {
    const prev = prevSubsystems[id];
    const next = nextSubsystems[id];
    const drop = prev.health - next.health;

    if (next.health < 30) {
      const tradeOffs: Record<SubsystemId, string> = {
        powerGrid:
          "Starving the Power Grid to feed other systems triggers a cascade: without power generation, everything else shuts down too.",
        lifeSupport:
          "Diverting power from Life Support to Shielding during a storm saves the crew from radiation but risks their air supply — a classic mission survival dilemma.",
        radiationShielding:
          "Powering Life Support and the Grid at the expense of Shielding exposes the crew to cumulative radiation — a risk that grows invisibly every turn.",
        foodProduction:
          "Cutting power to the Greenhouse Bay plunges crops into thermal shock: plants freeze, growth halts, and starvation penalties loom.",
      };
      const kidExplanations: Record<SubsystemId, string> = {
        powerGrid:
          "Your power system is almost broken! Without power, NOTHING works — not the air system, not the shields. Power is the most important thing!",
        lifeSupport:
          "The crew is almost out of fresh air! You protected them from radiation, but now they need life support power urgently.",
        radiationShielding:
          "The radiation shield is almost gone! The crew has been absorbing dangerous rays that add up over time — like getting too much sunburn, but invisible.",
        foodProduction:
          "The space greenhouse is freezing! Your plants are wilting and dying from lack of heat and light. Send power to save the food supply!",
      };
      alerts.push({
        severity: "critical",
        subsystem: id,
        headline: `${nextSubsystems[id].label} CRITICAL`,
        detail: `Health dropped to ${next.health.toFixed(1)}%. Immediate power reallocation required.`,
        tradeOffExplanation: tradeOffs[id],
        kidFriendlyExplanation: kidExplanations[id],
      });
    } else if (drop > 18) {
      alerts.push({
        severity: "warning",
        subsystem: id,
        headline: `${nextSubsystems[id].label} Degrading Fast`,
        detail: `Health fell ${drop.toFixed(1)} points this turn. Consider reallocating power.`,
        tradeOffExplanation: `Rapid health decline in ${nextSubsystems[id].label} means the current power allocation is too low relative to demand.`,
        kidFriendlyExplanation: `The ${nextSubsystems[id].label} lost a lot of health this turn. Try giving it more power!`,
      });
    }
  });

  // Greenhouse Thermal Shock Alert (<10 MW)
  if (crew.cropThermalShock) {
    alerts.push({
      severity: "warning",
      subsystem: "foodProduction",
      headline: "❄️ Greenhouse Thermal Shock (<10 MW)",
      detail: "Crop bay heaters offline under insufficient power (<10 MW). Plants entered thermal shock and lost 25% growth progress this Sol.",
      tradeOffExplanation: "Extreme planetary night/shadow temperatures require continuous atmospheric heating (>=10 MW) to protect aeroponic root mist from freezing solid.",
      kidFriendlyExplanation: "Brrr! The space greenhouse is freezing! The plants got cold shock and lost 25% of their growth progress.",
    });
  }

  // Crew Starvation Emergency Alert
  if (crew.starvationActive) {
    alerts.push({
      severity: "critical",
      subsystem: "crew",
      headline: "🚨 Crew Starvation Emergency (0 Days Food)",
      detail: "Caloric reserves depleted (0 kcal). Astronauts suffer -15 health per Sol and -20% subsystem repair speed penalty.",
      tradeOffExplanation: "Astronauts require 2,500 kcal/day (NASA BVAD standard). Starvation impairs cognitive focus and causes rapid physiological breakdown.",
      kidFriendlyExplanation: "EMERGENCY! The astronauts are starving! With no food left, everyone is weak and systems take longer to fix. Reallocate power to Food Production now!",
    });
  }

  // O2 alert
  if (crew.oxygenBufferPercent < 25) {
    alerts.push({
      severity: "critical",
      subsystem: "crew",
      headline: "O₂ Emergency — Crew at Risk",
      detail: `Oxygen buffer at ${crew.oxygenBufferPercent.toFixed(0)}%. CO₂ scrubbing critically under-powered.`,
      tradeOffExplanation:
        "Oxygen regeneration requires sustained Life Support power. Prioritising shielding or grid in previous turns depleted the O₂ buffer.",
      kidFriendlyExplanation:
        "EMERGENCY! The crew is running out of breathable air! Life support needs power right now!",
    });
  }

  // Radiation alert & strict NASA 500 mSv career limit
  if (config.strictCareerLimitEnforcement && crew.careerRadiationExposureMSv > config.careerRadiationLimitMSv) {
    alerts.push({
      severity: "critical",
      subsystem: "crew",
      headline: "NASA Flight Surgeon Advisory: 500 mSv Career Ceiling Exceeded",
      detail: `Crew cumulative career exposure reached ${crew.careerRadiationExposureMSv.toFixed(
        1
      )} mSv (Strict NASA-STD-3001 Limit: 500 mSv). Grounding protocol initiated.`,
      tradeOffExplanation:
        "NASA astronaut career radiation limit of 500 mSv represents the 3% REID (Risk of Exposure-Induced Death) cancer cap. Breaching this triggers mandatory flight status revocation.",
      kidFriendlyExplanation:
        "DANGER! The astronauts have reached the maximum safe lifetime radiation limit! Mission abort protocol active.",
    });
  } else if (crew.radiationExposureMSv > config.missionRadiationLimitMSv * 0.7) {
    alerts.push({
      severity: "warning",
      subsystem: "crew",
      headline: "Crew Radiation Exposure Elevated",
      detail: `Expedition dose: ${crew.radiationExposureMSv.toFixed(2)} mSv (Expedition Limit: ${
        config.missionRadiationLimitMSv
      } mSv | Career Ledger: ${crew.careerRadiationExposureMSv.toFixed(1)} / 500 mSv).`,
      tradeOffExplanation:
        "Radiation exposure is cumulative and irreversible — a small deficit in shielding each turn compiles into serious biological risk.",
      kidFriendlyExplanation:
        "The crew has absorbed quite a bit of radiation! Keep the radiation shield strong for the rest of the mission.",
    });
  }

  // Turn event alerts
  if (event.radiationSpikeMultiplier >= 3) {
    alerts.push({
      severity: "critical",
      subsystem: "general",
      headline: event.label,
      detail: event.description,
      tradeOffExplanation:
        "During a major Solar Particle Event, engineers must choose: pour power into shielding or maintain life support. There is no free option.",
      kidFriendlyExplanation: event.kidFriendlyDescription,
    });
  } else if (event.powerDeltaMW < -15) {
    alerts.push({
      severity: "warning",
      subsystem: "power",
      headline: event.label,
      detail: event.description,
      tradeOffExplanation:
        "A power reduction event compresses the available budget — every MW becomes more valuable and trade-offs sharpen.",
      kidFriendlyExplanation: event.kidFriendlyDescription,
    });
  } else if (event.powerDeltaMW !== 0 || event.lifeSupportStressFactor !== 1.0) {
    alerts.push({
      severity: "info",
      subsystem: "general",
      headline: event.label,
      detail: event.description,
      tradeOffExplanation: "",
      kidFriendlyExplanation: event.kidFriendlyDescription,
    });
  }

  // Scenario-Specific Critical Alerts
  if (scenario) {
    if (scenario.id === "artemis_iii_lunar_night") {
      if (allocation.radiationShielding < 10) {
        alerts.push({
          severity: "critical",
          subsystem: "radiationShielding",
          headline: "🥶 HABITAT FREEZE: Cryogenic Cold Penetrating Hull",
          detail: `Thermal heating allocated only ${allocation.radiationShielding} MW (minimum 10 MW required). External temperature −173°C is freezing structural seals!`,
          tradeOffExplanation:
            "During the 14-day lunar night, surface temperatures plunge to 100 K (−173°C). Radiator loops require ≥10 MW continuously to keep interior habitat livable.",
          kidFriendlyExplanation:
            "WARNING! The Moon night is −173°C and the habitat is freezing! Send at least 10 MW to heaters right now!",
        });
      }
      if (allocation.lifeSupport < 12) {
        alerts.push({
          severity: "critical",
          subsystem: "lifeSupport",
          headline: "⚠️ ECLSS CO₂ SCRUBBERS UNDERVOLTAGE",
          detail: `Life Support allocated ${allocation.lifeSupport} MW (minimum 12 MW required). Cryogenic CO₂ scrubbers failing to regenerate; crew breathing quality declining.`,
          tradeOffExplanation:
            "Closed-loop ECLSS requires at least 12 MW to cycle cryogenic CO₂ desiccant beds during the prolonged lunar darkness.",
          kidFriendlyExplanation:
            "AIR WARNING! The air scrubbers don't have enough power to clean out carbon dioxide! Give Life Support at least 12 MW!",
        });
      }
    } else if (scenario.id === "opportunity_dust_storm") {
      if (allocation.foodProduction < 10) {
        alerts.push({
          severity: "warning",
          subsystem: "foodProduction",
          headline: "🔴 DUST BLACKOUT: Aeroponics in Thermal Shock",
          detail: "Atmospheric tau 10.8 (98% blackout) has halted all natural photosynthesis. Aeroponic LED arrays need ≥10 MW or crops die.",
          tradeOffExplanation:
            "The 2018 Martian global dust storm blocks 98% of solar photons. Crops must be artificially illuminated with at least 10 MW or enter lethal thermal shock.",
          kidFriendlyExplanation:
            "The giant Martian dust storm has blacked out the Sun! Give the greenhouse 10 MW or the plants won't survive!",
        });
      }
    } else if (scenario.id === "apollo_13_cold_cabin") {
      if (allocation.radiationShielding > 6) {
        alerts.push({
          severity: "warning",
          subsystem: "radiationShielding",
          headline: "⚡ COLD CABIN BREACH: Non-Essential Heaters Drawing Power",
          detail: `You allocated ${allocation.radiationShielding} MW to thermal heating. Cold Cabin Protocol dictates powering down heaters (<6 MW) to preserve amps for Life Support!`,
          tradeOffExplanation:
            "With battery banks ruptured and power capped at 45 MW, drawing heating power starves critical LiOH scrubbers and avionics.",
          kidFriendlyExplanation:
            "Cold Cabin Rule: Turn OFF the heaters! The astronauts must endure the cold so all power goes to life support air scrubbers!",
        });
      }
      if (allocation.lifeSupport < 16) {
        alerts.push({
          severity: "critical",
          subsystem: "lifeSupport",
          headline: "🚨 LiOH SCRUBBER EMERGENCY: Carbon Dioxide Surge",
          detail: `Life Support allocated only ${allocation.lifeSupport} MW (needed ≥16 MW). The taped-together lithium hydroxide canisters are saturating; CO₂ is spiking!`,
          tradeOffExplanation:
            "Square canisters adapted into round holes create high flow resistance, demanding dedicated blower fan and scrubber power (≥16 MW).",
          kidFriendlyExplanation:
            "CRITICAL! Carbon dioxide is rising in the cabin! Send more power to Life Support to keep the air scrubbers running!",
        });
      }
    }
  }

  return alerts;
}

function computeMissionScore(
  subsystems: Record<SubsystemId, SubsystemState>,
  crew: CrewState,
  config: DifficultyConfig
): number {
  const healthScore =
    (subsystems.powerGrid.health +
      subsystems.lifeSupport.health +
      subsystems.radiationShielding.health +
      subsystems.foodProduction.health) / 4;
  const moraleScore = crew.morale;
  const radiationScore = clamp(
    100 - (crew.radiationExposureMSv / config.missionRadiationLimitMSv) * 100,
    0,
    100
  );
  const foodScore = clamp((crew.foodReserveDays / (config.id === "cadet" ? 18 : 15)) * 100, 0, 100);
  const o2Score = crew.oxygenBufferPercent;

  let baseScore = Math.round(
    healthScore * 0.30 +
      moraleScore * 0.20 +
      radiationScore * 0.20 +
      foodScore * 0.15 +
      o2Score * 0.15
  );

  // Career limit compliance bonus / penalty in Flight Director mode
  if (config.strictCareerLimitEnforcement) {
    if (crew.careerRadiationExposureMSv > config.careerRadiationLimitMSv) {
      baseScore = Math.max(0, baseScore - 30);
    }
  }

  // Starvation emergency penalty
  if (crew.starvationActive) {
    baseScore = Math.max(0, baseScore - 25);
  }

  return baseScore;
}

function computeOutcome(
  turn: number,
  subsystems: Record<SubsystemId, SubsystemState>,
  crew: CrewState,
  score: number,
  config: DifficultyConfig
): MissionOutcome {
  const criticalHealthFloor = config.id === "cadet" ? 8 : config.id === "flight_director" ? 20 : 15;
  const criticalO2Floor = config.id === "cadet" ? 5 : config.id === "flight_director" ? 15 : 10;

  const anySystemCritical = Object.values(subsystems).some((s) => s.health < criticalHealthFloor);
  const crewInDanger =
    crew.oxygenBufferPercent < criticalO2Floor ||
    crew.radiationExposureMSv > config.missionRadiationLimitMSv ||
    (config.strictCareerLimitEnforcement && crew.careerRadiationExposureMSv > config.careerRadiationLimitMSv);

  if (anySystemCritical || crewInDanger) {
    return "critical_alert";
  }

  if (turn === TOTAL_TURNS) {
    const successThreshold = config.id === "cadet" ? 60 : config.id === "flight_director" ? 75 : 70;
    const partialThreshold = config.id === "cadet" ? 38 : config.id === "flight_director" ? 50 : 45;

    if (score >= successThreshold) return "mission_success";
    if (score >= partialThreshold) return "partial_success";
    return "critical_alert";
  }

  return "ongoing";
}

function buildNarratives(
  turn: number,
  event: TurnEvent,
  subsystems: Record<SubsystemId, SubsystemState>,
  crew: CrewState,
  alerts: MissionAlert[],
  difficulty: DifficultyTier
): { summary: string; kidSummary: string } {
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const worstSystem = Object.values(subsystems).sort((a, b) => a.health - b.health)[0];

  if (criticalAlerts.length > 0) {
    return {
      summary: `Sol ${turn} [${difficulty.toUpperCase()}]: ${event.label} — CRITICAL alerts active. ${
        worstSystem.label
      } at ${worstSystem.health.toFixed(0)}% health. Immediate reallocation needed.`,
      kidSummary: `Sol ${turn}: ${event.kidFriendlyDescription} Things are getting serious — your ${worstSystem.label} needs help right now!`,
    };
  }

  const avgHealth =
    Object.values(subsystems).reduce((s, x) => s + x.health, 0) / 3;
  if (avgHealth > 70) {
    return {
      summary: `Sol ${turn} [${difficulty.toUpperCase()}]: ${event.label} — Systems stable. Average health ${avgHealth.toFixed(
        0
      )}%. Crew morale ${crew.morale}%.`,
      kidSummary: `Sol ${turn}: ${event.kidFriendlyDescription} Great job — the outpost is running well and the crew is happy!`,
    };
  }

  return {
    summary: `Sol ${turn} [${difficulty.toUpperCase()}]: ${event.label} — Systems under pressure. Average health ${avgHealth.toFixed(
      0
    )}%. Review allocation.`,
    kidSummary: `Sol ${turn}: ${event.kidFriendlyDescription} Some systems need attention — check where you're sending power!`,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function createInitialGameState(
  environment: MissionEnvironment,
  difficulty: DifficultyTier = "commander",
  missionSeed?: string,
  scenario?: HistoricScenario
): GameState {
  const seed = normalizeSeed(missionSeed || generateMissionSeed());
  const config = DIFFICULTY_PRESETS[difficulty];
  const initialSub = initialSubsystems(difficulty);
  const initialCrw = initialCrew(difficulty);

  // If a scenario is provided, apply its initial conditions & subsystem overrides
  if (scenario?.initialConditions) {
    const initCond = scenario.initialConditions;
    if (initCond.startingSubsystems) {
      if (initCond.startingSubsystems.powerGrid) {
        initialSub.powerGrid.health = initCond.startingSubsystems.powerGrid.health;
        initialSub.powerGrid.wearAccumulated = initCond.startingSubsystems.powerGrid.wearAccumulated;
        initialSub.powerGrid.statusMessage = initCond.startingSubsystems.powerGrid.statusMessage;
      }
      if (initCond.startingSubsystems.lifeSupport) {
        initialSub.lifeSupport.health = initCond.startingSubsystems.lifeSupport.health;
        initialSub.lifeSupport.wearAccumulated = initCond.startingSubsystems.lifeSupport.wearAccumulated;
        initialSub.lifeSupport.statusMessage = initCond.startingSubsystems.lifeSupport.statusMessage;
      }
      if (initCond.startingSubsystems.radiationShielding) {
        initialSub.radiationShielding.health = initCond.startingSubsystems.radiationShielding.health;
        initialSub.radiationShielding.wearAccumulated = initCond.startingSubsystems.radiationShielding.wearAccumulated;
        initialSub.radiationShielding.statusMessage = initCond.startingSubsystems.radiationShielding.statusMessage;
      }
      if (initCond.startingSubsystems.foodProduction) {
        initialSub.foodProduction.health = initCond.startingSubsystems.foodProduction.health;
        initialSub.foodProduction.wearAccumulated = initCond.startingSubsystems.foodProduction.wearAccumulated;
        initialSub.foodProduction.statusMessage = initCond.startingSubsystems.foodProduction.statusMessage;
      }
    }
    if (initCond.startingCrewMorale !== undefined) {
      initialCrw.morale = initCond.startingCrewMorale;
      if (initialCrw.members) {
        initialCrw.members = initialCrw.members.map((m) => ({
          ...m,
          morale: initCond.startingCrewMorale!,
        }));
      }
    }
    if (initCond.startingFoodDays !== undefined) {
      initialCrw.foodReserveDays = initCond.startingFoodDays;
      initialCrw.crewCaloricReserveDays = initCond.startingFoodDays;
    }
    if (initCond.startingOxygenBufferPercent !== undefined) {
      initialCrw.oxygenBufferPercent = initCond.startingOxygenBufferPercent;
    }
  }

  const effectiveInitialBudget = getEffectivePowerBudget(
    environment,
    1,
    0,
    difficulty,
    seed,
    scenario
  );

  const initialCadetHints =
    config.enableAutomatedHints
      ? generateCadetAutomatedHints(
          initialSub,
          initialCrw,
          getDefaultAllocation(effectiveInitialBudget, difficulty),
          effectiveInitialBudget,
          1
        )
      : undefined;

  return {
    missionSeed: seed,
    environment,
    difficulty,
    currentTurn: 0,
    history: [],
    subsystems: initialSub,
    crew: initialCrw,
    finalOutcome: "ongoing",
    cumulativeScore: 0,
    incidentHistory: [],
    activeModifiers: [],
    permanentWaterO2Bonus: 0,
    cumulativeThermalFatigueWear: 0,
    micrometeoroidHistory: [],
    cadetHints: initialCadetHints,
    scenario,
  };
}

export function applyIncidentChoice(
  state: GameState,
  incident: IncidentCard,
  choice: IncidentChoice,
  assignedSpecialist?: SpecialistRepairOption,
  interventionResult?: FlightDirectorInterventionResult
): GameState {
  const { effects } = choice;
  const specialistEffects = assignedSpecialist?.effects;

  // Combine directive, specialist, and 15-second flight director intervention effects
  const interventionGridDelta = interventionResult?.gridHealthBonus ?? 0;
  const interventionLifeSupportDelta = interventionResult?.lifeSupportDelta ?? 0;
  const interventionShieldingDelta = interventionResult?.shieldEfficiencyBonus ?? 0;

  const powerGridDelta =
    (effects.powerGridHealthDelta ?? 0) +
    (specialistEffects?.powerGridHealthDelta ?? 0) +
    interventionGridDelta;
  const lifeSupportDelta =
    (effects.lifeSupportHealthDelta ?? 0) +
    (specialistEffects?.lifeSupportHealthDelta ?? 0) +
    interventionLifeSupportDelta;
  const shieldingDelta =
    (effects.shieldingHealthDelta ?? 0) +
    (specialistEffects?.shieldingHealthDelta ?? 0) +
    interventionShieldingDelta;
  const foodProductionDelta =
    ((effects as { foodProductionHealthDelta?: number }).foodProductionHealthDelta ?? 0) +
    ((specialistEffects as { foodProductionHealthDelta?: number } | undefined)?.foodProductionHealthDelta ?? 0);

  // Clone subsystems
  const newSubsystems: Record<SubsystemId, SubsystemState> = {
    powerGrid: {
      ...state.subsystems.powerGrid,
      health: clamp(
        state.subsystems.powerGrid.health + powerGridDelta,
        MIN_SYSTEM_HEALTH,
        MAX_SYSTEM_HEALTH
      ),
    },
    lifeSupport: {
      ...state.subsystems.lifeSupport,
      health: clamp(
        state.subsystems.lifeSupport.health + lifeSupportDelta,
        MIN_SYSTEM_HEALTH,
        MAX_SYSTEM_HEALTH
      ),
    },
    radiationShielding: {
      ...state.subsystems.radiationShielding,
      health: clamp(
        state.subsystems.radiationShielding.health + shieldingDelta,
        MIN_SYSTEM_HEALTH,
        MAX_SYSTEM_HEALTH
      ),
    },
    foodProduction: {
      ...state.subsystems.foodProduction,
      health: clamp(
        state.subsystems.foodProduction.health + foodProductionDelta,
        MIN_SYSTEM_HEALTH,
        MAX_SYSTEM_HEALTH
      ),
    },
  };

  // Clone and update individual crew members
  let updatedMembers =
    state.crew.members && state.crew.members.length > 0
      ? state.crew.members.map((m) => ({ ...m }))
      : createInitialCrewMembers(state.difficulty);

  const newMoraleEvents = [...(state.crew.recentMoraleEvents || [])];

  if (assignedSpecialist) {
    const sEffects = assignedSpecialist.effects;
    updatedMembers = updatedMembers.map((m) => {
      if (m.role === assignedSpecialist.crewRole) {
        const newHealth = clamp(m.health + (sEffects.healthDelta ?? 0), 0, 100);
        const newMorale = clamp(m.morale + (sEffects.moraleDelta ?? 0), 0, 100);
        const addedRad = sEffects.radiationDeltaMSv ?? 0;
        const newRad = Math.round((m.radiationDoseMSv + addedRad) * 100) / 100;
        const newCareerRad = Math.round((m.careerRadiationMSv + addedRad * 3) * 10) / 10;
        return {
          ...m,
          health: newHealth,
          morale: newMorale,
          radiationDoseMSv: newRad,
          careerRadiationMSv: newCareerRad,
          status:
            sEffects.newStatus ??
            (newHealth < 45
              ? ("injured" as const)
              : addedRad > 1.5
              ? ("irradiated" as const)
              : ("heroic" as const)),
          statusDescription: sEffects.statusDescription ?? assignedSpecialist.tacticalSummary,
          currentAssignment: assignedSpecialist.actionTitle,
          recentEvent: assignedSpecialist.moraleEvent.title,
          repairsConducted: m.repairsConducted + 1,
        };
      }
      // General team morale ripple if specialist succeeded/struggled
      if (sEffects.teamMoraleDelta) {
        return {
          ...m,
          morale: clamp(m.morale + sEffects.teamMoraleDelta, 0, 100),
        };
      }
      return m;
    });

    const deployed = updatedMembers.find((m) => m.role === assignedSpecialist.crewRole);
    if (deployed) {
      newMoraleEvents.unshift({
        id: `${incident.id}_${assignedSpecialist.crewRole}_sol${incident.triggerSol}`,
        sol: incident.triggerSol,
        crewMemberId: deployed.id,
        crewMemberName: deployed.name,
        crewRole: deployed.role,
        roleIcon: deployed.avatar,
        title: assignedSpecialist.moraleEvent.title,
        narrative: assignedSpecialist.moraleEvent.narrative,
        moraleDelta: (assignedSpecialist.effects.moraleDelta ?? 0) + (assignedSpecialist.effects.teamMoraleDelta ?? 0),
        healthDelta: assignedSpecialist.effects.healthDelta,
        radiationDeltaMSv: assignedSpecialist.effects.radiationDeltaMSv,
        type: assignedSpecialist.moraleEvent.type,
        subsystemHelped: assignedSpecialist.actionTitle,
      });
    }
  }

  // Radiation calculation modified by flight director intervention:
  // - Optimal deflection (+20% shield) achieves 0 radiation leak
  // - Failed intervention or missed angle allows residual leak through
  let baseRadiationDelta = effects.radiationDeltaMSv ?? 0;
  if (interventionResult) {
    if (
      interventionResult.status === "success" &&
      interventionResult.interventionType === "magnetic_shield"
    ) {
      baseRadiationDelta = 0; // Optimal Deflection: zero radiation leak!
    } else if (interventionResult.radiationLeakMSv !== undefined) {
      baseRadiationDelta += interventionResult.radiationLeakMSv;
    }
  }

  const radDelta =
    baseRadiationDelta +
    (specialistEffects?.radiationDeltaMSv ? specialistEffects.radiationDeltaMSv * 0.25 : 0);
  const newMissionRadiation = Math.max(
    0,
    Math.round((state.crew.radiationExposureMSv + radDelta) * 100) / 100
  );
  const newCareerRadiation = Math.max(
    0,
    Math.round((state.crew.careerRadiationExposureMSv + radDelta * 3) * 10) / 10
  );

  const interventionMoraleBonus =
    interventionResult?.status === "success" ? 4 : interventionResult?.status === "failure" ? -4 : 0;
  const avgTeamMorale =
    updatedMembers.length > 0
      ? clamp(
          Math.round(
            updatedMembers.reduce((sum, m) => sum + m.morale, 0) / updatedMembers.length
          ) + interventionMoraleBonus,
          0,
          100
        )
      : clamp(state.crew.morale + (effects.moraleDelta ?? 0) + interventionMoraleBonus, 0, 100);

  const foodDelta =
    (effects.foodDaysDelta ?? 0) +
    (specialistEffects?.foodDaysDelta ?? 0) +
    (interventionResult?.foodDaysDelta ?? 0);
  const o2Delta = (effects.oxygenBufferDelta ?? 0) + (specialistEffects?.oxygenBufferDelta ?? 0);
  const updatedFood = clamp(
    Math.round((state.crew.foodReserveDays + foodDelta) * 10) / 10,
    0,
    30
  );

  // Clone crew
  const newCrew: CrewState = {
    ...state.crew,
    members: updatedMembers,
    morale: avgTeamMorale,
    radiationExposureMSv: newMissionRadiation,
    careerRadiationExposureMSv: newCareerRadiation,
    foodReserveDays: updatedFood,
    crewCaloricReserveDays: updatedFood,
    harvestYieldKg: state.crew.harvestYieldKg ?? 40.0,
    cropGrowthProgressPercent: state.crew.cropGrowthProgressPercent ?? 0,
    cropThermalShock: state.crew.cropThermalShock ?? false,
    starvationActive: updatedFood <= 0,
    oxygenBufferPercent: clamp(
      Math.round((state.crew.oxygenBufferPercent + o2Delta) * 10) / 10,
      0,
      100
    ),
    recentMoraleEvents: newMoraleEvents.slice(0, 10),
  };

  const deployedName = assignedSpecialist
    ? updatedMembers.find((m) => m.role === assignedSpecialist.crewRole)?.name
    : undefined;

  const choiceRecord: IncidentChoiceRecord = {
    incidentId: incident.id,
    incidentTitle: incident.title,
    sol: incident.triggerSol,
    choiceId: choice.id,
    choiceLabel: choice.label,
    tradeOffSummary: choice.tradeOffSummary,
    engineeringTakeaway: choice.engineeringTakeaway,
    specialistRole: assignedSpecialist?.crewRole,
    specialistName: deployedName,
    specialistAction: assignedSpecialist?.actionTitle,
    specialistRiskRewardSummary: assignedSpecialist
      ? `${assignedSpecialist.rewardDescription} | Risk: ${assignedSpecialist.riskDescription}`
      : undefined,
    interventionResult: interventionResult,
  };

  const newModifiers = [...(state.activeModifiers || [])];
  const interventionPowerDeltaMW = interventionResult?.powerDeltaMW ?? 0;
  const totalPowerDelta =
    (effects.powerDeltaMW ?? 0) +
    (specialistEffects?.powerDeltaMW ?? 0) +
    interventionPowerDeltaMW;
  if (totalPowerDelta !== 0) {
    newModifiers.push({
      id: `${incident.id}_power`,
      name: `${incident.title}: ${choice.shortTag}${
        assignedSpecialist ? ` (+ ${assignedSpecialist.actionTitle})` : ""
      }${
        interventionResult
          ? ` [Intervention: ${interventionResult.status.toUpperCase()}]`
          : ""
      }`,
      powerDeltaMW: totalPowerDelta,
      turnsRemaining: 1, // impacts this sol
    });
  }

  const bonus =
    (state.permanentWaterO2Bonus || 0) +
    (effects.permanentWaterO2Bonus || 0) +
    (specialistEffects?.permanentWaterO2Bonus || 0) +
    (interventionResult?.permanentWaterO2Bonus ?? 0);

  return {
    ...state,
    subsystems: newSubsystems,
    crew: newCrew,
    incidentHistory: [...(state.incidentHistory || []), choiceRecord],
    activeModifiers: newModifiers,
    permanentWaterO2Bonus: bonus,
  };
}

export function getDefaultAllocation(
  effectiveBudgetMW: number,
  _difficulty: DifficultyTier = "commander"
): PowerAllocation {
  // 4-way balanced allocation (25% each on 100 MW budget)
  const powerGrid = Math.round(effectiveBudgetMW * 0.25);
  const lifeSupport = Math.round(effectiveBudgetMW * 0.25);
  const radiationShielding = Math.round(effectiveBudgetMW * 0.25);
  const foodProduction = Math.max(
    0,
    effectiveBudgetMW - powerGrid - lifeSupport - radiationShielding
  );

  return {
    powerGrid,
    lifeSupport,
    radiationShielding,
    foodProduction,
  };
}

/**
 * Applies deterministic, reproducible solar and space weather variance
 * governed by the classroom mission seed.
 */
export function getSeededTurnEvent(
  baseEvent: TurnEvent,
  missionSeed: string,
  environmentId: string,
  sol: number
): TurnEvent {
  const rng = createSeededRNG(`${missionSeed}_event_${environmentId}_sol${sol}`);
  // Natural flux / weather variance (-3 to +3 MW)
  const fluxVariance = Math.round((rng.next() - 0.5) * 6);
  // Solar flare / storm particle density variance (-0.2x to +0.2x)
  const radVariance = Math.round((rng.next() - 0.5) * 0.4 * 10) / 10;

  return {
    ...baseEvent,
    powerDeltaMW: baseEvent.powerDeltaMW + fluxVariance,
    radiationSpikeMultiplier: Math.max(
      1,
      Math.round((baseEvent.radiationSpikeMultiplier + radVariance) * 10) / 10
    ),
  };
}

export function getEffectivePowerBudget(
  environment: MissionEnvironment,
  turn: number,
  additionalModifierMW = 0,
  difficulty: DifficultyTier = "commander",
  missionSeed?: string,
  scenario?: HistoricScenario
): number {
  const config = DIFFICULTY_PRESETS[difficulty];
  const baseEvent = scenario?.turnEvents ? scenario.turnEvents[turn - 1] : environment.turnEvents[turn - 1];
  const event =
    missionSeed && baseEvent
      ? getSeededTurnEvent(baseEvent, missionSeed, scenario ? scenario.id : environment.id, turn)
      : baseEvent;
  const eventDelta = event ? event.powerDeltaMW : 0;

  // Seeded baseline power / solar flux variance
  let seededFluxVarianceMW = 0;
  if (missionSeed) {
    const rng = createSeededRNG(`${missionSeed}_flux_${scenario ? scenario.id : environment.id}_sol${turn}`);
    seededFluxVarianceMW = Math.round((rng.next() - 0.5) * 6);
  }

  // Handle Scenario Specific Power Mechanics
  if (scenario) {
    const fixedDelta = baseEvent ? baseEvent.powerDeltaMW : 0;
    if (scenario.id === "artemis_iii_lunar_night") {
      // Constraint: 0 MW Solar Power for 7 consecutive Sols.
      // Survival challenge: Ration a fixed 35 MW Kilopower nuclear backup generator.
      const kilopowerBaseload = 35;
      const effective = Math.max(25, kilopowerBaseload + fixedDelta + additionalModifierMW);
      return Math.round(effective);
    }

    if (scenario.id === "opportunity_dust_storm") {
      // Constraint: Atmospheric opacity tau jumps to 10.8 (98% sunlight blackout).
      // Survival challenge: Emergency low-power triage (slashed down to ~22 MW).
      const marsBase = 60;
      const effective = Math.max(20, marsBase + fixedDelta + additionalModifierMW);
      return Math.round(effective);
    }

    if (scenario.id === "apollo_13_cold_cabin") {
      // Constraint: Battery bank ruptured (Max power capped at 45 MW total).
      // Survival challenge: Turn off habitat heating and shields to prioritize communications and life support.
      const basePower = 45;
      const effective = Math.min(45, Math.max(20, basePower + fixedDelta + additionalModifierMW));
      return Math.round(effective);
    }
  }

  const rtgFloor = environment.basePowerBudgetMW * config.rtgReserveFraction;
  let baseGeneration = 0;
  if (environment.id === "europa_under_ice") {
    // Under-ice environment: Zero solar flux!
    // Powered by Cryo-Geothermal wellheads (52 MW) + RTG Nuclear arrays (35 MW) = 87 MW baseline
    baseGeneration = 87;
  } else if (environment.id === "titan_hydrocarbon") {
    // Dense atmosphere & cryogenic methane lakes:
    // Powered by Dragonfly MMRTG (52 MW) + Cryogenic Methane Lake Carnot Heat Exchanger (32 MW) + trace solar (1 MW) = 85 MW baseline
    baseGeneration = 85;
  } else {
    // Lunar & Mars: Photovoltaic arrays + Fission/RTG baseload
    baseGeneration = environment.basePowerBudgetMW * environment.baselineSolarEfficiency;
  }

  const effective = Math.max(
    rtgFloor,
    baseGeneration + eventDelta + additionalModifierMW + seededFluxVarianceMW
  );
  return Math.round(effective);
}

export function processTurn(
  gameState: GameState,
  allocation: PowerAllocation
): { nextState: GameState; result: TurnResult } {
  const turn = gameState.currentTurn + 1;
  const { environment, difficulty, scenario } = gameState;
  const config = DIFFICULTY_PRESETS[difficulty];
  const baseEvent = scenario?.turnEvents ? scenario.turnEvents[turn - 1] : environment.turnEvents[turn - 1];
  const event =
    gameState.missionSeed && baseEvent
      ? getSeededTurnEvent(baseEvent, gameState.missionSeed, scenario ? scenario.id : environment.id, turn)
      : baseEvent;

  // 1. HARDCORE MECHANIC: Random Micro-Meteoroid Puncture Check
  let microStrike: MicrometeoroidStrike | null = null;
  if (config.enableMicrometeoroids) {
    microStrike = rollMicrometeoroidStrike(
      environment.id,
      turn,
      gameState.cumulativeScore,
      gameState.missionSeed
    );
  }

  // Active modifiers power sum + potential micrometeoroid power loss
  const modifierPowerDelta =
    (gameState.activeModifiers || []).reduce((sum, m) => sum + (m.powerDeltaMW || 0), 0) -
    (microStrike ? microStrike.powerLossMW : 0);

  const effectiveBudgetMW = getEffectivePowerBudget(
    environment,
    turn,
    modifierPowerDelta,
    difficulty,
    gameState.missionSeed,
    scenario
  );

  // Clamp allocation so it never exceeds the budget (simulate brownout proportionally)
  const totalRequested = totalAllocatedMW(allocation);
  const scaleFactor = totalRequested > effectiveBudgetMW ? effectiveBudgetMW / totalRequested : 1;
  const clampedAllocation: PowerAllocation = {
    powerGrid: Math.round(allocation.powerGrid * scaleFactor),
    lifeSupport: Math.round(allocation.lifeSupport * scaleFactor),
    radiationShielding: Math.round(allocation.radiationShielding * scaleFactor),
    foodProduction: Math.round(allocation.foodProduction * scaleFactor),
  };

  // Check if crew was starving entering this Sol to apply the -20% subsystem repair speed penalty
  const isStarvingEnteringSol = (gameState.crew.crewCaloricReserveDays ?? gameState.crew.foodReserveDays) <= 0;
  const effectiveConfig: DifficultyConfig = isStarvingEnteringSol
    ? {
        ...config,
        recoveryMultiplier: config.recoveryMultiplier * (1 - STARVATION_REPAIR_SPEED_PENALTY),
      }
    : config;

  // 2. HARDCORE MECHANIC: Degradation curves based on actual thermal fatigue (Coffin-Manson)
  let thermalReport: ThermalFatigueReport | undefined = undefined;
  let thermalWearPerSubsystem = 0;
  if (config.enableThermalFatigueCurves) {
    thermalReport = calculateThermalFatigue(
      environment.id,
      turn,
      clampedAllocation.radiationShielding,
      config.baselinePowerDemands.radiationShielding,
      gameState.cumulativeThermalFatigueWear || 0,
      gameState.missionSeed
    );
    thermalWearPerSubsystem = thermalReport.fatigueWearAdded * config.thermalFatigueMultiplier;
  }

  // Extra wear from events and micro-meteoroids
  const extraGridWear = microStrike?.subsystemHit === "powerGrid" ? microStrike.wearDelta : 0;
  const extraLsWear = microStrike?.subsystemHit === "lifeSupport" ? microStrike.wearDelta : 0;
  const extraShieldWear =
    (event.shieldingWearDelta || 0) +
    (microStrike?.subsystemHit === "radiationShielding" ? microStrike.wearDelta : 0);
  const extraFoodWear = microStrike?.subsystemHit === "foodProduction" ? microStrike.wearDelta : 0;

  // Process each subsystem
  const prevSubsystems = gameState.subsystems;
  const nextSubsystems: Record<SubsystemId, SubsystemState> = {
    powerGrid: processSubsystem(
      "powerGrid",
      prevSubsystems.powerGrid,
      clampedAllocation.powerGrid,
      1.0,
      extraGridWear,
      effectiveConfig,
      thermalWearPerSubsystem * 0.7
    ),
    lifeSupport: processSubsystem(
      "lifeSupport",
      prevSubsystems.lifeSupport,
      clampedAllocation.lifeSupport,
      event.lifeSupportStressFactor,
      extraLsWear,
      effectiveConfig,
      thermalWearPerSubsystem * 0.8
    ),
    radiationShielding: processSubsystem(
      "radiationShielding",
      prevSubsystems.radiationShielding,
      clampedAllocation.radiationShielding,
      event.radiationSpikeMultiplier,
      extraShieldWear,
      effectiveConfig,
      thermalWearPerSubsystem * 1.5 // Radiator & shielding loops bear brunt of thermal fatigue
    ),
    foodProduction: processSubsystem(
      "foodProduction",
      prevSubsystems.foodProduction,
      clampedAllocation.foodProduction,
      event.lifeSupportStressFactor,
      extraFoodWear,
      effectiveConfig,
      thermalWearPerSubsystem * 0.75
    ),
  };

  // Update crew state
  const shieldingHealth = nextSubsystems.radiationShielding.health / 100;
  const effectiveRadiationMSv =
    environment.baselineDailyRadiationMSv *
    event.radiationSpikeMultiplier *
    config.radiationDamageMultiplier *
    (1 - shieldingHealth * 0.85);

  const lsHealth = nextSubsystems.lifeSupport.health / 100;
  const lsBaseline = config.baselinePowerDemands.lifeSupport;
  const lsDeficit = Math.max(0, lsBaseline - clampedAllocation.lifeSupport);
  const lsExcess = Math.max(0, clampedAllocation.lifeSupport - lsBaseline);

  const bonusFactor = 1 + (gameState.permanentWaterO2Bonus || 0) / 100;
  const oxygenDelta =
    lsExcess * OXYGEN_RECOVERY_PER_MW_EXCESS * bonusFactor -
    lsDeficit * OXYGEN_LOSS_PER_MW_DEFICIT * config.oxygenLossRateMultiplier -
    (microStrike?.o2LeakPercent ?? 0);

  const newOxygenBuffer = clamp(
    gameState.crew.oxygenBufferPercent + oxygenDelta * event.lifeSupportStressFactor,
    0,
    100
  );

  // -------------------------------------------------------------------------
  // Greenhouse Agronomy Dynamics (NASA BVAD Baseline: 2,500 kcal/crew/day)
  // -------------------------------------------------------------------------
  const prevCropProgress = gameState.crew.cropGrowthProgressPercent ?? 0;
  const prevFoodReserve = gameState.crew.foodReserveDays ?? 15;
  const prevHarvestYield = gameState.crew.harvestYieldKg ?? 40.0;
  const foodPower = clampedAllocation.foodProduction;
  const ghHealth = nextSubsystems.foodProduction.health / 100;

  // Thermal Shock: power cut to <10 MW during cold nights or dust storms
  const isThermalShock = foodPower < GREENHOUSE_THERMAL_SHOCK_THRESHOLD_MW;
  let progressDelta = 0;
  if (isThermalShock) {
    // Crops enter "Thermal Shock" and lose 25% growth progress per Sol
    progressDelta = -GREENHOUSE_THERMAL_SHOCK_PROGRESS_PENALTY;
  } else if (foodPower >= GREENHOUSE_BASELINE_POWER_MW) {
    // 0% to 100% maturity over 3 Sols if powered adequately (>=20 MW)
    const baseProgress = 100 / HARVEST_CYCLE_SOLS;
    // Power boost for extra lighting (up to 1.35x rate at max allocation)
    const powerBoost = Math.min(1.35, 1 + ((foodPower - GREENHOUSE_BASELINE_POWER_MW) / GREENHOUSE_BASELINE_POWER_MW) * 0.35);
    progressDelta = baseProgress * powerBoost * (0.6 + 0.4 * ghHealth);
  } else {
    // Underpowered (10 - 19 MW): stunted crop growth
    const powerRatio = foodPower / GREENHOUSE_BASELINE_POWER_MW;
    progressDelta = (100 / HARVEST_CYCLE_SOLS) * powerRatio * 0.7 * (0.6 + 0.4 * ghHealth);
  }

  let candidateProgress = prevCropProgress + progressDelta;
  let harvestOccurred = false;
  let harvestYieldBonus = 0;
  let harvestReserveBonus = 0;

  if (candidateProgress >= 100) {
    harvestOccurred = true;
    candidateProgress = Math.max(0, candidateProgress - 100);
    harvestYieldBonus = HARVEST_YIELD_KG_PER_CYCLE;
    harvestReserveBonus = HARVEST_FOOD_RESERVE_DAYS_BONUS;
  }

  const newCropProgress = clamp(Math.round(candidateProgress * 10) / 10, 0, 100);
  const newHarvestYieldKg = Math.round((prevHarvestYield + harvestYieldBonus) * 10) / 10;

  // Food reserve consumption: -1 Sol consumption per turn + harvest yield bonus (+4 days)
  const candidateReserve = prevFoodReserve - config.foodConsumptionPerTurn + harvestReserveBonus;
  const newFoodReserve = clamp(Math.round(candidateReserve * 10) / 10, 0, 30);
  const starvationActive = newFoodReserve <= 0;

  // -------------------------------------------------------------------------
  // Crew Member Passive Perks & Morale Processing
  // -------------------------------------------------------------------------
  const currentMembers =
    gameState.crew.members && gameState.crew.members.length > 0
      ? gameState.crew.members
      : createInitialCrewMembers(difficulty);

  const doc = currentMembers.find((m) => m.role === "medical_officer");
  const isDocActive = (doc?.health ?? 0) >= 50 && doc?.status !== "irradiated";

  let moraleDelta = 0;
  if (lsHealth > 0.75 && nextSubsystems.powerGrid.health > 60 && ghHealth > 0.7) moraleDelta += MORALE_GAIN_GOOD_TURN;
  if (lsHealth < 0.5) moraleDelta -= MORALE_LOSS_LIFE_SUPPORT_LOW;
  if (effectiveRadiationMSv > environment.baselineDailyRadiationMSv * 2) moraleDelta -= MORALE_LOSS_RADIATION_HIGH;
  if (newFoodReserve < 3 && !starvationActive) moraleDelta -= MORALE_LOSS_FOOD_LOW;
  if (starvationActive) moraleDelta -= 20; // Starvation depression & fatigue
  if (harvestOccurred) moraleDelta += HARVEST_CREW_MORALE_SURGE; // +15% morale surge on harvest
  if (microStrike) moraleDelta -= 8; // Crew shaken by hull impact

  // Passive perk: Dr. Sarah Chen (Guardian Angel) dampens negative morale by 35%
  if (moraleDelta < 0 && isDocActive) {
    moraleDelta = Math.round(moraleDelta * 0.65);
  }

  // Update each individual crew member vitals
  const nextMembers: CrewMember[] = currentMembers.map((member) => {
    // Suit radiation absorption modifier by role
    const radFactor = member.role === "geologist" ? 0.75 : member.role === "botanist" ? 1.15 : 1.0;
    const memberDose = Math.round(effectiveRadiationMSv * radFactor * 100) / 100;
    const nextRad = Math.round((member.radiationDoseMSv + memberDose) * 100) / 100;
    const nextCareerRad = Math.round((member.careerRadiationMSv + memberDose * 3.5) * 10) / 10;
    const nextMorale = clamp(member.morale + moraleDelta, 0, 100);

    // Starvation penalties: -15 health per turn if food reserves hit 0
    const healthLoss = starvationActive ? STARVATION_HEALTH_PENALTY_PER_TURN : 0;
    const nextHealth = Math.max(0, member.health - healthLoss);

    // Natural recovery if habitat conditions are safe, or starvation status
    let nextStatus = member.status;
    let nextStatusDesc = member.statusDescription;
    if (starvationActive) {
      if (nextHealth <= 25) {
        nextStatus = "injured";
        nextStatusDesc = "Critical starvation: severe hypoglycemia and physical exhaustion (-15 HP/turn).";
      } else {
        nextStatus = "fatigued";
        nextStatusDesc = "Malnourished due to empty food reserves (-15 HP/turn).";
      }
    } else if (member.status === "fatigued" && lsHealth > 0.7 && newOxygenBuffer > 80 && newFoodReserve >= 3) {
      nextStatus = "nominal";
      nextStatusDesc = "Fully rested and operational after nominal sleep cycle.";
    } else if (member.status === "injured" && isDocActive && lsHealth > 0.8 && newFoodReserve >= 5) {
      nextStatus = "fatigued";
      nextStatusDesc = "Receiving active medical therapy; vitals stabilizing.";
    } else if (member.status === "irradiated" && isDocActive && lsHealth > 0.8) {
      nextStatus = "fatigued";
      nextStatusDesc = "Receiving active radioprotective therapy in medical bay.";
    } else if (member.status === "on_eva") {
      nextStatus = "nominal";
      nextStatusDesc = "Repairs complete; re-entered primary habitat airlock.";
    }

    return {
      ...member,
      health: nextHealth,
      morale: nextMorale,
      radiationDoseMSv: nextRad,
      careerRadiationMSv: nextCareerRad,
      status: nextStatus,
      statusDescription: nextStatusDesc,
    };
  });

  const avgCrewMorale = Math.round(
    nextMembers.reduce((sum, m) => sum + m.morale, 0) / nextMembers.length
  );

  const totalMissionRad =
    Math.round((gameState.crew.radiationExposureMSv + effectiveRadiationMSv) * 100) / 100;
  const totalCareerRad =
    Math.round((gameState.crew.careerRadiationExposureMSv + effectiveRadiationMSv * 3.5) * 10) / 10;

  const recentMoraleEvents = [...(gameState.crew.recentMoraleEvents || [])];
  if (harvestOccurred) {
    recentMoraleEvents.unshift({
      id: `harvest-sol-${turn}`,
      sol: turn,
      crewMemberId: "crew-botanist",
      crewMemberName: "Dr. Mei Lin",
      crewRole: "botanist",
      roleIcon: "🌱",
      title: "Fresh Hydroponic Harvest!",
      narrative: `Hydroponic Bay completed a crop cycle! ${HARVEST_YIELD_KG_PER_CYCLE} kg of fresh aeroponic produce yielded +${HARVEST_FOOD_RESERVE_DAYS_BONUS} food days and boosted crew morale +${HARVEST_CREW_MORALE_SURGE}%.`,
      moraleDelta: HARVEST_CREW_MORALE_SURGE,
      type: "positive",
      subsystemHelped: "Hydroponic Bay",
    });
  }

  const nextCrew: CrewState = {
    members: nextMembers,
    morale: avgCrewMorale,
    radiationExposureMSv: totalMissionRad,
    safeRadiationLimitMSv: config.missionRadiationLimitMSv,
    careerRadiationExposureMSv: totalCareerRad,
    careerLimitMSv: config.careerRadiationLimitMSv,
    foodReserveDays: Math.round(newFoodReserve * 10) / 10,
    crewCaloricReserveDays: Math.round(newFoodReserve * 10) / 10,
    harvestYieldKg: newHarvestYieldKg,
    cropGrowthProgressPercent: newCropProgress,
    cropThermalShock: isThermalShock,
    starvationActive,
    oxygenBufferPercent: Math.round(newOxygenBuffer * 10) / 10,
    recentMoraleEvents: recentMoraleEvents.slice(0, 10),
  };

  // 3. CADET MECHANIC: Automated gentle hints
  let cadetHints: AutomatedHint[] | undefined = undefined;
  if (config.enableAutomatedHints) {
    cadetHints = generateCadetAutomatedHints(
      nextSubsystems,
      nextCrew,
      clampedAllocation,
      effectiveBudgetMW,
      turn
    );
  }

  const alerts = computeAlerts(
    prevSubsystems,
    nextSubsystems,
    nextCrew,
    event,
    clampedAllocation,
    effectiveBudgetMW,
    config,
    thermalReport,
    microStrike ?? undefined,
    scenario
  );

  const score = computeMissionScore(nextSubsystems, nextCrew, config);
  const outcome = computeOutcome(turn, nextSubsystems, nextCrew, score, config);
  const { summary, kidSummary } = buildNarratives(
    turn,
    event,
    nextSubsystems,
    nextCrew,
    alerts,
    difficulty
  );

  // Age one-shot active modifiers
  const nextModifiers = (gameState.activeModifiers || [])
    .map((m) =>
      m.turnsRemaining !== undefined ? { ...m, turnsRemaining: m.turnsRemaining - 1 } : m
    )
    .filter((m) => m.turnsRemaining === undefined || m.turnsRemaining > 0);

  const result: TurnResult = {
    turn,
    difficulty,
    event,
    powerBudgetMW: effectiveBudgetMW,
    allocation: clampedAllocation,
    subsystems: nextSubsystems,
    crew: nextCrew,
    alerts,
    outcome,
    missionScorePercent: score,
    turnNarrativeSummary: summary,
    kidNarrativeSummary: kidSummary,
    thermalFatigue: thermalReport,
    micrometeoroidStrike: microStrike ?? undefined,
    cadetHints,
  };

  const nextState: GameState = {
    ...gameState,
    currentTurn: turn,
    history: [...gameState.history, result],
    subsystems: nextSubsystems,
    crew: nextCrew,
    finalOutcome: outcome,
    cumulativeScore: score,
    activeModifiers: nextModifiers,
    cumulativeThermalFatigueWear:
      thermalReport?.totalCumulativeFatigueWear ?? gameState.cumulativeThermalFatigueWear ?? 0,
    micrometeoroidHistory: microStrike
      ? [...(gameState.micrometeoroidHistory || []), microStrike]
      : gameState.micrometeoroidHistory || [],
    cadetHints,
  };

  return { nextState, result };
}

export function getTradeOffHints(
  allocation: PowerAllocation,
  effectiveBudgetMW: number,
  difficulty: DifficultyTier = "commander",
  scenario?: HistoricScenario
): string[] {
  const hints: string[] = [];
  const config = DIFFICULTY_PRESETS[difficulty];
  const baselines = config.baselinePowerDemands;
  const total = totalAllocatedMW(allocation);

  if (total > effectiveBudgetMW) {
    hints.push(`You're trying to use ${total} MW but only ${effectiveBudgetMW} MW is available — system will auto-scale down.`);
  }

  // Scenario-specific tactical survival hints
  if (scenario) {
    if (scenario.id === "artemis_iii_lunar_night") {
      if (allocation.radiationShielding < 10) {
        hints.push("🌑 Artemis Lunar Night: Maintain at least 10 MW to Thermal Shielding to stop the habitat from freezing at −173°C!");
      }
      if (allocation.lifeSupport < 12) {
        hints.push("🌑 Artemis Lunar Night: Maintain at least 12 MW to Life Support or O₂ scrubbers will lose scrubbing capacity in the cold!");
      }
    } else if (scenario.id === "opportunity_dust_storm") {
      if (allocation.foodProduction < 10) {
        hints.push("🔴 Opportunity Dust Storm: Food Production needs ≥10 MW to prevent crop thermal shock under 98% sunlight blackout, or prepare crew for ration hibernation!");
      }
    } else if (scenario.id === "apollo_13_cold_cabin") {
      if (allocation.radiationShielding > 6) {
        hints.push("🚀 Apollo 13 Protocol: Thermal heating should be cut (<6 MW) to divert limited 45 MW power to Life Support scrubbers!");
      }
      if (allocation.lifeSupport < 16) {
        hints.push("🚀 Apollo 13 Protocol: Prioritize ≥16 MW to Life Support so jury-rigged LiOH scrubbers keep CO₂ below toxic levels!");
      }
    }
  }

  if (allocation.lifeSupport < baselines.lifeSupport - 4) {
    hints.push(`Life Support is under-powered by ${baselines.lifeSupport - allocation.lifeSupport} MW — crew O₂ buffer and atmospheric scrubbing will suffer.`);
  }

  if (allocation.radiationShielding < baselines.radiationShielding - 4) {
    hints.push(`Radiation Shielding is under-powered by ${baselines.radiationShielding - allocation.radiationShielding} MW — crew radiation dose will rise.`);
  }

  if (allocation.powerGrid < baselines.powerGrid - 4) {
    hints.push(`Power Grid is under-resourced by ${baselines.powerGrid - allocation.powerGrid} MW — battery reserves may not replenish adequately.`);
  }

  if (allocation.foodProduction < baselines.foodProduction - 4) {
    if (allocation.foodProduction < GREENHOUSE_THERMAL_SHOCK_THRESHOLD_MW) {
      hints.push(`Food Production is critically low (<${GREENHOUSE_THERMAL_SHOCK_THRESHOLD_MW} MW) — aeroponic crops will enter Thermal Shock and lose 25% growth progress!`);
    } else {
      hints.push(`Food Production is under-resourced by ${baselines.foodProduction - allocation.foodProduction} MW — crop growth cycles will stall.`);
    }
  }

  const overloads = (["powerGrid", "lifeSupport", "radiationShielding", "foodProduction"] as SubsystemId[]).filter((id) => {
    return allocation[id] > baselines[id] * OVERLOAD_THRESHOLD_FRACTION;
  });
  if (overloads.length > 0) {
    hints.push(`${overloads.map((id) => ({ powerGrid: "Power Grid", lifeSupport: "Life Support", radiationShielding: "Radiation Shielding", foodProduction: "Hydroponic Bay" }[id])).join(" & ")} are in overload — this causes accelerated hardware wear!`);
  }

  if (hints.length === 0) {
    hints.push("Allocation looks balanced. All four systems near their baseline requirements.");
  }

  return hints;
}
