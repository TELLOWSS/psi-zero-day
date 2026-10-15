import {useCallback,useEffect,useRef} from 'react';
import type {DefenseCombatShot,DefenseRunState} from '../domain/defense';
import {DefenseCombatMixer} from '../app/defense-combat-mixer';

export function useDefenseCombatAudio(state:DefenseRunState|null,shots:readonly DefenseCombatShot[],muted:boolean,enabled:boolean,supplied=false){
 const mixer=useRef<DefenseCombatMixer|null>(null),seen=useRef('');
 const previous=useRef<DefenseRunState|null>(null);
 const arm=useCallback((force=false)=>{if((muted&&!force)||!enabled)return;const instance=mixer.current??new DefenseCombatMixer(supplied);mixer.current=instance;instance.arm();},[muted,enabled,supplied]);
 useEffect(()=>{
  if(muted||!enabled||!state||state.paused||state.status==='READY'||state.status==='WON'||state.status==='LOST'||document.hidden){mixer.current?.stop();return;}
  if(!shots.length)return;const key=shots.map(s=>s.id).join('|');if(seen.current===key)return;seen.current=key;
  for(const shot of shots)mixer.current?.play(shot,shot.targets[0]?shot.targets[0].point.x/1000*1.2-.6:0);
 },[state,shots,muted,enabled]);
 useEffect(()=>{
  const before=previous.current;previous.current=state;if(!supplied||muted||!state||!before||before.runId!==state.runId||state.paused||document.hidden||(before.tick===state.tick&&before.status===state.status))return;
  if(state.shield<before.shield)mixer.current?.critical('CRITICAL_LEAK_ALERT_AUDIO');
  if((state.eStopCooldownUntilTick??0)>(before.eStopCooldownUntilTick??0))mixer.current?.critical('CRITICAL_ESTOP_CONFIRMED_AUDIO');
  if(state.enemies.some(e=>e.enemyId==='BOSS')&&!before.enemies.some(e=>e.enemyId==='BOSS'))mixer.current?.critical('CRITICAL_BOSS_ENTRY_AUDIO');
  if(state.enemies.some(e=>e.enemyId==='BOSS'&&e.bossPhaseTriggered&&!before.enemies.find(b=>b.id===e.id)?.bossPhaseTriggered))mixer.current?.critical('CRITICAL_BOSS_PHASE_AUDIO');
  if(shots.some(s=>s.targets.some(t=>t.enemyId==='BOSS'&&t.resolved)))mixer.current?.critical('CRITICAL_BOSS_RESOLVE_AUDIO');
 },[state,supplied,muted,shots]);
 useEffect(()=>{const hide=()=>{if(document.hidden)mixer.current?.stop();};document.addEventListener('visibilitychange',hide);return()=>{document.removeEventListener('visibilitychange',hide);mixer.current?.dispose();mixer.current=null;};},[]);
 return arm;
}
