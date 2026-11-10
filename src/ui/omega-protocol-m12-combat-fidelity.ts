import type {OmegaFieldPlan,OmegaFieldPoint} from '../domain/omega-protocol-field';

/**
 * M12-G4: world-space original 2.5D material/grounding pass for ACT-1.
 * All elements are decorative. No collision, line-of-sight, engine damage,
 * unlock state, AIRA approval policy or third-party runtime API is modified.
 */
export interface OmegaG4Budget{
 readonly tier:'mobile'|'tablet'|'desktop';
 readonly rivetRows:number;
 readonly streaks:number;
 readonly rimLight:boolean;
}
export function omegaG4Budget(w:number,h:number):OmegaG4Budget{
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)
  throw new RangeError('Invalid combat-stage viewport');
 const pixels=w*h;
 return pixels<=370_000?
  {tier:'mobile',rivetRows:2,streaks:3,rimLight:false}:
  pixels<=900_000?
   {tier:'tablet',rivetRows:3,streaks:5,rimLight:true}:
   {tier:'desktop',rivetRows:5,streaks:7,rimLight:true};
}
/** Query-scoped, DEV LAB-ONLY original source selection.
 * This is NOT the final 160-frame AIRA approval gate.
 */
export function omegaG4SilverLabRequested(search:string,lab:boolean):boolean{
 if(!lab)return false;
 const p=new URLSearchParams(search);
 return p.get('omegaLab')==='1'&&p.get('omegaM12G4')==='1'&&
  p.get('omegaSilverPreview')===null;
}
export const OMEGA_G4_REVIEW_URL='/?omegaLab=1&omegaM12G4=1' as const;
/** The neutral 384x512 review painting is larger than native Watch enemies.
 * Compress its visual height only in the gated in-engine comparison; final
 * artist-authored sprite proportions are still a separately reviewed gate.
 */
export const OMEGA_G4_SILVER_SCALE=.78 as const;

const eligible=(plan:OmegaFieldPlan)=>plan.sector===1;
const ink=(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string)=>{
 ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
};
function line(ctx:CanvasRenderingContext2D,x:number,y:number,x2:number,y2:number):void{
 ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();
}
/**
 * Dark steel deck skin, grounded in original world-space route.
 * Ink, rivets, warning tape are surface marks only, not new platforms.
 * The dark directional variation helps silver AIRA and zombie silhouettes.
 */
export function drawOmegaG4CenterStageMaterial(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,budget:OmegaG4Budget,
):void{
 if(!eligible(plan))return;
 ctx.save();
 const panels=[
  {x:88,y:335,w:310,h:90},
  {x:115,y:448,w:365,h:105},
  {x:510,y:352,w:305,h:100},
  {x:855,y:355,w:350,h:110},
 ] as const;
 for(const p of panels){
  const g=ctx.createLinearGradient(p.x,p.y,p.x+p.w,p.y+p.h);
  g.addColorStop(0,'rgba(100,143,160,.10)');
  g.addColorStop(.54,'rgba(5,18,31,.28)');
  g.addColorStop(1,'rgba(107,172,175,.09)');
  ctx.fillStyle=g;ctx.fillRect(p.x,p.y,p.w,p.h);
  ctx.strokeStyle='rgba(151,209,216,.26)';ctx.lineWidth=1.5;
  ctx.strokeRect(p.x+4,p.y+4,p.w-8,p.h-8);
  ctx.strokeStyle='rgba(63,114,136,.18)';ctx.lineWidth=1;
  line(ctx,p.x+11,p.y+p.h*.54,p.x+p.w-11,p.y+p.h*.54);
  if(budget.tier!=='mobile'){
   ctx.fillStyle='rgba(178,204,201,.29)';
   for(let row=0;row<budget.rivetRows;row++)
    for(const side of [p.x+11,p.x+p.w-14])
     ctx.fillRect(side,p.y+12+row*(p.h-24)/Math.max(1,budget.rivetRows-1),3,3);
  }
 }
 // Central lane paints have no solid/height. Interact icons render after.
 ctx.strokeStyle='rgba(240,184,105,.35)';ctx.lineWidth=3;
 line(ctx,104,438,410,438);
 line(ctx,530,438,840,438);
 for(let i=0;i<budget.streaks;i++){
  const x=130+i*64;
  ink(ctx,x,490,16,3,'rgba(249,194,114,.34)');
 }
 ctx.restore();
}
export type OmegaG4ActorIdentity='silver-aira'|'infected'|'boss';
export const OMEGA_G4_ACTOR_PALETTE:Readonly<Record<OmegaG4ActorIdentity,{
 readonly rim:string; readonly reflection:string; readonly footprint:string;
}>>={
 'silver-aira':{rim:'rgba(204,226,255,.58)',reflection:'rgba(140,204,231,.21)',footprint:'rgba(110,207,241,.24)'},
 infected:{rim:'rgba(145,204,156,.33)',reflection:'rgba(98,143,119,.12)',footprint:'rgba(187,221,154,.13)'},
 boss:{rim:'rgba(246,155,185,.50)',reflection:'rgba(171,78,104,.20)',footprint:'rgba(251,159,120,.23)'},
};
/** Drawn BELOW a live actor's actual feet; NEVER paints over enemy warnings. */
export function drawOmegaG4ActorGrounding(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,actor:OmegaFieldPoint,
 identity:OmegaG4ActorIdentity,budget:OmegaG4Budget,radius=27,
):void{
 if(!eligible(plan)||!Number.isFinite(actor.x)||!Number.isFinite(actor.y)||
   !Number.isFinite(radius)||radius<=0)return;
 const palette=OMEGA_G4_ACTOR_PALETTE[identity];
 ctx.save();ctx.translate(actor.x,actor.y);
 ctx.fillStyle='rgba(0,8,18,.31)';
 ctx.beginPath();ctx.ellipse(0,5,radius*1.16,Math.max(7,radius*.36),0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=palette.footprint;ctx.lineWidth=2;
 ctx.beginPath();ctx.ellipse(0,5,radius*1.27,Math.max(9,radius*.43),0,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle=palette.reflection;
 ctx.beginPath();ctx.ellipse(radius*.16,12,radius*.75,Math.max(3,radius*.13),-.1,0,Math.PI*2);ctx.fill();
 if(budget.rimLight){
  ctx.strokeStyle=palette.rim;ctx.lineWidth=1.3;
  ctx.beginPath();ctx.ellipse(0,3,radius*.86,Math.max(5,radius*.25),0,Math.PI*.11,Math.PI*.71);ctx.stroke();
 }
 ctx.restore();
}
