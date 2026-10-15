import type {DefenseCombatShot,DefensePoint} from '../domain/defense';
import art from '../../content/defense/guard-projectile-art-v2.json';

export const GUARD_WEAPON_FX=art;
export function guardFlightPresentation(shot:DefenseCombatShot,start:DefensePoint,end:DefensePoint,rotated=false){
 const distance=Math.hypot(end.x-start.x,end.y-start.y);
 const burst=shot.towerId==='BURST',sensor=shot.towerId==='SENSOR';
 const minimum=burst?115:sensor?55:70,maximum=burst?225:sensor?105:145;
 const durationMs=Math.round(Math.max(minimum,Math.min(maximum,distance/(burst?.95:sensor?2.8:2))));
 const loft=burst?Math.min(70,Math.max(24,distance*.28)):0;
 const control={x:(start.x+end.x)/2-(rotated?loft:0),y:(start.y+end.y)/2-(rotated?0:loft)};
 return {durationMs,path:burst?`M${start.x} ${start.y}Q${control.x} ${control.y} ${end.x} ${end.y}`:`M${start.x} ${start.y}L${end.x} ${end.y}`,angle:Math.atan2(end.y-start.y,end.x-start.x)*180/Math.PI};
}

/** A globally bounded set of actual contacts; boss and primary contacts get priority. */
export function guardContactSprites(shots:readonly DefenseCombatShot[]){
 return new Set(shots.flatMap(shot=>shot.targets.map((hit,index)=>({key:`${shot.id}|${hit.id}`,score:(hit.enemyId==='BOSS'?100:0)+(index===0?20:0)+(hit.resolved?5:0)})))
  .sort((a,b)=>b.score-a.score).slice(0,art.budgets.contacts).map(hit=>hit.key));
}
