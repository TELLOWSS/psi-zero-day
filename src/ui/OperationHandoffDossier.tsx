import {useState} from 'react';
import {readOperationHandoffs} from '../app/operation-handoff-store';
import {CHARACTER_PROFILES, PATROL_STAGES} from '../engine/patrol-survivors-engine';
import copy from '../../content/localization/operation-handoff-dossier-ko.json';
import brief from '../../content/localization/survivors-operation-brief-ko.json';
import './operation-handoff-dossier.css';
import bridgeCopy from '../../content/localization/operation-handoff-bridge-ko.json';
import {handoffStoryAction,handoffDefenseBuild} from '../app/operation-handoff-bridge';
import type {StrategyAction} from '../app/strategy-actions';
import type {DefenseContent,DefenseRunState} from '../domain/defense';

interface StoryHandoffContext {
 actions:readonly StrategyAction[];
 text:(id:string)=>string;
 execute:(action:StrategyAction)=>unknown;
}
interface DefenseHandoffContext {
 content:DefenseContent;
 state:DefenseRunState;
 execute:(command:{type:'Build';padId:string;towerId:'CONTROL'|'SENSOR'})=>void;
 name:(id:'CONTROL'|'SENSOR')=>string;
 pauseReading?:()=>void;
}
export function OperationHandoffDossier({mode,story,defense}: {
 mode:'story'|'defense';story?:StoryHandoffContext;defense?:DefenseHandoffContext;
}) {
 const [records] = useState(() => readOperationHandoffs().reverse());
 const [index, setIndex] = useState(0);
 const record = records[index];
 const profile = record ? CHARACTER_PROFILES[record.characterId] : null;
 const action=record&&story?handoffStoryAction(record,story.actions):null;
 const build=record&&defense?handoffDefenseBuild(record,defense.content,defense.state):null;
 const roleId = record?.characterId === 'park' ? 'kang_taesik'
  : record?.characterId === 'jung' || record?.characterId === 'yoon' ? 'player' : record?.characterId;
 return <details className="operation-handoff-dossier" data-handoff-mode={mode} onToggle={event=>{if(event.currentTarget.open)defense?.pauseReading?.();}}>
  <summary>{copy.title}{records.length > 0 ? ` · ${records.length}` : ''}</summary>
  {record && profile && roleId ? <>
   <label>{copy.select}<select aria-label={copy.select} value={index} onChange={event => setIndex(Number(event.target.value))}>
    {records.map((r, i) => <option key={`${r.characterId}:${r.stageId}`} value={i}>{CHARACTER_PROFILES[r.characterId].name} · {PATROL_STAGES[r.stageId].name} · {r.outcome === 'victory' ? copy.victory : copy.defeat}</option>)}
   </select></label>
   <header><img src={profile.portraitUri} alt=""/><div><strong>{profile.name} · {profile.role}</strong><span>{PATROL_STAGES[record.stageId].name}</span><b>{record.outcome === 'victory' ? copy.victory : copy.defeat}</b></div></header>
   <dl>{([[copy.zones, record.zones], [copy.stops, record.cartStops], [copy.routes, record.rubbleCleared], [copy.damage, Math.round(record.damageTaken * 10) / 10], [copy.stars, `${record.stars.filter(Boolean).length}/3`]] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
   <p><strong>{copy[mode]}</strong>{brief.roles[roleId][mode]}</p><small>{copy.source}</small>
  </> : <p>{copy.empty}</p>}
  {action&&story&&<div><p>{bridgeCopy.storyHint}</p><button type="button" onClick={()=>story.execute(action)}>{bridgeCopy.story} · {story.text(action.label_text_id)}</button></div>}
  {build&&defense&&<div><p>{bridgeCopy.defenseHint}</p><p>{bridgeCopy.cost} {build.cost} · {bridgeCopy.budget} {defense.state.resource}</p><button type="button" disabled={!build.affordable} onClick={()=>defense.execute(build.command)}>{bridgeCopy.build} · {defense.name(build.command.towerId)} · {build.command.padId}</button></div>}
  {defense?.state.status==='INTERMISSION'&&defense.state.paused&&<p role="status">{bridgeCopy.paused}</p>}
  <p className="operation-handoff-boundary">{bridgeCopy.boundary}</p>
 </details>;
}
