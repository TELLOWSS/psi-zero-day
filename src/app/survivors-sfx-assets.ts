import ingest from '../../content/survivors-sfx-v1-ingest.json';
import type {SurvivorsAudioAsset} from '../domain/survivors-audio';
import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
export type RecordedSfxId='radio_release'|'drone_release'|'tesla_control'|'pickup'|'drone_launch'|'drone_dock'|'ui_equip'|'ui_denied';
const ids:readonly RecordedSfxId[]=['radio_release','drone_release','tesla_control','pickup','drone_launch','drone_dock','ui_equip','ui_denied'];
export const RECORDED_SFX:readonly SurvivorsAudioAsset[]=ids.map(id=>{
  const entry=ingest.find(row=>row.id===id&&row.mapping==='EXPLICIT_FILENAME');
  return {id,bus:'SFX',status:'CANDIDATE',uri:entry?.uri??null,sha256:entry?.sha256??null,rights:'DIRECTOR_SUPPLIED_RUNTIME_CANDIDATE_NOT_FINAL_RIGHTS_APPROVAL',loop:false};
});
export function recordedSfxAsset(id:RecordedSfxId):SurvivorsAudioAsset {return RECORDED_SFX.find(asset=>asset.id===id)!;}
/** RELEASE filenames mean the trigger discharge, not expiry of an airborne projectile. */
export function recordedEquipmentCue(event:Readonly<ProjectileFeedback>):RecordedSfxId|undefined {
  if(event.worker)return;
  if(event.phase==='launch'){
    if(event.kind==='radio'||event.kind==='satellite_wave')return 'radio_release';
    if(event.kind==='drone_laser'||event.kind==='hunter_beam')return 'drone_release';
  }
  if(event.phase==='impact'&&event.kind==='tesla_bolt')return 'tesla_control';
}
