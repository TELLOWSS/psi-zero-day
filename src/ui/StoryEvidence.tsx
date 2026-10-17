import {useEffect,useState} from 'react';
import type {GameState} from '../domain';
import {collectStoryEvidence,readStoryEvidence} from '../app/story-evidence';
import {storyEvidenceForScene,storyEvidenceReaction} from '../domain/story-evidence';

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
      <p>{t(storyEvidenceReaction(row,state))}</p>
    </article>)}
    {!result.saved&&<small role="status">{t('story.reader.unsaved')}</small>}
  </details>;
}
