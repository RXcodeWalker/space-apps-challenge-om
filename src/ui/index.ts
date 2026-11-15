// Flight Panel design system v3 — public surface. Import from 'src/ui' (or '../ui'), not deep paths.

export * from './tokens';
export * from './hooks';

export { Panel, type PanelProps } from './components/Panel';
export { StatusShape, StatusTag, StatusText, type StatusTagProps } from './components/StatusTag';
export { Readout, type ReadoutProps } from './components/Readout';
export { Bar, type BarProps } from './components/Bar';
export { Slider, type SliderProps } from './components/Slider';
export { Button, type ButtonProps } from './components/Button';
export { Toggle, Segmented, type ToggleProps, type SegmentedProps } from './components/Toggle';
export { RankHud } from './components/RankHud';
export { AppNav, type AppNavProps, type NavPage } from './components/AppNav';
export { MissionLogDrawer } from './components/MissionLogDrawer';
export { statusVars, cx } from './components/statusVars';

export { RANKS, OBJECTIVES, OBJECTIVE_IDS, rankInfo, rankIndex, type ObjectiveId, type ObjectiveDef, type Rank } from './game/objectives';
export {
  award, getProgress, getSettings, isDone, countOf, subscribe, onProgressEvent,
  updateSettings, bumpStat, resetProgress, saveMission, loadMission, clearMission, objectiveRows,
  type Progress, type Settings, type CelebrateLevel, type ProgressEvent, type AwardAt, type MissionSave,
} from './game/progress';

export { sfx, SOUNDS, type SoundId } from './fx/sound';
export { burst, achievementToast, promoteBanner, scramble, pulseHud, installCelebrations, setHudAnchor } from './fx/celebrate';
export { CelebrationLayer } from './fx/CelebrationLayer';
