// ============================================================
// intervention.ts — Flight Director Emergency Interventions
// Fast-paced 15-second tactile micro-puzzles for NASA incident triage
// ============================================================

import type { IncidentCard } from "../data/incidentCards";

export type InterventionType = "magnetic_shield" | "circuit_breaker" | "perchlorate_wash";

export type InterventionStatus = "ready" | "in_progress" | "success" | "failure" | "skipped";

export interface FlightDirectorInterventionResult {
  interventionType: InterventionType;
  status: "success" | "failure" | "skipped";
  telemetrySummary: string;
  shieldEfficiencyBonus?: number; // e.g. +20%
  radiationLeakMSv?: number; // e.g. 0 mSv on success, +1.2 mSv on failure
  gridHealthBonus?: number; // e.g. +15% on success, -10% on failure
  powerDeltaMW?: number; // e.g. +10 MW bonus on success, -10 MW on failure
  lifeSupportDelta?: number; // e.g. +15% on success, -8% on failure
  foodDaysDelta?: number; // e.g. +2 on success, -1 on failure
  permanentWaterO2Bonus?: number; // e.g. +10%
  details?: Record<string, string | number | boolean>;
}

/**
 * Maps an incoming incident to its corresponding 15-second tactile micro-puzzle.
 * 1. 🧲 Magnetic Shield Vector Alignment: Solar Particle Events, cosmic ray flares, radiation storms.
 * 2. ⚡ Emergency Circuit Breaker Reroute: Grid overloads, brownouts, power surges, electrical arcing.
 * 3. 🧪 Perchlorate Soil Wash Calibration: Regolith contamination, perchlorate salts, toxic dust, chemical washing.
 */
export function getIncidentInterventionType(incident: IncidentCard): InterventionType {
  const id = incident.id.toLowerCase();
  const text = `${incident.title} ${incident.headline} ${incident.description}`.toLowerCase();

  // 1. Magnetic Shield Vector Alignment
  if (
    id.includes("spe") ||
    id.includes("solar") ||
    id.includes("radiation") ||
    id.includes("gcr") ||
    text.includes("solar particle") ||
    text.includes("coronal mass") ||
    text.includes("proton") ||
    text.includes("magnetosphere") ||
    text.includes("cosmic ray") ||
    text.includes("radiation storm")
  ) {
    return "magnetic_shield";
  }

  // 2. Perchlorate Soil Wash Calibration
  if (
    id.includes("perchlorate") ||
    id.includes("dust") ||
    id.includes("regolith") ||
    id.includes("slagging") ||
    id.includes("icing") ||
    text.includes("perchlorate") ||
    text.includes("regolith") ||
    text.includes("soil") ||
    text.includes("contamin") ||
    text.includes("salt") ||
    text.includes("greywater") ||
    text.includes("brine") ||
    text.includes("purification")
  ) {
    return "perchlorate_wash";
  }

  // 3. Emergency Circuit Breaker Reroute (Default for electrical, brownout, drill surges, grid overloads)
  return "circuit_breaker";
}
