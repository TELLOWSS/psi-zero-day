import {useState} from 'react';
import type {DefenseCommand,DefenseContent,DefenseRunState,DefenseTowerState} from '../domain/defense';
import {defenseText as t} from '../app/defense-text';

export function GuardSpatialControls({content,state,selectedTower,onCommand}:{content:DefenseContent;state:DefenseRunState;selectedTower:DefenseTowerState|null;onCommand:(command:DefenseCommand)=>void}){
 const [destination,setDestination]=useState(''),[direction,setDirection]=useState('E');
 const transition=content.map.transition,needsTransition=state.status==='INTERMISSION'&&transition?.beforeWave===state.waveId&&!state.appliedTransitionIds?.includes(transition.id);
 const support=content.supports.find(s=>s.id===state.supportId)!;
 const credit=state.status==='INTERMISSION'&&(state.redeploymentCredits??0)>0;
 const pads=content.map.pads.filter(p=>!state.towers.some(t=>t.padId===p.id));
 const destinationId=pads.some(p=>p.id===destination)?destination:pads[0]?.id;
 const pad=content.map.pads.find(p=>p.id===selectedTower?.padId);
 const offsets:Record<string,readonly [number,number]>={N:[0,-100],E:[100,0],S:[0,100],W:[-100,0]};
 const offset=offsets[direction]!;
 return <section className="guard-spatial-controls">
  <small>{t(state.ultimateUnlocked?'guard.ultimate.slot':'guard.ultimate.locked')}</small>
  {transition&&state.mapPhase!=='SHIFTED'?<p>{t('guard.transition.warning')}</p>:null}
  {needsTransition?<button data-guard-transition onClick={()=>onCommand({type:'ConfirmTransition'})}>{t('guard.transition.confirm')}</button>:null}
  {support.relocation||credit?<div><p>{t(credit?'guard.relocate.credit':'guard.relocate.hint')}</p>
   <select aria-label={t('guard.relocate.destination')} value={destinationId??''} onChange={e=>setDestination(e.target.value)}>{pads.map(p=><option key={p.id} value={p.id}>{p.id}</option>)}</select>
   <button data-guard-relocate disabled={!selectedTower||!destinationId||(!credit&&state.supportCooldownRemaining>0)} onClick={()=>{if(selectedTower&&destinationId)onCommand({type:'RelocateTower',towerInstanceId:selectedTower.id,padId:destinationId});}}>{t('guard.relocate')}</button></div>:null}
  {support.directionalRange?<div><p>{t('guard.guidance.hint')}</p>
   <select aria-label={t('guard.guidance.direction')} value={direction} onChange={e=>setDirection(e.target.value)}>{Object.keys(offsets).map(d=><option key={d} value={d}>{t(`guard.direction.${d}`)}</option>)}</select>
   <button data-guard-guidance disabled={!selectedTower||state.status!=='RUNNING'||state.supportCooldownRemaining>0} onClick={()=>{if(selectedTower&&pad){if(state.paused)onCommand({type:'SetPaused',paused:false});onCommand({type:'UseSupport',towerInstanceId:selectedTower.id,direction:{x:Math.max(0,Math.min(1000,pad.x+offset[0])),y:Math.max(0,Math.min(600,pad.y+offset[1]))}});}}}>{t('guard.guidance')}</button></div>:null}
 </section>;
}
