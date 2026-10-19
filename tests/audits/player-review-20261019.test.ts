import {it,expect} from 'vitest';
import fs from 'node:fs';
import {playEpisode, type EpisodeDecisions} from '../helpers/episode01-playthrough';
import {createEpisode01Registry} from '../../src/content/episode01';
import {guardContents} from '../../src/content/guard-campaign';
import {createDefenseRun,applyDefenseCommand,advanceDefense} from '../../src/engine/defense';
import {recommendDefenseAction} from '../../src/app/defense-tactics';
import {encodeDefenseSave,decodeDefenseSave,emptyDefenseSaveDocument} from '../../src/app/defense-save';
const out='artifacts/player-review-20261019';
fs.mkdirSync(out,{recursive:true});
it('records a 144 route story matrix and directed consequence contrasts',()=>{
 const rows=[];
 for(const plan of ['delegate_kang','negotiate_yoon','coordinate_schedule','follow_junho'] as const)
 for(const ramp of ['check_self','ask_minseok','keep_schedule'] as const)
 for(const entrance of ['assign_crew','request_delay','force_clear'] as const)
 for(const evening of ['rest','family','study','field_note'] as const){
  const decisions={plan,ramp,entrance,evening,signal:'listen_more'} as const;
  const {state,trace}=playEpisode(decisions);
  rows.push({decisions,complete:state.flags.episode01_completed,events:state.event_runtime.completion_history.map(e=>e.event_id),commands:trace.length,flags:state.flags});
 }
 const directed=[];
 const content=createEpisode01Registry('directed').getValidatedContent();
 const profiles:Record<string,Partial<EpisodeDecisions>>={
  verify:{inspection:'inspection_sequence_agreement',responsibility:'report_verify_timeline',tbm:'tbm_change_control',restart:'restart_verify_controls',stopwork:'stopwork_protect_process',instruction:'instruction_reconstruct_chain',record:'record_preserve_timeline'},
  paperwork:{inspection:'inspection_quick_photo',responsibility:'report_defensive',tbm:'tbm_form_first',restart:'restart_follow_verbal',stopwork:'stopwork_ignore_social',instruction:'instruction_accept_top',record:'record_retrofit_paper'},
  blame:{inspection:'inspection_full_stop',responsibility:'report_one_sided',tbm:'tbm_worker_blame',restart:'restart_trace_instruction',stopwork:'stopwork_public_boundary',instruction:'instruction_blame_worker',record:'record_minimize_scope'}
 };
 for(const [profile,overrides] of Object.entries(profiles)){
  const d={plan:'coordinate_schedule',signal:'listen_more',ramp:'check_self',entrance:'request_delay',evening:'field_note',...overrides} as EpisodeDecisions;
  const normal=playEpisode(d,{content}),restored=playEpisode(d,{content,resumeEveryCommand:true});
  expect(restored.state).toEqual(normal.state);
  directed.push({profile,events:normal.state.event_runtime.completion_history.map(e=>e.event_id),commands:normal.trace.length,choices:normal.trace.filter(t=>t.command.type==='choose_event').map(t=>t.command),flags:normal.state.flags,resumeIdentical:true});
 }
 fs.writeFileSync(out+'/story.json',JSON.stringify({scope:'Engine commands only; helper supplies clock slots; not UI or human playtime',rows,directed},null,2));
 expect(rows).toHaveLength(144);expect(rows.every(r=>r.complete)).toBe(true);
 expect(directed.every(r=>r.events.length===26)).toBe(true);
},120000);
it('compares six guard stages with three planning styles and three target policies',()=>{
 const rows=[];
 for(const content of guardContents)for(const style of ['BALANCED','AREA_CONTROL','PRECISION'] as const)for(const targetMode of ['FIRST','STRONG','THREAT'] as const){
  let s=createDefenseRun(content,'COORDINATOR',`review-${style}-${targetMode}`,{ultimateUnlocked:content.ultimateEnabled===true});
  let ticks=0,actions=0,emergency=0;
  for(;ticks<40000&&!['WON','LOST'].includes(s.status);ticks++){
   if(s.status==='READY'||s.status==='INTERMISSION'){
    if(content.map.transition?.beforeWave===s.waveId&&!s.appliedTransitionIds?.length)s=applyDefenseCommand(s,content,{type:'ConfirmTransition'});
    for(let n=0;n<40;n++){const a=recommendDefenseAction(content,s,style);if(!a)break;s=applyDefenseCommand(s,content,a.command);actions++;}
    for(const t of s.towers)if(t.targetMode!==targetMode)s=applyDefenseCommand(s,content,{type:'SetTargetMode',towerInstanceId:t.id,targetMode});
    s=applyDefenseCommand(s,content,{type:'StartWave'});
   }
   if(content.sensorPressure&&s.status==='RUNNING'&&(s.eStopCooldownUntilTick??0)<=s.tick&&(s.enemies.some(e=>e.sensorPressure?.phase==='WARNING')||s.enemies.some(e=>e.enemyId==='BOSS'&&e.distance>1000))){s=applyDefenseCommand(s,content,{type:'TriggerEStop'});emergency++;}
   if(s.supportCooldownRemaining===0){try{s=applyDefenseCommand(s,content,{type:'UseSupport'});}catch{}}
   if(ticks%100===0&&s.status==='RUNNING'){const a=recommendDefenseAction(content,s,style);if(a){s=applyDefenseCommand(s,content,a.command);actions++;}}
   s=advanceDefense(s,content);
  }
  const resume=decodeDefenseSave(encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:s},content,1))?.payload.activeRun;
  expect(resume).toEqual(s);
  rows.push({stage:content.scenario.id,style,targetMode,status:s.status,shield:s.shield,wave:s.waveId,ticks,seconds:ticks*content.tickMs/1000,actions,emergency,resource:s.resource,leaks:s.leakedByEnemy,towers:s.towers.map(t=>({pad:t.padId,family:t.towerId,level:t.levelId})),resumeIdentical:true});
 }
 fs.writeFileSync(out+'/guard.json',JSON.stringify({scope:'Normal budget; known-stage recommendation policy; COORDINATOR; later-stage ultimate eligibility assumed; not natural unlock or human win rate',rows},null,2));
 expect(rows).toHaveLength(54);expect(rows.every(r=>['WON','LOST'].includes(r.status))).toBe(true);
},120000);
