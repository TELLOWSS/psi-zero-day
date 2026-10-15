import {useCallback,useEffect,useRef} from 'react';
import type {DefenseCombatShot,DefenseRunState} from '../domain/defense';
import {DefenseCombatMixer} from '../app/defense-combat-mixer';

export function useDefenseCombatAudio(state:DefenseRunState|null,shots:readonly DefenseCombatShot[],muted:boolean,enabled:boolean){
 const mixer=useRef<DefenseCombatMixer|null>(null),seen=useRef('');
 const arm=useCallback((force=false)=>{if((muted&&!force)||!enabled)return;const instance=mixer.current??new DefenseCombatMixer();mixer.current=instance;instance.arm();},[muted,enabled]);
 useEffect(()=>{
  if(muted||!enabled||!state||state.paused||state.status==='READY'||state.status==='WON'||state.status==='LOST'||document.hidden){mixer.current?.stop();return;}
  if(!shots.length)return;const key=shots.map(s=>s.id).join('|');if(seen.current===key)return;seen.current=key;
  for(const shot of shots)mixer.current?.play(shot,shot.targets[0]?shot.targets[0].point.x/1000*1.2-.6:0);
 },[state,shots,muted,enabled]);
 useEffect(()=>{const hide=()=>{if(document.hidden)mixer.current?.stop();};document.addEventListener('visibilitychange',hide);return()=>{document.removeEventListener('visibilitychange',hide);mixer.current?.dispose();mixer.current=null;};},[]);
 return arm;
}
