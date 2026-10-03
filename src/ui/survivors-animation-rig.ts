export interface Joint { x: number; y: number }
export interface LegRig { hip: Joint; knee: Joint; ankle: Joint; sole: Joint }
export interface ActorRig { waist: number; left: LegRig; right: LegRig }
const leg = (hx:number, hy:number, kx:number, ky:number, ax:number, ay:number, sx:number, sy:number):LegRig => ({hip:{x:hx,y:hy},knee:{x:kx,y:ky},ankle:{x:ax,y:ay},sole:{x:sx,y:sy}});
/** Coordinates relative to each approved sprite's opaque bounds; original identity stays intact. */
export const ACTOR_RIGS: Record<string, ActorRig> = {
 'player-map.webp': {waist:.435,left:leg(.35,.445,.23,.69,.12,.88,.12,1),right:leg(.61,.445,.60,.69,.62,.88,.72,.958)},
 'kang-taesik-map.webp': {waist:.53,left:leg(.43,.54,.35,.74,.26,.89,.26,1),right:leg(.68,.54,.76,.74,.78,.89,.85,.979)},
 'yoon-sungho-map.webp': {waist:.475,left:leg(.30,.485,.24,.71,.14,.88,.12,1),right:leg(.61,.485,.64,.71,.69,.88,.83,.98)},
 'lee-jaehoon-map.webp': {waist:.46,left:leg(.39,.47,.31,.70,.20,.89,.18,1),right:leg(.68,.47,.66,.70,.66,.89,.79,.97)},
 'lim-junho-map.webp': {waist:.455,left:leg(.43,.465,.36,.715,.22,.875,.24,1),right:leg(.69,.465,.67,.715,.64,.875,.73,.956)},
 'safety-monitor-v2.webp': {waist:.47,left:leg(.31,.48,.23,.71,.145,.875,.145,1),right:leg(.61,.48,.60,.71,.65,.875,.745,.976)},
 'worker-korean-v2.webp': {waist:.49,left:leg(.30,.50,.26,.73,.15,.89,.13,1),right:leg(.67,.50,.67,.73,.69,.89,.76,.977)},
 'sprite_player_yoon.webp': {waist:.475,left:leg(.30,.485,.24,.71,.14,.88,.12,1),right:leg(.61,.485,.64,.71,.69,.88,.83,.98)},
};
export interface Footstep { offset: number; lift: number; planted: boolean }
export function footstep(cycle:number, opposite=false, running=false):Footstep {
 const p=((cycle/(Math.PI*2)+(opposite?.5:0))%1+1)%1;
 const stride=running?66:54;
 if(p<.5) return {offset:stride*(.25-p),lift:0,planted:true};
 const swing=(p-.5)*2;
 return {offset:stride*(-.25+.5*(swing*swing*(3-2*swing))),lift:Math.sin(swing*Math.PI)*(running?8:5),planted:false};
}
/** Two-bone inverse kinematics; retain limb lengths and bend to the authored side. */
export function solveKnee(hip:Joint, ankle:Joint, upper:number, lower:number, bend=1):Joint {
 const dx=ankle.x-hip.x,dy=ankle.y-hip.y;
 const actual=Math.max(.0001,Math.hypot(dx,dy));
 const d=Math.min(actual,upper+lower-.001);
 const along=(upper*upper-lower*lower+d*d)/(2*d);
 const perpendicular=Math.sqrt(Math.max(0,upper*upper-along*along));
 return {x:hip.x+dx/actual*along-dy/actual*perpendicular*bend,y:hip.y+dy/actual*along+dx/actual*perpendicular*bend};
}
