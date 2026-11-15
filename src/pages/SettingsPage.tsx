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
  const { language, setLanguage, languages, t } = useTranslation();
  const [muted, toggleMute] = useSoundMuted();
  const motion: MotionChoice = s.reduceMotion === null ? 'system' : s.reduceMotion ? 'on' : 'off';

  return (
    <PageFrame eyebrow={t('shell.setEyebrow')} title={t('shell.setTitle')} lead={t('shell.setLead')}>
      <Panel size="lg" title={t('shell.display')} meta={t('shell.displayMeta')}>
        <Row name={t('shell.reduceMotion')} text={t('shell.reduceMotionText')}>
          <Segmented label={t('shell.reduceMotion')} value={motion} onChange={v => updateSettings({ reduceMotion: v === 'system' ? null : v === 'on' })}
            options={[{ value: 'system', label: t('shell.system') }, { value: 'on', label: t('shell.on') }, { value: 'off', label: t('shell.off') }]} />
        </Row>
        <Row name={t('shell.colorblind')} text={t('shell.colorblindText')}>
          <Toggle on={colorblindMode} onChange={setColorblindMode}>{t('shell.colorblindToggle')}</Toggle>
        </Row>
        <Row name={t('shell.celebrations')} text={t('shell.celebrationsText')}>
          <Segmented label={t('shell.celebrations')} value={s.celebrate} onChange={(v: CelebrateLevel) => updateSettings({ celebrate: v })}
            options={[{ value: 'full', label: t('shell.full') }, { value: 'subtle', label: t('shell.subtle') }, { value: 'off', label: t('shell.off') }]} />
        </Row>
      </Panel>

      <Panel size="lg" title={t('shell.soundPanel')} meta={t('shell.soundMeta')}>
        <Row name={t('shell.interfaceSounds')} text={t('shell.interfaceSoundsText')}>
          <Toggle on={s.sfx} onChange={on => { updateSettings({ sfx: on }); if (on) sfx.play('chime'); }}>{t('shell.soundToggle')}</Toggle>
        </Row>
        <Row name={t('shell.muteAll')} text={t('shell.muteAllText')}>
          <Toggle on={muted} onChange={() => toggleMute()}>{t('shell.muted')}</Toggle>
        </Row>
      </Panel>

      <Panel size="lg" title={t('shell.language')} meta={`${languages.length} ${t('shell.available')}`}>
        <Row name={t('shell.interfaceLanguage')} text={t('shell.interfaceLanguageText')}>
          <Segmented label={t('shell.language')} value={language} onChange={(v: SupportedLanguage) => setLanguage(v)}
            options={languages.map(l => ({ value: l.code, label: l.code.toUpperCase() }))} />
        </Row>
      </Panel>
    </PageFrame>
  );
}
