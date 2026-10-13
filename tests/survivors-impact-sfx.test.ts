// @vitest-environment jsdom
import {expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ingest from '../content/survivors-impact-sfx-ingest.json';
import {recordedEquipmentCue,recordedSfxFamily} from '../src/app/survivors-sfx-assets';
import {SurvivorsSessionAudio} from '../src/ui/survivors-session-audio';

it('keeps native rate, measured headroom and explicit pending listening approval',()=>{
 expect(ingest).toHaveLength(9);
 for(const row of ingest){
  expect(row.sampleRate).toBe(44100);expect(row.duration).toBeCloseTo(.48);
  expect(row.technicalPass).toBe(true);expect(row.rightsApproval).toBe(true);expect(row.listeningApproval).toBe(false);
  expect(row.runtimeOverFullScaleSamples).toBe(0);expect(row.runtimePeakDbfs).toBeLessThanOrEqual(-3);
  expect(createHash('sha256').update(readFileSync('public'+row.uri)).digest('hex')).toBe(row.sha256);
 }
 for(const id of ['impact_steel','impact_concrete','impact_finisher'] as const){
  expect(recordedSfxFamily(id)).toHaveLength(3);
  expect(recordedSfxFamily(id).every(asset=>asset.uri?.includes('impact-sfx-v1'))).toBe(true);
 }
 expect(recordedSfxFamily('impact_finisher','v1')).toHaveLength(0);
});
it('reserves decisive accents for important non-worker unblocked contacts',()=>{
 const event={projectileId:'p',kind:'radio' as const,phase:'impact' as const,x:0,y:0,angle:0,radius:4,critical:true};
 expect(recordedEquipmentCue({...event,actorKind:'CRANE_BOSS'})).toBe('impact_finisher');
 expect(recordedEquipmentCue({...event,actorKind:'FALLING_DEBRIS'})).toBe('impact_finisher');
 expect(recordedEquipmentCue({...event,worker:true,actorKind:'CRANE_BOSS'})).toBeUndefined();
 expect(recordedEquipmentCue({...event,actorKind:'GAS_LEAK'})).toBeUndefined();
 const audio=new SurvivorsSessionAudio(),play=vi.spyOn(audio,'playRecordedEffect').mockReturnValue(true);
 audio.playEquipmentFeedback({...event,actorKind:'CRANE_BOSS',blocked:true},{x:0,y:0});
 expect(play).not.toHaveBeenCalled();audio.dispose();vi.restoreAllMocks();
});
