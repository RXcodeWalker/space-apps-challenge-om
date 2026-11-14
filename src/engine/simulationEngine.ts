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
import {
  TOTAL_TURNS,
  MIN_SYSTEM_HEALTH,
  MAX_SYSTEM_HEALTH,
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

// Re-export difficulty types for easy consumption
export type {
  DifficultyTier,
  DifficultyConfig,
  ThermalFatigueReport,
  MicrometeoroidStrike,
  AutomatedHint,
};
export { DIFFICULTY_PRESETS };

// ---------------------------------------------------------------------------
// Core type definitions
// ---------------------------------------------------------------------------

export type SubsystemId = "powerGrid" | "lifeSupport" | "radiationShielding";

export interface PowerAllocation {
  powerGrid: number;        // MW allocated to power grid management & batteries
  lifeSupport: number;      // MW allocated to O₂, water recycling, hydroponics
  radiationShielding: number; // MW allocated to magnetic/water-wall & thermal management
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
  morale: number;           // 0–100; drops with life support failures & radiation spikes
  radiationExposureMSv: number; // cumulative mission exposure
  safeRadiationLimitMSv: number; // expedition threshold (45-60 mSv depending on difficulty)
  careerRadiationExposureMSv: number; // NASA career ledger (towards 500 mSv career ceiling)
  careerLimitMSv: number;   // 500 mSv NASA STD-3001 career limit
  foodReserveDays: number;  // days of food remaining
  oxygenBufferPercent: number; // % of nominal O₂ buffer; 0 = emergency
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

/** Food/oxygen baseline rates. */
const FOOD_HYDROPONICS_BONUS_PER_MW = 0.08; // extra food days per MW excess in life support
const OXYGEN_RECOVERY_PER_MW_EXCESS = 2;    // % O₂ buffer per MW excess
const OXYGEN_LOSS_PER_MW_DEFICIT = 4;       // % O₂ loss per MW deficit

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function totalAllocatedMW(allocation: PowerAllocation): number {
  return allocation.powerGrid + allocation.lifeSupport + allocation.radiationShielding;
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
      label: "Life Support",
      health: isCadet ? 95 : isHardcore ? 85 : 90,
      wearAccumulated: isCadet ? 0.01 : isHardcore ? 0.05 : 0.02,
      powerDrawMW: baselines.lifeSupport,
      statusMessage: "O₂ scrubbers, water recycling, and hydroponics nominal.",
      kidFriendlyStatus: "Air, water, and food systems are all doing well!",
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
  };
}

function initialCrew(difficulty: DifficultyTier): CrewState {
  const config = DIFFICULTY_PRESETS[difficulty];
  const isCadet = difficulty === "cadet";
  const isHardcore = difficulty === "flight_director";

  // In Flight Director realistic mode, veteran astronaut has an established career baseline
  const careerStartingDose = isHardcore ? 180 : 50;

  return {
    morale: isCadet ? 90 : isHardcore ? 75 : 80,
    radiationExposureMSv: 0,
    safeRadiationLimitMSv: config.missionRadiationLimitMSv,
    careerRadiationExposureMSv: careerStartingDose,
    careerLimitMSv: config.careerRadiationLimitMSv,
    foodReserveDays: isCadet ? 18 : isHardcore ? 14 : 15,
    oxygenBufferPercent: 100,
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
      normal: "O₂ scrubbers, water recycler, and hydroponics nominal.",
      low: "O₂ buffer dropping. CO₂ scrubbing under-powered. Hydroponics stress.",
      critical: "LIFE SUPPORT CRITICAL — crew O₂ at risk. Immediate power allocation required.",
      kid: "Air, water, and food systems are all working well!",
      kidLow: "The crew is running low on fresh air and water — add more power to Life Support!",
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
  strike?: MicrometeoroidStrike
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
  (["powerGrid", "lifeSupport", "radiationShielding"] as SubsystemId[]).forEach((id) => {
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
      };
      const kidExplanations: Record<SubsystemId, string> = {
        powerGrid:
          "Your power system is almost broken! Without power, NOTHING works — not the air system, not the shields. Power is the most important thing!",
        lifeSupport:
          "The crew is almost out of fresh air and food! You protected them from radiation, but now they need life support power urgently.",
        radiationShielding:
          "The radiation shield is almost gone! The crew has been absorbing dangerous rays that add up over time — like getting too much sunburn, but invisible.",
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

  return alerts;
}

function computeMissionScore(
  subsystems: Record<SubsystemId, SubsystemState>,
  crew: CrewState,
  config: DifficultyConfig
): number {
  const healthScore =
    (subsystems.powerGrid.health + subsystems.lifeSupport.health + subsystems.radiationShielding.health) / 3;
  const moraleScore = crew.morale;
  const radiationScore = clamp(
    100 - (crew.radiationExposureMSv / config.missionRadiationLimitMSv) * 100,
    0,
    100
  );
  const foodScore = clamp((crew.foodReserveDays / (config.id === "cadet" ? 18 : 15)) * 100, 0, 100);
  const o2Score = crew.oxygenBufferPercent;

  let baseScore = Math.round(
    healthScore * 0.35 +
      moraleScore * 0.2 +
      radiationScore * 0.2 +
      foodScore * 0.1 +
      o2Score * 0.15
  );

  // Career limit compliance bonus / penalty in Flight Director mode
  if (config.strictCareerLimitEnforcement) {
    if (crew.careerRadiationExposureMSv > config.careerRadiationLimitMSv) {
      baseScore = Math.max(0, baseScore - 30);
    }
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
  difficulty: DifficultyTier = "commander"
): GameState {
  const config = DIFFICULTY_PRESETS[difficulty];
  const initialSub = initialSubsystems(difficulty);
  const initialCrw = initialCrew(difficulty);

  const initialCadetHints =
    config.enableAutomatedHints
      ? generateCadetAutomatedHints(
          initialSub,
          initialCrw,
          getDefaultAllocation(environment.basePowerBudgetMW, difficulty),
          environment.basePowerBudgetMW,
          1
        )
      : undefined;

  return {
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
  };
}

export function applyIncidentChoice(
  state: GameState,
  incident: IncidentCard,
  choice: IncidentChoice
): GameState {
  const { effects } = choice;

  // Clone subsystems
  const newSubsystems = {
    powerGrid: {
      ...state.subsystems.powerGrid,
      health: clamp(
        state.subsystems.powerGrid.health + (effects.powerGridHealthDelta ?? 0),
        MIN_SYSTEM_HEALTH,
        MAX_SYSTEM_HEALTH
      ),
    },
    lifeSupport: {
      ...state.subsystems.lifeSupport,
      health: clamp(
        state.subsystems.lifeSupport.health + (effects.lifeSupportHealthDelta ?? 0),
        MIN_SYSTEM_HEALTH,
        MAX_SYSTEM_HEALTH
      ),
    },
    radiationShielding: {
      ...state.subsystems.radiationShielding,
      health: clamp(
        state.subsystems.radiationShielding.health + (effects.shieldingHealthDelta ?? 0),
        MIN_SYSTEM_HEALTH,
        MAX_SYSTEM_HEALTH
      ),
    },
  };

  const radDelta = effects.radiationDeltaMSv ?? 0;
  const newMissionRadiation = Math.max(
    0,
    Math.round((state.crew.radiationExposureMSv + radDelta) * 100) / 100
  );
  const newCareerRadiation = Math.max(
    0,
    Math.round((state.crew.careerRadiationExposureMSv + radDelta * 3) * 10) / 10
  );

  // Clone crew
  const newCrew: CrewState = {
    ...state.crew,
    morale: clamp(state.crew.morale + (effects.moraleDelta ?? 0), 0, 100),
    radiationExposureMSv: newMissionRadiation,
    careerRadiationExposureMSv: newCareerRadiation,
    foodReserveDays: clamp(
      Math.round((state.crew.foodReserveDays + (effects.foodDaysDelta ?? 0)) * 10) / 10,
      0,
      30
    ),
    oxygenBufferPercent: clamp(
      Math.round((state.crew.oxygenBufferPercent + (effects.oxygenBufferDelta ?? 0)) * 10) / 10,
      0,
      100
    ),
  };

  const choiceRecord: IncidentChoiceRecord = {
    incidentId: incident.id,
    incidentTitle: incident.title,
    sol: incident.triggerSol,
    choiceId: choice.id,
    choiceLabel: choice.label,
    tradeOffSummary: choice.tradeOffSummary,
    engineeringTakeaway: choice.engineeringTakeaway,
  };

  const newModifiers = [...(state.activeModifiers || [])];
  if (effects.powerDeltaMW && effects.powerDeltaMW !== 0) {
    newModifiers.push({
      id: `${incident.id}_power`,
      name: `${incident.title}: ${choice.shortTag}`,
      powerDeltaMW: effects.powerDeltaMW,
      turnsRemaining: 1, // impacts this sol
    });
  }

  const bonus = (state.permanentWaterO2Bonus || 0) + (effects.permanentWaterO2Bonus || 0);

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
  difficulty: DifficultyTier = "commander"
): PowerAllocation {
  const config = DIFFICULTY_PRESETS[difficulty];
  const baselines = config.baselinePowerDemands;

  const lifeSupport = Math.min(baselines.lifeSupport, effectiveBudgetMW * 0.38);
  const radiationShielding = Math.min(baselines.radiationShielding, effectiveBudgetMW * 0.32);
  const powerGrid = Math.max(0, effectiveBudgetMW - lifeSupport - radiationShielding);

  return {
    powerGrid: Math.round(powerGrid),
    lifeSupport: Math.round(lifeSupport),
    radiationShielding: Math.round(radiationShielding),
  };
}

export function getEffectivePowerBudget(
  environment: MissionEnvironment,
  turn: number,
  additionalModifierMW = 0,
  difficulty: DifficultyTier = "commander"
): number {
  const config = DIFFICULTY_PRESETS[difficulty];
  const event = environment.turnEvents[turn - 1];
  const rtgFloor = environment.basePowerBudgetMW * config.rtgReserveFraction;
  const solar = environment.basePowerBudgetMW * environment.baselineSolarEfficiency;
  const eventDelta = event ? event.powerDeltaMW : 0;
  const effective = Math.max(rtgFloor, solar + eventDelta + additionalModifierMW);
  return Math.round(effective);
}

export function processTurn(
  gameState: GameState,
  allocation: PowerAllocation
): { nextState: GameState; result: TurnResult } {
  const turn = gameState.currentTurn + 1;
  const { environment, difficulty } = gameState;
  const config = DIFFICULTY_PRESETS[difficulty];
  const event = environment.turnEvents[turn - 1];

  // 1. HARDCORE MECHANIC: Random Micro-Meteoroid Puncture Check
  let microStrike: MicrometeoroidStrike | null = null;
  if (config.enableMicrometeoroids) {
    microStrike = rollMicrometeoroidStrike(environment.id, turn, gameState.cumulativeScore);
  }

  // Active modifiers power sum + potential micrometeoroid power loss
  const modifierPowerDelta =
    (gameState.activeModifiers || []).reduce((sum, m) => sum + (m.powerDeltaMW || 0), 0) -
    (microStrike ? microStrike.powerLossMW : 0);

  const effectiveBudgetMW = getEffectivePowerBudget(
    environment,
    turn,
    modifierPowerDelta,
    difficulty
  );

  // Clamp allocation so it never exceeds the budget (simulate brownout proportionally)
  const totalRequested = totalAllocatedMW(allocation);
  const scaleFactor = totalRequested > effectiveBudgetMW ? effectiveBudgetMW / totalRequested : 1;
  const clampedAllocation: PowerAllocation = {
    powerGrid: Math.round(allocation.powerGrid * scaleFactor),
    lifeSupport: Math.round(allocation.lifeSupport * scaleFactor),
    radiationShielding: Math.round(allocation.radiationShielding * scaleFactor),
  };

  // 2. HARDCORE MECHANIC: Degradation curves based on actual thermal fatigue (Coffin-Manson)
  let thermalReport: ThermalFatigueReport | undefined = undefined;
  let thermalWearPerSubsystem = 0;
  if (config.enableThermalFatigueCurves) {
    thermalReport = calculateThermalFatigue(
      environment.id,
      turn,
      clampedAllocation.radiationShielding,
      config.baselinePowerDemands.radiationShielding,
      gameState.cumulativeThermalFatigueWear || 0
    );
    thermalWearPerSubsystem = thermalReport.fatigueWearAdded * config.thermalFatigueMultiplier;
  }

  // Extra wear from events and micro-meteoroids
  const extraGridWear = microStrike?.subsystemHit === "powerGrid" ? microStrike.wearDelta : 0;
  const extraLsWear = microStrike?.subsystemHit === "lifeSupport" ? microStrike.wearDelta : 0;
  const extraShieldWear =
    (event.shieldingWearDelta || 0) +
    (microStrike?.subsystemHit === "radiationShielding" ? microStrike.wearDelta : 0);

  // Process each subsystem
  const prevSubsystems = gameState.subsystems;
  const nextSubsystems: Record<SubsystemId, SubsystemState> = {
    powerGrid: processSubsystem(
      "powerGrid",
      prevSubsystems.powerGrid,
      clampedAllocation.powerGrid,
      1.0,
      extraGridWear,
      config,
      thermalWearPerSubsystem * 0.7
    ),
    lifeSupport: processSubsystem(
      "lifeSupport",
      prevSubsystems.lifeSupport,
      clampedAllocation.lifeSupport,
      event.lifeSupportStressFactor,
      extraLsWear,
      config,
      thermalWearPerSubsystem * 0.8
    ),
    radiationShielding: processSubsystem(
      "radiationShielding",
      prevSubsystems.radiationShielding,
      clampedAllocation.radiationShielding,
      event.radiationSpikeMultiplier,
      extraShieldWear,
      config,
      thermalWearPerSubsystem * 1.5 // Radiator & shielding loops bear brunt of thermal fatigue
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

  const foodDelta =
    lsExcess * FOOD_HYDROPONICS_BONUS_PER_MW * bonusFactor - config.foodConsumptionPerTurn;
  const newFoodReserve = clamp(gameState.crew.foodReserveDays + foodDelta, 0, 30);

  let moraleDelta = 0;
  if (lsHealth > 0.75 && nextSubsystems.powerGrid.health > 60) moraleDelta += MORALE_GAIN_GOOD_TURN;
  if (lsHealth < 0.5) moraleDelta -= MORALE_LOSS_LIFE_SUPPORT_LOW;
  if (effectiveRadiationMSv > environment.baselineDailyRadiationMSv * 2) moraleDelta -= MORALE_LOSS_RADIATION_HIGH;
  if (newFoodReserve < 3) moraleDelta -= MORALE_LOSS_FOOD_LOW;
  if (microStrike) moraleDelta -= 8; // Crew shaken by hull impact

  const totalMissionRad =
    Math.round((gameState.crew.radiationExposureMSv + effectiveRadiationMSv) * 100) / 100;
  const totalCareerRad =
    Math.round((gameState.crew.careerRadiationExposureMSv + effectiveRadiationMSv * 3.5) * 10) / 10;

  const nextCrew: CrewState = {
    morale: clamp(gameState.crew.morale + moraleDelta, 0, 100),
    radiationExposureMSv: totalMissionRad,
    safeRadiationLimitMSv: config.missionRadiationLimitMSv,
    careerRadiationExposureMSv: totalCareerRad,
    careerLimitMSv: config.careerRadiationLimitMSv,
    foodReserveDays: Math.round(newFoodReserve * 10) / 10,
    oxygenBufferPercent: Math.round(newOxygenBuffer * 10) / 10,
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
    microStrike ?? undefined
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
  difficulty: DifficultyTier = "commander"
): string[] {
  const hints: string[] = [];
  const config = DIFFICULTY_PRESETS[difficulty];
  const baselines = config.baselinePowerDemands;
  const total = totalAllocatedMW(allocation);

  if (total > effectiveBudgetMW) {
    hints.push(`You're trying to use ${total} MW but only ${effectiveBudgetMW} MW is available — system will auto-scale down.`);
  }

  if (allocation.lifeSupport < baselines.lifeSupport - 4) {
    hints.push(`Life Support is under-powered by ${baselines.lifeSupport - allocation.lifeSupport} MW — crew O₂ and food production will suffer.`);
  }

  if (allocation.radiationShielding < baselines.radiationShielding - 4) {
    hints.push(`Radiation Shielding is under-powered by ${baselines.radiationShielding - allocation.radiationShielding} MW — crew radiation dose will rise.`);
  }

  if (allocation.powerGrid < baselines.powerGrid - 4) {
    hints.push(`Power Grid is under-resourced by ${baselines.powerGrid - allocation.powerGrid} MW — battery reserves may not replenish adequately.`);
  }

  const overloads = (["powerGrid", "lifeSupport", "radiationShielding"] as SubsystemId[]).filter((id) => {
    return allocation[id] > baselines[id] * OVERLOAD_THRESHOLD_FRACTION;
  });
  if (overloads.length > 0) {
    hints.push(`${overloads.map((id) => ({ powerGrid: "Power Grid", lifeSupport: "Life Support", radiationShielding: "Radiation Shielding" }[id])).join(" & ")} are in overload — this causes accelerated hardware wear!`);
  }

  if (hints.length === 0) {
    hints.push("Allocation looks balanced. All three systems near their baseline requirements.");
  }

  return hints;
}
