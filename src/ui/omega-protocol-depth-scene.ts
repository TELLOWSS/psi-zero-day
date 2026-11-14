import type {OmegaFieldPlan,OmegaFieldProgress} from '../domain/omega-protocol-field';

/**
 * Stable world-space draw ordering of existing native obstacles, living Watch
 * hazards, projectiles, and one hero. This is purely a 2.5D canvas ordering decision: game
 * collision, damage, AI, navigation and actual XY are never changed.
 */
export type OmegaDepthDrawKind='prop'|'console'|'extraction'|'hazard'|'hero'|'projectile';
export interface OmegaDepthDrawItem {
 readonly kind:OmegaDepthDrawKind;
 readonly index:number;
 readonly depth:number;
}
const priority:Readonly<Record<OmegaDepthDrawKind,number>>={
 prop:0,console:1,extraction:2,hazard:3,hero:4,projectile:5,
};
export function omegaFieldDepthOrder(
 plan:OmegaFieldPlan,
 hazards:readonly {readonly y:number;readonly hp:number}[],
 playerY:number,progress?:OmegaFieldProgress,
 projectiles:readonly {readonly y:number}[]=[],
):readonly OmegaDepthDrawItem[]{
 if(!Number.isFinite(playerY)||hazards.length>64||
    hazards.some(h=>!Number.isFinite(h.y)||!Number.isFinite(h.hp))||
    projectiles.some(p=>!Number.isFinite(p.y)))
  throw new RangeError('Invalid OMEGA depth inputs');
 const out:OmegaDepthDrawItem[]=[];
 for(const [i,o] of plan.obstacles.entries())out.push({
  kind:'prop',index:i,depth:o.y+o.height,
 });
 if(progress){
  for(const [i,step] of plan.event.steps.entries())out.push({
   kind:'console',index:i,depth:step.target.y,
  });
  out.push({kind:'extraction',index:0,depth:plan.exit.y});
 }
 for(const [i,h] of hazards.entries())if(h.hp>0)out.push({
  kind:'hazard',index:i,depth:h.y,
 });
 out.push({kind:'hero',index:0,depth:playerY});
 for(const [i,p] of projectiles.entries())out.push({kind:'projectile',index:i,depth:p.y});
 out.sort((a,b)=>a.depth-b.depth||
  priority[a.kind]-priority[b.kind]||a.index-b.index);
 return out;
}
