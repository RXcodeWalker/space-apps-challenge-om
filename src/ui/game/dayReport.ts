// ============================================================
// Day report: turns a processed turn into the short, cause-first
// list the report card shows (design: Game Screen · "Day report").
// Pure function — no React, no engine mutation.
// ============================================================
import { STATUS, STATUS_RANK, statusOf, type Status } from '../tokens';
import type { CrewState, SubsystemId, SubsystemState, TurnResult } from '../../engine/simulationEngine';
import type { CrewMember } from '../../data/crewData';

export interface ReportLine { status: Status; text: string; delta: string }

export interface DayReport {
  caption: string;
  headline: string;
  /** Worst status in the report; colors the headline. */
  status: Status;
  lines: ReportLine[];
  /** Mission over (lost or day 10): the CTA starts a new run instead of the next day. */
  end: boolean;
  lost: boolean;
  /** The shield stopped a flare this day. */
  flareBlocked: boolean;
  cta: string;
}

export interface DaySnapshot {
  subsystems: Record<SubsystemId, SubsystemState>;
  crew: CrewState;
  members: CrewMember[];
}

const pad = (n: number) => String(n).padStart(2, '0');
const signed = (d: number, decimals: number, unit: string) => `${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(decimals)} ${unit}`;

/** Crew health as the member list the card and report both use. */
export const membersOf = (crew: CrewState, fallback: CrewMember[]): CrewMember[] => (crew.members?.length ? crew.members : fallback);

export function buildDayReport(prev: DaySnapshot, result: TurnResult, totalDays: number): DayReport {
  const lines: Array<ReportLine> = [];
  const push = (status: Status, text: string, delta: string) => lines.push({ status, text, delta });

  const flare = result.event.radiationSpikeMultiplier >= 1.6;
  const dayDose = result.crew.radiationExposureMSv - prev.crew.radiationExposureMSv;
  const limit = result.crew.safeRadiationLimitMSv || 100;
  const shieldBlocked = Math.round(result.subsystems.radiationShielding.health * 0.85);
  const alloc = result.allocation;
  const used = alloc.powerGrid + alloc.lifeSupport + alloc.radiationShielding + alloc.foodProduction;
  const brownout = result.subsystems.powerGrid.health < 35 || used > result.powerBudgetMW;

  if (flare) {
    push(dayDose > limit * 0.12 ? 'crit' : 'warn', `Solar flare hit. The shield blocked ${shieldBlocked}% of it.`, signed(dayDose, 1, 'mSv'));
  }

  const gridNow = result.subsystems.powerGrid.health, gridDelta = gridNow - prev.subsystems.powerGrid.health;
  push(
    brownout ? 'crit' : statusOf('battery', gridNow),
    brownout ? 'Brownout. The grid ran short of power.' : gridDelta < 0 ? 'Dark hours wore down the power grid.' : 'The power grid held up.',
    signed(gridDelta, 0, '%'),
  );

  const o2Delta = result.crew.oxygenBufferPercent - prev.crew.oxygenBufferPercent;
  push(
    statusOf('oxygen', result.crew.oxygenBufferPercent),
    o2Delta < 0 ? 'Oxygen dropped. Life support needs more power.' : 'The air stayed fresh.',
    signed(o2Delta, 0, '%'),
  );

  const foodDelta = result.crew.foodReserveDays - prev.crew.foodReserveDays;
  push(
    statusOf('food', result.crew.foodReserveDays),
    foodDelta < 0 ? 'The crew ate more than the greenhouse grew.' : 'The greenhouse kept up with meals.',
    signed(foodDelta, 1, 'd'),
  );

  if (!flare) push(statusOf('dose', (result.crew.radiationExposureMSv / limit) * 100), 'Background radiation reached the crew.', signed(dayDose, 1, 'mSv'));

  if (result.micrometeoroidStrike) push('warn', 'A micrometeoroid hit the hull.', result.micrometeoroidStrike.subsystemHit ? result.micrometeoroidStrike.subsystemHit : 'HULL');

  const next = membersOf(result.crew, prev.members), before = prev.members;
  let wi = 0;
  next.forEach((m, i) => { if (m.health < next[wi].health) wi = i; });
  const wd = next[wi].health - (before.find(b => b.id === next[wi].id)?.health ?? next[wi].health);
  if (wd < 0) push(statusOf('crew', next[wi].health), `${next[wi].name} is ${STATUS[statusOf('crew', next[wi].health)].word.toLowerCase()}.`, signed(wd, 0, 'hp'));

  lines.sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status]);
  const worst: Status = lines[0]?.status ?? 'ok';
  const lost = result.outcome === 'critical_alert';
  const done = result.turn >= totalDays;
  const headline = lost ? 'Mission lost' : done ? 'Mission complete' : worst === 'crit' ? 'Close call' : worst === 'warn' ? 'Tough day' : 'Smooth day';

  return {
    caption: `DAY ${pad(result.turn)} REPORT`,
    headline,
    status: lost ? 'crit' : worst,
    lines: lines.slice(0, 5),
    end: lost || done,
    lost,
    flareBlocked: flare && shieldBlocked >= 50,
    cta: lost || done ? 'See mission debrief' : `Plan day ${result.turn + 1}`,
  };
}
