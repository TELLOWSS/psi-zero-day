import type { StrategyView } from '../app/strategy-view';
import type { StrategySignalKind } from '../app/strategy-signals';

export interface StrategyMapCopy {
  readonly brand: string;
  readonly day: string;
  readonly stage: string;
  readonly psi: string;
  readonly objectives: string;
  readonly assignments: string;
  readonly roster: string;
  readonly site: string;
  readonly events: string;
  readonly progress: string;
}

export interface StrategyPersonLabel {
  readonly name: string;
  readonly role: string;
}

function signalIcon(kind: StrategySignalKind): string {
  switch (kind) {
    case 'ramp': return '↗';
    case 'vehicle': return '▣';
    case 'overlap': return '⇄';
    case 'access': return '!';
  }
}

export function StrategyMapShell({ view, copy, text, person }: {
  readonly view: StrategyView;
  readonly copy: StrategyMapCopy;
  readonly text: (textId: string) => string;
  readonly person: (characterId: string) => StrategyPersonLabel | undefined;
}) {
  const roster = view.roster.slice(0, 5);
  const progress = Math.max(0, Math.min(100, view.construction.current_stage_progress));
  const psiScore = Math.max(0, Math.min(100, Number(view.psi.values.score ?? 0)));

  return <main className="strategy-shell" data-stage={view.construction.stage_id}>
    <header className="strategy-hud">
      <div className="strategy-brand"><span className="strategy-hardhat" aria-hidden="true">⛑</span><strong>{copy.brand}</strong></div>
      <div className="strategy-meter" aria-label={copy.psi}>
        <span>{copy.psi}</span>
        <div className="strategy-meter-track"><i style={{ width: `${psiScore}%` }} /></div>
      </div>
      <div className="strategy-day"><span>{copy.day}</span><strong>{view.clock.day}</strong></div>
    </header>

    <aside className="strategy-rail" aria-label={copy.objectives}>
      <section className="strategy-panel strategy-objectives">
        <h2>{copy.objectives}</h2>
        <p>{copy.stage}<strong>{view.construction.stage_id}</strong></p>
        <p>{copy.progress}<strong>{progress}%</strong></p>
      </section>
      <button type="button"><span aria-hidden="true">⌖</span>{copy.site}</button>
      <button type="button"><span aria-hidden="true">⚠</span>{copy.events}<b>{view.signals.length}</b></button>
      <button type="button"><span aria-hidden="true">▦</span>{copy.assignments}<b>{view.assignments.length}</b></button>
    </aside>

    <section className="strategy-map" aria-label={copy.site}>
      <div className="strategy-map-sky" />
      <div className="strategy-map-road strategy-map-road-a" />
      <div className="strategy-map-road strategy-map-road-b" />
      <div className="strategy-site-building strategy-building-main"><span>5F</span><i /><i /><i /><i /></div>
      <div className="strategy-site-building strategy-building-side"><span>3F</span><i /><i /><i /></div>
      <div className="strategy-site-core"><span>CORE</span></div>
      <div className="strategy-tower-crane" aria-hidden="true"><i /><b /><em /></div>
      <div className="strategy-site-yard"><span>{view.assignments.length}</span><small>{copy.assignments}</small></div>
      <div className="strategy-map-stage-card">
        <span>{copy.stage}</span>
        <strong>{view.construction.stage_id}</strong>
        <progress value={progress} max={100} aria-label={copy.progress} />
      </div>

      <div className="strategy-worker-layer">
        {view.placements.map(placement => {
          const label = person(placement.character_id);
          const nearSignal = placement.nearby_signal_ids.length > 0;
          return <div
            className={`strategy-map-worker worker-${placement.anchor}${placement.scene_participant ? ' is-scene-participant' : ''}${nearSignal ? ' is-near-signal' : ''}`}
            data-character={placement.character_id}
            data-scene-participant={placement.scene_participant ? 'true' : 'false'}
            key={placement.character_id}
          >
            <div className="strategy-worker-figure" aria-hidden="true"><i className="worker-helmet" /><i className="worker-head" /><i className="worker-body" /></div>
            <div className="strategy-worker-label"><strong>{label?.name ?? placement.character_id}</strong><span>{label?.role ?? placement.role_id ?? ''}</span></div>
            {nearSignal ? <b className="strategy-worker-alert" aria-label={copy.events}>!</b> : null}
          </div>;
        })}
      </div>

      <div className="strategy-signal-layer" aria-live="polite">
        {view.signals.map(signal => <div
          className={`strategy-risk-signal signal-${signal.anchor} signal-${signal.kind}`}
          data-signal={signal.signal_id}
          key={signal.signal_id}
          role="status"
        >
          <span aria-hidden="true">{signalIcon(signal.kind)}</span>
          <strong>{text(signal.label_text_id)}</strong>
        </div>)}
      </div>
    </section>

    <footer className="strategy-roster" aria-label={copy.roster}>
      <div className="roster-title"><span>{copy.roster}</span><strong>{view.roster.length}</strong></div>
      {roster.map((character, index) => {
        const label = person(character.character_id);
        return <article className="strategy-character" key={character.character_id}>
          <div className="character-token" aria-hidden="true">{index + 1}</div>
          <div><strong>{label?.name ?? character.character_id}</strong><span>{label?.role ?? ''} · {character.available ? '●' : '○'} {character.experience}</span></div>
        </article>;
      })}
    </footer>
  </main>;
}
