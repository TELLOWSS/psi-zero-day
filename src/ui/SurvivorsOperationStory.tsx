import type {CharacterId, PatrolStageDefinition} from '../domain/patrol-survivors';
import type {OperationHandoff} from '../domain/survivors-operation-handoff';
import {operationStoryFocus,operationStoryMemory,operationStoryResult,storyRole} from '../app/survivors-operation-story';
import copy from '../../content/localization/survivors-operation-story-ko.json';
import bridgeCopy from '../../content/localization/operation-handoff-bridge-ko.json';
import {resolveHandoffCarry} from '../domain/survivors-handoff-carry';
import './survivors-operation-brief.css';

function Facts({facts}:{facts:{route:number;stop:number;zone:number}}) {
  return <dl className="survivors-story-facts">{(['route','stop','zone'] as const).map(key=><div key={key}><dt>{copy.metrics[key]}</dt><dd>{facts[key]}</dd></div>)}</dl>;
}
export function SurvivorsOperationStory({characterId,stage,records}:{characterId:CharacterId;stage:PatrolStageDefinition;records:readonly OperationHandoff[]}) {
  const role=copy.roles[storyRole(characterId)],focus=operationStoryFocus(characterId,stage);
  const memory=operationStoryMemory(records,characterId,stage);
  const carry=resolveHandoffCarry(records,stage.id);
  return <section className="survivors-operation-story" aria-label={copy.title}>
    <h4>{stage.id==='stage_12'?copy.pilotTitle:copy.title}</h4><p>{role.goal}</p>
    {carry&&<p role="status">{bridgeCopy.route}</p>}
    {focus&&<p><strong>{copy.title}</strong>{copy.goals[focus]}</p>}<small>{copy.optional}</small>
    {memory?<><p><strong>{copy.remembered} · STAGE {memory.record.stageNumber}</strong></p><Facts facts={memory.facts}/><p>{memory.retry?copy.retry:memory.revisit?copy.revisit:copy.nextStage}</p></>:<p>{copy.first}</p>}
  </section>;
}
export function SurvivorsOperationStoryResult({record,stage}:{record:OperationHandoff|null;stage:PatrolStageDefinition}) {
  const result=operationStoryResult(record,stage);if(!result)return null;
  const role=copy.roles[result.role];
  return <section className="survivors-operation-story survivors-story-debrief" aria-label={copy.result}>
    <h4>{copy.result}</h4><Facts facts={result.facts}/>
    <p><strong>{result.fulfilled?copy.fulfilled:copy.remaining}</strong>{result.focus?(result.fulfilled?copy.outcomes[result.focus]:copy.checks[result.focus]):role.goal}</p>
    {result.retry&&<p>{copy.retry}</p>}<p><strong>{copy.next}</strong>{role.next}</p>
  </section>;
}
