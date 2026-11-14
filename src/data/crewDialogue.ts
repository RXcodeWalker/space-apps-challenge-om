// ============================================================
// crewDialogue.ts — Outpost Commander Dynamic Crew Comms & Radio Reactions
// Grounded in the 4 crew roles:
// 1. Dr. Chen - Botanist (🌱 / Leaf)
// 2. Alex - Power Engineer (⚡ / Zap)
// 3. Dr. Rivera - Medical Officer (🩺 / HeartPulse)
// 4. Marcus - Geologist (🪨 / Hammer)
// ============================================================

import type { PowerAllocation, SubsystemState, SubsystemId, CrewState } from "../engine/simulationEngine";
import type { TurnEvent, MissionEnvironment } from "./nasaConstants";

export type CrewSpeakerId = "chen" | "alex" | "rivera" | "marcus";

export interface CrewSpeakerProfile {
  id: CrewSpeakerId;
  name: string;
  role: string;
  callsign: string;
  avatar: string;
  badgeIcon: "Leaf" | "Zap" | "HeartPulse" | "Hammer";
  color: string;
  channel: string;
}

export const CREW_SPEAKERS: Record<CrewSpeakerId, CrewSpeakerProfile> = {
  chen: {
    id: "chen",
    name: "Dr. Chen",
    role: "Lead Botanist",
    callsign: "Sprout",
    avatar: "🌱",
    badgeIcon: "Leaf",
    color: "#10b981", // Emerald
    channel: "CH-1 AGRONOMY",
  },
  alex: {
    id: "alex",
    name: "Alex",
    role: "Power Engineer",
    callsign: "Volt",
    avatar: "⚡",
    badgeIcon: "Zap",
    color: "#f59e0b", // Amber
    channel: "CH-2 POWER BUS",
  },
  rivera: {
    id: "rivera",
    name: "Dr. Rivera",
    role: "Medical Officer",
    callsign: "Doc",
    avatar: "🩺",
    badgeIcon: "HeartPulse",
    color: "#ec4899", // Rose
    channel: "CH-3 MED/ECLSS",
  },
  marcus: {
    id: "marcus",
    name: "Marcus",
    role: "Planetary Geologist",
    callsign: "Bedrock",
    avatar: "🪨",
    badgeIcon: "Hammer",
    color: "#38bdf8", // Sky Cyan
    channel: "CH-4 EVA/GEOLOGY",
  },
};

export interface CommsDialogue {
  id: string;
  speaker: CrewSpeakerProfile;
  message: string;
  tone: "urgent" | "positive" | "warning" | "nominal";
  source: "power_adjustment" | "sol_advance" | "milestone";
  priority: number; // Higher numbers preempt lower ones
  timestamp: number;
}

export interface DialogueEvaluationContext {
  allocation: PowerAllocation;
  previousAllocation?: PowerAllocation;
  lastAdjustedChannel?: SubsystemId;
  subsystems: Record<SubsystemId, SubsystemState>;
  crew: CrewState;
  currentTurn: number;
  effectiveBudgetMW: number;
  currentEvent?: TurnEvent;
  environment: MissionEnvironment;
}

/**
 * Checks whether the current game event represents an active solar/dust storm or radiation spike.
 */
export function isStormEventActive(event?: TurnEvent): boolean {
  if (!event) return false;
  const id = event.id.toLowerCase();
  const label = event.label.toLowerCase();
  return (
    id.includes("storm") ||
    id.includes("spe") ||
    id.includes("flare") ||
    label.includes("storm") ||
    label.includes("flare") ||
    label.includes("spe") ||
    event.radiationSpikeMultiplier > 1.4 ||
    event.powerDeltaMW <= -20
  );
}

/**
 * Checks whether battery reserves or power grid status is critical.
 */
export function isBatteryReserveCritical(
  allocation: PowerAllocation,
  subsystems: Record<SubsystemId, SubsystemState>,
  effectiveBudgetMW: number
): boolean {
  const totalAllocated =
    allocation.powerGrid +
    allocation.lifeSupport +
    allocation.radiationShielding +
    allocation.foodProduction;
  const isOverBudgetByLot = totalAllocated > effectiveBudgetMW + 10;
  const isPowerGridCriticalLow = allocation.powerGrid < 15;
  const isPowerGridDamaged = subsystems.powerGrid.health < 40;

  return isPowerGridCriticalLow || isOverBudgetByLot || (isPowerGridDamaged && allocation.powerGrid < 20);
}

