import {useEffect,useRef,useState,useId} from 'react';
import cinematic from '../../content/defense/guard-cinematic-v1.json';
import type {DefenseCombatShot,DefenseContent,DefenseRunState} from '../domain/defense';
import {defenseVisualPadPoint,defenseVisualPositionAtDistance} from '../app/defense-visual-projection';
import {guardMuzzleOffset} from '../app/guard-combat-presentation';
import {guardDamageLabels} from '../app/guard-battle-feedback';
import {defenseText as t} from '../app/defense-text';
import './defense-combat-fx.css';
import {GuardWeaponFX} from './GuardWeaponFX';
import {GUARD_WEAPON_FX} from './guard-projectile-presentation';

export function useDefenseCombatFX(state:DefenseRunState|null,shots:readonly DefenseCombatShot[]){
 const [visible,setVisible]=useState<readonly DefenseCombatShot[]>([]);
 const seen=useRef('');
 const expires=useRef(new Map<string,number>());
 useEffect(()=>{
  if(!state||state.paused||state.status!=='RUNNING'){expires.current.clear();setVisible([]);return;}
  if(!shots.length)return;
  const key=shots.map(s=>s.id).join('|');if(seen.current===key)return;seen.current=key;
  const lifetime=state.scenarioId.startsWith('guard-gd-')?GUARD_WEAPON_FX.lifetimeMs:420;
  const now=performance.now();for(const shot of shots)expires.current.set(shot.id,now+lifetime);
  setVisible(previous=>[...previous.filter(p=>(expires.current.get(p.id)??0)>now&&!shots.some(s=>s.id===p.id)),...shots].slice(-24));
 },[state,shots]);
 useEffect(()=>{
  if(!visible.length)return;
  const timer=window.setInterval(()=>{const now=performance.now();setVisible(previous=>{const next=previous.filter(s=>(expires.current.get(s.id)??0)>now);const live=new Set(next.map(s=>s.id));for(const id of expires.current.keys())if(!live.has(id))expires.current.delete(id);return next.length===previous.length?previous:next;});},50);return()=>window.clearInterval(timer);
 },[visible.length]);
 useEffect(()=>{const hide=()=>{if(document.hidden)setVisible([]);};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
 return visible;
}

export function DefenseCombatFX({shots,content,rotated=false}:{shots:readonly DefenseCombatShot[];content:DefenseContent;rotated?:boolean}){
 return content.map.id.startsWith('guard-gd-')?<GuardWeaponFX shots={shots} content={content} rotated={rotated}/>:<LegacyDefenseCombatFX shots={shots} content={content} rotated={rotated}/>;
}

function LegacyDefenseCombatFX({shots,content,rotated=false}:{shots:readonly DefenseCombatShot[];content:DefenseContent;rotated?:boolean}){
 const guard=content.map.id.startsWith('guard-gd-');
 const damageLabels=new Set(guard?guardDamageLabels(shots):[]);
 useEffect(()=>{if(!guard)return;const atlas=new Image();atlas.src='/'+cinematic.resolveAtlas.uri;void atlas.decode?.().catch(()=>{});},[guard]);
 const clipId=useId(),resolveSprites=new Set(guard?shots.flatMap(s=>s.targets.filter(h=>h.resolved).map(h=>({key:`${s.id}|${h.id}`,boss:h.enemyId==='BOSS'}))).sort((a,b)=>Number(b.boss)-Number(a.boss)).slice(0,cinematic.budgets.resolveSprites).map(h=>h.key):[]);
 const clearShot=guard?[...shots].filter(s=>s.targets.filter(hit=>hit.resolved).length>=3).sort((a,b)=>b.targets.filter(t=>t.resolved).length-a.targets.filter(t=>t.resolved).length)[0]?.id:undefined;
 return <g className="zb-combat-fx" aria-hidden="true"><defs><clipPath id={clipId}><rect x="-48" y="-60" width="96" height="96"/></clipPath></defs>{shots.map(shot=>{
  const pad=content.map.pads.find(p=>p.id===shot.padId);if(!pad||(!shot.targets.length&&!shot.targetPoint))return null;
  const origin=guard&&shot.origin?shot.origin:defenseVisualPadPoint(content.map.id,pad),mx=shot.towerId==='PULSE'?22:shot.towerId==='BURST'?15:0,my=shot.towerId==='SENSOR'?-38:-30,offset=guard?guardMuzzleOffset(shot,rotated):{x:rotated?my:mx,y:rotated?-mx:my},sx=origin.x+offset.x,sy=origin.y+offset.y;
  const first=guard?(shot.targets[0]?.point??shot.targetPoint!):defenseVisualPositionAtDistance(content.map.id,content.map.path,shot.targets[0]!.distance);
  const level=content.towers.find(t=>t.id===shot.towerId)!.levels.find(l=>l.id===shot.levelId)!;
  const arc=shot.towerId==='BURST',end=shot.mechanic==='PIERCE'?shot.targets.at(-1)?.point??first:first,path=arc?`M${sx} ${sy} Q${(sx+first.x)/2} ${Math.min(sy,first.y)-65} ${first.x} ${first.y}`:`M${sx} ${sy} L${end.x} ${end.y}`;
  const center=shot.targetPoint??first;
  return <g key={shot.id} className={`zb-shot is-${shot.towerId.toLowerCase()} is-${shot.levelId.toLowerCase()}${shot.phase==='IMPACT'?' is-real-impact':''}`} data-combat-phase={shot.phase??'CONTACT'} data-combat-shot={shot.id} data-combat-family={shot.towerId} data-combat-level={shot.levelId} data-combat-mechanic={shot.mechanic}>
   {shot.phase!=='IMPACT'?<><path d={path} className="zb-shot-halo"/><path d={path} className="zb-shot-core"/></>:null}
   {shot.phase!=='IMPACT'?<><circle cx={sx} cy={sy} r="9" className="zb-shot-muzzle"/>
   <circle r={arc?5:3.5} className="zb-shot-projectile"><animateMotion dur=".10s" path={path} fill="freeze"/></circle></>:null}
   {!guard&&shot.levelId==='L3A'?<path d={path} className="zb-shot-echo" transform="translate(0 5)"/>:null}
   {!guard&&shot.levelId==='L3B'?<path d={path} className="zb-shot-echo" transform="translate(0 -3)"/>:null}
   {shot.towerId==='BURST'&&shot.mechanic!=='WAVE'?<circle cx={center.x} cy={center.y} r={shot.radius??level.splashRadius} className="guard-area-footprint"/>:null}
   {guard&&shot.towerId==='BURST'&&shot.phase!=='LAUNCH'&&shot.mechanic!=='WAVE'?<circle cx={center.x} cy={center.y} r={level.splashRadius} className="guard-branch-wave"/>:null}
   {shot.towerId==='CONTROL'?shot.targets.slice(1).map((hit,index)=>{const at=guard?hit.point:defenseVisualPositionAtDistance(content.map.id,content.map.path,hit.distance),o=guard?guardMuzzleOffset(shot,rotated,index+1):offset;return <path key={hit.id} d={`M${origin.x+o.x} ${origin.y+o.y}L${at.x} ${at.y}`} className="guard-control-tether"/>;}):null}
   {shot.id===clearShot?<g transform={`translate(${first.x} ${first.y})${rotated?' rotate(-90)':''}`}><text className="guard-clear-count" y="-30" textAnchor="middle">{t('guard.review.resolved')} ×{shot.targets.filter(hit=>hit.resolved).length}</text></g>:null}
   {shot.targets.map(hit=>{
    const at=guard&&hit.point?hit.point:defenseVisualPositionAtDistance(content.map.id,content.map.path,hit.distance);
    return <g key={hit.id} transform={`translate(${at.x} ${at.y})`} data-combat-impact={hit.id} data-combat-damage={hit.damage} data-combat-resolved={hit.resolved}>
     <circle r={shot.towerId==='BURST'?34:19} className="zb-contact-wave"/>
     <circle r="5" className="zb-contact-core"/>
     {guard?<><path d="M-26 0L-12 0M12 0L26 0M0-26V-12M0 12V26M-19-19L-10-10M10 10L19 19M19-19L10-10M-10 10L-19 19" className="guard-impact-rays"/>
      {hit.resolved?<g className="guard-resolve-fragments"><path d="M-9-3L-16-13L-6-10ZM8-5L20-9L15 1ZM3 9L5 23L-3 17Z"/></g>:null}
      {damageLabels.has(`${shot.id}|${hit.id}`)?<text className={`guard-damage-number${hit.resolved?' is-resolved':''}`} transform={rotated?'rotate(-90)':undefined} y="-22" textAnchor="middle">{hit.resolved?'✦ ':''}{hit.damage}</text>:null}
     </>:null}
     <path d={shot.towerId==='CONTROL'?'M-14-8V-14H-8M8-14H14V-8M14 8V14H8M-8 14H-14V8':shot.towerId==='SENSOR'?'M-22 0H-8M8 0H22M0-22V-8M0 8V22':'M-20-12L-10-5M13-14L6-6M-15 17L-6 7M19 12L8 5'} className="zb-contact-shards"/>
     {resolveSprites.has(`${shot.id}|${hit.id}`)?<g data-cinematic-resolve={hit.id} transform={rotated?'rotate(-90)':undefined}><g clipPath={`url(#${clipId})`}><image href={'/'+cinematic.resolveAtlas.uri} x="-48" y="-60" width="384" height="192" className="guard-resolution-atlas"/></g><ellipse rx="32" ry="12" className="guard-resolve-groundlight"/></g>:null}
     {hit.resolved?<g className="zb-contact-resolve"><circle r="27"/><path d="M-8 0L-2 6L10-7"/></g>:null}
    </g>;
   })}
  </g>;
 })}</g>;
}
