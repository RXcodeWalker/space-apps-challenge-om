// ============================================================
// Player progress store: XP, rank, objectives, settings, saved mission.
// Framework-free (plain module + listeners) so any page, engine or
// modal can call award() without prop drilling. React reads it via
// the hooks in src/ui/hooks.ts (useSyncExternalStore).
//
//   award('first-day')                       → one-shot objective
//   award('both-worlds', { key: 'mars' })   → counted objective (needs N distinct keys)
//   award('smooth-day', { at: 'hud' })      → celebrate at the rank HUD instead of the last tap
// ============================================================

import { OBJECTIVES, RANKS, objective, rankIndex, type ObjectiveId } from './objectives';

export type CelebrateLevel = 'full' | 'subtle' | 'off';

export interface Settings {
  /** full = burst + pop-up + promotion banner; subtle = pop-up only; off = silent bookkeeping. */
  celebrate: CelebrateLevel;
  /** Celebration and UI sounds. The legacy global mute (soundEffects) also silences them. */
  sfx: boolean;
  /** null = follow the OS prefers-reduced-motion setting. */
  reduceMotion: boolean | null;
}

export interface Progress {
  version: 1;
  xp: number;
  /** Completed objectives → ISO timestamp. */
  done: Partial<Record<ObjectiveId, string>>;
  /** Counted objectives → distinct keys collected so far. */
  counts: Partial<Record<ObjectiveId, string[]>>;
  /** Title of the most recent unlock (for tickers and the log). */
  last: string;
  stats: { missionsStarted: number; missionsCompleted: number; daysRun: number };
  settings: Settings;
}

export type AwardAt = 'pointer' | 'hud' | { x: number; y: number };

export type ProgressEvent =
  | { type: 'award'; id: ObjectiveId; title: string; xp: number; at: AwardAt }
  | { type: 'counted'; id: ObjectiveId; have: number; need: number }
  | { type: 'promote'; rankIndex: number; name: string; level: number; total: number };

const KEY = 'oc-progress-v1';
const MISSION_KEY = 'oc-mission-save-v1';

const fresh = (): Progress => ({
  version: 1,
  xp: 0,
  done: {},
  counts: {},
  last: '',
  stats: { missionsStarted: 0, missionsCompleted: 0, daysRun: 0 },
  settings: { celebrate: 'full', sfx: true, reduceMotion: null },
});

function load(): Progress {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (raw) {
      const p = JSON.parse(raw);
      if (p && p.version === 1 && typeof p.xp === 'number') {
        const f = fresh();
        return { ...f, ...p, stats: { ...f.stats, ...p.stats }, settings: { ...f.settings, ...p.settings } };
      }
    }
  } catch { /* corrupt or blocked storage: start fresh */ }
  return fresh();
}

let state: Progress = load();
const listeners = new Set<() => void>();
const eventListeners = new Set<(e: ProgressEvent) => void>();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: keep in memory */ }
}
function commit(next: Progress) {
  state = next;
  persist();
  listeners.forEach(l => l());
}
function emit(e: ProgressEvent) { eventListeners.forEach(l => l(e)); }

// Another tab earned something: pick it up.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key === KEY) { state = load(); listeners.forEach(l => l()); }
  });
}

// ---------- Reading ----------

export const getProgress = (): Progress => state;
export const getSettings = (): Settings => state.settings;
export const isDone = (id: ObjectiveId) => !!state.done[id];
export const countOf = (id: ObjectiveId) => state.counts[id]?.length ?? 0;

/** Store change subscription (for useSyncExternalStore). */
export function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
/** Award / promote events (for celebrations, analytics, tickers). */
export function onProgressEvent(fn: (e: ProgressEvent) => void) { eventListeners.add(fn); return () => { eventListeners.delete(fn); }; }

// ---------- Writing ----------

/**
 * The one entry point for every page. Safe to call repeatedly — an objective
 * pays out once. Returns true only on the call that completes it.
 */
export function award(id: ObjectiveId, opts: { key?: string; at?: AwardAt } = {}): boolean {
  const def = objective(id);
  if (!def) {
    if (import.meta.env?.DEV) console.warn(`[award] unknown objective "${id}" — add it to src/ui/game/objectives.ts`);
    return false;
  }
  if (state.done[id]) return false;

  let counts = state.counts;
  if (def.need) {
    const key = opts.key ?? 'default';
    const have = state.counts[id] ?? [];
    if (have.includes(key)) return false;
    const nextHave = [...have, key];
    counts = { ...state.counts, [id]: nextHave };
    if (nextHave.length < def.need) {
      commit({ ...state, counts });
      emit({ type: 'counted', id, have: nextHave.length, need: def.need });
      return false;
    }
  }

  const before = rankIndex(state.xp);
  const xp = state.xp + def.xp;
  commit({ ...state, xp, counts, done: { ...state.done, [id]: new Date().toISOString() }, last: def.unlock });
  emit({ type: 'award', id, title: def.unlock, xp: def.xp, at: opts.at ?? 'pointer' });

  const after = rankIndex(xp);
  if (after > before) emit({ type: 'promote', rankIndex: after, name: RANKS[after].name, level: after + 1, total: RANKS.length });
  return true;
}

export function updateSettings(patch: Partial<Settings>) {
  commit({ ...state, settings: { ...state.settings, ...patch } });
}

export function bumpStat(key: keyof Progress['stats'], by = 1) {
  commit({ ...state, stats: { ...state.stats, [key]: state.stats[key] + by } });
}

/** Wipe XP and objectives. Settings survive (they're preferences, not progress). */
export function resetProgress() {
  commit({ ...fresh(), settings: state.settings });
}

// ---------- Saved mission (resume where you left off) ----------

export interface MissionSave<T = unknown> { savedAt: string; data: T }

export function saveMission<T>(data: T) {
  try { localStorage.setItem(MISSION_KEY, JSON.stringify({ savedAt: new Date().toISOString(), data } satisfies MissionSave<T>)); } catch { /* ignore */ }
}
export function loadMission<T>(): MissionSave<T> | null {
  try { const raw = localStorage.getItem(MISSION_KEY); return raw ? (JSON.parse(raw) as MissionSave<T>) : null; } catch { return null; }
}
export function clearMission() {
  try { localStorage.removeItem(MISSION_KEY); } catch { /* ignore */ }
}

/** Mission-log rows: every objective with its live state. */
export function objectiveRows() {
  return (Object.keys(OBJECTIVES) as ObjectiveId[]).map(id => {
    const def = objective(id);
    return { id, ...def, done: !!state.done[id], have: Math.min(countOf(id), def.need ?? 1) };
  });
}
