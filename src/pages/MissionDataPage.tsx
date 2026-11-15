import { useEffect, useState } from 'react';
import { Button, Panel, Segmented, award } from '../ui';
import { LUNAR_SOUTH_POLE, MARS_GALE_CRATER, EUROPA_UNDER_ICE, TITAN_HYDROCARBON, type MissionEnvironment } from '../data/nasaConstants';
import PageFrame from './PageFrame';

const ENVS: MissionEnvironment[] = [LUNAR_SOUTH_POLE, MARS_GALE_CRATER, EUROPA_UNDER_ICE, TITAN_HYDROCARBON];

/** Every number in the game traces back to a NASA dataset. This page lists them. */
export default function MissionDataPage({ initialEnvironmentId, onOpenExplorer }: { initialEnvironmentId?: string; onOpenExplorer: (env: MissionEnvironment) => void }) {
  const [id, setId] = useState(ENVS.find(e => e.id === initialEnvironmentId)?.id ?? ENVS[0].id);
  const env = ENVS.find(e => e.id === id) ?? ENVS[0];
  useEffect(() => { award('mission-data'); }, []);

  return (
    <PageFrame eyebrow="MISSION DATA · NASA SOURCES" title="Where the numbers come from" lead="Gravity, radiation and sunlight in the game follow real measurements. Pick a world to see the dataset behind each value.">
      <Segmented label="World" value={id} onChange={setId} options={ENVS.map(e => ({ value: e.id, label: e.name }))} />
      <Panel size="lg" title={env.name} meta={`${env.citations.length} sources`}>
        <p className="m-0 text-sm leading-5 text-oc-text-2">{env.subtitle}</p>
        <div>
          {env.citations.map(c => (
            <div key={c.datasetName + c.parameter} className="grid gap-2 border-b border-oc-line py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-4">
              <div className="flex flex-col gap-1">
                <span className="oc-type-code text-oc-text-3">{c.missionInstrument}</span>
                <span className="font-semibold">{c.datasetName}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="oc-type-data-s">{c.parameter}: <span className="text-oc-text-1">{c.value}</span></span>
                <span className="text-sm leading-5 text-oc-text-2">{c.kidFriendlyExplanation}</span>
                <a className="w-fit text-sm text-oc-accent hover:text-oc-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oc-accent" href={c.sourceUrl} target="_blank" rel="noopener noreferrer">Open source ↗</a>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <div><Button onClick={() => onOpenExplorer(env)}>Open full data explorer</Button></div>
    </PageFrame>
  );
}
