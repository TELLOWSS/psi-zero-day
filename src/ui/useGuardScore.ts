import {useCallback,useEffect,useRef,useState} from 'react';
import type {DefenseRunState} from '../domain/defense';
import manifest from '../../content/defense/guard-audio-v1.json';
import {isGuardMap} from '../content/guard-campaign';

export function useGuardScore(state:DefenseRunState|null,mapId:string|null|undefined,muted:boolean,totalWaves:number){
 const [armed,setArmed]=useState(false),playing=useRef<HTMLAudioElement|null>(null),retiring=useRef<HTMLAudioElement|null>(null);
 const arm=useCallback(()=>setArmed(true),[]);
 const enabled=isGuardMap(mapId);
 const phase=!state?'BED':state.status==='WON'?'CODA':state.enemies.some(e=>e.enemyId==='BOSS')?'BOSS':state.status==='RUNNING'?(state.waveId>=Math.ceil(totalWaves*.6)?'PRESSURE':'RHYTHM'):'BED';
 useEffect(()=>{
  if(!enabled||!armed||muted||state?.paused||document.hidden){playing.current?.pause();retiring.current?.pause();return;}
  const asset=manifest.assets.find(a=>a.id===`MUSIC_RAMP01_${phase}_FULL_MIX_AUDITION`);if(!asset)return;
  let current=playing.current;
  if(current?.dataset.phase!==phase){
   retiring.current?.pause();retiring.current=playing.current;
   current=new Audio('/'+asset.uri);current.preload='auto';current.loop=phase!=='CODA';current.volume=0;current.dataset.phase=phase;playing.current=current;
  }
  const startVolume=current.volume;void current.play().catch(()=>{window.dispatchEvent(new CustomEvent('psi:guard-score',{detail:{phase,status:'unavailable'}}));});
  window.dispatchEvent(new CustomEvent('psi:guard-score',{detail:{phase,uri:asset.uri,role:'FULL_MIX',status:'playing'}}));
  let step=0;const old=retiring.current,oldVolume=old?.volume??0;
  const fade=window.setInterval(()=>{step++;if(playing.current===current)current.volume=Math.min(.28,startVolume+(.28-startVolume)*step/10);if(old)old.volume=Math.max(0,oldVolume*(1-step/10));if(step>=10){window.clearInterval(fade);old?.pause();if(retiring.current===old)retiring.current=null;}},50);
  return()=>window.clearInterval(fade);
 },[enabled,armed,muted,state?.paused,phase]);
 useEffect(()=>{const hide=()=>{if(document.hidden){playing.current?.pause();retiring.current?.pause();}};document.addEventListener('visibilitychange',hide);return()=>{document.removeEventListener('visibilitychange',hide);playing.current?.pause();retiring.current?.pause();playing.current=null;retiring.current=null;};},[]);
 return arm;
}
