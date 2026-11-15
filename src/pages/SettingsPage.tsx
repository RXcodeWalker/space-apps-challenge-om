import type { ReactNode } from 'react';
import { Panel, Segmented, Toggle, sfx, updateSettings, useSettings, type CelebrateLevel } from '../ui';
import { useAccessibility } from '../utils/AccessibilityContext';
import { useTranslation } from '../i18n/LanguageContext';
import type { SupportedLanguage } from '../i18n/types';
import { useSoundMuted } from '../utils/soundEffects';
import PageFrame from './PageFrame';

function Row({ name, text, children }: { name: string; text: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-oc-line py-4 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex min-w-[200px] flex-[1_1_240px] flex-col gap-1">
        <span className="font-semibold leading-5">{name}</span>
        <span className="text-sm leading-5 text-oc-text-2">{text}</span>
      </div>
      {children}
    </div>
  );
}

type MotionChoice = 'system' | 'on' | 'off';

export default function SettingsPage() {
  const s = useSettings();
  const { colorblindMode, setColorblindMode } = useAccessibility();
  const { language, setLanguage, languages } = useTranslation();
  const [muted, toggleMute] = useSoundMuted();
  const motion: MotionChoice = s.reduceMotion === null ? 'system' : s.reduceMotion ? 'on' : 'off';

  return (
    <PageFrame eyebrow="SETTINGS · THIS DEVICE" title="Settings" lead="Changes apply right away and stay on this device.">
      <Panel size="lg" title="Display" meta="Motion and color">
        <Row name="Reduce motion" text="Shortens the day simulation and stops the blinking alarms. System follows your device.">
          <Segmented label="Reduce motion" value={motion} onChange={v => updateSettings({ reduceMotion: v === 'system' ? null : v === 'on' })}
            options={[{ value: 'system', label: 'System' }, { value: 'on', label: 'On' }, { value: 'off', label: 'Off' }]} />
        </Row>
        <Row name="Colorblind-safe palette" text="Swaps status colors for a palette that stays distinct. Shapes and words always show too.">
          <Toggle on={colorblindMode} onChange={setColorblindMode}>Colorblind palette</Toggle>
        </Row>
        <Row name="Celebrations" text="Bursts and pop-ups when you clear an objective.">
          <Segmented label="Celebrations" value={s.celebrate} onChange={(v: CelebrateLevel) => updateSettings({ celebrate: v })}
            options={[{ value: 'full', label: 'Full' }, { value: 'subtle', label: 'Subtle' }, { value: 'off', label: 'Off' }]} />
        </Row>
      </Panel>

      <Panel size="lg" title="Sound" meta="Synthesised, no files">
        <Row name="Interface sounds" text="Slider ticks, day chimes and alarms.">
          <Toggle on={s.sfx} onChange={on => { updateSettings({ sfx: on }); if (on) sfx.play('chime'); }}>Sound</Toggle>
        </Row>
        <Row name="Mute everything" text="One switch that silences every sound in the app, including older screens.">
          <Toggle on={muted} onChange={() => toggleMute()}>Muted</Toggle>
        </Row>
      </Panel>

      <Panel size="lg" title="Language" meta={`${languages.length} available`}>
        <Row name="Interface language" text="Mission text, reports and menus.">
          <Segmented label="Language" value={language} onChange={(v: SupportedLanguage) => setLanguage(v)}
            options={languages.map(l => ({ value: l.code, label: l.code.toUpperCase() }))} />
        </Row>
      </Panel>
    </PageFrame>
  );
}
