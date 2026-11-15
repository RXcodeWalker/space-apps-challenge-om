import { useState } from 'react';
import { Button, Panel } from '../ui';
import EducatorHubModal, { type EducatorTab } from '../components/EducatorHubModal';
import PageFrame from './PageFrame';

const CLASS_SEED = 'ARTEMIS-26';
const RESOURCES: Array<{ tab: EducatorTab; code: string; name: string; text: string }> = [
  { tab: 'lesson-plan', code: 'PLAN', name: 'Lesson plan', text: 'A 45-minute run sheet with teacher hooks and timing.' },
  { tab: 'ngss', code: 'NGSS', name: 'Standards alignment', text: 'Which NGSS performance expectations each day covers.' },
  { tab: 'prompts', code: 'ASK', name: 'Discussion prompts', text: 'Questions that turn a power split into an argument from evidence.' },
  { tab: 'print-guide', code: 'PRINT', name: 'Printable guide', text: 'Ink-friendly black and white pages for the whole class.' },
];

export default function TeacherPage({ seed, onUseSeed, onGoPlay }: { seed: string; onUseSeed: (seed: string) => void; onGoPlay: () => void }) {
  const [tab, setTab] = useState<EducatorTab | null>(null);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(CLASS_SEED); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  };
  return (
    <PageFrame eyebrow="TEACHER TOOLS · NGSS" title="Run it with a class" lead="Give every student the same code and they face the same space weather. Then compare plans.">
      <Panel size="lg" title="Class code" meta="Same code, same weather">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="oc-type-data-xl">{CLASS_SEED}</span>
          <div className="flex flex-wrap gap-2">
            <Button onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
            <Button variant="primary" onClick={() => { onUseSeed(CLASS_SEED); onGoPlay(); }}>Use this code</Button>
          </div>
        </div>
        <span className="text-sm text-oc-text-3">Current code on this device: <span className="oc-type-data-s text-oc-text-2">{seed || '—'}</span></span>
      </Panel>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-2">
        {RESOURCES.map(r => (
          <Panel key={r.tab} size="lg" title={r.name} meta={r.code}>
            <p className="m-0 flex-1 text-sm leading-5 text-oc-text-2">{r.text}</p>
            <Button size="sm" onClick={() => setTab(r.tab)}>Open</Button>
          </Panel>
        ))}
      </div>
      <EducatorHubModal isOpen={tab !== null} initialTab={tab ?? 'lesson-plan'} onClose={() => setTab(null)} onSelectSeed={s => { onUseSeed(s); setTab(null); onGoPlay(); }} />
    </PageFrame>
  );
}
