import {useState,useMemo} from 'react';
import type {PerkId,SurvivorsGameState} from '../domain/patrol-survivors';
import {PERK_CATALOG,EVOLUTION_RECIPES,SurvivorsEngine} from '../engine/patrol-survivors-engine';
import {SurvivorsFittingPreview} from './SurvivorsFittingPreview';
import copy from '../../content/localization/survivors-equipment-lab-ko.json';
import './survivors-equipment-lab.css';
import {SurvivorsEquipmentDetails} from './SurvivorsEquipmentDetails';
import type {FittingMotion} from './survivors-fitting-pose';
import fittingCopy from '../../content/localization/survivors-store-ko.json';
export function SurvivorsEquipmentLab({state,active}:{state:SurvivorsGameState;active:boolean}) {
 const [mode,setMode]=useState<'growth'|'evolution'>('growth'),[id,setId]=useState<PerkId>('radio_boost'),[level,setLevel]=useState(1),[playing,setPlaying]=useState(true),[open,setOpen]=useState(false),[step,setStep]=useState(0),[defense,setDefense]=useState(0);
 const [motion,setMotion]=useState<FittingMotion>('idle');
 const stats=useMemo(()=>SurvivorsEngine.equipmentPreview(state,id,level).state.player,[state,id,level]);
 const items=(Object.keys(PERK_CATALOG) as PerkId[]).filter(key=>mode==='evolution'?PERK_CATALOG[key].category==='evolution':PERK_CATALOG[key].category!=='evolution');const meta=PERK_CATALOG[id];const recipe=EVOLUTION_RECIPES[id as keyof typeof EVOLUTION_RECIPES];
 return <details className="survivors-equipment-lab" onToggle={e=>setOpen(e.currentTarget.open)}><summary>{copy.title}</summary><p>{copy.intro}</p>
 <div className="survivors-lab-controls"><label>{copy.mode}<select aria-label={copy.mode} value={mode} onChange={e=>{const next=e.target.value as typeof mode;setMode(next);setId(next==='evolution'?'satellite_broadcast':'radio_boost');setLevel(1);}}><option value="growth">{copy.growth}</option><option value="evolution">{copy.evolution}</option></select></label>
 <label>{copy.equipment}<select aria-label={copy.equipment} value={id} onChange={e=>{setId(e.target.value as PerkId);setLevel(1);}}>{items.map(key=><option key={key} value={key}>{PERK_CATALOG[key].name}</option>)}</select></label>
 <label>{copy.level}<select aria-label={copy.level} value={level} disabled={meta.maxLevel===1} onChange={e=>setLevel(Number(e.target.value))}>{Array.from({length:meta.maxLevel},(_,i)=><option key={i} value={i+1}>Lv.{i+1}</option>)}</select></label>
 <label>{fittingCopy.pose}<select aria-label={fittingCopy.pose} value={motion} onChange={e=>{if(['idle','walk','turn'].includes(e.target.value))setMotion(e.target.value as FittingMotion);}}><option value="idle">{fittingCopy.poseIdle}</option><option value="walk">{fittingCopy.poseWalk}</option><option value="turn">{fittingCopy.poseTurn}</option></select></label>
 <button type="button" onClick={()=>setPlaying(v=>!v)}>{playing?copy.pause:copy.play}</button><button type="button" onClick={()=>{setPlaying(false);setStep(v=>v+1);}}>{copy.step}</button><button type="button" onClick={()=>{setPlaying(true);setDefense(v=>v+1);}}>{copy.defense}</button></div>
 <p><strong>{meta.name} · Lv.{level}</strong> — {meta.description}</p>
 {recipe&&<p>{copy.recipe}: {PERK_CATALOG[recipe.weapon].name} Lv.5 + {PERK_CATALOG[recipe.support].name} Lv.1</p>}
 {meta.category==='support'&&<><p>{copy.support}</p><dl className="survivors-lab-stats"><div><dt>{copy.hp}</dt><dd>{stats.maxHp}</dd></div><div><dt>{copy.speed}</dt><dd>{stats.speed}</dd></div><div><dt>{copy.pickup}</dt><dd>{stats.pickupRadius}</dd></div><div><dt>{copy.regen}</dt><dd>{stats.regenRate}</dd></div><div><dt>{copy.cooldown}</dt><dd>{Math.round(stats.cooldownReduction*100)}%</dd></div><div><dt>{copy.power}</dt><dd>×{stats.damageMultiplier.toFixed(2)}</dd></div></dl></>}
 {open&&<SurvivorsFittingPreview state={state} equipment={{id,level}} stepToken={step} defenseToken={defense} active={active} playing={playing} motion={motion}/>}
 <SurvivorsEquipmentDetails characterId={state.characterId} id={id} kind="normal" level={level} player={stats}/>
 <small>{copy.target}</small></details>;
}
