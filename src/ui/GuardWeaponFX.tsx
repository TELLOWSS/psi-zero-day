import {useEffect,useId,useLayoutEffect,useRef} from 'react';
import type {CSSProperties} from 'react';
import type {DefenseCombatShot,DefenseContent} from '../domain/defense';
import cinematic from '../../content/defense/guard-cinematic-v1.json';
import {guardMuzzleOffset} from '../app/guard-combat-presentation';
import {guardDamageLabels} from '../app/guard-battle-feedback';
import {GUARD_WEAPON_FX as art,guardContactSprites,guardFlightPresentation} from './guard-projectile-presentation';
import './guard-weapon-fx.css';

const columns={PULSE:0,BURST:1,CONTROL:2,SENSOR:3} as const;
function GuardFlight({family,width,height,flight}:{family:DefenseCombatShot['towerId'];width:number;height:number;flight:ReturnType<typeof guardFlightPresentation>}){
 const motion=useRef<SVGAnimateMotionElement>(null);
 // A dynamically inserted SMIL animation must begin at insertion, not SVG document time zero.
 useLayoutEffect(()=>{motion.current?.beginElement?.();},[]);
 return <g className="guard-weapon-flight" style={{'--flight':`${flight.durationMs}ms`} as CSSProperties} data-weapon-flight data-flight-ms={flight.durationMs} data-flight-path={flight.path}>
  <animateMotion ref={motion} begin="indefinite" path={flight.path} dur={`${flight.durationMs}ms`} rotate="auto" calcMode="linear" fill="freeze"/>
  <GuardWeaponSprite family={family} row={0} width={width} height={height} anchor={.86}/>
 </g>;
}
export function GuardWeaponSprite({family,row,width,height=width,anchor=.5}:{family:DefenseCombatShot['towerId'];row:number;width:number;height?:number;anchor?:number}){
 const a=art.atlas;
 return <svg x={-width*anchor} y={-height/2} width={width} height={height} viewBox={`${columns[family]*a.cellWidth} ${row*a.cellHeight} ${a.cellWidth} ${a.cellHeight}`} overflow="hidden" preserveAspectRatio="none" data-weapon-sprite={`${family}:${row}`}>
  <image href={'/'+a.uri} width={a.width} height={a.height}/>
 </svg>;
}

export function GuardWeaponFX({shots,content,rotated=false}:{shots:readonly DefenseCombatShot[];content:DefenseContent;rotated?:boolean}){
 const clip=useId(),contacts=guardContactSprites(shots),labels=new Set(guardDamageLabels(shots));
 const active=shots.filter(s=>s.phase!=='IMPACT'&&s.mechanic!=='WAVE'&&(s.targets.length||s.targetPoint));
 const flightIds=new Set(active.slice(-art.budgets.flights).map(s=>s.id));
 const muzzleIds=new Set(shots.filter(s=>s.phase!=='IMPACT').slice(-art.budgets.muzzles).map(s=>s.id));
 const resolves=new Set(shots.flatMap(s=>s.targets.filter(h=>h.resolved).map(h=>({key:`${s.id}|${h.id}`,boss:h.enemyId==='BOSS'}))).sort((a,b)=>Number(b.boss)-Number(a.boss)).slice(0,art.budgets.resolveSprites).map(h=>h.key));
 useEffect(()=>{for(const uri of [art.atlas.uri,cinematic.resolveAtlas.uri]){const image=new Image();image.src='/'+uri;void image.decode?.().catch(()=>{});}},[]);
 return <g className="zb-combat-fx guard-weapon-fx" aria-hidden="true">
  <defs><clipPath id={clip}><rect x="-48" y="-60" width="96" height="96"/></clipPath></defs>
  {shots.slice(-art.budgets.shots).map(shot=>{
   const pad=content.map.pads.find(p=>p.id===shot.padId),first=shot.targets[0]?.point??shot.targetPoint;
   if(!pad||!first)return null;
   const origin=shot.origin??pad,offset=guardMuzzleOffset(shot,rotated),start={x:origin.x+offset.x,y:origin.y+offset.y};
   const end=shot.mechanic==='PIERCE'?(shot.targets.at(-1)?.point??first):first;
   const flight=guardFlightPresentation(shot,start,end,rotated);
   const level=content.towers.find(t=>t.id===shot.towerId)!.levels.find(l=>l.id===shot.levelId)!;
   const burst=shot.towerId==='BURST',sensor=shot.towerId==='SENSOR',control=shot.towerId==='CONTROL';
   const ultimate=shot.levelId.startsWith('L4'),precise=shot.levelId.endsWith('B');
   const width=(burst?52:sensor?54:control?42:44)*(ultimate?1.15:1);
   const delay=shot.phase==='IMPACT'?0:flight.durationMs;
   return <g key={shot.id} className={`guard-weapon-shot is-${shot.towerId.toLowerCase()}${precise?' is-precision':''}`} data-combat-shot={shot.id} data-combat-family={shot.towerId} data-combat-level={shot.levelId} data-combat-phase={shot.phase??'CONTACT'} data-combat-mechanic={shot.mechanic} data-weapon-style={art.visualVersion}>
    {muzzleIds.has(shot.id)?<g transform={`translate(${start.x} ${start.y}) rotate(${flight.angle})`} data-weapon-muzzle>
     <g className="guard-weapon-muzzle"><GuardWeaponSprite family={shot.towerId} row={1} width={burst?62:46} height={burst?44:34} anchor={.42}/></g>
    </g>:null}
    {flightIds.has(shot.id)?<GuardFlight family={shot.towerId} width={width} height={burst?29:sensor?16:21} flight={flight}/>:null}
    {shot.targets.map((hit,index)=>{
     const key=`${shot.id}|${hit.id}`,at=hit.point;
     const hitDelay=shot.mechanic==='PIERCE'&&shot.phase!=='IMPACT'?Math.round(delay*Math.min(1,Math.hypot(at.x-start.x,at.y-start.y)/Math.max(1,Math.hypot(end.x-start.x,end.y-start.y)))):delay;
     const size=(burst?(index===0?Math.max(64,Math.min(130,level.splashRadius*1.4)):42):sensor?46:control?54:58)*(hit.enemyId==='BOSS'?1.35:hit.resolved?1.15:1);
     return <g key={hit.id} transform={`translate(${at.x} ${at.y})`} style={{'--contact-delay':`${hitDelay}ms`} as CSSProperties} data-combat-impact={hit.id} data-combat-damage={hit.damage} data-combat-resolved={hit.resolved}>
      {contacts.has(key)?<g data-weapon-contact>
       <g className="guard-weapon-contact"><GuardWeaponSprite family={shot.towerId} row={2} width={size}/></g>
       <g className="guard-weapon-aftermath"><GuardWeaponSprite family={shot.towerId} row={3} width={size*1.22} height={size*(burst?.78:1.1)}/></g>
      </g>:null}
      {labels.has(key)?<text className={`guard-damage-number${hit.resolved?' is-resolved':''}`} transform={rotated?'rotate(-90)':undefined} y={-size*.32} textAnchor="middle">{hit.resolved?'✦ ':''}{hit.damage}</text>:null}
      {resolves.has(key)?<g data-cinematic-resolve={hit.id} transform={rotated?'rotate(-90)':undefined} className="guard-weapon-resolve"><g clipPath={`url(#${clip})`}><image href={'/'+cinematic.resolveAtlas.uri} x="-48" y="-60" width="384" height="192" className="guard-resolution-atlas"/></g></g>:null}
     </g>;
    })}
   </g>;
  })}
 </g>;
}
