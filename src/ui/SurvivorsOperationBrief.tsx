import type {CharacterId,PatrolStageDefinition} from '../domain/patrol-survivors';
import {useState} from 'react';
import {CHARACTER_PROFILES} from '../engine/patrol-survivors-engine';
import copy from '../../content/localization/survivors-operation-brief-ko.json';
import {readOperationHandoffs} from './survivors-operation-handoff-store';
import './survivors-operation-brief.css';
import {characterReflection,hasPlayerHandoffScene,playerHandoffSceneRecord} from '../app/survivors-character-reflection';
import reflectionCopy from '../../content/localization/survivors-character-reflection-ko.json';
import {SurvivorsHandoffDialogue} from './SurvivorsHandoffDialogue';
import {SurvivorsNarrativeDirection} from './SurvivorsNarrativeDirection';
import {SurvivorsOperationStory} from './SurvivorsOperationStory';
export function SurvivorsOperationBrief({characterId,stage}:{characterId:CharacterId;stage:PatrolStageDefinition}) {
 const [,refreshDialogue]=useState(0);
 const dialogueSaved=()=>refreshDialogue(value=>value+1);
 const roleId=characterId==='park'?'kang_taesik':characterId==='jung'?'player':characterId==='yoon'?'player':characterId;
 const rows=readOperationHandoffs();
 const role=copy.roles[roleId];const profile=CHARACTER_PROFILES[characterId];const speaker=CHARACTER_PROFILES[stage.narrative?.speaker??'player'];const reflection=characterReflection(rows,characterId);const record=reflection?.record;
 const archivedScene=characterId==='player'&&record?.stageId!=='stage_12'?playerHandoffSceneRecord(rows):null;
 return <aside className="survivors-operation-brief" aria-label={copy.title}>
 <header><img src={profile.portraitUri} alt=""/><div><small>{copy.title}</small><strong>{profile.name} · {profile.role}</strong><span>{stage.name}</span></div></header>
 {stage.narrative&&<details><summary>{copy.dispatch} · {speaker.name}</summary><p>{stage.narrative.brief}</p></details>}
 <p><strong>{copy.role}</strong>{role.action}</p>
 <p><strong>{copy.objective}</strong>{stage.starChallenges[1].description}</p>
 <SurvivorsOperationStory characterId={characterId} stage={stage} records={rows}/>
 <div className="survivors-operation-links"><p><strong>{copy.story}</strong>{role.story}</p><p><strong>{copy.defense}</strong>{role.defense}</p></div>
 <details><summary>{copy.record}</summary>{record?<>
 <p>STAGE {record.stageNumber} · {record.outcome==='victory'?copy.won:copy.lost}<br/>{copy.zones} {record.zones} · {copy.stops} {record.cartStops} · {copy.routes} {record.rubbleCleared}</p>
 <h4>{reflectionCopy.title}</h4>
 {hasPlayerHandoffScene(record)&&<figure className="survivors-handoff-scene"><img src="/assets/survivors/growth/player-stage12-handoff-v1.png" alt={reflectionCopy.sceneAlt}/><figcaption>{reflectionCopy.sceneCaption}</figcaption></figure>}
 {reflection!.evidence.length?<ul>{reflection!.evidence.map(id=><li key={id}>{reflectionCopy[id]}</li>)}</ul>:<p>{reflectionCopy.empty}</p>}
 <small>{reflectionCopy.boundary}</small>
 {hasPlayerHandoffScene(record)&&<><SurvivorsHandoffDialogue onSaved={dialogueSaved}/><SurvivorsNarrativeDirection record={record}/></>}
 </>:<p>{copy.none}</p>}<small>{copy.future}</small></details>
 {archivedScene&&<details className="survivors-handoff-archive"><summary>{reflectionCopy.archiveTitle}</summary><figure className="survivors-handoff-scene"><img src="/assets/survivors/growth/player-stage12-handoff-v1.png" alt={reflectionCopy.sceneAlt}/><figcaption>{reflectionCopy.sceneCaption}</figcaption></figure><SurvivorsHandoffDialogue onSaved={dialogueSaved}/><SurvivorsNarrativeDirection record={archivedScene}/></details>}
 </aside>;
}
