import {useEffect,useState} from 'react';
import type {DefenseContent,DefenseLevelId,DefenseTowerState,DefenseCombatShot,DefenseRunState} from '../domain/defense';
import {advanceDefenseWithCombat,applyDefenseCommand,defensePositionAtDistance} from '../engine/defense';
import {guardLabContent,createGuardLabRun,GUARD_LAB_STATIC_TICKS,GUARD_LAB_MAXIMUM_TICKS} from '../app/guard-tower-lab';
import {defenseTowerArtUri,defenseEnemyArtUri,defenseBoardArtUri} from '../app/defense-visual-assets';
import {defenseText as t} from '../app/defense-text';
import {DefenseCombatFX,useDefenseCombatFX} from './DefenseCombatFX';

export function GuardTowerLab({content,tower}:{content:DefenseContent;tower:DefenseTowerState}){
 const [open,setOpen]=useState(false),[level,setLevel]=useState<DefenseLevelId>(tower.levelId),[running,setRunning]=useState(false);
 const [reduced,setReduced]=useState(()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false);
 const [lab,setLab]=useState<{run:DefenseRunState|null;shots:readonly DefenseCombatShot[];damage:number}>({run:null,shots:[],damage:0});
 const visual=useDefenseCombatFX(lab.run,lab.shots);
 const definition=content.towers.find(d=>d.id===tower.towerId)!;
 const start=()=>{
  const simulation=guardLabContent(content),run=createGuardLabRun(content,tower.towerId,level);
  if(reduced){const frame=advanceDefenseWithCombat(run,simulation,GUARD_LAB_STATIC_TICKS);setLab({run:applyDefenseCommand(frame.state,simulation,{type:'SetPaused',paused:true}),shots:[],damage:frame.shots.flatMap(s=>s.targets).reduce((n,h)=>n+h.damage,0)});setRunning(false);}
  else{setLab({run,shots:[],damage:0});setRunning(true);}
 };
 useEffect(()=>{const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');const sync=()=>{setReduced(media?.matches??false);setRunning(false);};media?.addEventListener?.('change',sync);return()=>media?.removeEventListener?.('change',sync);},[]);
 useEffect(()=>{
  if(!open||!running)return;
  const simulation=guardLabContent(content);
  const timer=window.setInterval(()=>setLab(previous=>{
   if(!previous.run||document.hidden||previous.run.tick>=GUARD_LAB_MAXIMUM_TICKS)return previous;
   const frame=advanceDefenseWithCombat(previous.run,simulation);return {run:frame.state,shots:frame.shots,damage:previous.damage+frame.shots.flatMap(s=>s.targets).reduce((n,h)=>n+h.damage,0)};
  }),50);const finish=window.setTimeout(()=>setRunning(false),12050);return()=>{window.clearInterval(timer);window.clearTimeout(finish);};
 },[open,running,content]);
 useEffect(()=>{const hide=()=>{if(document.hidden)setRunning(false);};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
 const pad=content.map.pads[0]!;
 return <details className="guard-lab" onToggle={e=>{const value=e.currentTarget.open;setOpen(value);if(!value){setRunning(false);setLab({run:null,shots:[],damage:0});}}}>
  <summary>{t('guard.lab')}</summary>{open?<><p>{t('guard.lab_hint')}</p><small>{t('guard.lab_current')} {tower.levelId} · {t('guard.lab_preview')} {level}</small>
  <nav>{definition.levels.map(l=><button type="button" key={l.id} aria-pressed={level===l.id} onClick={()=>{setLevel(l.id);setRunning(false);setLab({run:null,shots:[],damage:0});}}>{l.id}</button>)}</nav>
  <p>{level.startsWith('L3')?t(`guard.${tower.towerId}.${level}`):t(`defense.tower.${tower.towerId}.role`)}</p>
  {reduced?<p>{t('guard.lab_static')}</p>:null}
  <svg viewBox="0 0 1000 600" aria-label={t('guard.lab')} data-lab-level={level} data-lab-static={reduced?'true':'false'}>
   <image href={defenseBoardArtUri(content.map.id)??undefined} width="1000" height="600"/>
   <polyline points={content.map.path.map(p=>p.join(',')).join(' ')} stroke="#f7cf7c" strokeWidth="3" fill="none" opacity=".5"/>
   <image href={defenseTowerArtUri(tower.towerId,level,content.map.id)??undefined} x={pad.x-54} y={pad.y-77} width="108" height="108"/>
   {lab.run?.enemies.map(enemy=>{const at=defensePositionAtDistance(content.map.path,enemy.distance);return <image key={enemy.id} href={defenseEnemyArtUri(enemy.enemyId,content.map.id)??undefined} x={at.x-28} y={at.y-34} width="56" height="56"/>;})}
   <DefenseCombatFX content={content} shots={visual}/>
  </svg>
  <button onClick={running?()=>setRunning(false):start}>{t(running?'guard.lab_stop':'guard.lab_start')}</button> <output>{t('guard.lab_damage')} {lab.damage}</output>
  </>:null}
 </details>;
}
