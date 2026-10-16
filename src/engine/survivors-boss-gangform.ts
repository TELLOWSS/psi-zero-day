import type {Hazard,PlayerStats,Projectile} from '../domain/patrol-survivors';
import {sweptCircle} from './survivors-simulation';
import type {TerrainObject} from '../domain/survivors-terrain';
import {terrainContains} from './survivors-terrain';

export const GANGFORM_INTERVENTION_RADIUS=76;
/** Locked, separated targets leave room for a deliberate move between interventions. */
function controlPoints(player:PlayerStats,terrain:readonly TerrainObject[]){
 const candidates=[-170,170,-340,340].map(offset=>({x:Math.max(80,Math.min(1320,player.x+offset)),y:Math.max(80,Math.min(820,player.y))}));
 candidates.push(...[200,450,700,950,1200].flatMap(x=>[180,450,720].map(y=>({x,y}))));
 const points: Array<{x:number;y:number;radius:number;hp:number;maxHp:number}>=[];
 for(const point of candidates){
  if(terrain.some(o=>terrainContains(o,point,52))||points.some(p=>Math.hypot(p.x-point.x,p.y-point.y)<200))continue;
  points.push({...point,radius:38,hp:60,maxHp:60});if(points.length===2)break;
 }
 return points;
}

export function tickGangform(h: Hazard, player: PlayerStats, dt: number, terrain:readonly TerrainObject[]=[]): boolean {
 const p=h.bossGameplay;if(p?.patternId!=='PENDULUM_DEBRIS'||p.combatPhase!=='pattern')return false;
 const g=p.gangform??(p.gangform={step:'pendulum_warning',remaining:1.2,anchorX:Math.max(170,Math.min(1230,h.x)),anchorY:h.y,zones:[]});
 h.vx=0;h.vy=0;h.y=g.anchorY;
 g.remaining=Math.max(0,g.remaining-dt);
 if(g.step==='pendulum')h.x=g.anchorX+Math.sin((3-g.remaining)/3*Math.PI*2)*110;
 else h.x=g.anchorX;
 // Debris is dangerous at the two locked zones, not beneath the suspended boss body.
 if(h.motion){h.motion.phase=g.step==='pendulum'?'charge':'cooldown';h.motion.timer=g.remaining;}
 if(g.remaining>0)return true;
 if(g.step==='pendulum_warning'){g.step='pendulum';g.remaining=3;}
 else if(g.step==='pendulum'){
  g.step='debris_warning';g.remaining=1.2;
  g.zones=controlPoints(player,terrain);
 }else if(g.step==='debris_warning'){g.step='debris';g.remaining=.4;}
 else if(g.step==='debris'){
  g.step='drop_zone';p.cycleCount++;p.combatPhase='weak_point';p.remaining=12;
  if(h.motion){h.motion.phase='cooldown';h.motion.timer=12;}
 }
 return true;
}

export function gangformContact(h: Readonly<Hazard>, player: {x:number;y:number}): boolean {
 const p=h.bossGameplay,g=p?.gangform;if(p?.combatPhase!=='pattern'||!g)return false;
 return g.step==='pendulum'?Math.hypot(h.x-player.x,h.y-player.y)<=h.radius+14:
  g.step==='debris'&&g.zones.some(z=>Math.hypot(z.x-player.x,z.y-player.y)<=z.radius+14);
}

/** Both spatial targets must be hit; body DPS and passive gear do not solve this pattern. */
export function hitGangformZone(h: Hazard, projectile: Projectile, previous: {x:number;y:number}, player?: {x:number;y:number}): {x:number;y:number}|undefined {
 const p=h.bossGameplay,g=p?.gangform;
 if(p?.combatPhase!=='weak_point'||!g||g.step!=='drop_zone'||!Number.isFinite(projectile.damage)||projectile.damage<=0)return;
 const z=g.zones.find(z=>z.hp>0);
 if(!z||!player||Math.hypot(player.x-z.x,player.y-z.y)>GANGFORM_INTERVENTION_RADIUS||!sweptCircle(previous.x,previous.y,projectile.x,projectile.y,z.x,z.y,z.radius+projectile.radius))return;
 z.hp=Math.max(0,z.hp-projectile.damage);projectile.pierce--;projectile.duration=0;
 if(g.zones.length===2&&g.zones.every(z=>z.hp===0)){
  p.signatureResolvedThisCycle=true;p.combatPhase='burst';p.remaining=0;p.burstRemaining=4.5;
 }
 return z;
}

export function gangformTarget(h: Hazard, _x: number, _y: number): Hazard {
 const p=h.bossGameplay,g=p?.gangform;if(p?.combatPhase!=='weak_point'||!g)return h;
 const z=g.zones.find(z=>z.hp>0);
 return z?{...h,x:z.x,y:z.y}:h;
}
