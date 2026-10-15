import {useEffect,useRef,useState} from 'react';
import type {DefenseCombatShot,DefenseContent,DefenseRunState} from '../domain/defense';
import {defenseVisualPadPoint,defenseVisualPositionAtDistance} from '../app/defense-visual-projection';
import './defense-combat-fx.css';

export function useDefenseCombatFX(state:DefenseRunState|null,shots:readonly DefenseCombatShot[]){
 const [visible,setVisible]=useState<readonly DefenseCombatShot[]>([]);
 const seen=useRef('');
 useEffect(()=>{
  if(!state||state.paused||state.status==='READY'||state.status==='WON'||state.status==='LOST'){setVisible([]);return;}
  if(!shots.length)return;
  const key=shots.map(s=>s.id).join('|');if(seen.current===key)return;seen.current=key;
  setVisible(previous=>[...previous.filter(p=>!shots.some(s=>s.id===p.id)),...shots].slice(-24));
 },[state,shots]);
 useEffect(()=>{
  if(!visible.length)return;
  const timer=window.setTimeout(()=>setVisible([]),420);return()=>window.clearTimeout(timer);
 },[visible]);
 useEffect(()=>{const hide=()=>{if(document.hidden)setVisible([]);};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
 return visible;
}

export function DefenseCombatFX({shots,content,rotated=false}:{shots:readonly DefenseCombatShot[];content:DefenseContent;rotated?:boolean}){
 return <g className="zb-combat-fx" aria-hidden="true">{shots.map(shot=>{
  const pad=content.map.pads.find(p=>p.id===shot.padId);if(!pad||!shot.targets.length)return null;
  const origin=defenseVisualPadPoint(content.map.id,pad),mx=shot.towerId==='PULSE'?22:shot.towerId==='BURST'?15:0,my=shot.towerId==='SENSOR'?-38:-30,sx=origin.x+(rotated?my:mx),sy=origin.y+(rotated?-mx:my);
  const first=defenseVisualPositionAtDistance(content.map.id,content.map.path,shot.targets[0]!.distance);
  const level=content.towers.find(t=>t.id===shot.towerId)!.levels.find(l=>l.id===shot.levelId)!;
  const arc=shot.towerId==='BURST',path=arc?`M${sx} ${sy} Q${(sx+first.x)/2} ${Math.min(sy,first.y)-65} ${first.x} ${first.y}`:`M${sx} ${sy} L${first.x} ${first.y}`;
  return <g key={shot.id} className={`zb-shot is-${shot.towerId.toLowerCase()} is-${shot.levelId.toLowerCase()}`} data-combat-shot={shot.id} data-combat-family={shot.towerId} data-combat-level={shot.levelId}>
   <path d={path} className="zb-shot-halo"/><path d={path} className="zb-shot-core"/>
   <circle cx={sx} cy={sy} r="9" className="zb-shot-muzzle"/>
   <circle r={arc?5:3.5} className="zb-shot-projectile"><animateMotion dur=".10s" path={path} fill="freeze"/></circle>
   {shot.levelId==='L3A'?<path d={path} className="zb-shot-echo" transform="translate(0 5)"/>:null}
   {shot.levelId==='L3B'?<path d={path} className="zb-shot-echo" transform="translate(0 -3)"/>:null}
   {shot.towerId==='BURST'?<circle cx={first.x} cy={first.y} r={level.splashRadius} className="guard-area-footprint"/>:null}
   {shot.towerId==='CONTROL'?shot.targets.slice(1).map(hit=>{const at=defenseVisualPositionAtDistance(content.map.id,content.map.path,hit.distance);return <path key={hit.id} d={`M${sx} ${sy}L${at.x} ${at.y}`} className="guard-control-tether"/>;}):null}
   {shot.targets.map(hit=>{
    const at=defenseVisualPositionAtDistance(content.map.id,content.map.path,hit.distance);
    return <g key={hit.id} transform={`translate(${at.x} ${at.y})`} data-combat-impact={hit.id} data-combat-damage={hit.damage} data-combat-resolved={hit.resolved}>
     <circle r={shot.towerId==='BURST'?34:19} className="zb-contact-wave"/>
     <circle r="5" className="zb-contact-core"/>
     <path d={shot.towerId==='CONTROL'?'M-14-8V-14H-8M8-14H14V-8M14 8V14H8M-8 14H-14V8':shot.towerId==='SENSOR'?'M-22 0H-8M8 0H22M0-22V-8M0 8V22':'M-20-12L-10-5M13-14L6-6M-15 17L-6 7M19 12L8 5'} className="zb-contact-shards"/>
     {hit.resolved?<g className="zb-contact-resolve"><circle r="27"/><path d="M-8 0L-2 6L10-7"/></g>:null}
    </g>;
   })}
  </g>;
 })}</g>;
}
