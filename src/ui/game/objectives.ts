// ============================================================
// XP ladder and objective registry. Add new objectives HERE only;
// pages refer to them by id through award(id).
// ============================================================

export interface Rank {
  /** XP needed to reach this rank. */
  xp: number;
  name: string;
  short: string;
}

export const RANKS: readonly Rank[] = [
  { xp: 0, name: 'CADET', short: 'CDT' },
  { xp: 150, name: 'SPECIALIST', short: 'SPC' },
  { xp: 400, name: 'ENGINEER', short: 'ENG' },
  { xp: 750, name: 'FLIGHT DIRECTOR', short: 'FD' },
  { xp: 1100, name: 'COMMANDER', short: 'CMD' },
];

export interface ObjectiveDef {
  /** What the mission log shows before it's done (an instruction). */
  title: string;
  /** What the achievement pop-up says when it unlocks (a headline). */
  unlock: string;
  xp: number;
  /** Counted objectives: how many distinct keys award(id, { key }) must collect. */
  need?: number;
  /** Hidden until unlocked in the mission log. */
  secret?: boolean;
}

export const OBJECTIVES = {
  'first-day': { title: 'Run your first day', unlock: 'First day survived', xp: 100 },
  'full-budget': { title: 'Assign every megawatt', unlock: 'Nothing wasted', xp: 25 },
  'smooth-day': { title: 'Get a Smooth day report', unlock: 'Smooth operator', xp: 50 },
  'flare-blocked': { title: 'Block a solar flare with the shield', unlock: 'Flare deflected', xp: 75 },
  'close-call': { title: 'Bring a critical reading back to nominal', unlock: 'Pulled back from the edge', xp: 75 },
  'mission-complete': { title: 'Survive all ten days', unlock: 'Mission complete', xp: 300 },
  'all-healthy': { title: 'Finish a mission with all four crew healthy', unlock: 'Nobody left behind', xp: 150 },
  'both-worlds': { title: 'Complete a mission on the Moon and on Mars', unlock: 'Two worlds', xp: 150, need: 2 },
  'flight-director': { title: 'Complete a mission at Flight Director difficulty', unlock: 'Flight Director cleared', xp: 200 },
  'mission-data': { title: 'Open the NASA mission data', unlock: 'Read the sources', xp: 25 },
  'patch': { title: 'Design a mission patch', unlock: 'Patch designer', xp: 50 },
  'ds-drill': { title: 'Finish the anomaly drill', unlock: 'Eyes on the panel', xp: 150 },
  'ds-drill-s': { title: 'Score an S in the anomaly drill', unlock: 'S-rank reflexes', xp: 150 },
  'ds-copy3': { title: 'Copy three color swatches', unlock: 'Palette collector', xp: 50, need: 3 },
  'ds-crit': { title: 'Push the oxygen lab into critical', unlock: 'Oxygen into the red', xp: 75 },
  'ds-gray': { title: 'Run the grayscale check at critical', unlock: 'Reads without color', xp: 75 },
  'ds-type': { title: 'Send a message through the type tester', unlock: 'Message to the crew', xp: 25 },
  'ds-xray': { title: 'X-ray a readout', unlock: 'Saw through the readout', xp: 25 },
  'ds-tablet': { title: 'Reflow the game for tablet', unlock: 'Reflowed for tablet', xp: 25 },
  'ds-fire6': { title: 'Fire all six motion curves', unlock: 'Every curve fired', xp: 75, need: 6 },
  'ds-scrub': { title: 'Play the day through to the report', unlock: 'Day played to the report', xp: 50 },
  'ds-sounds6': { title: 'Play every sound', unlock: 'Full sound check', xp: 100, need: 6 },
  'ds-bench': { title: 'Trip the bench into critical by hand', unlock: 'Bench tripped to critical', xp: 50 },
} as const satisfies Record<string, ObjectiveDef>;

export type ObjectiveId = keyof typeof OBJECTIVES;
export const OBJECTIVE_IDS = Object.keys(OBJECTIVES) as ObjectiveId[];
export const objective = (id: ObjectiveId): ObjectiveDef => OBJECTIVES[id];

export function rankIndex(xp: number): number {
  let i = 0;
  RANKS.forEach((r, k) => { if (xp >= r.xp) i = k; });
  return i;
}

/** Rank, next rank and 0–1 progress toward it. */
export function rankInfo(xp: number) {
  const i = rankIndex(xp), rank = RANKS[i], next = RANKS[i + 1] ?? null;
  const frac = next ? (xp - rank.xp) / (next.xp - rank.xp) : 1;
  return { index: i, level: i + 1, total: RANKS.length, rank, next, frac, toNext: next ? next.xp - xp : 0 };
}
