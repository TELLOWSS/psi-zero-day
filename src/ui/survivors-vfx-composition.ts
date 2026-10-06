import type {Projectile} from '../domain/patrol-survivors';
import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
import {cinematicLook} from './survivors-cinematic-vfx';

export function feedbackPriority(event:ProjectileFeedback,equipped:readonly string[]=[]):number {
  if(event.kind==='shout_shockwave'&&event.phase==='launch'&&!event.worker)return 120;
  if(event.worker)return 110;
  if(event.blocked)return event.phase==='impact'?85:0;
  const look=cinematicLook(event.kind,1,equipped);
  const important=look.premium||look.evolved;
  return event.phase==='launch'?(important?95:75):event.phase==='impact'?(event.critical?100:important?90:60):10;
}

/** Reserve one representative of every active weapon/phase before filling remaining slots. */
export function balancedFeedbackPool<T extends {event:ProjectileFeedback;age:number}>(effects:readonly T[],limit:number,equipped:readonly string[]=[],protectedEffect:(effect:T)=>boolean=()=>false):T[]{
  const protectedEffects=effects.filter(protectedEffect);
  const groups=new Map<string,T[]>();
  for(const effect of effects){
    if(protectedEffect(effect))continue;
    const e=effect.event,key=`${e.kind}:${e.phase}:${e.worker?'worker':e.blocked?'blocked':'combat'}`;
    const group=groups.get(key)??[];group.push(effect);groups.set(key,group);
  }
  for(const group of groups.values())group.sort((a,b)=>feedbackPriority(b.event,equipped)-feedbackPriority(a.event,equipped)||a.age-b.age);
  const ordered=[...groups.values()].sort((a,b)=>feedbackPriority(b[0]!.event,equipped)-feedbackPriority(a[0]!.event,equipped));
  const result=protectedEffects.slice(0,limit);
  while(result.length<limit&&ordered.some(group=>group.length))for(const group of ordered){
    if(result.length===limit)break;const effect=group.shift();if(effect)result.push(effect);
  }
  // Draw order remains chronological; scheduling priority is not a render-layer order.
  const selected=new Set(result);return effects.filter(effect=>selected.has(effect));
}

/** One hot core per nearby contact; other materials remain visible as accents. */
export function feedbackCoreOwners<T extends {event:ProjectileFeedback}>(effects:readonly T[],equipped:readonly string[]=[]):Set<T>{
  const owners:T[]=[];
  const ordered=[...effects].sort((a,b)=>feedbackPriority(b.event,equipped)-feedbackPriority(a.event,equipped));
  for(const effect of ordered){
    const e=effect.event;
    if(e.worker||e.blocked||e.kind==='shout_shockwave'||e.phase==='release')continue;
    if(!owners.some(owner=>owner.event.phase===e.phase&&Math.hypot(owner.event.x-e.x,owner.event.y-e.y)<28))owners.push(effect);
  }
  return new Set(owners);
}

export function cinematicFlightSelection(projectiles:readonly Projectile[],equipped:readonly string[],budget:number,listener:{x:number;y:number}):Set<Projectile>{
  const eligible=projectiles.filter(p=>['radio','satellite_wave','drone_laser','hunter_beam'].includes(p.kind));
  const groups=new Map<string,Projectile[]>();
  for(const p of eligible){const group=groups.get(p.kind)??[];group.push(p);groups.set(p.kind,group);}
  const priority=(p:Projectile)=>{const look=cinematicLook(p.kind,1,equipped);return (look.evolved?2:0)+(look.premium?1:0);};
  for(const group of groups.values())group.sort((a,b)=>Math.hypot(a.x-listener.x,a.y-listener.y)-Math.hypot(b.x-listener.x,b.y-listener.y));
  const ordered=[...groups.values()].sort((a,b)=>priority(b[0]!)-priority(a[0]!));
  const result=new Set<Projectile>();
  while(result.size<budget&&ordered.some(g=>g.length))for(const group of ordered){
    if(result.size===budget)break;const p=group.shift();if(p)result.add(p);
  }
  return result;
}
