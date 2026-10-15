import {useEffect,useState,useMemo,useRef} from 'react';
import type {DefenseContent,DefenseLevelId,DefenseTowerState,DefenseCombatShot,DefenseRunState} from '../domain/defense';
import {advanceDefenseWithCombat,applyDefenseCommand,defensePositionAtDistance} from '../engine/defense';
import {guardLabContent,createGuardLabRun,compareGuardBranches,GUARD_LAB_FIXTURES,GUARD_LAB_STATIC_TICKS,GUARD_LAB_MAXIMUM_TICKS,type GuardLabFixture} from '../app/guard-tower-lab';
import {defenseTowerArtUri,defenseEnemyArtUri,defenseBoardArtUri} from '../app/defense-visual-assets';
import {defenseText as t} from '../app/defense-text';
import {DefenseCombatFX,useDefenseCombatFX} from './DefenseCombatFX';

export function GuardTowerLab({content,tower}:{content:DefenseContent;tower:DefenseTowerState}){
 const [open,setOpen]=useState(false),[level,setLevel]=useState<DefenseLevelId>(tower.levelId),[running,setRunning]=useState(false);
 const [fixture,setFixture]=useState<GuardLabFixture>('MIXED');
 const [tier,setTier]=useState<'L3'|'L4'>(tower.levelId.startsWith('L4')?'L4':'L3');
 const host=useRef<HTMLDetailsElement|null>(null);
 const comparison=useMemo(()=>open?compareGuardBranches(content,tower.towerId,fixture,tier,tower.padId):[],[open,content,tower.towerId,tower.padId,fixture,tier]);
 const [reduced,setReduced]=useState(()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false);
 const [lab,setLab]=useState<{run:DefenseRunState|null;shots:readonly DefenseCombatShot[];damage:number}>({run:null,shots:[],damage:0});
 const visual=useDefenseCombatFX(lab.run,lab.shots);
 const definition=content.towers.find(d=>d.id===tower.towerId)!;
 const start=()=>{
  const simulation=guardLabContent(content,fixture),run=createGuardLabRun(content,tower.towerId,level,fixture,tower.padId);
  if(reduced){const frame=advanceDefenseWithCombat(run,simulation,GUARD_LAB_STATIC_TICKS);setLab({run:applyDefenseCommand(frame.state,simulation,{type:'SetPaused',paused:true}),shots:[],damage:frame.shots.flatMap(s=>s.targets).reduce((n,h)=>n+h.damage,0)});setRunning(false);}
  else{setLab({run,shots:[],damage:0});setRunning(true);}
 };
 useEffect(()=>{const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');const sync=()=>{setReduced(media?.matches??false);setRunning(false);};media?.addEventListener?.('change',sync);return()=>media?.removeEventListener?.('change',sync);},[]);
 useEffect(()=>{
  if(!open||!running)return;
  const simulation=guardLabContent(content,fixture);
  const timer=window.setInterval(()=>setLab(previous=>{
   if(!previous.run||document.hidden||previous.run.tick>=GUARD_LAB_MAXIMUM_TICKS)return previous;
   const frame=advanceDefenseWithCombat(previous.run,simulation);return {run:frame.state,shots:frame.shots,damage:previous.damage+frame.shots.flatMap(s=>s.targets).reduce((n,h)=>n+h.damage,0)};
  }),50);const finish=window.setTimeout(()=>setRunning(false),12050);return()=>{window.clearInterval(timer);window.clearTimeout(finish);};
 },[open,running,content,fixture]);
 useEffect(()=>{const hide=()=>{if(document.hidden)setRunning(false);};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
 useEffect(()=>{if(!host.current||!globalThis.IntersectionObserver)return;const observer=new IntersectionObserver(entries=>{if(!entries[0]?.isIntersecting)setRunning(false);});observer.observe(host.current);return()=>observer.disconnect();},[]);
 const pad=content.map.pads.find(p=>p.id===tower.padId)!;
 return <details ref={host} className="guard-lab" onToggle={e=>{const value=e.currentTarget.open;setOpen(value);if(!value){setRunning(false);setLab({run:null,shots:[],damage:0});}}}>
  <summary>{t('guard.lab')}</summary>{open?<><p>{t('guard.lab_hint')}</p><small>{t('guard.lab_current')} {tower.levelId} · {t('guard.lab_preview')} {level}</small>
  <nav aria-label={t('guard.lab.fixture')}>{GUARD_LAB_FIXTURES.map(id=><button key={id} type="button" data-lab-fixture={id} aria-pressed={fixture===id} onClick={()=>{setFixture(id);setRunning(false);setLab({run:null,shots:[],damage:0});}}>{t(`guard.lab.fixture.${id}`)}</button>)}</nav>
  {content.ultimateEnabled?<nav aria-label={t('guard.lab.tier')}>{(['L3','L4'] as const).map(value=><button key={value} data-lab-tier={value} aria-pressed={tier===value} onClick={()=>{setTier(value);setRunning(false);}}>{t(`guard.lab.${value}`)}</button>)}</nav>:null}
  <div className="guard-lab-comparison" aria-label={t('guard.lab.compare')}><strong>{t('guard.lab.compare')}</strong><small>{t('guard.lab.compare_hint')}</small><div>{comparison.map(row=><section key={row.level} data-lab-comparison={row.level}><b>{row.level}</b><span>{t('guard.lab_damage')} {row.damage}</span><span>{t('guard.review.resolved')} {row.resolved} / {row.spawned}</span><span>{t('guard.lab.control_time')} {row.slowEnemySeconds.toFixed(1)}s</span><span>{t('guard.lab.reveal_time')} {row.revealedEnemySeconds.toFixed(1)}s</span></section>)}</div></div>
  <nav>{definition.levels.map(l=><button type="button" key={l.id} aria-pressed={level===l.id} onClick={()=>{setLevel(l.id);setRunning(false);setLab({run:null,shots:[],damage:0});}}>{l.id}</button>)}</nav>
  <p>{level.startsWith('L3')||level.startsWith('L4')?t(`guard.${tower.towerId}.${level}`):t(`defense.tower.${tower.towerId}.role`)}</p>
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