/**
 * Reactive Trigger Logic for Power Adjustments:
 * 1. When Food Production is cut to <10 MW:
 *    Dr. Chen: "Commander, the greenhouse lights are cutting out... our lettuce crops are freezing!"
 * 2. When Shielding is set to ≥50 MW during a storm:
 *    Alex: "Magnetic deflector hum at 100%! We're ready for that solar proton storm."
 * 3. When Battery reserve is critical:
 *    Marcus: "Batteries are draining fast, Commander. We won't make it through the lunar twilight at this rate."
 * 4. When O₂ buffer is high:
 *    Dr. Rivera: "Atmospheric mix is crystal clear. Crew vitals are looking fantastic."
 */
export function evaluatePowerAdjustmentDialogue(
  ctx: DialogueEvaluationContext
): CommsDialogue | null {
  const { allocation, subsystems, crew, effectiveBudgetMW, currentEvent, lastAdjustedChannel } = ctx;
  const isStorm = isStormEventActive(currentEvent);
  const batteryCritical = isBatteryReserveCritical(allocation, subsystems, effectiveBudgetMW);
  const totalAllocated =
    allocation.powerGrid +
    allocation.lifeSupport +
    allocation.radiationShielding +
    allocation.foodProduction;

  // A. Priority 1: Match directly against whichever channel the user just adjusted
  if (lastAdjustedChannel === "foodProduction" && allocation.foodProduction < 10) {
    return {
      id: "chen_food_cut_freezing",
      speaker: CREW_SPEAKERS.chen,
      message: "Commander, the greenhouse lights are cutting out... our lettuce crops are freezing!",
      tone: "urgent",
      source: "power_adjustment",
      priority: 100,
      timestamp: Date.now(),
    };
  }

  if (lastAdjustedChannel === "radiationShielding" && allocation.radiationShielding >= 50 && isStorm) {
    return {
      id: "alex_shield_100_percent_storm",
      speaker: CREW_SPEAKERS.alex,
      message: "Magnetic deflector hum at 100%! We're ready for that solar proton storm.",
      tone: "positive",
      source: "power_adjustment",
      priority: 95,
      timestamp: Date.now(),
    };
  }

  if (lastAdjustedChannel === "powerGrid" && batteryCritical) {
    return {
      id: "marcus_battery_critical_draining",
      speaker: CREW_SPEAKERS.marcus,
      message: "Batteries are draining fast, Commander. We won't make it through the lunar twilight at this rate.",
      tone: "urgent",
      source: "power_adjustment",
      priority: 90,
      timestamp: Date.now(),
    };
  }

  if (
    lastAdjustedChannel === "lifeSupport" &&
    (crew.oxygenBufferPercent >= 80 || allocation.lifeSupport >= 30)
  ) {
    return {
      id: "rivera_o2_high_crystal_clear",
      speaker: CREW_SPEAKERS.rivera,
      message: "Atmospheric mix is crystal clear. Crew vitals are looking fantastic.",
      tone: "positive",
      source: "power_adjustment",
      priority: 85,
      timestamp: Date.now(),
    };
  }

  // B. Fallback checks for the 4 core triggers even if lastAdjustedChannel is unset (e.g. presets)
  if (allocation.foodProduction < 10) {
    return {
      id: "chen_food_cut_freezing",
      speaker: CREW_SPEAKERS.chen,
      message: "Commander, the greenhouse lights are cutting out... our lettuce crops are freezing!",
      tone: "urgent",
      source: "power_adjustment",
      priority: 100,
      timestamp: Date.now(),
    };
  }

  if (allocation.radiationShielding >= 50 && isStorm) {
    return {
      id: "alex_shield_100_percent_storm",
      speaker: CREW_SPEAKERS.alex,
      message: "Magnetic deflector hum at 100%! We're ready for that solar proton storm.",
      tone: "positive",
      source: "power_adjustment",
      priority: 95,
      timestamp: Date.now(),
    };
  }

  if (batteryCritical) {
    return {
      id: "marcus_battery_critical_draining",
      speaker: CREW_SPEAKERS.marcus,
      message: "Batteries are draining fast, Commander. We won't make it through the lunar twilight at this rate.",
      tone: "urgent",
      source: "power_adjustment",
      priority: 90,
      timestamp: Date.now(),
    };
  }

  if (crew.oxygenBufferPercent >= 85 || (allocation.lifeSupport >= 35 && crew.oxygenBufferPercent >= 70)) {
    return {
      id: "rivera_o2_high_crystal_clear",
      speaker: CREW_SPEAKERS.rivera,
      message: "Atmospheric mix is crystal clear. Crew vitals are looking fantastic.",
      tone: "positive",
      source: "power_adjustment",
      priority: 80,
      timestamp: Date.now(),
    };
  }

  // Additional reactive contextual dialogues based on specific slider interactions
  if (lastAdjustedChannel === "foodProduction" && allocation.foodProduction >= 35) {
    return {
      id: "chen_food_boosted",
      speaker: CREW_SPEAKERS.chen,
      message: "Photons are flooding the aeroponic trays! The dwarf wheat and strawberries are photosynthesizing at peak rate.",
      tone: "positive",
      source: "power_adjustment",
      priority: 60,
      timestamp: Date.now(),
    };
  }

  if (lastAdjustedChannel === "radiationShielding" && isStorm && allocation.radiationShielding < 20) {
    return {
      id: "alex_shield_dangerously_low",
      speaker: CREW_SPEAKERS.alex,
      message: "Warning Commander! Shielding is way too low for this storm—the active deflector grid is failing!",
      tone: "urgent",
      source: "power_adjustment",
      priority: 75,
      timestamp: Date.now(),
    };
  }

  if (lastAdjustedChannel === "lifeSupport" && allocation.lifeSupport < 18) {
    return {
      id: "rivera_life_support_low",
      speaker: CREW_SPEAKERS.rivera,
      message: "ECLSS scrubbers are falling behind. CO₂ partial pressure is rising in the habitat bunks!",
      tone: "warning",
      source: "power_adjustment",
      priority: 70,
      timestamp: Date.now(),
    };
  }

  if (totalAllocated > effectiveBudgetMW) {
    return {
      id: "alex_overbudget_warning",
      speaker: CREW_SPEAKERS.alex,
      message: "Main bus overload! We're demanding more megawatts than generated—dial something back before breakers trip!",
      tone: "warning",
      source: "power_adjustment",
      priority: 65,
      timestamp: Date.now(),
    };
  }

  return null;
}

