import type {CharacterId,PatrolStageDefinition} from '../domain/patrol-survivors';
import {CHARACTER_PROFILES} from '../engine/patrol-survivors-engine';
import copy from '../../content/localization/survivors-operation-brief-ko.json';
import {readOperationHandoffs} from './survivors-operation-handoff-store';
import {SurvivorsStoryBeat} from './SurvivorsStoryBeat';
import './survivors-operation-brief.css';
export function SurvivorsOperationBrief({characterId,stage}:{characterId:CharacterId;stage:PatrolStageDefinition}) {
 const roleId=characterId==='park'?'kang_taesik':characterId==='jung'?'player':characterId==='yoon'?'player':characterId;
 const role=copy.roles[roleId];const profile=CHARACTER_PROFILES[characterId];const speaker=CHARACTER_PROFILES[stage.narrative?.speaker??'player'];const record=readOperationHandoffs().filter(r=>r.characterId===characterId).at(-1);
 return <aside className="survivors-operation-brief" aria-label={copy.title}>
 <header><img src={profile.portraitUri} alt=""/><div><small>{copy.title}</small><strong>{profile.name} · {profile.role}</strong><span>{stage.name}</span></div></header>
 {stage.narrative&&<details><summary>{copy.dispatch} · {speaker.name}</summary><p>{stage.narrative.brief}</p></details>}
 <p><strong>{copy.role}</strong>{role.action}</p>
 <p><strong>{copy.objective}</strong>{stage.starChallenges[1].description}</p>
 <div className="survivors-operation-links"><p><strong>{copy.story}</strong>{role.story}</p><p><strong>{copy.defense}</strong>{role.defense}</p></div>
 <details><summary>{copy.record}</summary>{record?<p>STAGE {record.stageNumber} · {record.outcome==='victory'?copy.won:copy.lost}<br/>{copy.zones} {record.zones} · {copy.stops} {record.cartStops} · {copy.routes} {record.rubbleCleared}</p>:<p>{copy.none}</p>}<small>{copy.future}</small></details>
 <SurvivorsStoryBeat stageId={stage.id} characterId={characterId} view="brief"/>
 </aside>;
}
