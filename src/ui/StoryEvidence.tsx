import {useEffect,useState} from 'react';
import type {GameState} from '../domain';
import {collectStoryEvidence,readStoryEvidence} from '../app/story-evidence';
import {storyEvidenceForScene,storyEvidenceReaction} from '../domain/story-evidence';

/** Receipt observation IDs are externally supplied, including legacy saves.
 * Never interpolate an unknown ID into strict localization (which throws).
 */
const TRANSLATED_OBSERVATIONS=new Set([
  'controlled-zone','cart-stop','route-cleared','defense-route-review',
  'watch-load-pattern','guard-load-pattern','breaker-load-pattern',
]);
export function storyObservationLabel(id:string,t:(id:string)=>string):string {
  return t(TRANSLATED_OBSERVATIONS.has(id)
    ? `story.evidence.observation.${id}`:'story.evidence.observation.other');
}

export function StoryEvidence({eventId,state,t}:{eventId:string|null;state:GameState|null;t:(id:string)=>string}) {
  const [result,setResult]=useState(()=>({receipts:readStoryEvidence(),saved:true}));
  useEffect(()=>{
    let live=true;const refresh=()=>{void collectStoryEvidence().then(value=>{if(live)setResult(value);});};
    const stored=(e:StorageEvent)=>{if(['psi.survivors.operation-handoff.v1','psi-zero-day.encounter-intel.v1','psi-zero-day.defense.save.v1','psi-zero-day.guard.save.v2'].includes(e.key??''))refresh();};
    refresh();window.addEventListener('focus',refresh);window.addEventListener('storage',stored);
    return()=>{live=false;window.removeEventListener('focus',refresh);window.removeEventListener('storage',stored);};
  },[]);
  const rows=storyEvidenceForScene(eventId,result.receipts);
  if(!rows.length)return null;
  return <details open={rows.length===1} className="story-evidence" data-story-evidence="integrated">
    <summary>{t('story.evidence.title')} · {rows.length}</summary>
    <p className="story-evidence-boundary">{t('story.evidence.boundary')}</p>
    {rows.map(row=><article key={`${row.sourceMode}:${row.sourceRecordId}`} data-evidence-mode={row.sourceMode} data-evidence-outcome={row.outcome}>
      <span>{t(`story.evidence.mode.${row.sourceMode}`)} · {t(`story.evidence.outcome.${row.outcome}`)}</span>
      <small className="story-evidence-source">{t('story.evidence.source')} · {row.sourceAreaId==='unknown'?t('story.evidence.legacy'):row.sourceAreaId}
        {' · '}{row.observedAt?<time dateTime={row.observedAt}>{new Date(row.observedAt).toLocaleString('ko-KR')}</time>:t('story.evidence.undated')}
      </small>
      <p>{t(storyEvidenceReaction(row,state))}</p>
      {row.observationIds.length?<ul>{row.observationIds.map(id=><li key={id}>{storyObservationLabel(id,t)}</li>)}</ul>:null}
    </article>)}
    {!result.saved&&<small role="status">{t('story.reader.unsaved')}</small>}
  </details>;
}