/**
 * Sol Advance Trigger Logic:
 * Provides a short radio status check-in based on current events and mission environment.
 */
export function getSolAdvanceDialogue(
  currentTurn: number,
  environment: MissionEnvironment,
  event?: TurnEvent,
  _crew?: CrewState
): CommsDialogue {
  const isMars = environment.id === "mars_gale_crater";
  const isEuropa = environment.id === "europa_under_ice";
  const isTitan = environment.id === "titan_hydrocarbon";
  const eventLabel = event?.label ?? "";

  // Sol 1 Welcome transmission
  if (currentTurn === 1) {
    if (isMars) {
      return {
        id: `sol_${currentTurn}_intro_mars`,
        speaker: CREW_SPEAKERS.marcus,
        message: "Touchdown in Gale Crater confirmed! Seismometers anchored into red basalt. Ready for Sol 1 orders, Commander.",
        tone: "positive",
        source: "sol_advance",
        priority: 50,
        timestamp: Date.now(),
      };
    }
    if (isEuropa) {
      return {
        id: `sol_${currentTurn}_intro_europa`,
        speaker: CREW_SPEAKERS.alex,
        message: "Sub-surface cryo-drilling successful! We are fully anchored beneath the ice shelf. Ready for Sol 1 orders, Commander.",
        tone: "positive",
        source: "sol_advance",
        priority: 50,
        timestamp: Date.now(),
      };
    }
    if (isTitan) {
      return {
        id: `sol_${currentTurn}_intro_titan`,
        speaker: CREW_SPEAKERS.marcus,
        message: "Outpost landed successfully on Titan! Atmospheric pressure nominal and RTG generator online. Ready for Sol 1.",
        tone: "positive",
        source: "sol_advance",
        priority: 50,
        timestamp: Date.now(),
      };
    }
    return {
      id: `sol_${currentTurn}_intro_lunar`,
      speaker: CREW_SPEAKERS.marcus,
      message: "Outpost boots up nominal on Shackleton crater rim! All radio telemetry channels green. Let's make history, Commander.",
      tone: "positive",
      source: "sol_advance",
      priority: 50,
      timestamp: Date.now(),
    };
  }

  // Solar Particle Event / Radiation Storm Check-in
  if (
    event?.id.includes("spe") ||
    event?.id.includes("flare") ||
    (event?.radiationSpikeMultiplier ?? 1.0) > 1.5
  ) {
    return {
      id: `sol_${currentTurn}_spe_checkin`,
      speaker: CREW_SPEAKERS.alex,
      message: "NASA DSCOVR satellite detected a solar proton wave inbound! Make sure our magnetic shielding bus gets top priority today.",
      tone: "urgent",
      source: "sol_advance",
      priority: 50,
      timestamp: Date.now(),
    };
  }

  // Dust Storm Check-in
  if (event?.id.includes("dust_storm") || (event?.powerDeltaMW ?? 0) <= -20) {
    return {
      id: `sol_${currentTurn}_dust_storm_checkin`,
      speaker: CREW_SPEAKERS.marcus,
      message: "Sky is turning dark red—heavy dust particles are blanketing the photovoltaic array. Power generation is taking a hit!",
      tone: "warning",
      source: "sol_advance",
      priority: 50,
      timestamp: Date.now(),
    };
  }

  // Eclipse or Extreme Cold / Thermal Gradient Check-in
  if (
    event?.id.includes("eclipse") ||
    event?.id.includes("thermal") ||
    eventLabel.toLowerCase().includes("thermal") ||
    eventLabel.toLowerCase().includes("cold")
  ) {
    return {
      id: `sol_${currentTurn}_thermal_checkin`,
      speaker: CREW_SPEAKERS.chen,
      message: "Thermal telemetry shows exterior frost building up rapidly. The aeroponics heaters need steady power to protect the root systems.",
      tone: "warning",
      source: "sol_advance",
      priority: 50,
      timestamp: Date.now(),
    };
  }

  // First Harvest / Agronomy milestone
  if (event?.id.includes("harvest") || currentTurn === 9) {
    return {
      id: `sol_${currentTurn}_harvest_checkin`,
      speaker: CREW_SPEAKERS.chen,
      message: "Fresh crop harvest cycle ready! Plump red radishes and microgreens are crisp. The crew is ecstatic for real food!",
      tone: "positive",
      source: "sol_advance",
      priority: 50,
      timestamp: Date.now(),
    };
  }

  // Micrometeorite check-in
  if (event?.id.includes("micrometeorite")) {
    return {
      id: `sol_${currentTurn}_micrometeorite_checkin`,
      speaker: CREW_SPEAKERS.alex,
      message: "MMOD bumper sensors detected high-speed kinetic impacts along Module C Whipple shield! Check grid integrity.",
      tone: "warning",
      source: "sol_advance",
      priority: 50,
      timestamp: Date.now(),
    };
  }

  // Final Sol 10 Evaluation
  if (currentTurn === 10) {
    return {
      id: `sol_${currentTurn}_final_checkin`,
      speaker: CREW_SPEAKERS.rivera,
      message: "Sol 10 reached! Houston flight directors are running the final expedition review. Outstanding leadership, Commander!",
      tone: "positive",
      source: "sol_advance",
      priority: 50,
      timestamp: Date.now(),
    };
  }

  // Routine check-ins rotated across crew members for other Sols
  const routineCheckins: CommsDialogue[] = [
    {
      id: `sol_${currentTurn}_rivera_routine`,
      speaker: CREW_SPEAKERS.rivera,
      message: `Morning biometric sweep completed for Sol ${currentTurn}. Team cognitive scores are solid and sleep rhythms look steady.`,
      tone: "nominal",
      source: "sol_advance",
      priority: 40,
      timestamp: Date.now(),
    },
    {
      id: `sol_${currentTurn}_marcus_routine`,
      speaker: CREW_SPEAKERS.marcus,
      message: `Surface geology drill telemetry synced. Regolith core samples are stowed in the science airlock. Ready for Sol ${currentTurn}!`,
      tone: "nominal",
      source: "sol_advance",
      priority: 40,
      timestamp: Date.now(),
    },
    {
      id: `sol_${currentTurn}_chen_routine`,
      speaker: CREW_SPEAKERS.chen,
      message: `LED growth lights cycling on for Sol ${currentTurn}. Algae O₂ photobioreactors are bubbling with fresh oxygen!`,
      tone: "positive",
      source: "sol_advance",
      priority: 40,
      timestamp: Date.now(),
    },
    {
      id: `sol_${currentTurn}_alex_routine`,
      speaker: CREW_SPEAKERS.alex,
      message: `Stirling generator convertors synced with the battery banks. Grid telemetry is online for Sol ${currentTurn}.`,
      tone: "nominal",
      source: "sol_advance",
      priority: 40,
      timestamp: Date.now(),
    },
  ];

  const index = (currentTurn - 1) % routineCheckins.length;
  return routineCheckins[index];
}
