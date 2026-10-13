import ingestV1 from '../../content/survivors-sfx-v1-ingest.json';
import ingestV2 from '../../content/survivors-sfx-v2-ingest.json';
import impactIngest from '../../content/survivors-impact-sfx-ingest.json';
import type {SurvivorsAudioAsset} from '../domain/survivors-audio';
import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
export type RecordedSfxId='radio_release'|'extinguisher_release'|'drone_release'|'drone_premium_release'|'drone_hunter_burst'|'tesla_control'|'impact_steel'|'impact_concrete'|'impact_finisher'|'player_hit'|'pickup'|'drone_launch'|'drone_dock'|'ui_equip'|'ui_denied'|'target_controlled'|'boss_alert'|'incident_secured';
export type RecordedSfxVersion='v1'|'v2';
const idsV1=['radio_release','drone_release','tesla_control','pickup','drone_launch','drone_dock','ui_equip','ui_denied'];
const rights='DIRECTOR_SUPPLIED_RUNTIME_CANDIDATE_NOT_FINAL_RIGHTS_APPROVAL';
export const RECORDED_SFX_V1:readonly SurvivorsAudioAsset[]=idsV1.map(id=>{
  const entry=ingestV1.find(row=>row.id===id&&row.mapping==='EXPLICIT_FILENAME');
  return {id,bus:'SFX',status:'CANDIDATE',uri:entry?.uri??null,sha256:entry?.sha256??null,rights,loop:false};
});
// Footsteps/ambience remain unconnected until their Wave 2 lifecycle review.
export const RECORDED_SFX:readonly SurvivorsAudioAsset[]=[
 ...ingestV2.filter(row=>!['footstep_concrete','footstep_steel','site_night','impact_steel','impact_concrete'].includes(row.id)).map(row=>({id:row.id,bus:'SFX' as const,status:'CANDIDATE' as const,uri:row.uri,sha256:row.sha256,rights,loop:false})),
 ...impactIngest.filter(row=>row.technicalPass&&row.rightsApproval).map(row=>({id:row.id,bus:'SFX' as const,status:'CANDIDATE' as const,uri:row.uri,sha256:row.sha256,rights:'DIRECTOR_CONFIRMED_PUBLIC_GAME_USE_20261007_LISTENING_PENDING',loop:false})),
];
export function recordedSfxFamily(id:RecordedSfxId,version:RecordedSfxVersion='v2'):readonly SurvivorsAudioAsset[] {return (version==='v1'?RECORDED_SFX_V1:RECORDED_SFX).filter(asset=>asset.id===id);}
export function recordedSfxAsset(id:RecordedSfxId,index=0,version:RecordedSfxVersion='v2'):SurvivorsAudioAsset|undefined {return recordedSfxFamily(id,version)[index];}
/** RELEASE filenames describe discharge, not expiry. Worker receipts remain calm. */
export function recordedEquipmentCue(event:Readonly<ProjectileFeedback>,_equipped:readonly string[]=[]):RecordedSfxId|undefined {
  if(event.worker)return;
  if(event.phase==='launch'){
    if(event.kind==='radio'||event.kind==='satellite_wave')return 'radio_release';
    if(event.kind==='extinguisher'||event.kind==='cryo_blast')return 'extinguisher_release';
    // Drone fire is owned by the Director-approved V3 runtime path.
    // V2 drone assets remain archived in the registry for rollback/QA only.
  }
  if(event.phase==='impact'){
    if(event.critical&&['CRANE_BOSS','RUNAWAY_CART','FALLING_DEBRIS'].includes(event.actorKind??''))return 'impact_finisher';
    if(event.kind==='tesla_bolt')return 'tesla_control';
    if(event.actorKind==='FALLING_DEBRIS')return 'impact_concrete';
    if(event.actorKind==='CRANE_BOSS'||event.actorKind==='RUNAWAY_CART')return 'impact_steel';
  }
}
