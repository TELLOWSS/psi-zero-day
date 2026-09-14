import type { StrategyView } from '../app/strategy-view';

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

export function StrategyMapShell({ view, copy }: { readonly view: StrategyView; readonly copy: StrategyMapCopy }) {
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
      <button type="button"><span aria-hidden="true">⚠</span>{copy.events}<b>{view.runtime.active_event_id ? 1 : 0}</b></button>
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
      {view.runtime.active_event_id ? <div className="strategy-event-beacon" role="status"><span aria-hidden="true">!</span>{view.runtime.active_event_id}</div> : null}
    </section>

    <footer className="strategy-roster" aria-label={copy.roster}>
      <div className="roster-title"><span>{copy.roster}</span><strong>{view.roster.length}</strong></div>
      {roster.map((character, index) => <article className="strategy-character" key={character.character_id}>
        <div className="character-token" aria-hidden="true">{index + 1}</div>
        <div><strong>{character.character_id}</strong><span>{character.available ? '●' : '○'} {character.experience}</span></div>
      </article>)}
    </footer>
  </main>;
}
