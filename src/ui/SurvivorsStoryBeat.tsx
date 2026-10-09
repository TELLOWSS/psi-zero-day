import type {CharacterId, PatrolStageId} from '../domain/patrol-survivors';
import type {OperationHandoff} from '../domain/survivors-operation-handoff';
import {storyBrief,storyOutcome} from '../domain/survivors-story-attachment';
import {readOperationHandoffs} from './survivors-operation-handoff-store';
import './survivors-story-beat.css';

interface Props {
  readonly stageId: PatrolStageId;
  readonly characterId: CharacterId;
  readonly view: 'brief' | 'result';
  readonly record?: OperationHandoff | null;
}

/** Render outside the active canvas: never blocks dodges, warnings or touch targets. */
export function SurvivorsStoryBeat({stageId,characterId,view,record}:Props) {
  const history=readOperationHandoffs();
  const beat=view==='result'
    ? record?.stageId===stageId && record.characterId===characterId ? storyOutcome(record,history) : null
    : storyBrief(stageId,characterId,history);
  if(!beat) return null;
  return <section className="survivors-story-beat" data-story-stage={stageId} data-story-view={view} aria-label={beat.title}>
    <strong className="survivors-story-beat-title">{beat.title}</strong>
    <p>{beat.opening}</p>
    <p className="survivors-story-beat-radio">{beat.characterLine}</p>
    <small className="survivors-story-beat-evidence">{beat.evidence}</small>
    {beat.alternateView&&<p className="survivors-story-beat-alternate">{beat.alternateView}</p>}
    <p className="survivors-story-beat-next">{beat.nextSignal}</p>
  </section>;
}
